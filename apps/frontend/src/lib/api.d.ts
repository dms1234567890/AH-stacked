export declare const api: import("axios").AxiosInstance;
export declare const authApi: {
    login: (credentials: {
        username: string;
        password: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    refresh: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    logout: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const usersApi: {
    getMe: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    updateMe: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const studentsApi: {
    getAll: (params?: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getAdmissions: (params?: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    createAdmission: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    changeBatch: (data: {
        studentId: string;
        newBatchId: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getBatchHistory: (studentId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const employeesApi: {
    getAll: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const teachersApi: {
    getAll: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const batchesApi: {
    getAll: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    addSubject: (batchId: string, subjectId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    removeSubject: (batchId: string, subjectId: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const subjectsApi: {
    getAll: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const classesApi: {
    getAll: (params?: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
export declare const tasksApi: {
    getAll: (params?: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    getById: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    create: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    update: (id: string, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    delete: (id: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    complete: (taskId: string, data?: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
    rate: (taskId: string, data: {
        rating: number;
        notes?: string;
    }) => Promise<import("axios").AxiosResponse<any, any, {}>>;
};
//# sourceMappingURL=api.d.ts.map