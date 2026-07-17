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
let SubjectsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubjectsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubjectsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new Logger(SubjectsService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll() {
            const subjects = await this.prisma.subject.findMany({
                where: { deletedAt: null, isActive: true },
                orderBy: { name: 'asc' },
            });
            return subjects.map((s) => ({
                subjectName: s.name,
                subjectCode: s.code,
                id: s.id,
            }));
        }
        async create(data) {
            const existing = await this.prisma.subject.findFirst({
                where: {
                    OR: [
                        { code: data.code },
                        { name: { equals: data.name, mode: 'insensitive' } },
                    ],
                },
            });
            if (existing)
                throw new ConflictException('Subject name or code already exists');
            const subject = await this.prisma.subject.create({
                data: { name: data.name, code: data.code.toUpperCase() },
            });
            return {
                id: subject.id,
                subjectName: subject.name,
                subjectCode: subject.code,
            };
        }
        async update(code, data) {
            const subject = await this.prisma.subject.findUnique({ where: { code } });
            if (!subject)
                throw new NotFoundException('Subject not found');
            const updated = await this.prisma.subject.update({
                where: { code },
                data: { name: data.name },
            });
            return { subjectName: updated.name, subjectCode: updated.code };
        }
        async delete(code) {
            const subject = await this.prisma.subject.findUnique({ where: { code } });
            if (!subject)
                throw new NotFoundException('Subject not found');
            await this.prisma.subject.update({
                where: { code },
                data: { deletedAt: new Date(), isActive: false },
            });
            return { message: 'Subject deleted successfully' };
        }
    };
    return SubjectsService = _classThis;
})();
export { SubjectsService };
//# sourceMappingURL=subjects.service.js.map