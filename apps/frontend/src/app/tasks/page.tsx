'use client';

import { useState } from 'react';
import { useTasks, useCreateTask, useCompleteTask, useRateTask } from '@/lib/hooks';

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useTasks({
    status: statusFilter,
    page,
    limit: 20,
  });

  const createMutation = useCreateTask();
  const completeMutation = useCompleteTask();
  const rateMutation = useRateTask();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4">
          {[undefined, 'PENDING', 'COMPLETED', 'RATED'].map((status) => (
            <button
              key={status || 'all'}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status || 'ALL'}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="ml-auto px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
          >
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-800 font-medium">Failed to load tasks</h3>
                <p className="text-red-600 text-sm mt-1">
                  {(error as any)?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        {data && data.data && (
          <>
            {data.data.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">No tasks found</p>
                <p className="text-sm mt-1">Create a new task to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.data.map((task: any) => (
                  <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            #{task.token}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : task.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <h3 className="font-medium mt-1">{task.taskType || 'Task'}</h3>
                        {task.taskDetail && (
                          <p className="text-sm text-gray-600 mt-1">{task.taskDetail}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>Employee: {task.employeeName || 'Unassigned'}</span>
                          {task.taskEndingDate && (
                            <span>Due: {new Date(task.taskEndingDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.meta && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.meta.totalPages}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Create Task Form (simplified) */}
        <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-lg">
          <h2 className="font-medium mb-2">Quick Create Task</h2>
          <p className="text-xs text-gray-500 mb-3">Submit a new task to the queue system.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              try {
                await createMutation.mutateAsync({
                  employeeName: formData.get('employeeName') as string,
                  taskType: formData.get('taskType') as string,
                  taskDetail: formData.get('taskDetail') as string,
                });
                form.reset();
                refetch();
              } catch (err) {
                console.error('Failed to create task:', err);
              }
            }}
            className="flex gap-2 flex-wrap"
          >
            <input
              name="employeeName"
              placeholder="Employee name"
              className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[140px]"
              required
            />
            <input
              name="taskType"
              placeholder="Task type"
              defaultValue="EXTRA WORK"
              className="border rounded px-3 py-1.5 text-sm flex-1 min-w-[120px]"
              required
            />
            <input
              name="taskDetail"
              placeholder="Task details"
              className="border rounded px-3 py-1.5 text-sm flex-[2] min-w-[200px]"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </form>
          {createMutation.isSuccess && (
            <p className="text-green-600 text-xs mt-2">Task created successfully!</p>
          )}
          {createMutation.isError && (
            <p className="text-red-600 text-xs mt-2">
              Failed: {(createMutation.error as any)?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}