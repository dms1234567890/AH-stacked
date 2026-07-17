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
let BatchesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BatchesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatchesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        syncService;
        logger = new Logger(BatchesService.name);
        constructor(prisma, syncService) {
            this.prisma = prisma;
            this.syncService = syncService;
        }
        async findAll() {
            const batches = await this.prisma.batch.findMany({
                where: { deletedAt: null, isActive: true },
                select: {
                    id: true,
                    name: true,
                    classRoom: true,
                    createdAt: true,
                    subjects: {
                        select: {
                            subject: {
                                select: { id: true, name: true, code: true },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
                orderBy: { name: 'asc' },
            });
            return batches.map((b) => ({
                id: b.id,
                name: b.name,
                classRoom: b.classRoom || '',
                subjects: b.subjects.map((s) => ({
                    id: s.subject.id,
                    name: s.subject.name,
                    code: s.subject.code,
                })),
                subjectsCsv: b.subjects.map((s) => s.subject.name).join(', '),
                studentCount: b._count.students,
                createdAt: b.createdAt,
            }));
        }
        async findById(id) {
            const batch = await this.prisma.batch.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    classRoom: true,
                    isActive: true,
                    createdAt: true,
                    subjects: {
                        select: {
                            subject: {
                                select: { id: true, name: true, code: true, isActive: true },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
            });
            if (!batch || batch.deletedAt) {
                throw new NotFoundException('Batch not found');
            }
            return this.toBatchListItem(batch);
        }
        async findByName(name) {
            const batch = await this.prisma.batch.findFirst({
                where: { name, deletedAt: null },
                select: {
                    id: true,
                    name: true,
                    classRoom: true,
                    isActive: true,
                    createdAt: true,
                    subjects: {
                        select: {
                            subject: {
                                select: { id: true, name: true, code: true, isActive: true },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
            });
            if (!batch)
                throw new NotFoundException('Batch not found');
            return this.toBatchListItem(batch);
        }
        async create(data) {
            const existing = await this.prisma.batch.findFirst({
                where: { name: data.name, deletedAt: null },
                select: { id: true },
            });
            if (existing)
                throw new ConflictException('Batch already exists');
            const batch = await this.prisma.batch.create({
                data: {
                    name: data.name,
                    classRoom: data.classRoom,
                    subjects: {
                        create: data.subjects.map((subjectId) => ({
                            subject: { connect: { id: subjectId } },
                        })),
                    },
                },
                select: {
                    id: true,
                    name: true,
                    classRoom: true,
                    isActive: true,
                    createdAt: true,
                    subjects: {
                        select: {
                            subject: {
                                select: { id: true, name: true, code: true, isActive: true },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
            });
            await this.syncService.queueSync('batches', batch.id, 'INSERT');
            return this.toBatchListItem(batch);
        }
        async update(id, data) {
            const existing = await this.prisma.batch.findUnique({
                where: { id },
                select: { id: true, deletedAt: true },
            });
            if (!existing || existing.deletedAt)
                throw new NotFoundException('Batch not found');
            if (data.subjects) {
                await this.prisma.$transaction([
                    this.prisma.batchSubject.deleteMany({ where: { batchId: id } }),
                    this.prisma.batchSubject.createMany({
                        data: data.subjects.map((subjectId) => ({
                            batchId: id,
                            subjectId,
                        })),
                    }),
                ]);
            }
            const updated = await this.prisma.batch.update({
                where: { id },
                data: {
                    name: data.name,
                    classRoom: data.classRoom,
                },
                select: {
                    id: true,
                    name: true,
                    classRoom: true,
                    isActive: true,
                    createdAt: true,
                    subjects: {
                        select: {
                            subject: {
                                select: { id: true, name: true, code: true, isActive: true },
                            },
                        },
                    },
                    _count: { select: { students: true } },
                },
            });
            await this.syncService.queueSync('batches', id, 'UPDATE');
            return this.toBatchListItem(updated);
        }
        async delete(id, action, targetBatchId) {
            const countResult = await this.prisma.batch.findUnique({
                where: { id },
                select: {
                    id: true,
                    _count: { select: { students: true } },
                },
            });
            if (!countResult)
                throw new NotFoundException('Batch not found');
            const studentCount = countResult._count.students;
            if (studentCount > 0) {
                if (action === 'shift_students' && targetBatchId) {
                    await this.prisma.student.updateMany({
                        where: { batchId: id },
                        data: { batchId: targetBatchId },
                    });
                }
                else if (action === 'delete_students') {
                    await this.prisma.student.updateMany({
                        where: { batchId: id },
                        data: { deletedAt: new Date(), status: 'CANCELLED' },
                    });
                }
                else {
                    return {
                        success: false,
                        requiresAction: true,
                        affectedCount: studentCount,
                        message: 'Students exist in this batch. Choose delete or shift action.',
                    };
                }
            }
            await this.prisma.$transaction([
                this.prisma.batchSubject.deleteMany({ where: { batchId: id } }),
                this.prisma.batch.update({
                    where: { id },
                    data: { deletedAt: new Date(), isActive: false },
                }),
            ]);
            await this.syncService.queueSync('batches', id, 'DELETE');
            return {
                success: true,
                message: 'Batch deleted successfully',
                affectedCount: studentCount,
            };
        }
        async getStudentCount(batchId) {
            return this.prisma.student.count({
                where: { batchId, deletedAt: null },
            });
        }
        async getNames() {
            const batches = await this.prisma.batch.findMany({
                where: { deletedAt: null, isActive: true },
                select: { name: true },
                orderBy: { name: 'asc' },
            });
            return batches.map((b) => b.name);
        }
        async addSubjectToBatch(batchId, subjectId) {
            const existing = await this.prisma.batchSubject.findUnique({
                where: { batchId_subjectId: { batchId, subjectId } },
            });
            if (existing)
                throw new ConflictException('Subject already assigned to batch');
            await this.prisma.batchSubject.create({ data: { batchId, subjectId } });
            await this.syncService.queueSync('batches', batchId, 'UPDATE');
            return { message: 'Subject added to batch' };
        }
        async removeSubjectFromBatch(batchId, subjectId) {
            await this.prisma.batchSubject.delete({
                where: { batchId_subjectId: { batchId, subjectId } },
            });
            await this.syncService.queueSync('batches', batchId, 'UPDATE');
            return { message: 'Subject removed from batch' };
        }
        toBatchListItem(batch) {
            return {
                id: batch.id,
                name: batch.name,
                classRoom: batch.classRoom || '',
                subjects: batch.subjects.map((s) => ({
                    id: s.subject.id,
                    name: s.subject.name,
                    code: s.subject.code,
                    isActive: s.subject.isActive,
                })),
                subjectsCsv: batch.subjects.map((s) => s.subject.name).join(', '),
                studentCount: batch._count.students,
                createdAt: batch.createdAt,
            };
        }
    };
    return BatchesService = _classThis;
})();
export { BatchesService };
//# sourceMappingURL=batches.service.js.map