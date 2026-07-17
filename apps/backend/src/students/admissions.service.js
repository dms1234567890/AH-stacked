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
let AdmissionsService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdmissionsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AdmissionsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        logger = new Logger(AdmissionsService.name);
        constructor(prisma) {
            this.prisma = prisma;
        }
        async findAll() {
            const admissions = await this.prisma.admission.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
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
                    program: true,
                    status: true,
                },
            });
            return admissions;
        }
        async getNewStudents() {
            const [admissions, students] = await Promise.all([
                this.prisma.admission.findMany({
                    where: { deletedAt: null, status: 'PENDING' },
                    select: { studentId: true, studentName: true },
                }),
                this.prisma.student.findMany({
                    where: { deletedAt: null },
                    select: { studentId: true },
                }),
            ]);
            const enrolledIds = new Set(students.map((s) => s.studentId));
            return admissions
                .filter((a) => !enrolledIds.has(a.studentId))
                .map((a) => ({
                studentId: a.studentId,
                studentName: a.studentName,
                status: 'new',
            }));
        }
        async syncIds() {
            const [admissions, students] = await Promise.all([
                this.prisma.admission.findMany({
                    where: { deletedAt: null, status: 'PENDING' },
                    select: { id: true, studentId: true, studentName: true },
                }),
                this.prisma.student.findMany({
                    where: { deletedAt: null },
                    select: { id: true, studentId: true, studentName: true },
                }),
            ]);
            const studentMap = new Map(students.map((s) => [s.studentName.toLowerCase(), s]));
            let updated = 0;
            for (const admission of admissions) {
                const existingStudent = studentMap.get(admission.studentName.toLowerCase());
                if (existingStudent && existingStudent.studentId !== admission.studentId) {
                    await this.prisma.student.update({
                        where: { id: existingStudent.id },
                        data: { studentId: admission.studentId },
                    });
                    updated++;
                }
            }
            return { message: `Synced ${updated} student IDs` };
        }
    };
    return AdmissionsService = _classThis;
})();
export { AdmissionsService };
//# sourceMappingURL=admissions.service.js.map