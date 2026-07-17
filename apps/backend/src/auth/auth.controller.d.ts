import { AuthService } from './auth.service';
import { Request } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: {
        username: string;
        password: string;
    }): Promise<{
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
    refresh(refreshDto: {
        refreshToken: string;
    }): Promise<{
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    getProfile(req: Request): Express.User | undefined;
}
//# sourceMappingURL=auth.controller.d.ts.map