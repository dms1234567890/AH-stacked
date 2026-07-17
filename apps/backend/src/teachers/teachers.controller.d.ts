import { TeachersService } from './teachers.service';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    findAll(): Promise<any>;
    create(body: {
        name: string;
        teacherId: string;
        email?: string;
    }): Promise<any>;
}
//# sourceMappingURL=teachers.controller.d.ts.map