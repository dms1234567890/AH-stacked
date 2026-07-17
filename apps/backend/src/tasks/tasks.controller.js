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
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
let TasksController = (() => {
    let _classDecorators = [ApiTags('Tasks'), ApiBearerAuth(), UseGuards(JwtAuthGuard), Controller('tasks')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _findAll_decorators;
    let _getCompletedForRating_decorators;
    let _rate_decorators;
    var TasksController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [Post(), ApiOperation({ summary: 'Create a new task' })];
            _findAll_decorators = [Get(), ApiOperation({ summary: 'Get all tasks' })];
            _getCompletedForRating_decorators = [Get('completed'), ApiOperation({ summary: 'Get completed tasks for rating' })];
            _rate_decorators = [Post(':token/rate'), ApiOperation({ summary: 'Rate a task' })];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCompletedForRating_decorators, { kind: "method", name: "getCompletedForRating", static: false, private: false, access: { has: obj => "getCompletedForRating" in obj, get: obj => obj.getCompletedForRating }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _rate_decorators, { kind: "method", name: "rate", static: false, private: false, access: { has: obj => "rate" in obj, get: obj => obj.rate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TasksController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        tasksService = __runInitializers(this, _instanceExtraInitializers);
        constructor(tasksService) {
            this.tasksService = tasksService;
        }
        async create(body, req) {
            const user = req.user;
            return this.tasksService.create({ ...body, giverId: user.id });
        }
        async findAll(page, limit, status) {
            return this.tasksService.findAll({ page, limit, status });
        }
        async getCompletedForRating() {
            return this.tasksService.getCompletedForRating();
        }
        async rate(token, body, req) {
            const user = req.user;
            return this.tasksService.rate(token, body.rating, user.id, body.notes);
        }
    };
    return TasksController = _classThis;
})();
export { TasksController };
//# sourceMappingURL=tasks.controller.js.map