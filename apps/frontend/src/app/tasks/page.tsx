'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTasks,
  useCreateTask,
  useCompleteTask,
  useRateTask,
  useHeadsBootstrap,
} from '@/lib/hooks';
import {
  LayoutDashboard,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Star,
  FileText,
  Calendar,
  User,
  Briefcase,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Modals/Forms State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    taskType: 'EXTRA WORK',
    taskReason: '',
    taskRole: '',
    taskDetail: '',
    taskEndingDate: '',
  });

  const [completeState, setCompleteState] = useState<{ isOpen: boolean; token: string; notes: string } | null>(null);
  const [rateState, setRateState] = useState<{ isOpen: boolean; token: string; rating: number; notes: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Hooks
  const { data: bootstrapData } = useHeadsBootstrap();
  const { data: tasksData, isLoading, isError, error, refetch } = useTasks({
    status: statusFilter,
    page,
    limit: 20,
  });

  const createMutation = useCreateTask();
  const completeMutation = useCompleteTask();
  const rateMutation = useRateTask();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const selected = bootstrapData?.employees?.find((emp: any) => emp.name === name);
    setFormData((prev) => ({
      ...prev,
      employeeName: name,
      employeeId: selected ? selected.employeeId : '',
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeName) {
      showToast('Please select an employee', 'error');
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      showToast('Task assigned successfully', 'success');
      setIsCreateOpen(false);
      setFormData({
        employeeName: '',
        employeeId: '',
        taskType: 'EXTRA WORK',
        taskReason: '',
        taskRole: '',
        taskDetail: '',
        taskEndingDate: '',
      });
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign task', 'error');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeState) return;
    try {
      await completeMutation.mutateAsync({
        token: completeState.token,
        data: completeState.notes,
      });
      showToast('Task completed successfully', 'success');
      setCompleteState(null);
      refetch();
    } catch (err: any) {
      showToast('Failed to complete task', 'error');
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateState) return;
    if (rateState.rating < 1 || rateState.rating > 5) {
      showToast('Please select a rating between 1 and 5', 'error');
      return;
    }
    try {
      await rateMutation.mutateAsync({
        token: rateState.token,
        data: {
          rating: rateState.rating,
          notes: rateState.notes,
        },
      });
      showToast('Task rated successfully', 'success');
      setRateState(null);
      refetch();
    } catch (err: any) {
      showToast('Failed to rate task', 'error');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter local lists by search
  const filteredTasks = tasksData?.data?.filter((task: any) => {
    const term = search.toLowerCase();
    return (
      task.employeeName?.toLowerCase().includes(term) ||
      task.taskType?.toLowerCase().includes(term) ||
      task.taskDetail?.toLowerCase().includes(term) ||
      task.token?.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Activity className="text-indigo-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Actions panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Tasks', value: undefined },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Rated', value: 'RATED' },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => { setStatusFilter(s.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  statusFilter === s.value
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-full sm:w-60 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              />
            </div>
            
            {/* New Task Button */}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow"
            >
              <Plus size={16} /> Assign Task
            </button>
          </div>
        </div>

        {/* Tasks List Content */}
        {isLoading ? (
          <div className="bg-white rounded-xl py-16 text-center border shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <span className="mt-3 block text-gray-500 font-medium">Loading task roster...</span>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h3 className="text-red-800 font-bold text-lg mb-2">Error Loading Tasks</h3>
            <p className="text-red-600 text-sm mb-4">{(error as any)?.message || 'Internal connection error'}</p>
            <button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold text-sm">
              Retry Sync
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border rounded-xl py-16 text-center text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tasks found matching current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task: any) => {
              const isExpanded = expandedTaskId === task.id;
              return (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:border-gray-200 transition">
                  <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          #{task.token}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          task.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : task.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">{task.employeeName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {task.taskType}</span>
                        {task.taskEndingDate && (
                          <span className="flex items-center gap-1"><Calendar size={14} /> Due: {new Date(task.taskEndingDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      {task.status === 'PENDING' && (
                        <button
                          onClick={() => setCompleteState({ isOpen: true, token: task.token, notes: '' })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Complete
                        </button>
                      )}
                      
                      {task.status === 'COMPLETED' && (
                        <button
                          onClick={() => setRateState({ isOpen: true, token: task.token, rating: 5, notes: '' })}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Rate Task
                        </button>
                      )}

                      {task.status === 'RATED' && task.ratings?.[0] && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          <Star size={16} fill="currentColor" /> {task.ratings[0].rating}/5
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-50 pt-4 bg-gray-50/50 space-y-3 text-sm text-gray-700">
                      {task.employeeId && (
                        <div><strong>Employee ID:</strong> {task.employeeId}</div>
                      )}
                      {task.taskRole && (
                        <div><strong>Role / Position:</strong> {task.taskRole}</div>
                      )}
                      {task.taskReason && (
                        <div><strong>Reason / Context:</strong> {task.taskReason}</div>
                      )}
                      {task.taskDetail && (
                        <div><strong>Task Details:</strong> {task.taskDetail}</div>
                      )}
                      {task.giver && (
                        <div><strong>Assigned By:</strong> {task.giver.name}</div>
                      )}
                      {task.completions?.[0]?.notes && (
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100">
                          <strong>Completion Notes:</strong> {task.completions[0].notes}
                        </div>
                      )}
                      {task.ratings?.[0]?.notes && (
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100">
                          <strong>Rating Comments:</strong> {task.ratings[0].notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {tasksData?.meta && tasksData.meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border bg-white font-medium text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {tasksData.meta.page} of {tasksData.meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= tasksData.meta.totalPages}
              className="px-4 py-2 rounded-lg border bg-white font-medium text-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* CREATE TASK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Assign Task</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <form id="create-task-form" onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Name *</label>
                    <select
                      value={formData.employeeName}
                      onChange={handleEmployeeChange}
                      required
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    >
                      <option value="">Select Employee</option>
                      {bootstrapData?.employees?.map((emp: any) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      readOnly
                      className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 text-gray-500 focus:outline-none"
                      placeholder="Auto-populated"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
                    <select
                      value={formData.taskType}
                      onChange={(e) => setFormData((f) => ({ ...f, taskType: e.target.value }))}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    >
                      <option value="EXTRA WORK">EXTRA WORK</option>
                      <option value="ACADEMIC AUDIT">ACADEMIC AUDIT</option>
                      <option value="LEAVE SUBSTITUTION">LEAVE SUBSTITUTION</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Due / Ending Date</label>
                    <input
                      type="date"
                      value={formData.taskEndingDate}
                      onChange={(e) => setFormData((f) => ({ ...f, taskEndingDate: e.target.value }))}
                      className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Position</label>
                  <input
                    type="text"
                    value={formData.taskRole}
                    onChange={(e) => setFormData((f) => ({ ...f, taskRole: e.target.value }))}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                    placeholder="Enter role (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason / Context</label>
                  <textarea
                    value={formData.taskReason}
                    onChange={(e) => setFormData((f) => ({ ...f, taskReason: e.target.value }))}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none h-20"
                    placeholder="Enter reason for assignment"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Task Details</label>
                  <textarea
                    value={formData.taskDetail}
                    onChange={(e) => setFormData((f) => ({ ...f, taskDetail: e.target.value }))}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none h-24"
                    placeholder="Describe task details, goals, or requirements"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
                Cancel
              </button>
              <button type="submit" form="create-task-form" disabled={createMutation.isPending} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow disabled:opacity-50">
                {createMutation.isPending ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE TASK MODAL */}
      {completeState?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Complete Task</h3>
              <button onClick={() => setCompleteState(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCompleteSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Completion Notes / Feedback</label>
                  <textarea
                    value={completeState.notes}
                    onChange={(e) => setCompleteState((s: any) => ({ ...s, notes: e.target.value }))}
                    placeholder="Enter optional summary of completed work..."
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm h-32 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  ></textarea>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setCompleteState(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={completeMutation.isPending} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                  {completeMutation.isPending ? 'Completing...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATE TASK MODAL */}
      {rateState?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Rate Completed Task</h3>
              <button onClick={() => setRateState(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRateSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating Score *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRateState((s: any) => ({ ...s, rating: star }))}
                        className="text-amber-400 hover:scale-110 transition"
                      >
                        <Star size={32} fill={star <= rateState.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rater Comments</label>
                  <textarea
                    value={rateState.notes}
                    onChange={(e) => setRateState((s: any) => ({ ...s, notes: e.target.value }))}
                    placeholder="Enter rating feedback or comments..."
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm h-28 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  ></textarea>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setRateState(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={rateMutation.isPending} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                  {rateMutation.isPending ? 'Submitting...' : 'Save Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white font-medium z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}