var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
let StudentsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var StudentsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StudentsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        syncService;
        logger = new Logger(StudentsService.name);
        constructor(prisma, syncService) {
            this.prisma = prisma;
            this.syncService = syncService;
        }
        async findAll(query) {
            const page = Math.max(1, query.page || 1);
            const limit = Math.min(100, Math.max(1, query.limit || 30));
            const skip = (page - 1) * limit;
            const where = { deletedAt: null };
            if (query.search) {
                where.OR = [
                    { studentName: { contains: query.search, mode: 'insensitive' } },
                    { studentId: { contains: query.search, mode: 'insensitive' } },
                    { fatherName: { contains: query.search, mode: 'insensitive' } },
                    { motherName: { contains: query.search, mode: 'insensitive' } },
                    { mobileNumbers: { contains: query.search } },
                ];
            }
            if (query.batchId) {
                where.batchId = query.batchId;
            }
            if (query.status) {
                where.status = query.status;
            }
            const [total, students] = await Promise.all([
                this.prisma.student.count({ where }),
                this.prisma.student.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        studentId: true,
                        startSession: true,
                        endSession: true,
                        dateOfApplication: true,
                        studentName: true,
                        fatherName: true,
                        dob: true,
                        mobileNumbers: true,
                        email: true,
                        motherName: true,
                        category: true,
                        fatherOccupation: true,
                        defenceService: true,
                        jobDescription: true,
                        class: true,
                        presentSchool: true,
                        batchId: true,
                        additionalLanguage: true,
                        program: true,
                        status: true,
                        createdAt: true,
                        batch: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: query.sortBy
                        ? { [query.sortBy]: query.sortOrder || 'asc' }
                        : { createdAt: 'desc' },
                }),
            ]);
            return {
                data: students.map((s) => this.toDto(s)),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        async findById(id) {
            const student = await this.prisma.student.findUnique({
                where: { id },
                select: {
                    id: true,
                    studentId: true,
                    startSession: true,
                    endSession: true,
                    dateOfApplication: true,
                    studentName: true,
                    fatherName: true,
                    dob: true,
                    mobileNumbers: true,
                    email: true,
                    motherName: true,
                    category: true,
                    fatherOccupation: true,
                    defenceService: true,
                    jobDescription: true,
                    class: true,
                    presentSchool: true,
                    batchId: true,
                    additionalLanguage: true,
                    program: true,
                    status: true,
                    createdAt: true,
                    batch: {
                        select: { id: true, name: true },
                    },
                },
            });
            if (!student || student.deletedAt) {
                throw new NotFoundException('Student not found');
            }
            return this.toDto(student);
        }
        async findByStudentId(studentId) {
            const student = await this.prisma.student.findUnique({
                where: { studentId },
                select: {
                    id: true,
                    studentId: true,
                    startSession: true,
                    endSession: true,
                    dateOfApplication: true,
                    studentName: true,
                    fatherName: true,
                    dob: true,
                    mobileNumbers: true,
                    email: true,
                    motherName: true,
                    category: true,
                    fatherOccupation: true,
                    defenceService: true,
                    jobDescription: true,
                    class: true,
                    presentSchool: true,
                    batchId: true,
                    additionalLanguage: true,
                    program: true,
                    status: true,
                    createdAt: true,
                    batch: {
                        select: { id: true, name: true },
                    },
                },
            });
            if (!student || student.deletedAt) {
                throw new NotFoundException('Student not found');
            }
            return this.toDto(student);
        }
        async create(data) {
            const existing = await this.prisma.student.findUnique({
                where: { studentId: data.studentId },
                select: { id: true },
            });
            if (existing) {
                throw new ConflictException('Student with this ID already exists');
            }
            const student = await this.prisma.student.create({
                data: {
                    studentId: data.studentId,
                    studentName: data.studentName,
                    startSession: data.startSession,
                    endSession: data.endSession,
                    dateOfApplication: data.dateOfApplication ? new Date(data.dateOfApplication) : undefined,
                    fatherName: data.fatherName,
                    dob: data.dob ? new Date(data.dob) : undefined,
                    mobileNumbers: data.mobileNumbers,
                    email: data.email,
                    motherName: data.motherName,
                    category: data.category,
                    fatherOccupation: data.fatherOccupation,
                    defenceService: data.defenceService,
                    jobDescription: data.jobDescription,
                    class: data.class,
                    presentSchool: data.presentSchool,
                    batchId: data.batchId,
                    additionalLanguage: data.additionalLanguage,
                    program: data.program,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    studentId: true,
                    studentName: true,
                    batchId: true,
                    batch: { select: { name: true } },
                },
            });
            if (data.batchId && data.changedById) {
                const batch = await this.prisma.batch.findUnique({
                    where: { id: data.batchId },
                    select: { name: true },
                });
                if (batch) {
                    await this.prisma.batchChangeLog.create({
                        data: {
                            studentId: student.studentId,
                            studentName: student.studentName,
                            newBatch: batch.name,
                            changedById: data.changedById,
                            dateOfChange: new Date(),
                        },
                    });
                }
            }
            await this.syncService.queueSync('students', student.id, 'INSERT');
            return this.findById(student.id);
        }
        async update(id, data) {
            const student = await this.prisma.student.findUnique({
                where: { id },
                select: {
                    id: true,
                    studentId: true,
                    studentName: true,
                    batchId: true,
                    batch: { select: { name: true } },
                },
            });
            if (!student || student.deletedAt) {
                throw new NotFoundException('Student not found');
            }
            const previousBatchId = student.batchId;
            const updateData = { ...data };
            if (data.dob)
                updateData.dob = new Date(data.dob);
            delete updateData.changedById;
            await this.prisma.student.update({
                where: { id },
                data: updateData,
                select: { id: true },
            });
            if (data.batchId && data.batchId !== previousBatchId && data.changedById) {
                const [oldBatch, newBatch] = await Promise.all([
                    previousBatchId
                        ? this.prisma.batch.findUnique({ where: { id: previousBatchId }, select: { name: true } })
                        : null,
                    this.prisma.batch.findUnique({ where: { id: data.batchId }, select: { name: true } }),
                ]);
                if (newBatch) {
                    await this.prisma.batchChangeLog.create({
                        data: {
                            studentId: student.studentId,
                            studentName: student.studentName,
                            previousBatch: oldBatch?.name || '',
                            newBatch: newBatch.name,
                            changedById: data.changedById,
                            dateOfChange: new Date(),
                        },
                    });
                }
            }
            await this.syncService.queueSync('students', id, 'UPDATE');
            return this.findById(id);
        }
        async cancel(id, reason, cancelledById) {
            const student = await this.prisma.student.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!student)
                throw new NotFoundException('Student not found');
            await this.prisma.student.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    deletedAt: new Date(),
                },
            });
            await this.syncService.queueSync('students', id, 'DELETE');
            return { message: 'Student admission cancelled successfully' };
        }
        async getSyncPreview() {
            const [admissions, students] = await Promise.all([
                this.prisma.admission.findMany({
                    where: { deletedAt: null },
                    select: { studentId: true, studentName: true },
                }),
                this.prisma.student.findMany({
                    where: { deletedAt: null },
                    select: { studentId: true, studentName: true },
                }),
            ]);
            const dbMap = new Map(students.map((s) => [s.studentId, s]));
            const mismatches = [];
            for (const admission of admissions) {
                const student = dbMap.get(admission.studentId);
                if (student && student.studentName !== admission.studentName) {
                    mismatches.push({
                        studentName: admission.studentName,
                        admissionId: admission.studentId,
                        databaseId: student.studentId,
                        admissionRowNumber: '',
                        databaseRowNumber: '',
                        matchedFields: 1,
                        matchType: 'id_match',
                    });
                }
            }
            return {
                totalMatches: admissions.length - mismatches.length,
                totalMismatches: mismatches.length,
                ambiguousCount: 0,
                mismatches,
                admissionsCount: admissions.length,
                databaseCount: students.length,
            };
        }
        async findDuplicates() {
            const students = await this.prisma.student.findMany({
                where: { deletedAt: null },
                select: {
                    id: true,
                    studentId: true,
                    studentName: true,
                    fatherName: true,
                    motherName: true,
                    mobileNumbers: true,
                    email: true,
                    dob: true,
                    class: true,
                },
                orderBy: { studentName: 'asc' },
            });
            const groups = [];
            const seen = new Map();
            for (const student of students) {
                const key = `${student.studentName}|${student.fatherName || ''}|${student.mobileNumbers || ''}`;
                if (!seen.has(key))
                    seen.set(key, []);
                seen.get(key).push(student);
            }
            for (const [, group] of seen) {
                if (group.length > 1) {
                    groups.push({
                        count: group.length,
                        rows: group.map((s) => ({
                            rowNumber: '',
                            studentId: s.studentId,
                            studentName: s.studentName,
                            motherName: s.motherName || '',
                            fatherName: s.fatherName || '',
                            mobile: s.mobileNumbers || '',
                            email: s.email || '',
                            dob: s.dob?.toISOString() || '',
                            class: s.class || '',
                            duplicateKey: `${s.studentName}|${s.fatherName || ''}|${s.mobileNumbers || ''}`,
                            matchedData: [
                                { field: 'Student Name', value: s.studentName },
                                { field: "Father's Name", value: s.fatherName || '' },
                                { field: 'Mobile Numbers', value: s.mobileNumbers || '' },
                            ],
                        })),
                    });
                }
            }
            return {
                totalRows: students.length,
                totalDuplicateGroups: groups.length,
                totalDuplicateRows: groups.reduce((sum, g) => sum + g.count, 0),
                groups,
                matchedOnFields: ['Student Name', "Father's Name", 'Mobile Numbers'],
            };
        }
        async getBatchHistory(studentId) {
            return this.prisma.batchChangeLog.findMany({
                where: { studentId },
                orderBy: { dateOfChange: 'desc' },
                select: {
                    id: true,
                    studentId: true,
                    studentName: true,
                    previousBatch: true,
                    newBatch: true,
                    dateOfChange: true,
                    changedBy: {
                        select: { name: true },
                    },
                },
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toDto(student) {
            return {
                id: student.id,
                studentId: student.studentId,
                startSession: student.startSession || undefined,
                endSession: student.endSession || undefined,
                dateOfApplication: student.dateOfApplication?.toISOString(),
                studentName: student.studentName,
                fatherName: student.fatherName || undefined,
                dob: student.dob?.toISOString().split('T')[0],
                mobileNumbers: student.mobileNumbers || undefined,
                email: student.email || undefined,
                motherName: student.motherName || undefined,
                category: student.category || undefined,
                fatherOccupation: student.fatherOccupation || undefined,
                defenceService: student.defenceService || undefined,
                jobDescription: student.jobDescription || undefined,
                class: student.class || undefined,
                presentSchool: student.presentSchool || undefined,
                batchName: student.batch?.name || undefined,
                batchId: student.batchId || undefined,
                additionalLanguage: student.additionalLanguage || undefined,
                program: student.program || undefined,
                status: student.status,
                createdAt: student.createdAt instanceof Date
                    ? student.createdAt.toISOString()
                    : student.createdAt,
            };
        }
    };
    return StudentsService = _classThis;
})();
export { StudentsService };
//# sourceMappingURL=students.service.js.map