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
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
let AuthService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AuthService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AuthService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        jwtService;
        logger = new Logger(AuthService.name);
        constructor(prisma, jwtService) {
            this.prisma = prisma;
            this.jwtService = jwtService;
        }
        async login(username, password) {
            // Find user by username
            const user = await this.prisma.user.findUnique({
                where: { username },
            });
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }
            if (!user.isActive) {
                throw new UnauthorizedException('Account is deactivated');
            }
            // Generate tokens
            const tokens = await this.generateTokens(user);
            // Update last login
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    refreshToken: tokens.refreshToken,
                },
            });
            return {
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    post: user.post,
                    role: user.role,
                },
                tokens,
            };
        }
        async refreshToken(refreshToken) {
            try {
                const payload = this.jwtService.verify(refreshToken, {
                    secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
                });
                const user = await this.prisma.user.findUnique({
                    where: { id: payload.sub },
                });
                if (!user || user.refreshToken !== refreshToken) {
                    throw new UnauthorizedException('Invalid refresh token');
                }
                const tokens = await this.generateTokens(user);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { refreshToken: tokens.refreshToken },
                });
                return { tokens };
            }
            catch {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }
        }
        async logout(userId) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { refreshToken: null },
            });
        }
        async validateUser(userId) {
            return this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    email: true,
                    mobile: true,
                    post: true,
                    role: true,
                    isActive: true,
                },
            });
        }
        async generateTokens(user) {
            const payload = {
                sub: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
            };
            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync(payload),
                this.jwtService.signAsync(payload, {
                    secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
                    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
                }),
            ]);
            return { accessToken, refreshToken };
        }
    };
    return AuthService = _classThis;
})();
export { AuthService };
//# sourceMappingURL=auth.service.js.map