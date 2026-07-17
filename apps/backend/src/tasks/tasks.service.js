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
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
let TasksService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TasksService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TasksService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        syncService;
        logger = new Logger(TasksService.name);
        constructor(prisma, syncService) {
            this.prisma = prisma;
            this.syncService = syncService;
        }
        async create(data) {
            const token = crypto.randomBytes(4).toString('hex');
            const task = await this.prisma.task.create({
                data: {
                    token,
                    employeeId: data.employeeId,
                    employeeName: data.employeeName,
                    taskType: data.taskType || 'EXTRA WORK',
                    taskReason: data.taskReason,
                    taskRole: data.taskRole,
                    taskDetail: data.taskDetail,
                    taskEndingDate: data.taskEndingDate ? new Date(data.taskEndingDate) : undefined,
                    giverId: data.giverId,
                },
                select: { id: true },
            });
            await this.syncService.queueSync('tasks', task.id, 'INSERT');
            return this.findById(task.id);
        }
        async findAll(query) {
            const page = Math.max(1, query.page || 1);
            const limit = Math.min(100, Math.max(1, query.limit || 30));
            const where = { deletedAt: null };
            if (query.status)
                where.status = query.status;
            const [total, tasks] = await Promise.all([
                this.prisma.task.count({ where }),
                this.prisma.task.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    select: {
                        id: true,
                        token: true,
                        employeeId: true,
                        employeeName: true,
                        taskType: true,
                        taskReason: true,
                        taskRole: true,
                        taskDetail: true,
                        taskEndingDate: true,
                        status: true,
                        createdAt: true,
                        giver: { select: { id: true, name: true } },
                        employee: {
                            select: { id: true, name: true, employeeId: true },
                        },
                        completions: {
                            select: { id: true, completedAt: true, notes: true },
                        },
                        ratings: {
                            select: { id: true, rating: true, notes: true, createdAt: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);
            return {
                data: tasks,
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            };
        }
        async findById(id) {
            const task = await this.prisma.task.findUnique({
                where: { id },
                select: {
                    id: true,
                    token: true,
                    employeeId: true,
                    employeeName: true,
                    taskType: true,
                    taskReason: true,
                    taskRole: true,
                    taskDetail: true,
                    taskEndingDate: true,
                    status: true,
                    createdAt: true,
                    giver: { select: { id: true, name: true } },
                    employee: {
                        select: { id: true, name: true, employeeId: true },
                    },
                    completions: {
                        select: { id: true, completedAt: true, notes: true },
                    },
                    ratings: {
                        select: { id: true, rating: true, notes: true, createdAt: true },
                    },
                },
            });
            if (!task || task.deletedAt) {
                throw new NotFoundException('Task not found');
            }
            return task;
        }
        async getCompletedForRating() {
            return this.prisma.task.findMany({
                where: { status: 'COMPLETED', deletedAt: null },
                select: {
                    id: true,
                    token: true,
                    employeeName: true,
                    taskType: true,
                    taskDetail: true,
                    status: true,
                    employee: {
                        select: { id: true, name: true },
                    },
                    completions: {
                        select: { completedAt: true, notes: true },
                    },
                },
            });
        }
        async findByToken(token) {
            const task = await this.prisma.task.findUnique({
                where: { token },
                select: {
                    id: true,
                    token: true,
                    employeeId: true,
                    employeeName: true,
                    taskType: true,
                    taskReason: true,
                    taskRole: true,
                    taskDetail: true,
                    taskEndingDate: true,
                    status: true,
                    createdAt: true,
                    giver: { select: { id: true, name: true } },
                    employee: {
                        select: { id: true, name: true, employeeId: true },
                    },
                },
            });
            if (!task)
                throw new NotFoundException('Task not found');
            return task;
        }
        async complete(token, notes) {
            const task = await this.prisma.task.findUnique({
                where: { token },
                select: { id: true },
            });
            if (!task)
                throw new NotFoundException('Task not found');
            const result = await this.prisma.$transaction([
                this.prisma.taskCompletion.create({
                    data: { taskId: task.id, notes },
                }),
                this.prisma.task.update({
                    where: { id: task.id },
                    data: { status: 'COMPLETED' },
                    select: { id: true },
                }),
            ]);
            await this.syncService.queueSync('tasks', task.id, 'UPDATE');
            return { message: 'Task completed successfully' };
        }
        async rate(token, rating, raterId, notes) {
            const task = await this.prisma.task.findUnique({
                where: { token },
                select: { id: true, status: true },
            });
            if (!task)
                throw new NotFoundException('Task not found');
            if (task.status !== 'COMPLETED') {
                throw new Error('Task must be completed before rating');
            }
            await this.prisma.$transaction([
                this.prisma.taskRating.create({
                    data: { taskId: task.id, rating, raterId, notes },
                }),
                this.prisma.task.update({
                    where: { id: task.id },
                    data: { status: 'RATED' },
                }),
            ]);
            await this.syncService.queueSync('tasks', task.id, 'UPDATE');
            return { message: 'Rating saved successfully' };
        }
        async update(id, data) {
            const task = await this.prisma.task.findUnique({
                where: { id },
                select: { id: true, deletedAt: true },
            });
            if (!task || task.deletedAt) {
                throw new NotFoundException('Task not found');
            }
            const updateData = { ...data };
            if (data.taskEndingDate) {
                updateData.taskEndingDate = new Date(data.taskEndingDate);
            }
            delete updateData.giverId;
            await this.prisma.task.update({
                where: { id },
                data: updateData,
            });
            await this.syncService.queueSync('tasks', id, 'UPDATE');
            return this.findById(id);
        }
        async delete(id) {
            const task = await this.prisma.task.findUnique({
                where: { id },
                select: { id: true },
            });
            if (!task)
                throw new NotFoundException('Task not found');
            await this.prisma.task.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            await this.syncService.queueSync('tasks', id, 'DELETE');
            return { message: 'Task deleted successfully' };
        }
    };
    return TasksService = _classThis;
})();
export { TasksService };
//# sourceMappingURL=tasks.service.js.map