import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    findAll(): Promise<any>;
    create(body: {
        name: string;
        employeeId: string;
        email?: string;
        department?: string;
        designation?: string;
        phone?: string;
    }): Promise<any>;
}
//# sourceMappingURL=employees.controller.d.ts.map