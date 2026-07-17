import { ClassesService } from './classes.service';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    findByDate(date: string): Promise<any>;
    create(body: {
        scheduleData: any[];
        scheduleDate: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: any[];
    }>;
}
//# sourceMappingURL=classes.controller.d.ts.map