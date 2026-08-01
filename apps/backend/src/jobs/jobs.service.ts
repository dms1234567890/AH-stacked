import { Injectable, Logger } from '@nestjs/common';
import { GoogleSheetsService } from '../sync/google-sheets.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  /**
   * Get Bootstrap metadata (Departments & Positions list + Requisitions roster)
   */
  async getBootstrapData() {
    const { departments, positions } = await this.googleSheetsService.fetchJobReqDepartmentsAndPositions();
    const requisitions = await this.googleSheetsService.fetchJobRequisitions();

    return {
      departments,
      positions,
      requisitions,
    };
  }

  /**
   * Get all job requisitions
   */
  async getRequisitions() {
    return this.googleSheetsService.fetchJobRequisitions();
  }

  /**
   * Submit a new job requisition
   */
  async submitRequisition(data: {
    requesterEmpId: string;
    requesterDept: string;
    requesterPos: string;
    department: string;
    position: string;
    numCandidates: number;
    salary: string;
    requiredBy: string;
    jobDescription: string;
    candidateRequirements: string;
  }) {
    if (!data.requesterEmpId || !data.department || !data.position) {
      throw new Error('Requester Employee ID, Department, and Position are required.');
    }

    const success = await this.googleSheetsService.appendJobRequisition(data);
    return {
      status: success ? 'Success' : 'PartialSuccess',
      message: success
        ? 'Job requirement submitted successfully!'
        : 'Requirement saved locally (Google Sheet update pending).',
      data,
    };
  }
}
