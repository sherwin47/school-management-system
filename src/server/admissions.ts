/**
 * Admission System Server Functions
 * Handles online admission forms, application tracking, document verification, fee collection
 * Supabase RLS: Authenticated users can submit/view own applications, admins can manage all
 */

import { supabaseClient } from "@/lib/supabaseClient";
import { z } from "zod";
import {
  AdmissionApplicationSchema,
  DocumentVerificationSchema,
  AdmissionOfferLetterSchema,
} from "@/lib/schemas";

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

export interface AdmissionApplication {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  currentSchool?: string;
  currentGrade: string;
  applyingForGrade: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  applicationStatus: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Waitlisted";
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  waitlistPosition?: number;
  rejectionReason?: string;
  documents: DocumentVerification[];
  admissionFeeStatus: "Pending" | "Paid" | "Waived";
  admissionFeeAmount: number;
  notes: string;
  parentEmail: string;
  parentPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVerification {
  id: string;
  documentType: "Birth Certificate" | "Previous Marksheet" | "Transfer Certificate" | "Address Proof" | "Photo" | "Other";
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface AdmissionOfferLetter {
  id: string;
  applicationId: string;
  studentName: string;
  admittedGrade: string;
  section?: string;
  academicYear: string;
  offerIssuedAt: string;
  offerValidUntil: string;
  conditions: string[];
  status: "Issued" | "Accepted" | "Rejected" | "Expired";
  acceptedAt?: string;
  rejectedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// SERVER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Submit online admission enquiry form
 * Creates new application with "Draft" status
 */
export async function submitAdmissionEnquiry(
  applicationData: Omit<AdmissionApplication, "id" | "applicationStatus" | "createdAt" | "updatedAt" | "documents" | "appliedAt">
) {
  try {
    const payload = {
      ...applicationData,
      applicationStatus: "Draft" as const,
      documents: [],
      appliedAt: new Date().toISOString(),
    };

    const { data, error } = await supabaseClient
      .from("admission_applications")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error submitting admission enquiry:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit complete admission application
 * Moves status from Draft → Submitted
 */
export async function submitAdmissionApplication(applicationId: string) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({
        applicationStatus: "Submitted",
        appliedAt: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error submitting application:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload application document
 * Adds document to application documents array
 */
export async function uploadApplicationDocument(
  applicationId: string,
  documentData: Omit<DocumentVerification, "id" | "uploadedAt" | "verificationStatus">
) {
  try {
    // Get current application
    const { data: app, error: fetchErr } = await supabaseClient
      .from("admission_applications")
      .select("documents")
      .eq("id", applicationId)
      .single();

    if (fetchErr) throw fetchErr;

    const newDocument: DocumentVerification = {
      id: `doc_${Date.now()}`,
      ...documentData,
      uploadedAt: new Date().toISOString(),
      verificationStatus: "Pending",
    };

    const updatedDocs = [...(app.documents || []), newDocument];

    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({ documents: updatedDocs })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error uploading document:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get admission applications for admin review
 * Paginated list with filtering
 */
export async function getAdmissionApplications(
  filters: {
    status?: AdmissionApplication["applicationStatus"];
    grade?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  try {
    let query = supabaseClient
      .from("admission_applications")
      .select("*", { count: "est" });

    if (filters.status) {
      query = query.eq("applicationStatus", filters.status);
    }
    if (filters.grade) {
      query = query.eq("applyingForGrade", filters.grade);
    }

    const { data, error, count } = await query
      .order("appliedAt", { ascending: false })
      .limit(filters.limit || 20)
      .offset(filters.offset || 0);

    if (error) throw error;
    return { success: true, data, total: count };
  } catch (err: any) {
    console.error("Error fetching applications:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get single admission application with all details
 */
export async function getAdmissionApplication(applicationId: string) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching application:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get applications in waitlist
 */
export async function getWaitlistedApplications(grade: string) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .select("*")
      .eq("applicationStatus", "Waitlisted")
      .eq("applyingForGrade", grade)
      .order("waitlistPosition", { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error fetching waitlist:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin: Verify document
 */
export async function verifyDocument(
  applicationId: string,
  documentId: string,
  verificationStatus: "Verified" | "Rejected",
  remarks?: string
) {
  try {
    const { data: app, error: fetchErr } = await supabaseClient
      .from("admission_applications")
      .select("documents")
      .eq("id", applicationId)
      .single();

    if (fetchErr) throw fetchErr;

    const updatedDocs = app.documents.map((doc: DocumentVerification) =>
      doc.id === documentId
        ? {
            ...doc,
            verificationStatus,
            verifiedBy: "admin", // TODO: Get from auth context
            verifiedAt: new Date().toISOString(),
            remarks,
          }
        : doc
    );

    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({ documents: updatedDocs })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error verifying document:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin: Review application
 * Updates status and adds admin comments
 */
export async function reviewAdmissionApplication(
  applicationId: string,
  reviewStatus: "Under Review",
  adminNotes: string
) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({
        applicationStatus: reviewStatus,
        reviewedBy: "admin", // TODO: Get from auth context
        reviewedAt: new Date().toISOString(),
        notes: adminNotes,
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error reviewing application:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin: Approve admission & create offer letter
 */
export async function approveAdmission(
  applicationId: string,
  offerData: Omit<AdmissionOfferLetter, "id" | "status" | "offerIssuedAt">
) {
  try {
    // Get application first
    const { data: app, error: fetchErr } = await supabaseClient
      .from("admission_applications")
      .select("studentName")
      .eq("id", applicationId)
      .single();

    if (fetchErr) throw fetchErr;

    // Create offer letter
    const offerLetter: AdmissionOfferLetter = {
      id: `offer_${Date.now()}`,
      applicationId,
      studentName: app.studentName,
      ...offerData,
      status: "Issued",
      offerIssuedAt: new Date().toISOString(),
    };

    const { data: letter, error: letterErr } = await supabaseClient
      .from("admission_offer_letters")
      .insert([offerLetter])
      .select()
      .single();

    if (letterErr) throw letterErr;

    // Update application status
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({ applicationStatus: "Approved" })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, application: data, offerLetter: letter };
  } catch (err: any) {
    console.error("Error approving admission:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin: Reject admission application
 */
export async function rejectAdmission(applicationId: string, rejectionReason: string) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({
        applicationStatus: "Rejected",
        rejectionReason,
        reviewedAt: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error rejecting application:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Admin: Move application to waitlist
 */
export async function waitlistApplication(applicationId: string, waitlistPosition: number) {
  try {
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({
        applicationStatus: "Waitlisted",
        waitlistPosition,
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Error waitlisting application:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get student admission statistics for dashboard
 */
export async function getAdmissionStats(academicYear: string) {
  try {
    const statuses = ["Submitted", "Under Review", "Approved", "Rejected", "Waitlisted"] as const;
    const stats: Record<string, number> = {};

    for (const status of statuses) {
      const { count, error } = await supabaseClient
        .from("admission_applications")
        .select("*", { count: "est" })
        .eq("applicationStatus", status);

      if (!error) stats[status] = count || 0;
    }

    return { success: true, data: stats };
  } catch (err: any) {
    console.error("Error fetching admission stats:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Collect admission fee
 */
export async function recordAdmissionFee(
  applicationId: string,
  amount: number,
  paymentMethod: string,
  receipt: string
) {
  try {
    // Update application status
    const { data, error } = await supabaseClient
      .from("admission_applications")
      .update({
        admissionFeeStatus: "Paid",
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) throw error;

    // Record payment in payment ledger
    await supabaseClient.from("payment_ledger").insert([
      {
        description: "Admission Fee",
        amount,
        method: paymentMethod,
        receipt_no: receipt,
        status: "success",
        category: "Admission",
      },
    ]);

    return { success: true, data };
  } catch (err: any) {
    console.error("Error recording admission fee:", err);
    return { success: false, error: err.message };
  }
}
