import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class HeadsService {
  constructor(private prisma: PrismaService) {}

  async getBootstrapData() {
    const [employees, batches, subjects, subjectHeads, batchHeads, syllabusOverview] = await Promise.all([
      this.prisma.employee.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          employeeId: true,
          department: true,
          designation: true,
        },
      }),
      this.prisma.batch.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.headAssignment.findMany({
        where: { assignmentType: 'Subject' },
      }),
      this.prisma.headAssignment.findMany({
        where: { assignmentType: 'Batch' },
      }),
      this.getSyllabusOverview(),
    ]);

    return {
      employees,
      batches,
      subjects,
      subjectHeads,
      batchHeads,
      syllabusOverview,
    };
  }

  async saveSubjectHead(payload: any) {
    const { targetName, headEmployeeId, headName, assignedBy } = payload;
    
    // Check if it already exists to update
    const existing = await this.prisma.headAssignment.findFirst({
      where: { assignmentType: 'Subject', targetName },
    });

    if (existing) {
      return this.prisma.headAssignment.update({
        where: { id: existing.id },
        data: {
          headEmployeeId,
          headName,
          assignedBy,
        },
      });
    }

    return this.prisma.headAssignment.create({
      data: {
        assignmentType: 'Subject',
        targetName,
        headEmployeeId,
        headName,
        assignedBy,
      },
    });
  }

  async saveBatchHead(payload: any) {
    const { targetName, headEmployeeId, headName, assignedBy } = payload;
    
    const existing = await this.prisma.headAssignment.findFirst({
      where: { assignmentType: 'Batch', targetName },
    });

    if (existing) {
      return this.prisma.headAssignment.update({
        where: { id: existing.id },
        data: {
          headEmployeeId,
          headName,
          assignedBy,
        },
      });
    }

    return this.prisma.headAssignment.create({
      data: {
        assignmentType: 'Batch',
        targetName,
        headEmployeeId,
        headName,
        assignedBy,
      },
    });
  }

  async deleteSubjectHead(id: string) {
    return this.prisma.headAssignment.delete({
      where: { id },
    });
  }

  async deleteBatchHead(id: string) {
    return this.prisma.headAssignment.delete({
      where: { id },
    });
  }

  async getSyllabusModules(batchName: string, subjectName: string) {
    const modules = await this.prisma.syllabusModule.findMany({
      where: { batchName, subjectName },
      orderBy: { moduleNumber: 'asc' },
    });

    // Also get module progress for this batch + subject
    const progressRecords = await this.prisma.moduleProgress.findMany({
      where: { batchName, subjectName, status: 'Completed' },
    });

    const completedModuleNumbers = new Set(progressRecords.map(p => p.moduleNumber));

    return modules.map(m => ({
      ...m,
      status: completedModuleNumbers.has(m.moduleNumber) ? 'Completed' : 'Pending',
    }));
  }

  async saveSyllabusModule(payload: any) {
    const { id, batchName, subjectName, moduleTitle, chapterName, moduleDescription, dueDate } = payload;
    
    let { moduleNumber } = payload;
    if (!moduleNumber && !id) {
      // Find latest module number
      const latestModule = await this.prisma.syllabusModule.findFirst({
        where: { batchName, subjectName },
        orderBy: { moduleNumber: 'desc' },
      });
      if (latestModule && latestModule.moduleNumber.startsWith('M')) {
        const num = parseInt(latestModule.moduleNumber.replace('M', ''), 10);
        moduleNumber = `M${(num + 1).toString().padStart(3, '0')}`;
      } else {
        moduleNumber = 'M001';
      }
    }

    if (id) {
      return this.prisma.syllabusModule.update({
        where: { id },
        data: {
          moduleTitle,
          chapterName,
          moduleDescription,
          dueDate,
        },
      });
    }

    return this.prisma.syllabusModule.create({
      data: {
        batchName,
        subjectName,
        moduleNumber,
        moduleTitle,
        chapterName,
        moduleDescription,
        dueDate,
      },
    });
  }

  async deleteSyllabusModule(id: string) {
    return this.prisma.syllabusModule.delete({
      where: { id },
    });
  }

  async getSyllabusOverview() {
    const modules = await this.prisma.syllabusModule.findMany();
    const progressRecords = await this.prisma.moduleProgress.findMany({
      where: { status: 'Completed' },
    });

    const completedSet = new Set(
      progressRecords.map(p => `${p.batchName}-${p.subjectName}-${p.moduleNumber}`)
    );

    const overviewMap = new Map<string, any>();

    for (const m of modules) {
      const key = `${m.batchName}-${m.subjectName}`;
      if (!overviewMap.has(key)) {
        overviewMap.set(key, {
          batchName: m.batchName,
          subjectName: m.subjectName,
          moduleCount: 0,
          completedCount: 0,
          pendingCount: 0,
          latestStatus: 'Pending',
          lastUpdated: m.updatedAt,
        });
      }

      const stats = overviewMap.get(key);
      stats.moduleCount += 1;
      
      const isCompleted = completedSet.has(`${m.batchName}-${m.subjectName}-${m.moduleNumber}`);
      if (isCompleted) {
        stats.completedCount += 1;
      } else {
        stats.pendingCount += 1;
      }

      if (new Date(m.updatedAt) > new Date(stats.lastUpdated)) {
        stats.lastUpdated = m.updatedAt;
      }
    }

    const result = Array.from(overviewMap.values()).map(stats => {
      stats.latestStatus = stats.pendingCount === 0 && stats.moduleCount > 0 ? 'Completed' : 'Pending';
      return stats;
    });

    return result;
  }

  async generateSyllabusPdf(batchName: string, subjectName: string) {
    const modules = await this.getSyllabusModules(batchName, subjectName);

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; color: #333; }
            h3 { text-align: center; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>Syllabus</h1>
          <h3>Batch: ${batchName} | Subject: ${subjectName}</h3>
          <table>
            <thead>
              <tr>
                <th>Module #</th>
                <th>Title</th>
                <th>Chapter</th>
                <th>Description</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${modules.map(m => `
                <tr>
                  <td>${m.moduleNumber}</td>
                  <td>${m.moduleTitle}</td>
                  <td>${m.chapterName}</td>
                  <td>${m.moduleDescription || ''}</td>
                  <td>${m.dueDate || ''}</td>
                  <td>${m.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Simple base64 encoding of HTML to represent the PDF response requirement
    const base64Html = Buffer.from(htmlContent).toString('base64');

    return {
      fileName: `Syllabus_${batchName}_${subjectName}.html`,
      mimeType: 'text/html',
      base64: base64Html,
    };
  }
}
