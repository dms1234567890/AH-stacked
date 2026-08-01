import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from '../sync/google-sheets.service';

@Injectable()
export class GrievanceService {
  private readonly logger = new Logger(GrievanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  /**
   * Get full dashboard data
   */
  async getDashboardData() {
    let dbComplaints: any[] = [];
    try {
      dbComplaints = await this.prisma.grievanceComplaint.findMany({
        where: { deletedAt: null },
        include: { _count: { select: { callRecords: true } } },
        orderBy: [
          { priority: 'desc' },
          { createdDate: 'desc' },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`DB complaints query warning: ${err.message}`);
    }

    // Live complaints from Google Sheets (Complaint_Lifecycle)
    const sheetComplaints = await this.googleSheetsService.fetchComplaintLifecycleData();

    // Merge complaints (by complaintId)
    const complaintMap = new Map<string, any>();
    sheetComplaints.forEach((c) => {
      if (c.complaintId) complaintMap.set(c.complaintId, c);
    });
    dbComplaints.forEach((c) => {
      const mapped = this.mapComplaint(c);
      complaintMap.set(c.complaintId, mapped);
    });

    const complaints = Array.from(complaintMap.values());

    let dbCallRecords: any[] = [];
    try {
      dbCallRecords = await this.prisma.grievanceCallRecord.findMany({
        where: { deletedAt: null },
        include: { complaint: { select: { complaintId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (err: any) {
      this.logger.warn(`DB call records query warning: ${err.message}`);
    }

    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter((c) => c.status === 'PENDING').length;
    const inProgressComplaints = complaints.filter((c) => c.status === 'IN PROGRESS').length;
    const highPriorityCount = complaints.filter((c) => c.priority === 'HIGH PRIORITY').length;

    const todayKey = this.getTodayKey();
    const todayCallRecords = dbCallRecords.filter((r) => r.callDate === todayKey);
    const callStats = this.computeCallStats(todayCallRecords);
    const pendingCalls = await this.getPendingCallsForToday();
    const recentCallLogs = dbCallRecords.slice(0, 50).map((r) => ({
      createdAt: r.createdAt,
      callDate: r.callDate,
      complaintId: r.complaint?.complaintId || r.complaintId,
      studentName: r.studentName,
      callStatus: r.callStatus,
    }));

    return {
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      highPriorityCount,
      pendingCallsToday: pendingCalls.length,
      callStats,
      pendingCalls,
      recentCallLogs,
      complaints,
    };
  }

  /**
   * Get all grievance complaints
   */
  async getComplaints() {
    let dbComplaints: any[] = [];
    try {
      dbComplaints = await this.prisma.grievanceComplaint.findMany({
        where: { deletedAt: null },
        orderBy: [
          { priority: 'desc' },
          { createdDate: 'desc' },
        ],
      });
    } catch (err: any) {
      this.logger.warn(`DB complaints query warning: ${err.message}`);
    }

    const sheetComplaints = await this.googleSheetsService.fetchComplaintLifecycleData();

    const complaintMap = new Map<string, any>();
    sheetComplaints.forEach((c) => {
      if (c.complaintId) complaintMap.set(c.complaintId, c);
    });
    dbComplaints.forEach((c) => {
      complaintMap.set(c.complaintId, this.mapComplaint(c));
    });

    return Array.from(complaintMap.values());
  }

  /**
   * Get a single complaint by complaintId
   */
  async getComplaint(complaintId: string) {
    const complaint = await this.prisma.grievanceComplaint.findUnique({
      where: { complaintId },
    });
    if (!complaint || complaint.deletedAt) {
      throw new NotFoundException(`Complaint not found: ${complaintId}`);
    }
    return this.mapComplaint(complaint);
  }

  /**
   * Search complaints
   */
  async searchComplaints(query: string) {
    const search = query.trim().toLowerCase();
    if (search.length < 2) return [];

    let dbComplaints: any[] = [];
    try {
      dbComplaints = await this.prisma.grievanceComplaint.findMany({
        where: {
          deletedAt: null,
          OR: [
            { complaintId: { contains: search, mode: 'insensitive' } },
            { studentId: { contains: search, mode: 'insensitive' } },
            { studentName: { contains: search, mode: 'insensitive' } },
            { fatherName: { contains: search, mode: 'insensitive' } },
            { complainantName: { contains: search, mode: 'insensitive' } },
            { complainantMobile: { contains: search, mode: 'insensitive' } },
          ],
        },
        orderBy: [
          { priority: 'desc' },
          { createdDate: 'desc' },
        ],
        take: 30,
      });
    } catch (err: any) {
      this.logger.warn(`Search DB complaints error: ${err.message}`);
    }

    const sheetComplaints = await this.googleSheetsService.fetchComplaintLifecycleData();
    const filteredSheet = sheetComplaints.filter((c) => {
      const idMatch = (c.complaintId || '').toLowerCase().includes(search);
      const studentMatch = (c.studentName || '').toLowerCase().includes(search);
      const studentIdMatch = (c.studentId || '').toLowerCase().includes(search);
      const deptMatch = (c.department || '').toLowerCase().includes(search);
      return idMatch || studentMatch || studentIdMatch || deptMatch;
    });

    const complaintMap = new Map<string, any>();
    filteredSheet.forEach((c) => {
      if (c.complaintId) complaintMap.set(c.complaintId, c);
    });
    dbComplaints.forEach((c) => {
      complaintMap.set(c.complaintId, {
        complaintId: c.complaintId,
        studentId: c.studentId,
        studentName: c.studentName,
        fatherName: c.fatherName,
        department: c.department,
        priority: c.priority,
        status: c.status,
        complainantName: c.complainantName,
        complainantMobile: c.complainantMobile,
        createdDate: c.createdDate,
        complaintText: c.complaintText,
      });
    });

    return Array.from(complaintMap.values());
  }

  /**
   * Create a new grievance complaint
   */
  async createComplaint(data: {
    complaintId?: string;
    studentId?: string;
    studentName?: string;
    fatherName?: string;
    motherName?: string;
    parentEmail?: string;
    complainantName?: string;
    complainantRelation?: string;
    complainantMobile?: string;
    department?: string;
    complaintText?: string;
    complaintType?: string;
    priority?: string;
    status?: string;
    assignedTo?: string;
    createdDate?: string;
  }) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const complaintId = data.complaintId || `PC-${dateStr}-${random4}`;

    const complaintObj = {
      complaintId,
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      fatherName: data.fatherName || '',
      motherName: data.motherName || '',
      parentEmail: data.parentEmail || '',
      complainantName: data.complainantName || '',
      complainantRelation: data.complainantRelation || 'Self',
      complainantMobile: data.complainantMobile || '',
      department: data.department || 'ACADEMIC',
      complaintType: data.complaintType || '',
      complaintText: data.complaintText || '',
      priority: data.priority || 'NORMAL',
      status: data.status || 'PENDING',
      assignedTo: data.assignedTo || '',
      createdDate: data.createdDate || today.toLocaleDateString('en-US'),
      lastUpdated: today.toLocaleDateString('en-US'),
    };

    // 1. Sync directly to Google Sheet
    await this.googleSheetsService.appendComplaintToSheet(complaintObj);

    // 2. Save to database safely if available
    try {
      await this.prisma.grievanceComplaint.create({
        data: {
          complaintId,
          studentId: data.studentId,
          studentName: data.studentName,
          fatherName: data.fatherName,
          motherName: data.motherName,
          parentEmail: data.parentEmail,
          complainantName: data.complainantName,
          complainantRelation: data.complainantRelation,
          complainantMobile: data.complainantMobile,
          department: data.department || 'ACADEMIC',
          complaintType: data.complaintType,
          complaintText: data.complaintText,
          priority: data.priority || 'NORMAL',
          status: data.status || 'PENDING',
          assignedTo: data.assignedTo,
          createdDate: data.createdDate || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not save complaint to DB: ${err.message}`);
    }

    return complaintObj;
  }

  /**
   * Update a complaint
   */
  async updateComplaint(
    complaintId: string,
    data: {
      status?: string;
      priority?: string;
      hodResponse?: string;
      employeeResponse?: string;
      assignedTo?: string;
      resolutionDate?: string;
      complaintText?: string;
    },
  ) {
    const existing = await this.prisma.grievanceComplaint.findUnique({
      where: { complaintId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Complaint not found: ${complaintId}`);
    }

    const updateData: any = { ...data, lastUpdated: new Date() };
    if (data.resolutionDate) {
      updateData.resolutionDate = new Date(data.resolutionDate);
    }

    const complaint = await this.prisma.grievanceComplaint.update({
      where: { complaintId },
      data: updateData,
    });
    return this.mapComplaint(complaint);
  }

  /**
   * Delete a complaint
   */
  async deleteComplaint(complaintId: string) {
    const existing = await this.prisma.grievanceComplaint.findUnique({
      where: { complaintId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Complaint not found: ${complaintId}`);
    }
    await this.prisma.grievanceComplaint.update({
      where: { complaintId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ============================================================
  // CALL RECORDS
  // ============================================================

  /**
   * Get pending calls for today
   */
  async getPendingCallsForToday() {
    const todayKey = this.getTodayKey();
    const complaints = await this.prisma.grievanceComplaint.findMany({
      where: {
        deletedAt: null,
        department: 'GRIEVANCE',
        status: { in: ['PENDING', 'IN PROGRESS'] },
      },
    });

    const existingCalls = await this.prisma.grievanceCallRecord.findMany({
      where: { callDate: todayKey, deletedAt: null },
      select: { complaintId: true },
    });
    const existingKeys = new Set(existingCalls.map((c) => c.complaintId));

    return complaints
      .filter((c) => !existingKeys.has(c.id))
      .map((c) => ({
        taskKey: `GRIEVANCE|${todayKey}|${c.complaintId}`,
        callDate: todayKey,
        complaintId: c.complaintId,
        studentId: c.studentId,
        studentName: c.studentName,
        fatherName: c.fatherName,
        mobile: c.complainantMobile || '',
        complainantName: c.complainantName,
        complainantMobile: c.complainantMobile,
        department: c.department,
        priority: c.priority,
        complaintStatus: c.status,
        reason: `Grievance follow-up: ${c.complaintId}`,
        source: 'AUTO_GRIEVANCE',
      }));
  }

  /**
   * Log a call record
   */
  async logCall(payload: {
    complaintId: string;
    callStatus: string;
    callDate?: string;
    outcome?: string;
    remarks?: string;
    dropMessageContent?: string;
    callbackScheduledDate?: string;
  }) {
    const complaint = await this.prisma.grievanceComplaint.findUnique({
      where: { complaintId: payload.complaintId },
    });
    if (!complaint || complaint.deletedAt) {
      throw new NotFoundException(`Complaint not found: ${payload.complaintId}`);
    }

    const todayKey = this.getTodayKey();
    const callDate = payload.callDate || todayKey;
    const callId = `GRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const record = await this.prisma.grievanceCallRecord.create({
      data: {
        callId,
        complaintId: complaint.id,
        studentId: complaint.studentId,
        studentName: complaint.studentName,
        fatherName: complaint.fatherName,
        motherName: complaint.motherName,
        mobileNumber: complaint.complainantMobile,
        complainantName: complaint.complainantName,
        complainantRelation: complaint.complainantRelation,
        complainantMobile: complaint.complainantMobile,
        department: complaint.department,
        complaintType: complaint.complaintType,
        priority: complaint.priority,
        complaintStatus: complaint.status,
        callDate,
        callStatus: payload.callStatus,
        callOutcome: payload.outcome || '',
        dropMessageContent: payload.dropMessageContent || '',
        remarks: payload.remarks || '',
        callbackScheduledDate: payload.callbackScheduledDate || '',
      },
    });

    // Update complaint status if needed
    if (payload.callStatus === 'COMPLETED') {
      await this.prisma.grievanceComplaint.update({
        where: { id: complaint.id },
        data: { status: 'IN PROGRESS', lastUpdated: new Date() },
      });
    }

    return {
      success: true,
      callId: record.callId,
      complaintId: complaint.complaintId,
      callStatus: payload.callStatus,
    };
  }

  /**
   * Get call records for a specific complaint
   */
  async getCallRecordsForComplaint(complaintId: string) {
    const complaint = await this.prisma.grievanceComplaint.findUnique({
      where: { complaintId },
    });
    if (!complaint || complaint.deletedAt) return [];

    const records = await this.prisma.grievanceCallRecord.findMany({
      where: { complaintId: complaint.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      callId: r.callId,
      complaintId: complaint.complaintId,
      callDate: r.callDate,
      callStatus: r.callStatus,
      callOutcome: r.callOutcome,
      dropMessageContent: r.dropMessageContent,
      remarks: r.remarks,
      callbackScheduledDate: r.callbackScheduledDate,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Get recent call logs
   */
  async getRecentCallLogs(filters?: { limit?: number }) {
    const limit = Math.min(Math.max(1, filters?.limit || 50), 200);
    const records = await this.prisma.grievanceCallRecord.findMany({
      where: { deletedAt: null },
      include: { complaint: { select: { complaintId: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((r) => ({
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      callDate: r.callDate,
      complaintId: r.complaint?.complaintId || r.complaintId,
      studentName: r.studentName,
      fatherName: r.fatherName,
      mobile: r.mobileNumber,
      complainantName: r.complainantName,
      department: r.department,
      priority: r.priority,
      complaintStatus: r.complaintStatus,
      callStatus: r.callStatus,
      outcome: r.callOutcome,
      remarks: r.remarks,
    }));
  }

  /**
   * Get scheduled callbacks
   */
  async getScheduledCallbacks() {
    const todayKey = this.getTodayKey();
    const records = await this.prisma.grievanceCallRecord.findMany({
      where: {
        deletedAt: null,
        callStatus: 'CALLBACK_SCHEDULED',
        callbackScheduledDate: { gte: todayKey },
      },
      include: { complaint: { select: { complaintId: true } } },
      orderBy: { callbackScheduledDate: 'asc' },
    });

    return records.map((r) => ({
      callId: r.callId,
      complaintId: r.complaint?.complaintId || r.complaintId,
      studentName: r.studentName,
      mobile: r.mobileNumber,
      callbackDate: r.callbackScheduledDate,
      remarks: r.remarks,
    }));
  }

  /**
   * Get today's call summary
   */
  async getTodaysCallSummary() {
    const todayKey = this.getTodayKey();
    const records = await this.prisma.grievanceCallRecord.findMany({
      where: { callDate: todayKey, deletedAt: null },
    });
    const complaints = await this.prisma.grievanceComplaint.findMany({
      where: { deletedAt: null, department: 'GRIEVANCE' },
    });
    const pendingCalls = await this.getPendingCallsForToday();

    return {
      date: todayKey,
      totalComplaints: complaints.length,
      callsMade: records.length,
      pendingCalls: pendingCalls.length,
      completedCalls: records.filter((r) => r.callStatus === 'COMPLETED').length,
      notPicked: records.filter((r) => r.callStatus === 'NOT_PICKED').length,
      callbacks: records.filter((r) => r.callStatus === 'CALLBACK_SCHEDULED').length,
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private computeCallStats(records: any[]) {
    const stats: any = {
      totalCallsToday: records.length,
      completed: 0,
      notPicked: 0,
      dropMessageSent: 0,
      callbackScheduled: 0,
      wrongNumber: 0,
      switchedOff: 0,
    };
    records.forEach((r) => {
      const status = (r.callStatus || '').toUpperCase();
      if (status === 'COMPLETED') stats.completed++;
      else if (status === 'NOT_PICKED') stats.notPicked++;
      else if (status === 'DROP_MESSAGE_SENT') stats.dropMessageSent++;
      else if (status === 'CALLBACK_SCHEDULED') stats.callbackScheduled++;
      else if (status === 'WRONG_NUMBER') stats.wrongNumber++;
      else if (status === 'NUMBER_SWITCHED_OFF') stats.switchedOff++;
    });
    return stats;
  }

  private getTodayKey(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private mapComplaint(c: any) {
    return {
      id: c.id,
      complaintId: c.complaintId,
      studentId: c.studentId,
      studentName: c.studentName,
      fatherName: c.fatherName,
      motherName: c.motherName,
      parentEmail: c.parentEmail,
      complainantName: c.complainantName,
      complainantRelation: c.complainantRelation,
      complainantMobile: c.complainantMobile,
      department: c.department,
      complaintText: c.complaintText,
      complaintType: c.complaintType,
      priority: c.priority,
      status: c.status,
      assignedTo: c.assignedTo,
      hodResponse: c.hodResponse,
      employeeResponse: c.employeeResponse,
      createdDate: c.createdDate,
      lastUpdated: c.lastUpdated,
      resolutionDate: c.resolutionDate,
      callCount: c._count?.callRecords || 0,
    };
  }
}