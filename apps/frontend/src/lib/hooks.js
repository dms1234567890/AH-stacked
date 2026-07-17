'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, tasksApi, batchesApi, subjectsApi, } from './api';
// ================================================================
// Students Hooks
// ================================================================
export function useStudents(params) {
    return useQuery({
        queryKey: ['students', params],
        queryFn: () => studentsApi.getAll(params).then((r) => r.data),
        placeholderData: (prev) => prev,
        staleTime: 30_000,
    });
}
export function useStudent(id) {
    return useQuery({
        queryKey: ['students', id],
        queryFn: () => studentsApi.getById(id).then((r) => r.data),
        enabled: !!id,
    });
}
export function useCreateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => studentsApi.create(data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}
export function useUpdateStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => studentsApi.update(id, data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}
export function useDeleteStudent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => studentsApi.delete(id).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });
}
// ================================================================
// Tasks Hooks
// ================================================================
export function useTasks(params) {
    return useQuery({
        queryKey: ['tasks', params],
        queryFn: () => tasksApi.getAll(params).then((r) => r.data),
        placeholderData: (prev) => prev,
        staleTime: 15_000,
    });
}
export function useTask(id) {
    return useQuery({
        queryKey: ['tasks', id],
        queryFn: () => tasksApi.getById(id).then((r) => r.data),
        enabled: !!id,
    });
}
export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tasksApi.create(data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
export function useCompleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ token, data }) => tasksApi.complete(token, data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
export function useRateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ token, data }) => tasksApi.rate(token, data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}
// ================================================================
// Batches Hooks
// ================================================================
export function useBatches() {
    return useQuery({
        queryKey: ['batches'],
        queryFn: () => batchesApi.getAll().then((r) => r.data),
        staleTime: 60_000,
    });
}
export function useBatch(id) {
    return useQuery({
        queryKey: ['batches', id],
        queryFn: () => batchesApi.getById(id).then((r) => r.data),
        enabled: !!id,
    });
}
export function useCreateBatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => batchesApi.create(data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
    });
}
export function useUpdateBatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => batchesApi.update(id, data).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
    });
}
export function useDeleteBatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => batchesApi.delete(id).then((r) => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        },
    });
}
// ================================================================
// Subjects Hooks
// ================================================================
export function useSubjects() {
    return useQuery({
        queryKey: ['subjects'],
        queryFn: () => subjectsApi.getAll().then((r) => r.data),
        staleTime: 60_000,
    });
}
// ================================================================
// Sync Status Hook
// ================================================================
export function useSyncStatus() {
    return useQuery({
        queryKey: ['sync', 'status'],
        queryFn: () => fetch('/api/v1/sync/status', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).then((r) => r.json()),
        staleTime: 10_000,
        refetchInterval: 30_000,
    });
}
//# sourceMappingURL=hooks.js.map