import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export type LoginDto = z.infer<typeof loginSchema>;
export declare const createStudentSchema: z.ZodObject<{
    studentId: z.ZodString;
    startSession: z.ZodOptional<z.ZodString>;
    endSession: z.ZodOptional<z.ZodString>;
    dateOfApplication: z.ZodOptional<z.ZodString>;
    studentName: z.ZodString;
    fatherName: z.ZodOptional<z.ZodString>;
    dob: z.ZodOptional<z.ZodString>;
    mobileNumbers: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    motherName: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    fatherOccupation: z.ZodOptional<z.ZodString>;
    defenceService: z.ZodOptional<z.ZodString>;
    jobDescription: z.ZodOptional<z.ZodString>;
    class: z.ZodOptional<z.ZodString>;
    presentSchool: z.ZodOptional<z.ZodString>;
    batchId: z.ZodOptional<z.ZodString>;
    additionalLanguage: z.ZodOptional<z.ZodString>;
    program: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    studentName: string;
    mobileNumbers?: string | undefined;
    motherName?: string | undefined;
    fatherName?: string | undefined;
    batchId?: string | undefined;
    email?: string | undefined;
    startSession?: string | undefined;
    endSession?: string | undefined;
    dateOfApplication?: string | undefined;
    dob?: string | undefined;
    category?: string | undefined;
    fatherOccupation?: string | undefined;
    defenceService?: string | undefined;
    jobDescription?: string | undefined;
    class?: string | undefined;
    presentSchool?: string | undefined;
    additionalLanguage?: string | undefined;
    program?: string | undefined;
}, {
    studentId: string;
    studentName: string;
    mobileNumbers?: string | undefined;
    motherName?: string | undefined;
    fatherName?: string | undefined;
    batchId?: string | undefined;
    email?: string | undefined;
    startSession?: string | undefined;
    endSession?: string | undefined;
    dateOfApplication?: string | undefined;
    dob?: string | undefined;
    category?: string | undefined;
    fatherOccupation?: string | undefined;
    defenceService?: string | undefined;
    jobDescription?: string | undefined;
    class?: string | undefined;
    presentSchool?: string | undefined;
    additionalLanguage?: string | undefined;
    program?: string | undefined;
}>;
export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export declare const updateStudentSchema: z.ZodObject<Omit<{
    studentId: z.ZodOptional<z.ZodString>;
    startSession: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    endSession: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dateOfApplication: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    studentName: z.ZodOptional<z.ZodString>;
    fatherName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dob: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mobileNumbers: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    motherName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fatherOccupation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    defenceService: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    jobDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    class: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    presentSchool: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    batchId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    additionalLanguage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    program: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "studentId">, "strip", z.ZodTypeAny, {
    mobileNumbers?: string | undefined;
    motherName?: string | undefined;
    fatherName?: string | undefined;
    studentName?: string | undefined;
    batchId?: string | undefined;
    email?: string | undefined;
    startSession?: string | undefined;
    endSession?: string | undefined;
    dateOfApplication?: string | undefined;
    dob?: string | undefined;
    category?: string | undefined;
    fatherOccupation?: string | undefined;
    defenceService?: string | undefined;
    jobDescription?: string | undefined;
    class?: string | undefined;
    presentSchool?: string | undefined;
    additionalLanguage?: string | undefined;
    program?: string | undefined;
}, {
    mobileNumbers?: string | undefined;
    motherName?: string | undefined;
    fatherName?: string | undefined;
    studentName?: string | undefined;
    batchId?: string | undefined;
    email?: string | undefined;
    startSession?: string | undefined;
    endSession?: string | undefined;
    dateOfApplication?: string | undefined;
    dob?: string | undefined;
    category?: string | undefined;
    fatherOccupation?: string | undefined;
    defenceService?: string | undefined;
    jobDescription?: string | undefined;
    class?: string | undefined;
    presentSchool?: string | undefined;
    additionalLanguage?: string | undefined;
    program?: string | undefined;
}>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export declare const studentQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    batchId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "CANCELLED", "GRADUATED"]>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    search?: string | undefined;
    batchId?: string | undefined;
    status?: "ACTIVE" | "CANCELLED" | "GRADUATED" | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    batchId?: string | undefined;
    status?: "ACTIVE" | "CANCELLED" | "GRADUATED" | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type StudentQueryDto = z.infer<typeof studentQuerySchema>;
export declare const createBatchSchema: z.ZodObject<{
    name: z.ZodString;
    subjects: z.ZodArray<z.ZodString, "many">;
    classRoom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    subjects: string[];
    name: string;
    classRoom?: string | undefined;
}, {
    subjects: string[];
    name: string;
    classRoom?: string | undefined;
}>;
export type CreateBatchDto = z.infer<typeof createBatchSchema>;
export declare const updateBatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    classRoom: z.ZodOptional<z.ZodString>;
    subjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    subjects?: string[] | undefined;
    name?: string | undefined;
    classRoom?: string | undefined;
}, {
    subjects?: string[] | undefined;
    name?: string | undefined;
    classRoom?: string | undefined;
}>;
export type UpdateBatchDto = z.infer<typeof updateBatchSchema>;
export declare const createSubjectSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    code: string;
}, {
    name: string;
    code: string;
}>;
export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export declare const updateSubjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
}, {
    name?: string | undefined;
}>;
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;
export declare const createEmployeeSchema: z.ZodObject<{
    name: z.ZodString;
    employeeId: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    department: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    employeeId: string;
    email?: string | undefined;
    department?: string | undefined;
    designation?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    employeeId: string;
    email?: string | undefined;
    department?: string | undefined;
    designation?: string | undefined;
    phone?: string | undefined;
}>;
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export declare const createTaskSchema: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    employeeName: z.ZodOptional<z.ZodString>;
    taskType: z.ZodOptional<z.ZodString>;
    taskReason: z.ZodOptional<z.ZodString>;
    taskRole: z.ZodOptional<z.ZodString>;
    taskDetail: z.ZodOptional<z.ZodString>;
    taskEndingDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId?: string | undefined;
    employeeName?: string | undefined;
    taskType?: string | undefined;
    taskReason?: string | undefined;
    taskRole?: string | undefined;
    taskDetail?: string | undefined;
    taskEndingDate?: string | undefined;
}, {
    employeeId?: string | undefined;
    employeeName?: string | undefined;
    taskType?: string | undefined;
    taskReason?: string | undefined;
    taskRole?: string | undefined;
    taskDetail?: string | undefined;
    taskEndingDate?: string | undefined;
}>;
export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export declare const rateTaskSchema: z.ZodObject<{
    rating: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    notes?: string | undefined;
}, {
    rating: number;
    notes?: string | undefined;
}>;
export type RateTaskDto = z.infer<typeof rateTaskSchema>;
export declare const createScheduleSchema: z.ZodObject<{
    date: z.ZodString;
    batchId: z.ZodString;
    subjectId: z.ZodString;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    teacherId: z.ZodOptional<z.ZodString>;
    teacherName: z.ZodOptional<z.ZodString>;
    teacherEmail: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    batchId: string;
    date: string;
    subjectId: string;
    startTime?: string | undefined;
    endTime?: string | undefined;
    teacherId?: string | undefined;
    teacherName?: string | undefined;
    teacherEmail?: string | undefined;
}, {
    batchId: string;
    date: string;
    subjectId: string;
    startTime?: string | undefined;
    endTime?: string | undefined;
    teacherId?: string | undefined;
    teacherName?: string | undefined;
    teacherEmail?: string | undefined;
}>;
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
//# sourceMappingURL=validation.d.ts.map