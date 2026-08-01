import { Injectable, Logger } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';

/**
 * Maps entity types to the Google Spreadsheet IDs and target sheet names.
 */
const SHEET_MAP: Record<string, { spreadsheetId: string; sheetName: string }> = {
  students: {
    spreadsheetId: process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '',
    sheetName: 'students_database',
  },
  admissions: {
    spreadsheetId: process.env.GOOGLE_ADMISSIONS_SHEET_ID || '',
    sheetName: 'Admissions',
  },
  batches: {
    spreadsheetId: process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '',
    sheetName: 'Batches',
  },
  tasks: {
    spreadsheetId: process.env.GOOGLE_LOGIN_SHEET_ID || '',
    sheetName: 'Tasks',
  },
  employees: {
    spreadsheetId: process.env.GOOGLE_LOGIN_SHEET_ID || '',
    sheetName: 'Employees',
  },
  teachers: {
    spreadsheetId: process.env.GOOGLE_LOGIN_SHEET_ID || '',
    sheetName: 'Teachers',
  },
  subjects: {
    spreadsheetId: process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '',
    sheetName: 'Subjects',
  },
  exam_types_custom: {
    spreadsheetId: process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '',
    sheetName: 'Exam_Types',
  },
};

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets!: sheets_v4.Sheets;
  private initialized = false;

  constructor() {
    this.initializeClient();
  }

  /**
   * Lets read-only reporting features fail clearly when Sheets credentials are
   * absent, instead of presenting an empty report as if no records existed.
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  private initializeClient() {
    try {
      const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!serviceAccountEmail || !privateKey) {
        this.logger.warn(
          'Google Service Account credentials not configured. Sheets sync will be skipped.',
        );
        return;
      }

      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth } as any);
      this.initialized = true;
      this.logger.log('Google Sheets API client initialized');
    } catch (error: any) {
      this.logger.error(`Failed to initialize Google Sheets client: ${error.message}`);
    }
  }

  /**
   * Sync an entity's data to the appropriate Google Sheet.
   * Uses append mode for INSERT, update-in-place for UPDATE, and clear for DELETE.
   */
  async sync(
    entityType: string,
    entityId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, any>,
  ): Promise<void> {
    if (!this.initialized) {
      this.logger.warn(`Sheets client not initialized. Skipping sync for ${entityType}:${entityId}`);
      return;
    }

    const sheetInfo = SHEET_MAP[entityType];
    if (!sheetInfo || !sheetInfo.spreadsheetId) {
      this.logger.warn(`No sheet mapping for entity type: ${entityType}. Skipping.`);
      return;
    }

    const { spreadsheetId, sheetName } = sheetInfo;

    switch (action) {
      case 'INSERT':
        await this.appendRow(spreadsheetId, sheetName, data);
        break;
      case 'UPDATE':
        await this.updateRow(spreadsheetId, sheetName, entityId, data);
        break;
      case 'DELETE':
        await this.deleteRow(spreadsheetId, sheetName, entityId);
        break;
    }
  }

  /**
   * Append a new row to the sheet. If the sheet has no header row,
   * it writes the column headers first based on the data keys.
   */
  private async appendRow(
    spreadsheetId: string,
    sheetName: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      const existingHeaders = await this.getHeaders(spreadsheetId, sheetName);
      let headers: string[];

      if (existingHeaders.length === 0) {
        // No header row; write headers from data keys + data row
        headers = Object.keys(data);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers, headers.map((h) => String(data[h] ?? ''))],
          },
        });
        this.logger.log(`Created header row and appended data to ${sheetName}`);
      } else {
        headers = existingHeaders;
        const row = headers.map((h) => String(data[h] ?? ''));
        await this.sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:A`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [row] },
        });
        this.logger.log(`Appended row to ${sheetName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error appending row to ${sheetName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a row identified by entityId. We find the row by scanning
   * the first column for a matching ID. This is O(n) but fine for moderate sheets.
   */
  private async updateRow(
    spreadsheetId: string,
    sheetName: string,
    entityId: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      const headers = await this.getHeaders(spreadsheetId, sheetName);
      if (headers.length === 0) {
        this.logger.warn(`No headers found in ${sheetName}; cannot update`);
        return;
      }

      const rows = await this.getAllRows(spreadsheetId, sheetName);
      if (rows.length === 0) return;

      // Assume first column is an ID field (e.g., "Student ID", "Employee ID", "Token")
      const idColumn = headers[0];
      const rowIndex = rows.findIndex((row) => row[0] === entityId);
      if (rowIndex === -1) {
        // Row not found; append instead
        this.logger.warn(`Entity ${entityId} not found in ${sheetName}; appending new row`);
        return this.appendRow(spreadsheetId, sheetName, data);
      }

      // Build the updated row preserving column order
      const updatedRow = headers.map((h) => String(data[h] ?? ''));
      const sheetRow = rowIndex + 2; // +1 for header, +1 for 1-based index
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [updatedRow] },
      });
      this.logger.log(`Updated row ${sheetRow} in ${sheetName}`);
    } catch (error: any) {
      this.logger.error(`Error updating row in ${sheetName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a row by clearing its content. Sheets API does not support
   * row deletion directly via values, so we clear and shift if needed.
   * We use the batchUpdate method to delete rows when possible.
   */
  private async deleteRow(
    spreadsheetId: string,
    sheetName: string,
    entityId: string,
  ): Promise<void> {
    try {
      const headers = await this.getHeaders(spreadsheetId, sheetName);
      if (headers.length === 0) return;

      const rows = await this.getAllRows(spreadsheetId, sheetName);
      const rowIndex = rows.findIndex((row) => row[0] === entityId);
      if (rowIndex === -1) {
        this.logger.warn(`Entity ${entityId} not found in ${sheetName}; nothing to delete`);
        return;
      }

      // Clear the row content (keep structure intact)
      const sheetRow = rowIndex + 2;
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A${sheetRow}:${String.fromCharCode(64 + headers.length)}${sheetRow}`,
      });
      this.logger.log(`Cleared row ${sheetRow} in ${sheetName} for deleted entity`);
    } catch (error: any) {
      this.logger.error(`Error deleting row in ${sheetName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read the header row (first row) of a sheet.
   */
  private async getHeaders(spreadsheetId: string, sheetName: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
      });
      return response.data.values?.[0] || [];
    } catch {
      return [];
    }
  }

  /**
   * Read all values for a given spreadsheet and range.
   */
  async getSheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
    if (!this.initialized) {
      this.logger.warn('Sheets client not initialized. Cannot read sheet values.');
      return [];
    }
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values || [];
    } catch (error: any) {
      this.logger.error(`Error reading sheet values from ${spreadsheetId} for range ${range}: ${error.message}`);
      return [];
    }
  }

  /**
   * Read all data rows (excluding header) from a sheet.
   */
  private async getAllRows(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });
      const values = response.data.values || [];
      // Skip header row
      return values.slice(1);
    } catch {
      return [];
    }
  }

  /**
   * Fetch a single user by username from the Login Google Sheet.
   */
  async fetchUserFromSheet(username: string): Promise<{
    username: string;
    password: string;
    post: string;
    id?: string;
    name?: string;
    email?: string;
    mobile?: string;
  } | null> {
    if (!this.initialized) return null;
    const spreadsheetId = process.env.GOOGLE_LOGIN_SHEET_ID || '1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI';
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Login!A:G',
      });
      const rows = response.data.values || [];
      const target = username.trim().toLowerCase();
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const sheetUsername = (row[0] || '').toString().trim();
        if (sheetUsername.toLowerCase() === target) {
          return {
            username: sheetUsername,
            password: (row[1] || '').toString().trim(),
            post: (row[2] || 'ACADEMIC MANAGER').toString().trim(),
            id: (row[3] || '').toString().trim() || undefined,
            name: (row[4] || sheetUsername).toString().trim(),
            email: (row[5] || '').toString().trim() || undefined,
            mobile: (row[6] || '').toString().trim() || undefined,
          };
        }
      }
      return null;
    } catch (error: any) {
      this.logger.warn(`Could not read Login sheet: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch all users from the Login Google Sheet.
   */
  async fetchAllUsersFromSheet(): Promise<Array<{
    username: string;
    password: string;
    post: string;
    id?: string;
    name?: string;
    email?: string;
    mobile?: string;
  }>> {
    if (!this.initialized) return [];
    const spreadsheetId = process.env.GOOGLE_LOGIN_SHEET_ID || '1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI';
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Login!A:G',
      });
      const rows = response.data.values || [];
      const users: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const username = (row[0] || '').toString().trim();
        const password = (row[1] || '').toString().trim();
        if (!username || !password) continue;
        users.push({
          username,
          password,
          post: (row[2] || 'ACADEMIC MANAGER').toString().trim(),
          id: (row[3] || '').toString().trim() || undefined,
          name: (row[4] || username).toString().trim(),
          email: (row[5] || '').toString().trim() || undefined,
          mobile: (row[6] || '').toString().trim() || undefined,
        });
      }
      return users;
    } catch (error: any) {
      this.logger.warn(`Could not read Login sheet: ${error.message}`);
      return [];
    }
  }

  /**
   * Looks up an Academic user in the Departments sheet used by the legacy
   * Academic Head app. Only rows whose DepartmentName is ACADEMIC are valid
   * credentials; all other departments are intentionally excluded.
   */
  async fetchAcademicDepartmentUser(username: string): Promise<{
    username: string;
    password: string;
    post: string;
    id: string;
    name: string;
    email?: string;
    mobile?: string;
  } | null> {
    if (!this.initialized) return null;

    const spreadsheetId =
      process.env.GOOGLE_DEPARTMENTS_SHEET_ID ||
      '1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA';
    const requestedUsername = username.trim();

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Departments!A:I',
      });
      const rows = response.data.values || [];
      if (rows.length < 2) return null;

      const headerIndex: Record<string, number> = {};
      rows[0].forEach((header, index) => {
        const key = String(header || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '');
        if (key) headerIndex[key] = index;
      });
      const column = (aliases: string[], fallback: number) => {
        for (const alias of aliases) {
          const index = headerIndex[alias.toLowerCase().replace(/[^a-z0-9]+/g, '')];
          if (index !== undefined) return index;
        }
        return fallback;
      };

      // Fallback positions match the established Academic Head application.
      const departmentIdIndex = column(['DepartmentID', 'Department Id'], 0);
      const departmentNameIndex = column(['DepartmentName', 'Department Name'], 1);
      const headNameIndex = column(['HeadName', 'Head Name'], 2);
      const headIdIndex = column(['HeadId', 'Head Id'], 4);
      const mobileIndex = column(['Department_mobile_number', 'Department Mobile Number', 'Mobile'], 5);
      const emailIndex = column(['Department_email_id', 'Department Email Id', 'Email'], 6);
      const usernameIndex = column(['user_id', 'User Id', 'Username'], 7);
      const passwordIndex = column(['password', 'Password'], 8);

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const department = String(row[departmentNameIndex] || '').trim().toUpperCase();
        const sheetUsername = String(row[usernameIndex] || '').trim();
        if (department !== 'ACADEMIC' || sheetUsername !== requestedUsername) continue;

        const departmentId = String(row[departmentIdIndex] || '').trim();
        const headId = String(row[headIdIndex] || '').trim();
        return {
          username: sheetUsername,
          password: String(row[passwordIndex] || '').trim(),
          post: 'ACADEMIC',
          id: headId || departmentId || sheetUsername,
          name: String(row[headNameIndex] || sheetUsername).trim(),
          email: String(row[emailIndex] || '').trim() || undefined,
          mobile: String(row[mobileIndex] || '').trim() || undefined,
        };
      }
      return null;
    } catch (error: any) {
      this.logger.warn(`Could not read Academic Departments sheet: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch Telecaller Calling Operations Data from Google Sheets
   */
  async fetchCallingSheetsData(): Promise<{
    attendanceTasks: any[];
    homeworkTasks: any[];
    callLogs: any[];
    callRecords: any[];
  }> {
    if (!this.initialized) {
      return { attendanceTasks: [], homeworkTasks: [], callLogs: [], callRecords: [] };
    }

    const opsSpreadsheetId = '1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8';
    const callSpreadsheetId = '12FZpI5aftOfockOMeZf0rNRZozZ9JFOPtSSLEdFFpUg';

    const attendanceTasks: any[] = [];
    const homeworkTasks: any[] = [];
    const callLogs: any[] = [];
    const callRecords: any[] = [];

    // 1. Read Attendance Data
    try {
      const resAtt = await this.sheets.spreadsheets.values.get({
        spreadsheetId: opsSpreadsheetId,
        range: "'Student'sAttendenceData'!A1:Z1000",
      });
      const rows = resAtt.data.values || [];
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const date = String(row[0] || '').trim();
          const batch = String(row[1] || '').trim();
          const studentName = String(row[2] || '').trim();
          const studentId = String(row[3] || '').trim();
          const presence = String(row[4] || '').trim().toUpperCase();
          const teacherName = String(row[6] || '').trim();
          const reason = String(row[7] || '').trim();

          if (presence === 'ABSENT' || presence.includes('ABSENT')) {
            attendanceTasks.push({
              date,
              batch,
              studentName,
              studentId,
              teacherName,
              reason: reason ? `ABSENT: ${reason}` : `Attendance: ABSENT on ${date}`,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Attendance sheet: ${err.message}`);
    }

    // 2. Read Homework Data
    try {
      const resHw = await this.sheets.spreadsheets.values.get({
        spreadsheetId: opsSpreadsheetId,
        range: 'Homework_data!A1:Z1000',
      });
      const rows = resHw.data.values || [];
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const date = String(row[1] || '').trim();
          const batch = String(row[2] || '').trim();
          const studentId = String(row[3] || '').trim();
          const studentName = String(row[4] || '').trim();
          const fatherName = String(row[5] || '').trim();
          const subject = String(row[6] || '').trim();
          const status = String(row[7] || '').trim();

          if (status.toLowerCase().includes('absent') || status.toLowerCase().includes('incomplete') || status.toLowerCase().includes('pending')) {
            homeworkTasks.push({
              date,
              batch,
              studentId,
              studentName,
              fatherName,
              subject,
              status,
              reason: `HW Incomplete: ${subject} (${status})`,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Homework sheet: ${err.message}`);
    }

    // 3. Read Call_Log Data
    try {
      const resLog = await this.sheets.spreadsheets.values.get({
        spreadsheetId: callSpreadsheetId,
        range: 'Call_Log!A1:Z1000',
      });
      const rows = resLog.data.values || [];
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          callLogs.push({
            createdAt: row[0],
            updatedAt: row[1],
            callDate: row[2],
            taskKey: row[3],
            taskType: row[4],
            studentId: row[5],
            studentName: row[6],
            fatherName: row[7],
            mobile: row[8],
            batch: row[9],
            reason: row[10],
            source: row[11],
            status: row[12],
            outcome: row[13],
            remarks: row[14],
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Call_Log sheet: ${err.message}`);
    }

    // 4. Read Call_Records Data
    try {
      const resRec = await this.sheets.spreadsheets.values.get({
        spreadsheetId: callSpreadsheetId,
        range: 'Call_Records!A1:Z1000',
      });
      const rows = resRec.data.values || [];
      if (rows.length > 1) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          callRecords.push({
            callId: row[0],
            callDate: row[1],
            studentId: row[2],
            studentName: row[3],
            fatherName: row[4],
            mobile: row[5],
            batch: row[6],
            taskType: row[7],
            status: row[8],
            outcome: row[9],
            dropMessageStatus: row[10],
            dropMessageContent: row[11],
            remarks: row[12],
            createdAt: row[13],
            updatedAt: row[14],
            taskKey: row[15],
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Call_Records sheet: ${err.message}`);
    }

    return { attendanceTasks, homeworkTasks, callLogs, callRecords };
  }

  /**
   * Fetch Complaint Lifecycle Data from Google Sheet 1cQtrY026MlF7yvEg8YtsPyB_DKxTV9Da_0BC7W6E9Nw
   */
  async fetchComplaintLifecycleData(): Promise<any[]> {
    if (!this.initialized) return [];

    const complaintSpreadsheetId = '1cQtrY026MlF7yvEg8YtsPyB_DKxTV9Da_0BC7W6E9Nw';
    try {
      const resLC = await this.sheets.spreadsheets.values.get({
        spreadsheetId: complaintSpreadsheetId,
        range: 'Complaint_Lifecycle!A1:Z1000',
      });
      const rows = resLC.data.values || [];
      if (rows.length < 2) return [];

      const complaints: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;
        complaints.push({
          complaintId: String(row[0] || '').trim(),
          studentId: String(row[1] || '').trim(),
          studentName: String(row[2] || '').trim(),
          parentEmail: String(row[3] || '').trim(),
          department: String(row[4] || '').trim(),
          complaintType: String(row[5] || '').trim(),
          complaintText: String(row[6] || '').trim(),
          priority: String(row[7] || 'NORMAL').trim(),
          status: String(row[8] || 'PENDING').trim(),
          assignedTo: String(row[9] || '').trim(),
          hodResponse: String(row[10] || '').trim(),
          employeeResponse: String(row[11] || '').trim(),
          createdDate: String(row[12] || '').trim(),
          lastUpdated: String(row[13] || '').trim(),
          resolutionDate: String(row[14] || '').trim(),
          fatherName: String(row[15] || '').trim(),
          motherName: String(row[16] || '').trim(),
          complainantName: String(row[17] || '').trim(),
          complainantRelation: String(row[18] || '').trim(),
          complainantMobile: String(row[19] || '').trim(),
        });
      }
      return complaints;
    } catch (err: any) {
      this.logger.warn(`Could not fetch Complaint_Lifecycle sheet: ${err.message}`);
      return [];
    }
  }

  /**
   * Append a new Complaint row to Google Sheet 1cQtrY026MlF7yvEg8YtsPyB_DKxTV9Da_0BC7W6E9Nw
   */
  async appendComplaintToSheet(complaint: any): Promise<boolean> {
    if (!this.initialized) return false;

    const complaintSpreadsheetId = '1cQtrY026MlF7yvEg8YtsPyB_DKxTV9Da_0BC7W6E9Nw';
    try {
      const row = [
        complaint.complaintId,
        complaint.studentId || '',
        complaint.studentName || '',
        complaint.parentEmail || '',
        complaint.department || 'ACADEMIC',
        complaint.complaintType || '',
        complaint.complaintText || '',
        complaint.priority || 'NORMAL',
        complaint.status || 'PENDING',
        complaint.assignedTo || '',
        complaint.hodResponse || '',
        complaint.employeeResponse || '',
        complaint.createdDate || new Date().toLocaleDateString('en-US'),
        complaint.lastUpdated || new Date().toLocaleDateString('en-US'),
        complaint.resolutionDate || '',
        complaint.fatherName || '',
        complaint.motherName || '',
        complaint.complainantName || '',
        complaint.complainantRelation || '',
        complaint.complainantMobile || '',
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: complaintSpreadsheetId,
        range: 'Complaint_Lifecycle!A:T',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      return true;
    } catch (err: any) {
      this.logger.warn(`Could not append complaint to Google Sheet: ${err.message}`);
      return false;
    }
  }

  /**
   * Fetch Departments and Positions for Job Requisition
   * Spreadsheet ID: 1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA
   */
  async fetchJobReqDepartmentsAndPositions(): Promise<{ departments: string[]; positions: string[] }> {
    if (!this.initialized) return { departments: [], positions: [] };

    const spreadsheetId = '1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA';
    let departments: string[] = [];
    let positions: string[] = [];

    try {
      const resDept = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Departments!A1:B100',
      });
      const rows = resDept.data.values || [];
      if (rows.length > 1) {
        departments = rows.slice(1).map((r: any) => String(r[1] || r[0] || '').trim()).filter(Boolean);
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Job Departments sheet: ${err.message}`);
    }

    try {
      const resPos = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Positions!A1:B100',
      });
      const rows = resPos.data.values || [];
      if (rows.length > 1) {
        positions = rows.slice(1).map((r: any) => String(r[1] || r[0] || '').trim()).filter(Boolean);
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch Job Positions sheet: ${err.message}`);
    }

    if (departments.length === 0) {
      departments = [
        'ACADEMIC', 'ADMINISTRATION', 'ACCOUNTS', 'ADMISSION', 'MARKETING',
        'HR', 'IT & TECH', 'TRANSPORT', 'HOSTEL', 'EXAM & EVALUATION', 'MANAGEMENT'
      ];
    }
    if (positions.length === 0) {
      positions = [
        'Faculty / Teacher', 'Senior Teacher', 'Subject Head', 'Telecaller',
        'Academic Counsellor', 'Receptionist / Front Desk', 'Office Assistant',
        'Accountant', 'HR Executive', 'IT Support Engineer', 'Hostel Warden',
        'Transport Manager', 'Lab Assistant', 'DTP Operator'
      ];
    }

    return { departments, positions };
  }

  /**
   * Fetch submitted Job Requisitions from Google Sheet
   */
  async fetchJobRequisitions(): Promise<any[]> {
    if (!this.initialized) return [];

    const spreadsheetId = '1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA';
    try {
      const resReq = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Requisitions!A1:L1000',
      });
      const rows = resReq.data.values || [];
      if (rows.length < 2) return [];

      const requisitions: any[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] && !row[1] && !row[4]) continue;
        requisitions.push({
          id: `REQ-${i}`,
          timestamp: String(row[0] || '').trim(),
          requesterEmpId: String(row[1] || '').trim(),
          requesterDept: String(row[2] || '').trim(),
          requesterPos: String(row[3] || '').trim(),
          department: String(row[4] || '').trim(),
          position: String(row[5] || '').trim(),
          numCandidates: Number(row[6]) || 1,
          salary: String(row[7] || '').trim(),
          requiredBy: String(row[8] || '').trim(),
          jobDescription: String(row[9] || '').trim(),
          candidateRequirements: String(row[10] || '').trim(),
          status: String(row[11] || 'PENDING').trim(),
        });
      }
      return requisitions.reverse();
    } catch (err: any) {
      this.logger.warn(`Could not fetch Job Requisitions sheet: ${err.message}`);
      return [];
    }
  }

  /**
   * Append a new Job Requisition row to Google Sheet
   */
  async appendJobRequisition(data: any): Promise<boolean> {
    if (!this.initialized) return false;

    const spreadsheetId = '1AxdiOpaij8Lnx0TV5iMhgVlADfN0LeXzwOdmbzmrlGA';
    try {
      const row = [
        new Date().toLocaleString('en-US'),
        String(data.requesterEmpId || '').toUpperCase().trim(),
        data.requesterDept || '',
        data.requesterPos || '',
        data.department || '',
        data.position || '',
        data.numCandidates || 1,
        data.salary || '',
        data.requiredBy || '',
        data.jobDescription || '',
        data.candidateRequirements || '',
        'PENDING',
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Requisitions!A:L',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      return true;
    } catch (err: any) {
      this.logger.warn(`Could not append Job Requisition to Google Sheet: ${err.message}`);
      return false;
    }
  }
}
