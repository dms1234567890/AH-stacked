export declare function useStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    batchId?: string;
    status?: string;
}): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useStudent(id: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCreateStudent(): import("@tanstack/react-query").UseMutationResult<any, Error, any, unknown>;
export declare function useUpdateStudent(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    data: any;
}, unknown>;
export declare function useDeleteStudent(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useTasks(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useTask(id: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCreateTask(): import("@tanstack/react-query").UseMutationResult<any, Error, any, unknown>;
export declare function useCompleteTask(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    token: string;
    data?: any;
}, unknown>;
export declare function useRateTask(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    token: string;
    data: {
        rating: number;
        notes?: string;
    };
}, unknown>;
export declare function useBatches(): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useBatch(id: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCreateBatch(): import("@tanstack/react-query").UseMutationResult<any, Error, any, unknown>;
export declare function useUpdateBatch(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    id: string;
    data: any;
}, unknown>;
export declare function useDeleteBatch(): import("@tanstack/react-query").UseMutationResult<any, Error, string, unknown>;
export declare function useSubjects(): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useSyncStatus(): import("@tanstack/react-query").UseQueryResult<unknown, Error>;
//# sourceMappingURL=hooks.d.ts.map