var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { Controller, Get, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
let StudentsController = (() => {
    let _classDecorators = [ApiTags('Students'), ApiBearerAuth(), UseGuards(JwtAuthGuard, RolesGuard), Controller('students')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _getNewStudents_decorators;
    let _getActiveStudents_decorators;
    let _getSyncPreview_decorators;
    let _syncStudentIds_decorators;
    let _findDuplicates_decorators;
    let _getBatchHistory_decorators;
    let _findById_decorators;
    let _create_decorators;
    let _update_decorators;
    let _cancel_decorators;
    let _findByStudentId_decorators;
    var StudentsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Get all students (paginated)' }), ApiQuery({ name: 'page', required: false }), ApiQuery({ name: 'limit', required: false }), ApiQuery({ name: 'search', required: false }), ApiQuery({ name: 'batchId', required: false }), ApiQuery({ name: 'status', required: false })];
            _getNewStudents_decorators = [Get('new'), ApiOperation({ summary: 'Get new students (not yet enrolled)' })];
            _getActiveStudents_decorators = [Get('active'), ApiOperation({ summary: 'Get active students' })];
            _getSyncPreview_decorators = [Get('sync-preview'), ApiOperation({ summary: 'Preview student ID mismatches between admissions and database' })];
            _syncStudentIds_decorators = [Post('sync'), ApiOperation({ summary: 'Sync student IDs from admissions to database' })];
            _findDuplicates_decorators = [Get('duplicates'), ApiOperation({ summary: 'Find duplicate students in database' })];
            _getBatchHistory_decorators = [Get('batch-history/:studentId'), ApiOperation({ summary: 'Get batch change history for a student' })];
            _findById_decorators = [Get(':id'), ApiOperation({ summary: 'Get student by ID' })];
            _create_decorators = [Post(), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Create a new student' })];
            _update_decorators = [Put(':id'), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Update a student' })];
            _cancel_decorators = [Delete(':id'), Roles('ADMIN'), ApiOperation({ summary: 'Cancel student admission (soft delete)' })];
            _findByStudentId_decorators = [Get('student-id/:studentId'), ApiOperation({ summary: 'Find student by student ID (e.g., 2602060001)' })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getNewStudents_decorators, { kind: "method", name: "getNewStudents", static: false, private: false, access: { has: obj => "getNewStudents" in obj, get: obj => obj.getNewStudents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getActiveStudents_decorators, { kind: "method", name: "getActiveStudents", static: false, private: false, access: { has: obj => "getActiveStudents" in obj, get: obj => obj.getActiveStudents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSyncPreview_decorators, { kind: "method", name: "getSyncPreview", static: false, private: false, access: { has: obj => "getSyncPreview" in obj, get: obj => obj.getSyncPreview }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _syncStudentIds_decorators, { kind: "method", name: "syncStudentIds", static: false, private: false, access: { has: obj => "syncStudentIds" in obj, get: obj => obj.syncStudentIds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findDuplicates_decorators, { kind: "method", name: "findDuplicates", static: false, private: false, access: { has: obj => "findDuplicates" in obj, get: obj => obj.findDuplicates }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getBatchHistory_decorators, { kind: "method", name: "getBatchHistory", static: false, private: false, access: { has: obj => "getBatchHistory" in obj, get: obj => obj.getBatchHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findById_decorators, { kind: "method", name: "findById", static: false, private: false, access: { has: obj => "findById" in obj, get: obj => obj.findById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: obj => "cancel" in obj, get: obj => obj.cancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findByStudentId_decorators, { kind: "method", name: "findByStudentId", static: false, private: false, access: { has: obj => "findByStudentId" in obj, get: obj => obj.findByStudentId }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            StudentsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        studentsService = __runInitializers(this, _instanceExtraInitializers);
        admissionsService;
        constructor(studentsService, admissionsService) {
            this.studentsService = studentsService;
            this.admissionsService = admissionsService;
        }
        async findAll(page, limit, search, batchId, status, sortBy, sortOrder) {
            return this.studentsService.findAll({ page, limit, search, batchId, status, sortBy, sortOrder });
        }
        async getNewStudents() {
            return this.admissionsService.getNewStudents();
        }
        async getActiveStudents(page, limit, search, batchId) {
            return this.studentsService.findAll({ page, limit, search, batchId, status: 'ACTIVE' });
        }
        async getSyncPreview() {
            return this.studentsService.getSyncPreview();
        }
        async syncStudentIds() {
            return this.admissionsService.syncIds();
        }
        async findDuplicates() {
            return this.studentsService.findDuplicates();
        }
        async getBatchHistory(studentId) {
            return this.studentsService.getBatchHistory(studentId);
        }
        async findById(id) {
            return this.studentsService.findById(id);
        }
        async create(body, req) {
            const user = req.user;
            return this.studentsService.create({ ...body, changedById: user.id });
        }
        async update(id, body, req) {
            const user = req.user;
            return this.studentsService.update(id, { ...body, changedById: user.id });
        }
        async cancel(id, req) {
            const user = req.user;
            return this.studentsService.cancel(id, 'Cancelled by admin', user.id);
        }
        async findByStudentId(studentId) {
            return this.studentsService.findByStudentId(studentId);
        }
    };
    return StudentsController = _classThis;
})();
export { StudentsController };
//# sourceMappingURL=students.controller.js.map