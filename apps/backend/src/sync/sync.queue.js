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
import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
let SyncQueue = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SyncQueue = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SyncQueue = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        googleSheets;
        logger = new Logger(SyncQueue.name);
        queue;
        worker;
        constructor(prisma, googleSheets) {
            this.prisma = prisma;
            this.googleSheets = googleSheets;
            const connection = {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
            };
            this.queue = new Queue('google-sheets-sync', {
                connection,
                defaultJobOptions: {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 2000, // 2s, 4s, 8s, 16s, 32s
                    },
                    removeOnComplete: 100,
                    removeOnFail: 50,
                },
            });
            this.worker = new Worker('google-sheets-sync', async (job) => this.processJob(job), {
                connection,
                concurrency: 3,
                limiter: {
                    max: 10,
                    duration: 1000, // 10 jobs per second max
                },
            });
            this.worker.on('completed', (job) => {
                this.logger.log(`Sync job ${job.id} completed: ${job.data.entityType}:${job.data.entityId}`);
            });
            this.worker.on('failed', (job, error) => {
                this.logger.error(`Sync job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`, error.stack);
            });
            this.logger.log('BullMQ sync queue initialized');
        }
        async enqueue(data) {
            const job = await this.queue.add('sync-to-sheets', {
                ...data,
                retryAttempt: 0,
            });
            return job.id ?? '';
        }
        async processJob(job) {
            const { syncLogId, entityType, entityId, action } = job.data;
            // Mark as in_progress
            await this.prisma.syncLog.update({
                where: { id: syncLogId },
                data: {
                    status: 'IN_PROGRESS',
                    lastAttemptAt: new Date(),
                    retryCount: job.attemptsMade,
                },
            });
            try {
                // Fetch the full entity data from the database
                const entityData = await this.fetchEntityData(entityType, entityId);
                // Push to Google Sheets
                await this.googleSheets.sync(entityType, entityId, action, entityData);
                // Mark as completed
                await this.prisma.syncLog.update({
                    where: { id: syncLogId },
                    data: { status: 'COMPLETED' },
                });
            }
            catch (error) {
                // Update error info; BullMQ handles retry via attempts/backoff
                await this.prisma.syncLog.update({
                    where: { id: syncLogId },
                    data: {
                        status: 'FAILED',
                        errorMessage: error.message,
                        lastAttemptAt: new Date(),
                        retryCount: job.attemptsMade,
                    },
                });
                throw error; // Re-throw so BullMQ retries
            }
        }
        async fetchEntityData(entityType, entityId) {
            switch (entityType) {
                case 'students': {
                    const student = await this.prisma.student.findUnique({
                        where: { id: entityId },
                        include: { batch: true },
                    });
                    if (!student)
                        throw new Error(`Student ${entityId} not found`);
                    return {
                        'Student ID': student.studentId,
                        'Student Name': student.studentName,
                        "Father's Name": student.fatherName || '',
                        "Mother's Name": student.motherName || '',
                        DOB: student.dob?.toISOString().split('T')[0] || '',
                        'Mobile Numbers': student.mobileNumbers || '',
                        Email: student.email || '',
                        Category: student.category || '',
                        Class: student.class || '',
                        Batch: student.batch?.name || '',
                        Program: student.program || '',
                        Status: student.status,
                        'Start Session': student.startSession || '',
                        'End Session': student.endSession || '',
                    };
                }
                case 'batches': {
                    const batch = await this.prisma.batch.findUnique({
                        where: { id: entityId },
                        include: {
                            subjects: { include: { subject: true } },
                            _count: { select: { students: true } },
                        },
                    });
                    if (!batch)
                        throw new Error(`Batch ${entityId} not found`);
                    return {
                        'Batch Name': batch.name,
                        'Class Room': batch.classRoom || '',
                        Subjects: batch.subjects.map((s) => s.subject.name).join(', '),
                        'Student Count': batch._count.students,
                        Active: batch.isActive,
                    };
                }
                case 'tasks': {
                    const task = await this.prisma.task.findUnique({
                        where: { id: entityId },
                        include: { employee: true, giver: true },
                    });
                    if (!task)
                        throw new Error(`Task ${entityId} not found`);
                    return {
                        Token: task.token,
                        Employee: task.employeeName || task.employee?.name || '',
                        'Task Type': task.taskType || '',
                        'Task Detail': task.taskDetail || '',
                        'Task Role': task.taskRole || '',
                        'Ending Date': task.taskEndingDate?.toISOString().split('T')[0] || '',
                        Status: task.status,
                        'Given By': task.giver?.name || '',
                        Created: task.createdAt.toISOString(),
                    };
                }
                case 'employees': {
                    const employee = await this.prisma.employee.findUnique({
                        where: { id: entityId },
                    });
                    if (!employee)
                        throw new Error(`Employee ${entityId} not found`);
                    return {
                        'Employee ID': employee.employeeId,
                        Name: employee.name,
                        Email: employee.email || '',
                        Department: employee.department || '',
                        Designation: employee.designation || '',
                        Phone: employee.phone || '',
                    };
                }
                case 'teachers': {
                    const teacher = await this.prisma.teacher.findUnique({
                        where: { id: entityId },
                    });
                    if (!teacher)
                        throw new Error(`Teacher ${entityId} not found`);
                    return {
                        'Teacher ID': teacher.teacherId,
                        Name: teacher.name,
                        Email: teacher.email || '',
                    };
                }
                case 'subjects': {
                    const subject = await this.prisma.subject.findUnique({
                        where: { id: entityId },
                    });
                    if (!subject)
                        throw new Error(`Subject ${entityId} not found`);
                    return {
                        Code: subject.code,
                        Name: subject.name,
                        Active: subject.isActive,
                    };
                }
                default:
                    throw new Error(`Unknown entity type: ${entityType}`);
            }
        }
        async onModuleDestroy() {
            await this.queue.close();
            await this.worker.close();
        }
    };
    return SyncQueue = _classThis;
})();
export { SyncQueue };
//# sourceMappingURL=sync.queue.js.map