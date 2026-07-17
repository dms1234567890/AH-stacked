import { z } from 'zod';
// ============================================================
// Auth Validation Schemas
// ============================================================
export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});
// ============================================================
// Student Validation Schemas
// ============================================================
export const createStudentSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    startSession: z.string().optional(),
    endSession: z.string().optional(),
    dateOfApplication: z.string().optional(),
    studentName: z.string().min(1, 'Student name is required'),
    fatherName: z.string().optional(),
    dob: z.string().optional(),
    mobileNumbers: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    motherName: z.string().optional(),
    category: z.string().optional(),
    fatherOccupation: z.string().optional(),
    defenceService: z.string().optional(),
    jobDescription: z.string().optional(),
    class: z.string().optional(),
    presentSchool: z.string().optional(),
    batchId: z.string().uuid().optional(),
    additionalLanguage: z.string().optional(),
    program: z.string().optional(),
});
export const updateStudentSchema = createStudentSchema.partial().omit({ studentId: true });
export const studentQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(30),
    search: z.string().optional(),
    batchId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'CANCELLED', 'GRADUATED']).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});
// ============================================================
// Batch Validation Schemas
// ============================================================
export const createBatchSchema = z.object({
    name: z.string().min(1, 'Batch name is required'),
    subjects: z.array(z.string().uuid()).min(1, 'At least one subject is required'),
    classRoom: z.string().optional(),
});
export const updateBatchSchema = z.object({
    name: z.string().optional(),
    classRoom: z.string().optional(),
    subjects: z.array(z.string().uuid()).optional(),
});
// ============================================================
// Subject Validation Schemas
// ============================================================
export const createSubjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
    code: z.string().min(1, 'Subject code is required'),
});
export const updateSubjectSchema = z.object({
    name: z.string().optional(),
});
// ============================================================
// Employee Validation Schemas
// ============================================================
export const createEmployeeSchema = z.object({
    name: z.string().min(1, 'Employee name is required'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    email: z.string().email().optional().or(z.literal('')),
    department: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
});
// ============================================================
// Task Validation Schemas
// ============================================================
export const createTaskSchema = z.object({
    employeeId: z.string().optional(),
    employeeName: z.string().optional(),
    taskType: z.string().optional(),
    taskReason: z.string().optional(),
    taskRole: z.string().optional(),
    taskDetail: z.string().optional(),
    taskEndingDate: z.string().optional(),
});
export const rateTaskSchema = z.object({
    rating: z.number().int().min(1).max(5),
    notes: z.string().optional(),
});
// ============================================================
// Class Schedule Validation Schemas
// ============================================================
export const createScheduleSchema = z.object({
    date: z.string(),
    batchId: z.string().uuid(),
    subjectId: z.string().uuid(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    teacherId: z.string().optional(),
    teacherName: z.string().optional(),
    teacherEmail: z.string().email().optional().or(z.literal('')),
});
//# sourceMappingURL=validation.js.map