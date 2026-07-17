import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(username: string, password: string): Promise<{
        user: {
            id: any;
            username: any;
            name: any;
            email: any;
            mobile: any;
            post: any;
            role: any;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    logout(userId: string): Promise<void>;
    validateUser(userId: string): Promise<any>;
    private generateTokens;
}
//# sourceMappingURL=auth.service.d.ts.map