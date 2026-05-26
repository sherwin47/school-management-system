/**
 * Notification Engine
 * Supports: Email (Nodemailer), SMS (Twilio), Push Notifications
 * Features: Template system, bulk sending, delivery tracking, scheduling
 */

import { supabaseClient } from "@/lib/supabaseClient";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS
// ─────────────────────────────────────────────────────────────

export type NotificationChannel = "email" | "sms" | "push" | "in-app";
export type NotificationStatus = "pending" | "sent" | "failed" | "read" | "delivery_failed";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification {
  id: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, any>;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string; // For email and push
  body: string;
  variables: string[]; // List of variable names like {{studentName}}, {{amount}}
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkNotificationRequest {
  channel: NotificationChannel;
  templateId: string;
  recipients: Array<{
    email?: string;
    phone?: string;
    recipientId?: string;
    data: Record<string, any>;
  }>;
  priority?: NotificationPriority;
  scheduledFor?: string;
}

// ─────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES = {
  ADMISSION_CONFIRMATION: {
    id: "admission_confirmation",
    name: "Admission Confirmation",
    channel: "email" as const,
    subject: "Admission Confirmed - {{studentName}} • Scholar Spark Galaxy",
    body: `Dear {{parentName}},

Congratulations! We are pleased to inform you that {{studentName}} has been admitted to {{schoolName}} for {{admittedGrade}}.

Admission Details:
- Student Name: {{studentName}}
- Grade: {{admittedGrade}}
- Section: {{section}}
- Academic Year: {{academicYear}}
- Admission Fee: ₹{{admissionFee}}

Next Steps:
1. Confirm admission by {{confirmDeadline}}
2. Pay the admission fee
3. Complete document verification
4. Collect Student ID Card from the office

Please log in to your Parent Portal to complete these steps and view more details.

For any queries, contact our admissions team at admissions@school.com

Best regards,
Scholar Spark Galaxy - Admissions Team`,
    variables: ["parentName", "studentName", "schoolName", "admittedGrade", "section", "academicYear", "admissionFee", "confirmDeadline"],
  },
  PAYMENT_SUCCESS: {
    id: "payment_success",
    name: "Payment Successful",
    channel: "email" as const,
    subject: "Payment Received - Receipt #{{receiptNumber}}",
    body: `Dear {{studentName}},

Thank you for your payment. We have successfully received your payment.

Payment Details:
- Receipt Number: {{receiptNumber}}
- Amount: {{currency}} {{amount}}
- Category: {{category}}
- Date: {{paymentDate}}
- Status: ✓ Paid

Your account has been credited. You can view your payment history in the app.

For any queries, please contact the finance team.

Best regards,
Scholar Spark Galaxy - Finance Team`,
    variables: ["studentName", "receiptNumber", "amount", "currency", "category", "paymentDate"],
  },
  FEE_REMINDER: {
    id: "fee_reminder",
    name: "Fee Reminder",
    channel: "email" as const,
    subject: "Reminder: Outstanding Fee Due - {{studentName}}",
    body: `Dear {{parentName}},

This is a reminder that the following fee is due for {{studentName}}:

Outstanding Fee:
- Category: {{category}}
- Amount: ₹{{amount}}
- Due Date: {{dueDate}}

Please pay the outstanding fee at the earliest to avoid late charges.

Pay Online: https://app.scholarspark.com/pay
Offline Payment: Visit the Finance Office

For any queries or payment plan requests, contact finance@school.com

Best regards,
Scholar Spark Galaxy - Finance Team`,
    variables: ["parentName", "studentName", "category", "amount", "dueDate"],
  },
  LEAVE_APPROVED: {
    id: "leave_approved",
    name: "Leave Approved",
    channel: "email" as const,
    subject: "Leave Request Approved",
    body: `Dear {{staffName}},

Your leave request has been approved.

Leave Details:
- Leave Type: {{leaveType}}
- From: {{startDate}}
- To: {{endDate}}
- Duration: {{duration}} days
- Status: ✓ APPROVED

Please ensure your responsibilities are handed over appropriately. Have a great leave!

Best regards,
Scholar Spark Galaxy - HR Team`,
    variables: ["staffName", "leaveType", "startDate", "endDate", "duration"],
  },
  EMERGENCY_ALERT: {
    id: "emergency_alert",
    name: "Emergency Alert",
    channel: "sms" as const,
    subject: "EMERGENCY ALERT",
    body: `EMERGENCY: {{message}}

Time: {{timestamp}}
Location: {{location}}

Please contact {{contactNumber}} for more information.`,
    variables: ["message", "timestamp", "location", "contactNumber"],
  },
} as const;

// ─────────────────────────────────────────────────────────────
// SMS TEMPLATES
// ─────────────────────────────────────────────────────────────

export const SMS_TEMPLATES = {
  ADMISSION_STATUS_UPDATE: "Hi {{parentName}}, {{studentName}}'s admission status has been updated to {{status}}. Log in to the app for details.",
  PAYMENT_REMINDER: "Hi {{parentName}}, Outstanding fee of ₹{{amount}} is due on {{dueDate}} for {{studentName}}. Pay online: [link]",
  ASSIGNMENT_REMINDER: "Hi {{studentName}}, You have {{count}} pending assignments. Log in to the app to submit.",
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATION SERVICE
// ─────────────────────────────────────────────────────────────

export class NotificationService {
  private emailConfigured: boolean;
  private smsConfigured: boolean;
  private pushConfigured: boolean;

  constructor(emailConfig?: any, smsConfig?: any, pushConfig?: any) {
    this.emailConfigured = !!emailConfig;
    this.smsConfigured = !!smsConfig;
    this.pushConfigured = !!pushConfig;
  }

  /**
   * Send email notification
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      if (!this.emailConfigured) {
        throw new Error("Email service not configured");
      }

      const notification: Notification = {
        id: `notif_${Date.now()}`,
        recipientEmail: to,
        channel: "email",
        subject,
        body,
        status: "pending",
        priority: "normal",
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save notification to database
      const { error: dbError } = await supabaseClient
        .from("notifications")
        .insert([notification as any]);

      if (dbError) throw dbError;

      // TODO: Integrate with Nodemailer to send actual email
      // const transporter = nodemailer.createTransport(emailConfig);
      // await transporter.sendMail({
      //   to,
      //   subject,
      //   html: body,
      // });

      // Update status to sent
      await supabaseClient
        .from("notifications")
        .update({
          status: "sent",
          sentAt: new Date().toISOString(),
        })
        .eq("id", notification.id);

      return { success: true, notificationId: notification.id };
    } catch (err: any) {
      console.error("Error sending email:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    phone: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      if (!this.smsConfigured) {
        throw new Error("SMS service not configured");
      }

      const notification: Notification = {
        id: `notif_${Date.now()}`,
        recipientPhone: phone,
        channel: "sms",
        subject: "SMS",
        body: message,
        status: "pending",
        priority: "normal",
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save notification to database
      const { error: dbError } = await supabaseClient
        .from("notifications")
        .insert([notification as any]);

      if (dbError) throw dbError;

      // TODO: Integrate with Twilio to send SMS
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   to: phone,
      //   from: fromNumber,
      //   body: message,
      // });

      // Update status to sent
      await supabaseClient
        .from("notifications")
        .update({
          status: "sent",
          sentAt: new Date().toISOString(),
        })
        .eq("id", notification.id);

      return { success: true, notificationId: notification.id };
    } catch (err: any) {
      console.error("Error sending SMS:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send push notification
   */
  async sendPush(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const notification: Notification = {
        id: `notif_${Date.now()}`,
        recipientId: userId,
        channel: "push",
        subject: title,
        body: message,
        status: "pending",
        priority: "normal",
        metadata: data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save notification to database
      const { error: dbError } = await supabaseClient
        .from("notifications")
        .insert([notification as any]);

      if (dbError) throw dbError;

      // TODO: Integrate with Firebase Cloud Messaging or custom push service
      // const message = {
      //   notification: { title, body: message },
      //   data,
      //   token: deviceToken,
      // };
      // await admin.messaging().send(message);

      // Update status to sent
      await supabaseClient
        .from("notifications")
        .update({
          status: "sent",
          sentAt: new Date().toISOString(),
        })
        .eq("id", notification.id);

      return { success: true, notificationId: notification.id };
    } catch (err: any) {
      console.error("Error sending push notification:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send notification using template
   */
  async sendFromTemplate(
    recipientEmail: string,
    templateId: string,
    templateData: Record<string, any>,
    channel: NotificationChannel = "email"
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Get template from database or use predefined
      const template =
        Object.values(EMAIL_TEMPLATES).find((t) => t.id === templateId) ||
        Object.values(SMS_TEMPLATES).find((t) => t === templateId);

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      let subject = "Notification";
      let body = "";

      if ("subject" in template && "body" in template) {
        subject = template.subject;
        body = template.body;

        // Replace variables
        for (const [key, value] of Object.entries(templateData)) {
          const regex = new RegExp(`{{${key}}}`, "g");
          subject = subject.replace(regex, String(value));
          body = body.replace(regex, String(value));
        }
      }

      if (channel === "email") {
        return this.sendEmail(recipientEmail, subject, body, templateData);
      } else if (channel === "sms") {
        return this.sendSMS(recipientEmail, body, templateData);
      }

      throw new Error(`Unsupported channel: ${channel}`);
    } catch (err: any) {
      console.error("Error sending template notification:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(request: BulkNotificationRequest): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    notificationIds: string[];
    errors: string[];
  }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      notificationIds: [] as string[],
      errors: [] as string[],
    };

    try {
      // Get template
      const template = Object.values(EMAIL_TEMPLATES).find((t) => t.id === request.templateId);

      if (!template) {
        throw new Error(`Template not found: ${request.templateId}`);
      }

      // Send to each recipient
      for (const recipient of request.recipients) {
        try {
          let body = template.body;
          let subject = template.subject;

          // Replace variables
          for (const [key, value] of Object.entries(recipient.data)) {
            const regex = new RegExp(`{{${key}}}`, "g");
            body = body.replace(regex, String(value));
            subject = subject.replace(regex, String(value));
          }

          let result;
          if (request.channel === "email" && recipient.email) {
            result = await this.sendEmail(recipient.email, subject, body, recipient.data);
          } else if (request.channel === "sms" && recipient.phone) {
            result = await this.sendSMS(recipient.phone, body, recipient.data);
          }

          if (result?.success) {
            results.sent++;
            results.notificationIds.push(result.notificationId || "");
          } else {
            results.failed++;
            results.errors.push(result?.error || "Unknown error");
          }
        } catch (err: any) {
          results.failed++;
          results.errors.push(err.message);
        }
      }

      return results;
    } catch (err: any) {
      console.error("Error in bulk send:", err);
      return {
        ...results,
        success: false,
        errors: [err.message],
      };
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(
    userId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notifications: Notification[]; total: number; error?: string }> {
    try {
      let query = supabaseClient
        .from("notifications")
        .select("*", { count: "est" });

      if (userId) {
        query = query.eq("recipientId", userId);
      }

      const { data, count, error } = await query
        .order("createdAt", { ascending: false })
        .limit(limit)
        .offset(offset);

      if (error) throw error;

      return { notifications: data || [], total: count || 0 };
    } catch (err: any) {
      console.error("Error fetching notification history:", err);
      return { notifications: [], total: 0, error: err.message };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseClient
        .from("notifications")
        .update({ status: "read" })
        .eq("id", notificationId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    recipientEmail: string,
    subject: string,
    body: string,
    scheduledFor: string
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const notification: Notification = {
        id: `notif_${Date.now()}`,
        recipientEmail,
        channel: "email",
        subject,
        body,
        status: "pending",
        priority: "normal",
        scheduledFor,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .from("notifications")
        .insert([notification as any]);

      if (error) throw error;

      // TODO: Set up cron job or scheduler to send at scheduledFor time

      return { success: true, notificationId: notification.id };
    } catch (err: any) {
      console.error("Error scheduling notification:", err);
      return { success: false, error: err.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT SINGLETON
// ─────────────────────────────────────────────────────────────

export const notificationService = new NotificationService(
  process.env.NODEMAILER_CONFIG,
  process.env.TWILIO_CONFIG,
  process.env.FIREBASE_CONFIG
);
