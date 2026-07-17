import { Injectable, Logger } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';

/**
 * Maps entity types to the Google Spreadsheet IDs and target sheet names.
 */
const SHEET_MAP: Record<string, { spreadsheetId: string; sheetName: string }> = {
  students: {
    spreadsheetId: process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '',
    sheetName: 'Students',
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
};

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets!: sheets_v4.Sheets;
  private initialized = false;

  constructor() {
    this.initializeClient();
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
}