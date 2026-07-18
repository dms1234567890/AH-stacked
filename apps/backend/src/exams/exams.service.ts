import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from '../sync/google-sheets.service';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private prisma: PrismaService,
    private googleSheets: GoogleSheetsService,
  ) {}

  /**
   * Fetch all exam types from the local database.
   */
  async getAll() {
    return this.prisma.examType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Save (create or update) an exam type.
   * After saving to PostgreSQL, sync the row to Google Sheets.
   */
  async save(payload: {
    id?: string;
    name: string;
    subjectsWithMarks: Array<{ subjectName: string; maxMarks: number; optional?: boolean }>;
  }) {
    const { id, name, subjectsWithMarks } = payload;

    let record: any;

    if (id) {
      // Update existing
      const existing = await this.prisma.examType.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Exam type ${id} not found`);

      record = await this.prisma.examType.update({
        where: { id },
        data: {
          name,
          subjectsWithMarks: subjectsWithMarks as any,
        },
      });

      // Sync update to Google Sheets
      this.syncToSheet(record, 'UPDATE').catch(err =>
        this.logger.error(`Sheet sync UPDATE failed: ${err.message}`),
      );
    } else {
      // Create new
      const sheetId = String(Date.now());
      record = await this.prisma.examType.create({
        data: {
          sheetId,
          name,
          subjectsWithMarks: subjectsWithMarks as any,
        },
      });

      // Sync insert to Google Sheets
      this.syncToSheet(record, 'INSERT').catch(err =>
        this.logger.error(`Sheet sync INSERT failed: ${err.message}`),
      );
    }

    return record;
  }

  /**
   * Delete an exam type by id.
   * Also removes the corresponding row from Google Sheets.
   */
  async delete(id: string) {
    const existing = await this.prisma.examType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Exam type ${id} not found`);

    await this.prisma.examType.delete({ where: { id } });

    // Sync delete to Google Sheets
    if (existing.sheetId) {
      this.syncDeleteFromSheet(existing.sheetId).catch(err =>
        this.logger.error(`Sheet sync DELETE failed: ${err.message}`),
      );
    }

    return { success: true };
  }

  /**
   * Bootstrap: read from the Google Sheet `Exam_Types` and seed PostgreSQL.
   * This is the initial import from legacy data.
   */
  async bootstrap() {
    const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '';
    if (!spreadsheetId) {
      this.logger.warn('GOOGLE_CLASSES_STUDENTS_SHEET_ID not set; skipping bootstrap');
      return { imported: 0, skipped: 0 };
    }

    const rows = await this.googleSheets.getSheetValues(
      spreadsheetId,
      'Exam_Types!A:C',
    );

    if (!rows || rows.length <= 1) {
      this.logger.warn('Exam_Types sheet is empty or has no data rows');
      return { imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const sheetId = String(row[0] || '').trim();
      const name = String(row[1] || '').trim();
      const detailsRaw = String(row[2] || '').trim();

      if (!name) {
        skipped++;
        continue;
      }

      // Parse subjects JSON
      let subjectsWithMarks: any[] = [];
      try {
        subjectsWithMarks = JSON.parse(detailsRaw);
      } catch {
        this.logger.warn(`Could not parse subjects JSON for row ${i}: ${detailsRaw}`);
        subjectsWithMarks = [];
      }

      // Upsert by sheetId or name
      const existing = await this.prisma.examType.findFirst({
        where: {
          OR: [
            ...(sheetId ? [{ sheetId }] : []),
            { name },
          ],
        },
      });

      if (existing) {
        await this.prisma.examType.update({
          where: { id: existing.id },
          data: {
            sheetId: sheetId || existing.sheetId,
            name,
            subjectsWithMarks: subjectsWithMarks as any,
          },
        });
        skipped++;
      } else {
        await this.prisma.examType.create({
          data: {
            sheetId: sheetId || null,
            name,
            subjectsWithMarks: subjectsWithMarks as any,
          },
        });
        imported++;
      }
    }

    this.logger.log(`Bootstrap complete: ${imported} imported, ${skipped} skipped/updated`);
    return { imported, skipped };
  }

  /**
   * Sync a record to Google Sheets on INSERT or UPDATE.
   */
  private async syncToSheet(record: any, action: 'INSERT' | 'UPDATE') {
    const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '';
    if (!spreadsheetId) return;

    const sheetData: Record<string, any> = {
      ID: record.sheetId || record.id,
      Exam_Type_Name: record.name,
      Subjects_With_Marks: JSON.stringify(record.subjectsWithMarks),
    };

    try {
      if (action === 'INSERT') {
        // Use the existing sync mechanism that maps to 'Exam_Types' sheet
        // We manually call the googleSheets service methods
        const rows = await this.googleSheets.getSheetValues(spreadsheetId, 'Exam_Types!1:1');
        const headers = rows?.[0] || [];

        if (headers.length === 0) {
          // No headers yet — the bootstrap or setupSheet should handle this
          this.logger.warn('Exam_Types sheet has no headers; skipping sheet sync');
          return;
        }

        // Use the sync service for entity-based sync
        await this.googleSheets.sync('exam_types_custom', record.sheetId || record.id, action, sheetData);
      } else {
        await this.googleSheets.sync('exam_types_custom', record.sheetId || record.id, action, sheetData);
      }
    } catch (err: any) {
      this.logger.error(`Sheet sync failed for ${action}: ${err.message}`);
    }
  }

  /**
   * Remove a row from Google Sheets on DELETE.
   */
  private async syncDeleteFromSheet(sheetId: string) {
    const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '';
    if (!spreadsheetId) return;

    try {
      await this.googleSheets.sync('exam_types_custom', sheetId, 'DELETE', {});
    } catch (err: any) {
      this.logger.error(`Sheet delete sync failed: ${err.message}`);
    }
  }
}
