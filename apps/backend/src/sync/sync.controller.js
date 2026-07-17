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
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
let SyncController = (() => {
    let _classDecorators = [ApiTags('Sync'), ApiBearerAuth(), UseGuards(JwtAuthGuard, RolesGuard), Controller('sync')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _processPending_decorators;
    let _getStatus_decorators;
    let _getLogs_decorators;
    var SyncController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _processPending_decorators = [Post('process'), Roles('ADMIN'), ApiOperation({ summary: 'Re-queue all pending/failed sync jobs to BullMQ for processing' })];
            _getStatus_decorators = [Get('status'), Roles('ADMIN'), ApiOperation({ summary: 'Get sync queue status summary' })];
            _getLogs_decorators = [Get('logs'), Roles('ADMIN'), ApiOperation({ summary: 'Get recent sync log entries' }), ApiQuery({ name: 'limit', required: false })];
            __esDecorate(this, null, _processPending_decorators, { kind: "method", name: "processPending", static: false, private: false, access: { has: obj => "processPending" in obj, get: obj => obj.processPending }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getStatus_decorators, { kind: "method", name: "getStatus", static: false, private: false, access: { has: obj => "getStatus" in obj, get: obj => obj.getStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getLogs_decorators, { kind: "method", name: "getLogs", static: false, private: false, access: { has: obj => "getLogs" in obj, get: obj => obj.getLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SyncController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        syncService = __runInitializers(this, _instanceExtraInitializers);
        constructor(syncService) {
            this.syncService = syncService;
        }
        async processPending() {
            return this.syncService.processPendingSyncs();
        }
        async getStatus() {
            return this.syncService.getSyncStatus();
        }
        async getLogs(limit) {
            return this.syncService.getSyncLogs(limit);
        }
    };
    return SyncController = _classThis;
})();
export { SyncController };
//# sourceMappingURL=sync.controller.js.map