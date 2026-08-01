import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);
  constructor(private readonly prisma: PrismaService) {}

  timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  parseTimeSlot(slot: string): { startMinutes: number; endMinutes: number } {
    if (!slot || !slot.includes('-')) return { startMinutes: 0, endMinutes: 0 };
    const [start, end] = slot.split('-');
    return {
      startMinutes: this.timeToMinutes(start.trim()),
      endMinutes: this.timeToMinutes(end.trim()),
    };
  }

  isTimeOverlap(slotA: string, slotB: string): boolean {
    const a = this.parseTimeSlot(slotA);
    const b = this.parseTimeSlot(slotB);
    return Math.max(a.startMinutes, b.startMinutes) < Math.min(a.endMinutes, b.endMinutes);
  }

  getWeekDay(dateStr: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  }

  async getBootstrapData() {
    const [teachers, batches, subjects, workTimes, recurring] = await Promise.all([
      this.prisma.teacher.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
      this.prisma.batch.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } }),
      this.prisma.subject.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } }),
      this.getTeacherWorkTimes(),
      this.getRecurringSchedule(),
    ]);

    return { teachers, batches, subjects, workTimes, recurring };
  }

  async getRecurringSchedule(batchId?: string) {
    return this.prisma.recurringSchedule.findMany({
      where: batchId ? { batchId } : undefined,
      include: { batch: true, teacher: true },
    });
  }

  async saveRecurringSchedule(batchId: string, weekDay: string | null, entries: any[]) {
    await this.prisma.recurringSchedule.deleteMany({
      where: {
        batchId,
        weekDay: weekDay === null ? null : weekDay,
      },
    });

    if (entries && entries.length > 0) {
      await this.prisma.recurringSchedule.createMany({
        data: entries.map(entry => ({
          batchId,
          weekDay,
          timeSlot: entry.timeSlot,
          subject: entry.subject,
          dutyType: entry.dutyType,
          classRoom: entry.classRoom,
          teacherId: entry.teacherId,
          teacherName: entry.teacherName,
        })),
      });
    }
    return { success: true };
  }

  async getScheduleForDate(date: string) {
    const weekDay = this.getWeekDay(date);
    const dateObj = new Date(date);

    const [recurring, overrides, merged] = await Promise.all([
      this.prisma.recurringSchedule.findMany({
        where: { OR: [{ weekDay }, { weekDay: null }] },
        include: { batch: true, teacher: true },
      }),
      this.getPartialOverrides(date),
      this.getMergedClasses(date),
    ]);

    return { recurring, overrides, merged };
  }

  async savePartialOverride(data: any) {
    return this.prisma.partialScheduleOverride.create({
      data: {
        date: new Date(data.date),
        batchId: data.batchId,
        timeSlot: data.timeSlot,
        subject: data.subject,
        dutyType: data.dutyType,
        classRoom: data.classRoom,
        originalTeacherId: data.originalTeacherId,
        replacementTeacherId: data.replacementTeacherId,
        reason: data.reason,
      },
    });
  }

  async getPartialOverrides(date: string) {
    return this.prisma.partialScheduleOverride.findMany({
      where: { date: new Date(date) },
      include: { batch: true, originalTeacher: true, replacementTeacher: true },
    });
  }

  async saveTeacherWorkTime(teacherId: string, startTime: string, endTime: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new Error('Teacher not found');

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    return this.prisma.teacherWorkTime.upsert({
      where: { teacherId },
      create: {
        teacherId,
        teacherName: teacher.name,
        startTime,
        endTime,
        startMinutes,
        endMinutes,
      },
      update: {
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        teacherName: teacher.name,
      },
    });
  }

  async getTeacherWorkTimes() {
    return this.prisma.teacherWorkTime.findMany({
      include: { teacher: true },
    });
  }

  async deleteTeacherWorkTime(teacherId: string) {
    return this.prisma.teacherWorkTime.delete({ where: { teacherId } });
  }

  async saveTeacherAbsence(data: any) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: data.teacherId } });
    return this.prisma.teacherAbsence.create({
      data: {
        teacherId: data.teacherId,
        teacherName: teacher?.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        absenceType: data.absenceType,
        reason: data.reason,
      },
    });
  }

  async getTeacherAbsences(params: any) {
    const where: any = {};
    if (params.teacherId) where.teacherId = params.teacherId;
    if (params.startDate) where.startDate = { gte: new Date(params.startDate) };
    if (params.endDate) where.endDate = { lte: new Date(params.endDate) };

    return this.prisma.teacherAbsence.findMany({
      where,
      include: { teacher: true },
    });
  }

  async saveMergedClass(data: any) {
    return this.prisma.mergedClass.create({
      data: {
        date: new Date(data.date),
        originalBatchId: data.originalBatchId,
        mergedBatchId: data.mergedBatchId,
        timeSlot: data.timeSlot,
        subject: data.subject,
        dutyType: data.dutyType,
        classRoom: data.classRoom,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        reason: data.reason,
      },
    });
  }

  async deleteMergedClass(id: string) {
    return this.prisma.mergedClass.delete({ where: { id } });
  }

  async getMergedClasses(date: string) {
    return this.prisma.mergedClass.findMany({
      where: { date: new Date(date) },
      include: { originalBatch: true, mergedBatch: true, teacher: true },
    });
  }

  async saveSundayDuty(date: string, entries: any[]) {
    if (!entries || entries.length === 0) return { success: true };
    
    await this.prisma.sundayDuty.createMany({
      data: entries.map(entry => ({
        date: new Date(date),
        roomNumber: entry.roomNumber,
        startTime: entry.startTime,
        endTime: entry.endTime,
        teacherId: entry.teacherId,
        teacherName: entry.teacherName,
        remarks: entry.remarks,
      })),
    });
    return { success: true };
  }

  async getSundayDuties(date: string) {
    return this.prisma.sundayDuty.findMany({
      where: { date: new Date(date) },
      include: { teacher: true },
    });
  }

  async deleteSundayDuty(id: string) {
    return this.prisma.sundayDuty.delete({ where: { id } });
  }

  async getFreeTimeAnalytics(date: string, teacherId?: string) {
    const weekDay = this.getWeekDay(date);
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    // Get all teachers
    const teachers = await this.prisma.teacher.findMany({
      where: {
        deletedAt: null,
        ...(teacherId ? { id: teacherId } : {}),
      },
      orderBy: { name: 'asc' },
    });

    // Get recurring schedules for today
    const recurring = await this.prisma.recurringSchedule.findMany({
      where: { OR: [{ weekDay }, { weekDay: null }] },
    });

    // Get partial overrides for today
    const overrides = await this.prisma.partialScheduleOverride.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // Get merged classes for today
    const merged = await this.prisma.mergedClass.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // Get absences for today
    const absences = await this.prisma.teacherAbsence.findMany({
      where: {
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });

    // Get work times
    const workTimes = await this.prisma.teacherWorkTime.findMany();
    const workTimeMap = new Map(workTimes.map(wt => [wt.teacherId, wt]));
    const absenceMap = new Map(absences.map(a => [a.teacherId, a]));

    return teachers.map(teacher => {
      const isAbsent = absenceMap.has(teacher.id);

      // Total slots limit - standard is 6 slots per day
      let totalSlots = 6;
      const wt = workTimeMap.get(teacher.id);
      if (wt) {
        const totalMinutes = (wt as any).endMinutes - (wt as any).startMinutes;
        // Assume each slot is 60 minutes
        totalSlots = Math.max(1, Math.round(totalMinutes / 60));
      }

      if (isAbsent) {
        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          utilization: 0,
          busySlots: 0,
          totalSlots,
          onLeave: true,
          leaveReason: (absenceMap.get(teacher.id) as any)?.reason || 'Absent',
        };
      }

      // Calculate busy slots
      const teacherRecurring = recurring.filter(r => r.teacherId === teacher.id);
      const busyTimeSlots = new Set<string>();

      // Add recurring slots
      teacherRecurring.forEach(r => {
        if (r.timeSlot) busyTimeSlots.add(r.timeSlot);
      });

      // Process overrides: remove if teacher was replaced, add if teacher is replacement
      overrides.forEach(o => {
        if (o.originalTeacherId === teacher.id) {
          busyTimeSlots.delete(o.timeSlot);
        }
        if (o.replacementTeacherId === teacher.id) {
          busyTimeSlots.add(o.timeSlot);
        }
      });

      // Process merged classes: add if teacher is teaching
      merged.forEach(m => {
        if (m.teacherId === teacher.id) {
          busyTimeSlots.add(m.timeSlot);
        }
      });

      const busySlots = busyTimeSlots.size;
      const utilization = totalSlots > 0 ? Math.round((busySlots / totalSlots) * 100) : 0;

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        utilization,
        busySlots,
        totalSlots,
        onLeave: false,
        leaveReason: '',
      };
    });
  }

  async findAvailableTeachers(date: string, timeSlot: string, subject?: string) {
    const weekDay = this.getWeekDay(date);
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    // Get all teachers
    const teachers = await this.prisma.teacher.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    // Get recurring schedules for today
    const recurring = await this.prisma.recurringSchedule.findMany({
      where: { OR: [{ weekDay }, { weekDay: null }] },
    });

    // Get partial overrides for today
    const overrides = await this.prisma.partialScheduleOverride.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // Get merged classes for today
    const merged = await this.prisma.mergedClass.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    // Get absences for today
    const absences = await this.prisma.teacherAbsence.findMany({
      where: {
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });
    const absentTeacherIds = new Set(absences.map(a => a.teacherId));

    // Check availability for each teacher at the given timeSlot
    return teachers.filter(teacher => {
      // 1. If absent, not available
      if (absentTeacherIds.has(teacher.id)) return false;

      // Check if they are busy at the target timeSlot
      const checkOverlap = (slot: string) => this.isTimeOverlap(slot, timeSlot);

      // 2. Check recurring
      const hasRecurringOverlap = recurring.some(r => r.teacherId === teacher.id && r.timeSlot && checkOverlap(r.timeSlot));

      // 3. Process overrides for this teacher
      // Did they get replaced in a conflicting slot? (makes them free)
      const replacedInOverlap = overrides.some(o => o.originalTeacherId === teacher.id && o.timeSlot && checkOverlap(o.timeSlot));
      // Are they replacing someone in a conflicting slot? (makes them busy)
      const replacingInOverlap = overrides.some(o => o.replacementTeacherId === teacher.id && o.timeSlot && checkOverlap(o.timeSlot));

      // 4. Check merged classes
      const teachingMergedInOverlap = merged.some(m => m.teacherId === teacher.id && m.timeSlot && checkOverlap(m.timeSlot));

      // Compute final status:
      // If (recurringOverlap AND NOT replacedInOverlap) OR replacingInOverlap OR teachingMergedInOverlap => BUSY
      const isBusy = (hasRecurringOverlap && !replacedInOverlap) || replacingInOverlap || teachingMergedInOverlap;

      return !isBusy;
    });
  }
}