/**
 * Database Service Layer - Supabase CRUD Operations
 * Handles all database interactions with proper error handling
 * Provides role-based access control enforcement
 */

import { createClient } from "@supabase/supabase-js";
import type {
  AttendanceRecord,
  AcademicGrade,
  FeeRecord,
  PaymentLedger,
  HostelRoom,
  HostelComplaint,
  HostelVisitor,
  TransportRoute,
  LibraryBook,
  BookCirculation,
  LeaveRequest,
  UserProfile,
  AppRole,
} from "./schemas";

// ═════════════════════════════════════════════════════════════════════════════
// Error Types
// ═════════════════════════════════════════════════════════════════════════════

export class DBError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = "DBError";
  }
}

export class ValidationError extends Error {
  constructor(
    public message: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(public message: string = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Database Service Class
// ═════════════════════════════════════════════════════════════════════════════

export class DatabaseService {
  private client;
  private readonly staffRoles: AppRole[] = ["admin", "teacher"];

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  private async handleError(error: unknown, context: string): Promise<never> {
    console.error(`[DB Error] ${context}:`, error);

    if (error instanceof Error) {
      // Supabase errors
      if ("status" in error && typeof error.status === "number") {
        throw new DBError(
          error.message || `Database error in ${context}`,
          error.status,
          error
        );
      }

      // Constraint violations
      if ("code" in error) {
        const code = (error as any).code;
        if (code === "23505") {
          // Unique violation
          throw new DBError(
            "Duplicate entry: This record already exists",
            409,
            error
          );
        }
        if (code === "23503") {
          // Foreign key violation
          throw new DBError(
            "Invalid reference: Related record does not exist",
            400,
            error
          );
        }
        if (code === "23514") {
          // Check constraint violation
          throw new DBError("Invalid data: Constraint violation", 400, error);
        }
      }

      throw new DBError(error.message || `Database error in ${context}`, 500, error);
    }

    throw new DBError(`Unknown error in ${context}`, 500);
  }

  private isStaffRole(role: AppRole): boolean {
    return this.staffRoles.includes(role);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ATTENDANCE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async recordAttendance(
    record: Omit<AttendanceRecord, "id" | "created_at">,
    userRole: AppRole
  ): Promise<AttendanceRecord> {
    try {
      // Only staff can record attendance
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can record attendance");
      }

      const { data, error } = await this.client
        .from("attendance_logs")
        .insert([
          {
            session_date: record.session_date,
            grade: record.grade,
            section: record.section,
            student_id: record.student_id,
            student_name: record.student_name,
            status: record.status,
            marked_by_name: record.marked_by_name,
            marked_by_id: record.marked_by_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as AttendanceRecord;
    } catch (error) {
      await this.handleError(error, "recordAttendance");
    }
  }

  async bulkRecordAttendance(
    records: Array<Omit<AttendanceRecord, "id" | "created_at" | "marked_by_name">>,
    markedByName: string,
    markedById: string,
    userRole: AppRole
  ): Promise<AttendanceRecord[]> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can record attendance");
      }

      const payload = records.map((r) => ({
        session_date: r.session_date,
        grade: r.grade,
        section: r.section,
        student_id: r.student_id,
        student_name: r.student_name,
        status: r.status,
        marked_by_name: markedByName,
        marked_by_id: markedById,
      }));

      const { data, error } = await this.client
        .from("attendance_logs")
        .insert(payload)
        .select();

      if (error) throw error;
      return data as AttendanceRecord[];
    } catch (error) {
      await this.handleError(error, "bulkRecordAttendance");
    }
  }

  async getAttendanceRecords(
    sessionDate: string,
    grade?: string,
    section?: string
  ): Promise<AttendanceRecord[]> {
    try {
      let query = this.client
        .from("attendance_logs")
        .select()
        .eq("session_date", sessionDate);

      if (grade) query = query.eq("grade", grade);
      if (section) query = query.eq("section", section);

      const { data, error } = await query;

      if (error) throw error;
      return data as AttendanceRecord[];
    } catch (error) {
      await this.handleError(error, "getAttendanceRecords");
    }
  }

  async getStudentAttendance(studentId: string, limit: number = 30): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await this.client
        .from("attendance_logs")
        .select()
        .eq("student_id", studentId)
        .order("session_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AttendanceRecord[];
    } catch (error) {
      await this.handleError(error, "getStudentAttendance");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // ACADEMICS OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async recordGrade(
    grade: Omit<AcademicGrade, "id" | "created_at" | "updated_at">,
    userRole: AppRole
  ): Promise<AcademicGrade> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can record grades");
      }

      const { data, error } = await this.client
        .from("academic_grades")
        .insert([grade])
        .select()
        .single();

      if (error) throw error;
      return data as AcademicGrade;
    } catch (error) {
      await this.handleError(error, "recordGrade");
    }
  }

  async bulkRecordGrades(
    grades: Array<Omit<AcademicGrade, "id" | "created_at" | "updated_at">>,
    userRole: AppRole
  ): Promise<AcademicGrade[]> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can record grades");
      }

      const { data, error } = await this.client
        .from("academic_grades")
        .insert(grades)
        .select();

      if (error) throw error;
      return data as AcademicGrade[];
    } catch (error) {
      await this.handleError(error, "bulkRecordGrades");
    }
  }

  async getStudentGrades(studentId: string): Promise<AcademicGrade[]> {
    try {
      const { data, error } = await this.client
        .from("academic_grades")
        .select()
        .eq("student_id", studentId)
        .order("term", { ascending: false });

      if (error) throw error;
      return data as AcademicGrade[];
    } catch (error) {
      await this.handleError(error, "getStudentGrades");
    }
  }

  async getGradesByTerm(term: string, grade?: string): Promise<AcademicGrade[]> {
    try {
      let query = this.client.from("academic_grades").select().eq("term", term);

      if (grade) query = query.eq("grade", grade);

      const { data, error } = await query;

      if (error) throw error;
      return data as AcademicGrade[];
    } catch (error) {
      await this.handleError(error, "getGradesByTerm");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // FEES OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getFeeRecords(
    studentId?: string,
    status?: string,
    limit: number = 100
  ): Promise<FeeRecord[]> {
    try {
      let query = this.client.from("fee_records").select().limit(limit);

      if (studentId) query = query.eq("student_id", studentId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;

      if (error) throw error;
      return data as FeeRecord[];
    } catch (error) {
      await this.handleError(error, "getFeeRecords");
    }
  }

  async recordPayment(
    payment: Omit<PaymentLedger, "id" | "created_at">,
    userRole: AppRole
  ): Promise<PaymentLedger> {
    try {
      // Allow students to submit payments, staff to record
      if (!["student", "admin", "teacher"].includes(userRole)) {
        throw new AuthorizationError("Unauthorized to record payment");
      }

      const { data, error } = await this.client
        .from("payment_ledger")
        .insert([payment])
        .select()
        .single();

      if (error) throw error;

      // Update fee record status
      const fee = await this.client.from("fee_records").select().eq("id", payment.fee_record_id).single();
      if (fee.data) {
        const totalPaid = fee.data.paid + payment.amount;
        const newStatus = totalPaid >= fee.data.amount ? "paid" : "partial";
        await this.client
          .from("fee_records")
          .update({ paid: totalPaid, status: newStatus })
          .eq("id", payment.fee_record_id);
      }

      return data as PaymentLedger;
    } catch (error) {
      await this.handleError(error, "recordPayment");
    }
  }

  async getPaymentHistory(studentId: string): Promise<PaymentLedger[]> {
    try {
      const { data, error } = await this.client
        .from("payment_ledger")
        .select()
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PaymentLedger[];
    } catch (error) {
      await this.handleError(error, "getPaymentHistory");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HOSTEL OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getHostelRooms(): Promise<HostelRoom[]> {
    try {
      const { data, error } = await this.client
        .from("hostel_rooms")
        .select()
        .order("block", { ascending: true })
        .order("room_no", { ascending: true });

      if (error) throw error;
      return data as HostelRoom[];
    } catch (error) {
      await this.handleError(error, "getHostelRooms");
    }
  }

  async updateHostelRoom(
    blockId: string,
    roomNo: string,
    updates: Partial<HostelRoom>,
    userRole: AppRole
  ): Promise<HostelRoom> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can update hostel rooms");
      }

      const { data, error } = await this.client
        .from("hostel_rooms")
        .update(updates)
        .eq("block", blockId)
        .eq("room_no", roomNo)
        .select()
        .single();

      if (error) throw error;
      return data as HostelRoom;
    } catch (error) {
      await this.handleError(error, "updateHostelRoom");
    }
  }

  async createHostelComplaint(
    complaint: Omit<HostelComplaint, "id" | "created_at" | "updated_at">,
    userRole: AppRole
  ): Promise<HostelComplaint> {
    try {
      const { data, error } = await this.client
        .from("hostel_complaints")
        .insert([complaint])
        .select()
        .single();

      if (error) throw error;
      return data as HostelComplaint;
    } catch (error) {
      await this.handleError(error, "createHostelComplaint");
    }
  }

  async getHostelComplaints(
    status?: string,
    userRole?: AppRole,
    studentName?: string
  ): Promise<HostelComplaint[]> {
    try {
      let query = this.client.from("hostel_complaints").select();

      if (status) query = query.eq("status", status);
      if (studentName) query = query.eq("student_name", studentName);

      const { data, error } = await query;

      if (error) throw error;
      return data as HostelComplaint[];
    } catch (error) {
      await this.handleError(error, "getHostelComplaints");
    }
  }

  async updateHostelComplaint(
    complaintId: string,
    updates: Partial<HostelComplaint>,
    userRole: AppRole
  ): Promise<HostelComplaint> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can update complaints");
      }

      const { data, error } = await this.client
        .from("hostel_complaints")
        .update(updates)
        .eq("id", complaintId)
        .select()
        .single();

      if (error) throw error;
      return data as HostelComplaint;
    } catch (error) {
      await this.handleError(error, "updateHostelComplaint");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // TRANSPORT OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getTransportRoutes(): Promise<TransportRoute[]> {
    try {
      const { data, error } = await this.client
        .from("transport_routes")
        .select()
        .order("route_no", { ascending: true });

      if (error) throw error;
      return data as TransportRoute[];
    } catch (error) {
      await this.handleError(error, "getTransportRoutes");
    }
  }

  async updateGPSLocation(
    routeId: string,
    latitude: number,
    longitude: number,
    tripActive?: boolean
  ): Promise<TransportRoute> {
    try {
      const updates: any = {
        current_lat: latitude,
        current_lng: longitude,
        last_location_at: new Date().toISOString(),
      };

      if (tripActive !== undefined) {
        updates.trip_active = tripActive;
      }

      const { data, error } = await this.client
        .from("transport_routes")
        .update(updates)
        .eq("id", routeId)
        .select()
        .single();

      if (error) throw error;
      return data as TransportRoute;
    } catch (error) {
      await this.handleError(error, "updateGPSLocation");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // LIBRARY OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getLibraryBooks(category?: string): Promise<LibraryBook[]> {
    try {
      let query = this.client.from("library_books").select();

      if (category) query = query.eq("category", category);

      const { data, error } = await query;

      if (error) throw error;
      return data as LibraryBook[];
    } catch (error) {
      await this.handleError(error, "getLibraryBooks");
    }
  }

  async issueBook(
    bookId: string,
    studentId: string,
    studentName: string,
    dueDateDays: number = 14,
    userRole: AppRole = "admin"
  ): Promise<BookCirculation> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can issue books");
      }

      const issuedDate = new Date();
      const dueDate = new Date(issuedDate.getTime() + dueDateDays * 24 * 60 * 60 * 1000);

      // Get book title
      const book = await this.client.from("library_books").select().eq("id", bookId).single();
      if (book.error) throw book.error;

      const { data, error } = await this.client
        .from("library_circulations")
        .insert([
          {
            book_id: bookId,
            book_title: book.data.title,
            student_id: studentId,
            student_name: studentName,
            issued_date: issuedDate.toISOString().split("T")[0],
            due_date: dueDate.toISOString().split("T")[0],
            status: "issued",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update available copies
      await this.client
        .from("library_books")
        .update({ available_copies: book.data.available_copies - 1 })
        .eq("id", bookId);

      return data as BookCirculation;
    } catch (error) {
      await this.handleError(error, "issueBook");
    }
  }

  async returnBook(
    circulationId: string,
    userRole: AppRole = "admin"
  ): Promise<BookCirculation> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can process book returns");
      }

      // Get circulation record
      const circ = await this.client
        .from("library_circulations")
        .select()
        .eq("id", circulationId)
        .single();

      if (circ.error) throw circ.error;

      const returnedDate = new Date().toISOString().split("T")[0];

      const { data, error } = await this.client
        .from("library_circulations")
        .update({
          returned_date: returnedDate,
          status: "returned",
        })
        .eq("id", circulationId)
        .select()
        .single();

      if (error) throw error;

      // Update available copies
      const book = await this.client
        .from("library_books")
        .select()
        .eq("id", circ.data.book_id)
        .single();

      if (book.data) {
        await this.client
          .from("library_books")
          .update({ available_copies: book.data.available_copies + 1 })
          .eq("id", circ.data.book_id);
      }

      return data as BookCirculation;
    } catch (error) {
      await this.handleError(error, "returnBook");
    }
  }

  async getStudentCirculations(studentId: string): Promise<BookCirculation[]> {
    try {
      const { data, error } = await this.client
        .from("library_circulations")
        .select()
        .eq("student_id", studentId)
        .order("issued_date", { ascending: false });

      if (error) throw error;
      return data as BookCirculation[];
    } catch (error) {
      await this.handleError(error, "getStudentCirculations");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // HR/LEAVE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async createLeaveRequest(
    request: Omit<LeaveRequest, "id" | "created_at" | "updated_at">,
    userRole: AppRole
  ): Promise<LeaveRequest> {
    try {
      if (!this.isStaffRole(userRole)) {
        throw new AuthorizationError("Only staff can request leave");
      }

      const { data, error } = await this.client
        .from("leave_requests")
        .insert([request])
        .select()
        .single();

      if (error) throw error;
      return data as LeaveRequest;
    } catch (error) {
      await this.handleError(error, "createLeaveRequest");
    }
  }

  async getLeaveRequests(
    staffId?: string,
    status?: string,
    userRole?: AppRole
  ): Promise<LeaveRequest[]> {
    try {
      let query = this.client.from("leave_requests").select();

      if (staffId) query = query.eq("staff_id", staffId);
      if (status) query = query.eq("status", status);

      const { data, error } = await query;

      if (error) throw error;
      return data as LeaveRequest[];
    } catch (error) {
      await this.handleError(error, "getLeaveRequests");
    }
  }

  async approveLeaveRequest(
    requestId: string,
    approvedBy: string,
    userRole: AppRole
  ): Promise<LeaveRequest> {
    try {
      if (userRole !== "admin") {
        throw new AuthorizationError("Only admins can approve leave requests");
      }

      const { data, error } = await this.client
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: approvedBy,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data as LeaveRequest;
    } catch (error) {
      await this.handleError(error, "approveLeaveRequest");
    }
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // USER PROFILE OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════════

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await this.client
        .from("profiles")
        .select()
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      await this.handleError(error, "getUserProfile");
    }
  }

  async getAllProfiles(role?: AppRole): Promise<UserProfile[]> {
    try {
      let query = this.client.from("profiles").select();

      if (role) query = query.eq("role", role);

      const { data, error } = await query;

      if (error) throw error;
      return data as UserProfile[];
    } catch (error) {
      await this.handleError(error, "getAllProfiles");
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Singleton Export
// ═════════════════════════════════════════════════════════════════════════════

let dbService: DatabaseService | null = null;

export function getDBService(): DatabaseService {
  if (!dbService) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Database service not initialized: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set"
      );
    }

    dbService = new DatabaseService(url, key);
  }

  return dbService;
}
