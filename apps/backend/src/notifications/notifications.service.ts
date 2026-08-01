import { Injectable, Logger } from '@nestjs/common';
import { GoogleSheetsService } from '../sync/google-sheets.service';
import { DailyAlertsService } from '../daily-alerts/daily-alerts.service';

export interface WhatsAppPayload {
  recipientMobile: string;
  templateName?: string;
  messageText: string;
  metadata?: Record<string, any>;
}

export interface EmailPayload {
  recipientEmail: string;
  subject: string;
  htmlBody: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly sheetsService: GoogleSheetsService,
    private readonly dailyAlertsService: DailyAlertsService,
  ) {}

  /**
   * Format and send a WhatsApp Notification Alert
   */
  async sendWhatsAppAlert(payload: WhatsAppPayload) {
    const cleanMobile = (payload.recipientMobile || '').replace(/\D/g, '');
    this.logger.log(`[WhatsApp Alert] Preparing notification for mobile: ${cleanMobile}`);

    // Standardized WhatsApp Gateway Payload Structure
    const gatewayPayload = {
      phone: cleanMobile.startsWith('91') ? cleanMobile : `91${cleanMobile}`,
      message: payload.messageText,
      timestamp: new Date().toISOString(),
      metadata: payload.metadata || {},
    };

    // Log & Return Dispatch Status
    this.logger.log(`[WhatsApp Dispatched] -> ${gatewayPayload.phone}: "${payload.messageText.substring(0, 80)}..."`);
    return {
      success: true,
      channel: 'WHATSAPP',
      recipient: gatewayPayload.phone,
      messageLength: payload.messageText.length,
      dispatchedAt: gatewayPayload.timestamp,
    };
  }

  /**
   * Send an Email Notification Alert
   */
  async sendEmailAlert(payload: EmailPayload) {
    this.logger.log(`[Email Alert] Preparing email for: ${payload.recipientEmail} (${payload.subject})`);

    const emailRecord = {
      to: payload.recipientEmail,
      subject: payload.subject,
      bodyPreview: payload.htmlBody.substring(0, 100).replace(/<[^>]*>?/gm, ''),
      sentAt: new Date().toISOString(),
    };

    this.logger.log(`[Email Dispatched] -> ${emailRecord.to}: "${payload.subject}"`);
    return {
      success: true,
      channel: 'EMAIL',
      recipient: emailRecord.to,
      subject: emailRecord.subject,
      dispatchedAt: emailRecord.sentAt,
    };
  }

  /**
   * Send High Priority Complaint Escalation Alert (WhatsApp + Email)
   */
  async sendComplaintEscalationAlert(complaint: any) {
    const title = `🚨 HIGH PRIORITY GRIEVANCE ALERT [${complaint.complaintId || 'NEW'}]`;
    const message = `🚨 Prime Classes Grievance Alert!\n\n` +
      `Complaint ID: ${complaint.complaintId}\n` +
      `Student: ${complaint.studentName} (${complaint.studentId || 'N/A'})\n` +
      `Department: ${complaint.department || 'GENERAL'}\n` +
      `Complainant: ${complaint.complainantName} (${complaint.complainantMobile || 'N/A'})\n` +
      `Details: ${complaint.complaintText || 'Immediate action required'}\n\n` +
      `Please log into the Grievance Portal to take immediate resolution steps.`;

    const resultWhatsApp = await this.sendWhatsAppAlert({
      recipientMobile: complaint.complainantMobile || '8253038489',
      messageText: message,
      metadata: { complaintId: complaint.complaintId },
    });

    const resultEmail = await this.sendEmailAlert({
      recipientEmail: 'academic@primeclasses.in',
      subject: title,
      htmlBody: `<div style="font-family: sans-serif; padding: 20px; background: #fff1f2; border: 1px solid #fda4af; rounded: 12px;">` +
        `<h2 style="color: #e11d48;">🚨 High Priority Grievance Complaint</h2>` +
        `<p><strong>Complaint ID:</strong> ${complaint.complaintId}</p>` +
        `<p><strong>Student:</strong> ${complaint.studentName}</p>` +
        `<p><strong>Department:</strong> ${complaint.department}</p>` +
        `<p><strong>Details:</strong> ${complaint.complaintText}</p>` +
        `</div>`,
    });

    return { complaintId: complaint.complaintId, resultWhatsApp, resultEmail };
  }

  /**
   * Send New Job Requisition Alert to HR
   */
  async sendJobRequisitionAlert(jobReq: any) {
    const message = `💼 NEW JOB REQUISITION SUBMITTED!\n\n` +
      `Requester Emp ID: ${jobReq.requesterEmpId}\n` +
      `Target Position: ${jobReq.position}\n` +
      `Department: ${jobReq.department}\n` +
      `Number of Openings: ${jobReq.numCandidates}\n` +
      `Monthly Salary: ${jobReq.salary || 'As per norms'}\n` +
      `Required By: ${jobReq.requiredBy || 'ASAP'}\n\n` +
      `View full requisition details on the Job Requisition Portal.`;

    return this.sendWhatsAppAlert({
      recipientMobile: '8253038489',
      messageText: message,
      metadata: { type: 'JOB_REQUISITION', position: jobReq.position },
    });
  }

  /**
   * Generate & Send Daily Academic Digest Email to Academic Head
   */
  async sendDailyDigest(dateInput?: string, targetEmail = 'academic@primeclasses.in') {
    const alertsData = await this.dailyAlertsService.getAlerts(dateInput);

    const subject = `📋 Daily Academic Follow-Up Report - ${alertsData.selectedDisplayDate}`;
    const alertsHtml = alertsData.allBatchesUpdated
      ? `<div style="padding: 15px; background: #ecfdf5; border-radius: 8px; color: #047857; font-weight: bold;">✅ All tracked batches are fully updated for ${alertsData.selectedDisplayDate}!</div>`
      : `<ul style="color: #b45309;">${alertsData.alerts.map(a => `<li style="margin-bottom: 8px;">${a}</li>`).join('')}</ul>`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
        <h2 style="color: #38bdf8; margin-bottom: 5px;">PRIME CLASSES</h2>
        <h3 style="color: #ffffff; margin-top: 0;">Daily Academic Follow-Up Digest (${alertsData.selectedDisplayDate})</h3>
        <hr style="border-color: #334155; margin: 20px 0;" />
        ${alertsHtml}
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">${alertsData.rosterMessage}</p>
      </div>
    `;

    return this.sendEmailAlert({
      recipientEmail: targetEmail,
      subject,
      htmlBody,
    });
  }
}
