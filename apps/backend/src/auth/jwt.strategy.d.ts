import { Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';
import type { JwtPayload } from '@prime/types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<any>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map