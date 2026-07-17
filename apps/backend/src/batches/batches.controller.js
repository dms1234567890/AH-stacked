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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
let BatchesController = (() => {
    let _classDecorators = [ApiTags('Batches'), ApiBearerAuth(), UseGuards(JwtAuthGuard, RolesGuard), Controller('batches')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _getNames_decorators;
    let _findById_decorators;
    let _findByName_decorators;
    let _create_decorators;
    let _update_decorators;
    let _delete_decorators;
    let _getStudentCount_decorators;
    let _addSubject_decorators;
    let _removeSubject_decorators;
    var BatchesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Get all batches' })];
            _getNames_decorators = [Get('names'), ApiOperation({ summary: 'Get batch names only' })];
            _findById_decorators = [Get(':id'), ApiOperation({ summary: 'Get batch by ID' })];
            _findByName_decorators = [Get('name/:name'), ApiOperation({ summary: 'Get batch by name' })];
            _create_decorators = [Post(), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Create a new batch' })];
            _update_decorators = [Put(':id'), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Update a batch' })];
            _delete_decorators = [Delete(':id'), Roles('ADMIN'), ApiOperation({ summary: 'Delete a batch' })];
            _getStudentCount_decorators = [Get(':id/student-count'), ApiOperation({ summary: 'Get student count for a batch' })];
            _addSubject_decorators = [Post(':batchId/subjects/:subjectId'), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Add subject to batch' })];
            _removeSubject_decorators = [Delete(':batchId/subjects/:subjectId'), Roles('ADMIN', 'MANAGER'), ApiOperation({ summary: 'Remove subject from batch' })];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getNames_decorators, { kind: "method", name: "getNames", static: false, private: false, access: { has: obj => "getNames" in obj, get: obj => obj.getNames }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findById_decorators, { kind: "method", name: "findById", static: false, private: false, access: { has: obj => "findById" in obj, get: obj => obj.findById }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findByName_decorators, { kind: "method", name: "findByName", static: false, private: false, access: { has: obj => "findByName" in obj, get: obj => obj.findByName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStudentCount_decorators, { kind: "method", name: "getStudentCount", static: false, private: false, access: { has: obj => "getStudentCount" in obj, get: obj => obj.getStudentCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addSubject_decorators, { kind: "method", name: "addSubject", static: false, private: false, access: { has: obj => "addSubject" in obj, get: obj => obj.addSubject }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeSubject_decorators, { kind: "method", name: "removeSubject", static: false, private: false, access: { has: obj => "removeSubject" in obj, get: obj => obj.removeSubject }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatchesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        batchesService = __runInitializers(this, _instanceExtraInitializers);
        constructor(batchesService) {
            this.batchesService = batchesService;
        }
        async findAll() {
            return this.batchesService.findAll();
        }
        async getNames() {
            return this.batchesService.getNames();
        }
        async findById(id) {
            return this.batchesService.findById(id);
        }
        async findByName(name) {
            return this.batchesService.findByName(name);
        }
        async create(body, req) {
            const user = req.user;
            return this.batchesService.create({ ...body, changedById: user.id });
        }
        async update(id, body) {
            return this.batchesService.update(id, body);
        }
        async delete(id, action, targetBatchId) {
            return this.batchesService.delete(id, action, targetBatchId);
        }
        async getStudentCount(id) {
            const count = await this.batchesService.getStudentCount(id);
            return { count };
        }
        async addSubject(batchId, subjectId) {
            return this.batchesService.addSubjectToBatch(batchId, subjectId);
        }
        async removeSubject(batchId, subjectId) {
            return this.batchesService.removeSubjectFromBatch(batchId, subjectId);
        }
    };
    return BatchesController = _classThis;
})();
export { BatchesController };
//# sourceMappingURL=batches.controller.js.map