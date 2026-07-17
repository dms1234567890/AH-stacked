'use client';
import { useState } from 'react';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/lib/hooks';
export default function StudentsPage() {
    const [activeSection, setActiveSection] = useState('students-manage');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const { data, isLoading, isError, error, refetch } = useStudents({
        search: search || undefined,
        page,
        limit: 30,
    });
    const createMutation = useCreateStudent();
    const updateMutation = useUpdateStudent();
    const deleteMutation = useDeleteStudent();
    const renderLoading = () => (<div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-600">Loading students...</span>
    </div>);
    const renderError = () => (<div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-red-800 font-medium">Failed to load data</h3>
          <p className="text-red-600 text-sm mt-1">{error?.message || 'An unexpected error occurred'}</p>
        </div>
        <button onClick={() => refetch()} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium">
          Retry
        </button>
      </div>
    </div>);
    return (<div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-10">
        <h1 className="text-2xl font-bold mb-6">Students Management</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveSection('enroll')} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
            Enroll New Students
          </button>
          <button onClick={() => setActiveSection('active')} className="bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition">
            Active Students
          </button>
          <button onClick={() => setActiveSection('sync')} className="bg-amber-500 text-white p-2 rounded hover:bg-amber-600 transition">
            Sync Status
          </button>
          <button onClick={() => setActiveSection('list')} className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition">
            All Students
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => window.location.href = '/dashboard'} className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </button>
          {activeSection === 'list' && (<div className="flex gap-2">
              <input type="text" placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="border rounded px-3 py-1 text-sm w-48"/>
              <button onClick={() => refetch()} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
                Refresh
              </button>
            </div>)}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
          {/* All Students List */}
          {activeSection === 'list' && (<>
              {isLoading && renderLoading()}
              {isError && renderError()}
              {data && data.data && (<>
                  {data.data.length === 0 ? (<p className="text-gray-500 text-center py-8">No students found.</p>) : (<div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Student ID</th>
                            <th className="text-left py-2 px-2">Name</th>
                            <th className="text-left py-2 px-2">Batch</th>
                            <th className="text-left py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((student) => (<tr key={student.id} className="border-b hover:bg-gray-100">
                              <td className="py-2 px-2">{student.studentId}</td>
                              <td className="py-2 px-2">{student.studentName}</td>
                              <td className="py-2 px-2">{student.batchName || '-'}</td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${student.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : student.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'}`}>
                                  {student.status}
                                </span>
                              </td>
                            </tr>))}
                        </tbody>
                      </table>
                      {/* Pagination */}
                      {data.meta && data.meta.totalPages > 1 && (<div className="flex items-center justify-center gap-2 mt-4">
                          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50">
                            Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            Page {data.meta.page} of {data.meta.totalPages}
                          </span>
                          <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-50">
                            Next
                          </button>
                        </div>)}
                    </div>)}
                </>)}
            </>)}

          {/* Active Students */}
          {activeSection === 'active' && (<ActiveStudentsList />)}

          {/* Sync Status */}
          {activeSection === 'sync' && (<SyncStatusPanel />)}

          {/* Placeholder sections */}
          {!['list', 'active', 'sync'].includes(activeSection) && (<p className="text-gray-500 text-center py-8">
              {activeSection === 'students-manage' && 'Please select a section from the buttons above.'}
              {activeSection === 'enroll' && 'Enroll new students functionality.'}
            </p>)}
        </div>
      </div>
    </div>);
}
function ActiveStudentsList() {
    const { data, isLoading, isError, error, refetch } = useStudents({ status: 'ACTIVE', limit: 50 });
    if (isLoading) {
        return (<div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-500 text-sm">Loading active students...</span>
      </div>);
    }
    if (isError) {
        return (<div className="bg-red-50 border border-red-200 rounded p-3">
        <p className="text-red-600 text-sm">Failed to load: {error?.message}</p>
        <button onClick={() => refetch()} className="mt-2 text-red-700 underline text-sm">Retry</button>
      </div>);
    }
    if (!data?.data?.length) {
        return <p className="text-gray-500 text-center py-8">No active students found.</p>;
    }
    return (<div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">Student ID</th>
            <th className="text-left py-2 px-2">Name</th>
            <th className="text-left py-2 px-2">Batch</th>
            <th className="text-left py-2 px-2">Class</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((student) => (<tr key={student.id} className="border-b hover:bg-gray-100">
              <td className="py-2 px-2">{student.studentId}</td>
              <td className="py-2 px-2">{student.studentName}</td>
              <td className="py-2 px-2">{student.batchName || '-'}</td>
              <td className="py-2 px-2">{student.class || '-'}</td>
            </tr>))}
        </tbody>
      </table>
    </div>);
}
function SyncStatusPanel() {
    const { data, isLoading, refetch } = useStudents();
    return (<div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Database Sync Status</h3>
        <button onClick={() => refetch()} className="text-blue-600 hover:underline text-sm">
          Refresh
        </button>
      </div>
      {isLoading ? (<div className="animate-pulse h-20 bg-gray-200 rounded"></div>) : (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded p-3 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {data?.meta?.total || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Records</div>
          </div>
          <div className="bg-white border rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-600">Online</div>
            <div className="text-xs text-gray-500 mt-1">PostgreSQL Status</div>
          </div>
          <div className="bg-white border rounded p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">Async</div>
            <div className="text-xs text-gray-500 mt-1">Sync Pipeline</div>
          </div>
          <div className="bg-white border rounded p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">BullMQ</div>
            <div className="text-xs text-gray-500 mt-1">Queue Engine</div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=page.js.map