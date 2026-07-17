import { SubjectsService } from './subjects.service';
export declare class SubjectsController {
    private readonly subjectsService;
    constructor(subjectsService: SubjectsService);
    findAll(): Promise<any>;
    create(body: {
        name: string;
        code: string;
    }): Promise<{
        id: any;
        subjectName: any;
        subjectCode: any;
    }>;
    update(code: string, body: {
        name?: string;
    }): Promise<{
        subjectName: any;
        subjectCode: any;
    }>;
    delete(code: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=subjects.controller.d.ts.map