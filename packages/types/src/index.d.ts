export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
    name: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResponse {
    user: UserDto;
    tokens: AuthTokens;
}
export interface UserDto {
    id: string;
    username: string;
    name: string;
    email?: string;
    mobile?: string;
    post: string;
    role: string;
}
export interface StudentDto {
    id: string;
    studentId: string;
    startSession?: string;
    endSession?: string;
    dateOfApplication?: string;
    studentName: string;
    fatherName?: string;
    dob?: string;
    mobileNumbers?: string;
    email?: string;
    motherName?: string;
    category?: string;
    fatherOccupation?: string;
    defenceService?: string;
    jobDescription?: string;
    class?: string;
    presentSchool?: string;
    batchName?: string;
    batchId?: string;
    additionalLanguage?: string;
    program?: string;
    status: string;
    createdAt: string;
}
export interface AdmissionDto {
    id: string;
    studentId: string;
    startSession?: string;
    endSession?: string;
    dateOfApplication?: string;
    studentName: string;
    fatherName?: string;
    dob?: string;
    mobileNumbers?: string;
    email?: string;
    motherName?: string;
    category?: string;
    fatherOccupation?: string;
    defenceService?: string;
    jobDescription?: string;
    class?: string;
    presentSchool?: string;
    program?: string;
    status: string;
}
export interface SyncPreviewDto {
    totalMatches: number;
    totalMismatches: number;
    ambiguousCount: number;
    mismatches: MismatchItem[];
    admissionsCount: number;
    databaseCount: number;
}
export interface MismatchItem {
    studentName: string;
    admissionId: string;
    databaseId: string;
    admissionRowNumber: string;
    databaseRowNumber: string;
    class?: string;
    dob?: string;
    startSession?: string;
    endSession?: string;
    matchedFields: number;
    matchType: string;
}
export interface BatchDto {
    id: string;
    name: string;
    classRoom?: string;
    subjects: SubjectDto[];
    studentCount?: number;
    createdAt: string;
}
export interface BatchDetailDto {
    batch: string;
    subjects: string[];
    subjectsCsv: string;
    classRoom: string;
}
export interface BatchChangeLogDto {
    id: string;
    studentId: string;
    studentName?: string;
    previousBatch?: string;
    newBatch: string;
    changedByName?: string;
    dateOfChange: string;
}
export interface SubjectDto {
    id: string;
    name: string;
    code: string;
    isActive?: boolean;
}
export interface SubjectListItemDto {
    subjectName: string;
    subjectCode: string;
}
export interface EmployeeDto {
    id: string;
    name: string;
    employeeId: string;
    email?: string;
    department?: string;
    designation?: string;
    phone?: string;
}
export interface TeacherDto {
    id: string;
    name: string;
    teacherId: string;
    email?: string;
}
export interface TaskDto {
    id: string;
    token: string;
    employeeId?: string;
    employeeName?: string;
    taskType?: string;
    taskReason?: string;
    taskRole?: string;
    taskDetail?: string;
    taskEndingDate?: string;
    giverName?: string;
    status: string;
    createdAt: string;
}
export interface TaskRatingDto {
    id: string;
    taskId: string;
    rating: number;
    raterName?: string;
    notes?: string;
    createdAt: string;
}
export interface ClassScheduleDto {
    id: string;
    date: string;
    batchName: string;
    subjectName: string;
    startTime?: string;
    endTime?: string;
    teacherName?: string;
    teacherEmail?: string;
}
export interface SyncStatusDto {
    entityType: string;
    entityId: string;
    action: string;
    status: string;
    retryCount: number;
    errorMessage?: string;
    lastAttemptAt?: string;
}
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
//# sourceMappingURL=index.d.ts.map