'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  studentsApi,
  tasksApi,
  batchesApi,
  subjectsApi,
  employeesApi,
  teachersApi,
  classesApi,
  headsApi,
  performanceApi,
  examsApi,
} from './api';

// ================================================================
// Students Hooks
// ================================================================

export function useStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => studentsApi.getAll(params).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => studentsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      studentsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// ================================================================
// Tasks Hooks
// ================================================================

export function useTasks(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.getAll(params).then((r) => r.data),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tasksApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data?: any }) =>
      tasksApi.complete(token, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useRateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: { rating: number; notes?: string } }) =>
      tasksApi.rate(token, data).then((r) => r.data),
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

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchesApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => batchesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      batchesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, targetBatchId }: { id: string; action?: string; targetBatchId?: string }) =>
      batchesApi.delete(id, { action, targetBatchId }).then((r) => r.data),
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

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => subjectsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      subjectsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
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

// ================================================================
// Additional Admissions & Sync Hooks
// ================================================================

export function useNewStudents() {
  return useQuery({
    queryKey: ['students', 'new'],
    queryFn: () => studentsApi.getNew().then((r) => r.data),
    staleTime: 15_000,
  });
}

export function useSyncPreview() {
  return useQuery({
    queryKey: ['students', 'sync-preview'],
    queryFn: () => studentsApi.getSyncPreview().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useSyncIds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentsApi.syncIds().then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDuplicates() {
  return useQuery({
    queryKey: ['students', 'duplicates'],
    queryFn: () => studentsApi.getDuplicates().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useBatchChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; newBatchId: string }) =>
      studentsApi.changeBatch(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useBatchHistory(studentId: string) {
  return useQuery({
    queryKey: ['students', 'batch-history', studentId],
    queryFn: () => studentsApi.getBatchHistory(studentId).then((r) => r.data),
    enabled: !!studentId,
  });
}

export function useDeleteAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.deleteAdmission(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useDeleteDuplicate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentId }: { id: string; studentId: string }) =>
      studentsApi.deleteDuplicate(id, studentId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

// ================================================================
// Classes / Schedule Hooks
// ================================================================

export function useClassesBootstrap() {
  return useQuery({
    queryKey: ['classes', 'bootstrap'],
    queryFn: () => classesApi.getBootstrap().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useRecurringSchedule(batchId?: string) {
  return useQuery({
    queryKey: ['classes', 'recurring', batchId],
    queryFn: () => classesApi.getRecurring(batchId).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useSaveRecurringSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.saveRecurring(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useScheduleForDate(date: string) {
  return useQuery({
    queryKey: ['classes', 'schedule', date],
    queryFn: () => classesApi.getScheduleForDate(date).then((r) => r.data),
    enabled: !!date,
    staleTime: 15_000,
  });
}

export function usePartialOverrides(date: string) {
  return useQuery({
    queryKey: ['classes', 'partial', date],
    queryFn: () => classesApi.getPartialOverrides(date).then((r) => r.data),
    enabled: !!date,
    staleTime: 15_000,
  });
}

export function useSavePartialOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.savePartialOverride(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useTeacherWorkTimes() {
  return useQuery({
    queryKey: ['classes', 'work-times'],
    queryFn: () => classesApi.getWorkTimes().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useSaveWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.saveWorkTime(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useDeleteWorkTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherId: string) => classesApi.deleteWorkTime(teacherId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useTeacherAbsences(params?: any) {
  return useQuery({
    queryKey: ['classes', 'absences', params],
    queryFn: () => classesApi.getAbsences(params).then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useSaveAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.saveAbsence(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useMergedClasses(date: string) {
  return useQuery({
    queryKey: ['classes', 'merged', date],
    queryFn: () => classesApi.getMerged(date).then((r) => r.data),
    enabled: !!date,
    staleTime: 15_000,
  });
}

export function useSaveMergedClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.saveMerged(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useDeleteMergedClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.deleteMerged(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useSundayDuties(date: string) {
  return useQuery({
    queryKey: ['classes', 'sunday', date],
    queryFn: () => classesApi.getSunday(date).then((r) => r.data),
    enabled: !!date,
    staleTime: 15_000,
  });
}

export function useSaveSundayDuty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => classesApi.saveSunday(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useDeleteSundayDuty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => classesApi.deleteSunday(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useFreeTimeAnalytics(params: any) {
  return useQuery({
    queryKey: ['classes', 'free-time', params],
    queryFn: () => classesApi.getFreeTime(params).then((r) => r.data),
    enabled: !!params?.date,
    staleTime: 15_000,
  });
}

export function useAvailableTeachers(params: any) {
  return useQuery({
    queryKey: ['classes', 'available', params],
    queryFn: () => classesApi.getAvailable(params).then((r) => r.data),
    enabled: !!(params?.date && params?.timeSlot),
    staleTime: 15_000,
  });
}

// ================================================================
// Heads Hooks
// ================================================================

export function useHeadsBootstrap() {
  return useQuery({
    queryKey: ['heads', 'bootstrap'],
    queryFn: () => headsApi.getBootstrap().then(r => r.data),
    staleTime: 30_000,
  });
}

export function useSaveSubjectHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => headsApi.saveSubjectHead(data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useSaveBatchHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => headsApi.saveBatchHead(data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useDeleteSubjectHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => headsApi.deleteSubjectHead(id).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useDeleteBatchHead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => headsApi.deleteBatchHead(id).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useSyllabusModules(params: any) {
  return useQuery({
    queryKey: ['heads', 'syllabus', params],
    queryFn: () => headsApi.getSyllabus(params).then(r => r.data),
    enabled: !!(params?.batchName && params?.subjectName),
    staleTime: 15_000,
  });
}

export function useSaveSyllabusModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => headsApi.saveSyllabus(data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useDeleteSyllabusModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => headsApi.deleteSyllabus(id).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['heads'] }); },
  });
}

export function useSyllabusOverview() {
  return useQuery({
    queryKey: ['heads', 'syllabus-overview'],
    queryFn: () => headsApi.getSyllabusOverview().then(r => r.data),
    staleTime: 30_000,
  });
}

export function usePerformanceLeaderboard(params?: {
  fromDate?: string;
  toDate?: string;
  languageMode?: string;
  batchFilter?: string;
}) {
  return useQuery({
    queryKey: ['performance', 'leaderboard', params],
    queryFn: () => performanceApi.getLeaderboard(params).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useStudentPerformanceReport(
  studentId: string,
  params?: {
    fromDate?: string;
    toDate?: string;
    languageMode?: string;
    batchFilter?: string;
  },
) {
  return useQuery({
    queryKey: ['performance', 'report', studentId, params],
    queryFn: () => performanceApi.getStudentReport(studentId, params).then(r => r.data),
    enabled: !!studentId,
    staleTime: 60_000,
  });
}

// ================================================================
// Exams Hooks
// ================================================================

export function useExamTypes() {
  return useQuery({
    queryKey: ['exams'],
    queryFn: () => examsApi.getAll().then(r => r.data),
    staleTime: 30_000,
  });
}

export function useSaveExamType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => examsApi.save(data).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); },
  });
}

export function useDeleteExamType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.delete(id).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); },
  });
}

export function useBootstrapExams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => examsApi.bootstrap().then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['exams'] }); },
  });
}