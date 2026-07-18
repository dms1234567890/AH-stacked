'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useHeadsBootstrap,
  useSaveSubjectHead,
  useSaveBatchHead,
  useDeleteSubjectHead,
  useDeleteBatchHead,
  useSyllabusModules,
  useSaveSyllabusModule,
  useDeleteSyllabusModule,
  useSyllabusOverview,
} from '@/lib/hooks';
import { headsApi } from '@/lib/api';
import {
  BookOpen,
  Users,
  LayoutDashboard,
  FileText,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Pencil,
} from 'lucide-react';

export default function HeadsPage() {
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'batches' | 'syllabus'>('overview');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  // Data fetching
  const { data: bootstrapData, isLoading: isBootstrapLoading } = useHeadsBootstrap();
  const { data: overviewData, isLoading: isOverviewLoading } = useSyllabusOverview();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm flex flex-col hidden md:flex">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" />
            Heads Manage
          </h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} />
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'subjects'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen size={20} />
            Subject Heads
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'batches'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} />
            Batch Heads
          </button>
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'syllabus'
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={20} />
            Syllabus / Modules
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b flex justify-between items-center">
           <h1 className="text-lg font-bold text-gray-800">Heads Manage</h1>
           <select 
             value={activeTab}
             onChange={(e) => setActiveTab(e.target.value as any)}
             className="border rounded-md px-2 py-1"
           >
             <option value="overview">Overview</option>
             <option value="subjects">Subject Heads</option>
             <option value="batches">Batch Heads</option>
             <option value="syllabus">Syllabus</option>
           </select>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <OverviewTab 
              overviewData={overviewData} 
              bootstrapData={bootstrapData} 
              setActiveTab={setActiveTab} 
            />
          )}
          {activeTab === 'subjects' && (
            <SubjectHeadsTab 
              bootstrapData={bootstrapData} 
              showToast={showToast} 
            />
          )}
          {activeTab === 'batches' && (
            <BatchHeadsTab 
              bootstrapData={bootstrapData} 
              showToast={showToast} 
            />
          )}
          {activeTab === 'syllabus' && (
            <SyllabusTab 
              bootstrapData={bootstrapData} 
              showToast={showToast} 
            />
          )}
        </div>
      </div>

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

// ---------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------
function OverviewTab({ overviewData, bootstrapData, setActiveTab }: { overviewData: any, bootstrapData: any, setActiveTab: (t: any) => void }) {
  const totalBatchHeads = bootstrapData?.batchHeads?.length || 0;
  const totalSubjectHeads = bootstrapData?.subjectHeads?.length || 0;
  
  let totalModules = 0;
  let completedModules = 0;
  if (overviewData) {
    overviewData.forEach((item: any) => {
      totalModules += item.totalModules;
      completedModules += item.completedModules;
    });
  }
  const syllabusProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Batch Heads</p>
            <p className="text-2xl font-bold text-gray-800">{totalBatchHeads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Subject Heads</p>
            <p className="text-2xl font-bold text-gray-800">{totalSubjectHeads}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">Overall Syllabus Progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${syllabusProgress}%` }}></div>
              </div>
              <span className="text-lg font-bold text-gray-800">{syllabusProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-gray-800">Syllabus Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="py-3 px-4 font-medium">Batch Name</th>
                <th className="py-3 px-4 font-medium">Subject Name</th>
                <th className="py-3 px-4 font-medium">Total Modules</th>
                <th className="py-3 px-4 font-medium">Completed</th>
                <th className="py-3 px-4 font-medium">Pending</th>
                <th className="py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {overviewData?.map((item: any, i: number) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">{item.batchName}</td>
                  <td className="py-3 px-4">{item.subjectName}</td>
                  <td className="py-3 px-4 font-medium">{item.totalModules}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{item.completedModules}</td>
                  <td className="py-3 px-4 text-orange-500 font-medium">{item.pendingModules}</td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => {
                        window.sessionStorage.setItem('preselect-syllabus', JSON.stringify({ batchName: item.batchName, subjectName: item.subjectName }));
                        setActiveTab('syllabus');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Open Syllabus
                    </button>
                  </td>
                </tr>
              ))}
              {!overviewData?.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No syllabus data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------
// Subject Heads Tab
// ---------------------------------------------------------
function SubjectHeadsTab({ bootstrapData, showToast }: { bootstrapData: any, showToast: any }) {
  const [formData, setFormData] = useState({ subjectId: '', employeeId: '' });
  const saveMutation = useSaveSubjectHead();
  const deleteMutation = useDeleteSubjectHead();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.employeeId) return;
    try {
      await saveMutation.mutateAsync(formData);
      showToast('Subject head assigned successfully', 'success');
      setFormData({ subjectId: '', employeeId: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign subject head', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Assign Subject Head</h2>
        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select 
              value={formData.subjectId} 
              onChange={(e) => setFormData(f => ({ ...f, subjectId: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Subject</option>
              {bootstrapData?.subjects?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select 
              value={formData.employeeId} 
              onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Employee</option>
              {bootstrapData?.employees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            Assign Head
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Active Subject Heads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="py-3 px-4 font-medium">Subject Name</th>
                <th className="py-3 px-4 font-medium">Head Name</th>
                <th className="py-3 px-4 font-medium">Employee ID</th>
                <th className="py-3 px-4 font-medium">Date Assigned</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {bootstrapData?.subjectHeads?.map((sh: any) => (
                <tr key={sh.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-indigo-700">{sh.subject?.name || sh.targetName}</td>
                  <td className="py-3 px-4">{sh.employee?.name || sh.headName}</td>
                  <td className="py-3 px-4">{sh.employee?.employeeId || sh.headEmployeeId}</td>
                  <td className="py-3 px-4">{new Date(sh.createdAt || sh.assignedDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={async () => {
                        if (confirm('Remove this subject head assignment?')) {
                          try {
                            await deleteMutation.mutateAsync(sh.id);
                            showToast('Removed successfully', 'success');
                          } catch(err) {
                            showToast('Failed to remove', 'error');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove Assignment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!bootstrapData?.subjectHeads?.length && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No subject heads assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Batch Heads Tab
// ---------------------------------------------------------
function BatchHeadsTab({ bootstrapData, showToast }: { bootstrapData: any, showToast: any }) {
  const [formData, setFormData] = useState({ batchId: '', employeeId: '' });
  const saveMutation = useSaveBatchHead();
  const deleteMutation = useDeleteBatchHead();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId || !formData.employeeId) return;
    try {
      await saveMutation.mutateAsync(formData);
      showToast('Batch head assigned successfully', 'success');
      setFormData({ batchId: '', employeeId: '' });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign batch head', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Assign Batch Head</h2>
        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select 
              value={formData.batchId} 
              onChange={(e) => setFormData(f => ({ ...f, batchId: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Batch</option>
              {bootstrapData?.batches?.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select 
              value={formData.employeeId} 
              onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select Employee</option>
              {bootstrapData?.employees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={18} />
            Assign Head
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Active Batch Heads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="py-3 px-4 font-medium">Batch Name</th>
                <th className="py-3 px-4 font-medium">Head Name</th>
                <th className="py-3 px-4 font-medium">Employee ID</th>
                <th className="py-3 px-4 font-medium">Date Assigned</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {bootstrapData?.batchHeads?.map((bh: any) => (
                <tr key={bh.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-indigo-700">{bh.batch?.name || bh.targetName}</td>
                  <td className="py-3 px-4">{bh.employee?.name || bh.headName}</td>
                  <td className="py-3 px-4">{bh.employee?.employeeId || bh.headEmployeeId}</td>
                  <td className="py-3 px-4">{new Date(bh.createdAt || bh.assignedDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={async () => {
                        if (confirm('Remove this batch head assignment?')) {
                          try {
                            await deleteMutation.mutateAsync(bh.id);
                            showToast('Removed successfully', 'success');
                          } catch(err) {
                            showToast('Failed to remove', 'error');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                      title="Remove Assignment"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {!bootstrapData?.batchHeads?.length && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No batch heads assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Syllabus Tab
// ---------------------------------------------------------
function SyllabusTab({ bootstrapData, showToast }: { bootstrapData: any, showToast: any }) {
  const [filters, setFilters] = useState({ batchName: '', subjectName: '' });
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState<{isOpen: boolean, data: any}>({ isOpen: false, data: null });
  
  useEffect(() => {
    const preselect = window.sessionStorage.getItem('preselect-syllabus');
    if (preselect) {
      try {
        const parsed = JSON.parse(preselect);
        setFilters(parsed);
      } catch(e) {}
      window.sessionStorage.removeItem('preselect-syllabus');
    }
  }, []);

  const { data: modules, isLoading } = useSyllabusModules(filters);
  const deleteMutation = useDeleteSyllabusModule();
  const saveMutation = useSaveSyllabusModule();

  const handleDownloadPdf = async () => {
    try {
      const res = await headsApi.getSyllabusPdf(filters);
      // Assuming res.data contains { url } or blob
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        // basic fallback if it returns raw pdf data (would need blob handling normally)
        showToast('PDF downloaded / opened in new tab', 'success');
      }
    } catch(err) {
      showToast('Failed to download PDF', 'error');
    }
  };

  const filteredModules = modules?.filter((m: any) => 
    m.moduleName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const completedCount = modules?.filter((m: any) => m.status === 'Completed').length || 0;
  const pendingCount = (modules?.length || 0) - completedCount;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Batch</label>
            <select 
              value={filters.batchName} 
              onChange={(e) => setFilters(f => ({ ...f, batchName: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm border focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Batch</option>
              {bootstrapData?.batches?.map((b: any) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 md:w-48">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject</label>
            <select 
              value={filters.subjectName} 
              onChange={(e) => setFilters(f => ({ ...f, subjectName: e.target.value }))}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm border focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Subject</option>
              {bootstrapData?.subjects?.map((s: any) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setModalState({ isOpen: true, data: { status: 'Pending', batchName: filters.batchName, subjectName: filters.subjectName } })}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus size={16} /> New Module
          </button>
          <button 
            onClick={handleDownloadPdf}
            disabled={!filters.batchName || !filters.subjectName}
            className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      {filters.batchName && filters.subjectName && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-sm text-gray-500 font-medium">Total Modules</p>
                <p className="text-2xl font-bold text-gray-800">{modules?.length || 0}</p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-green-100 bg-green-50 text-center shadow-sm">
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-700">{completedCount}</p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-orange-100 bg-orange-50 text-center shadow-sm">
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Modules List</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search modules..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 text-center text-gray-500">Loading syllabus...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                      <th className="py-3 px-4 font-medium">Module Name</th>
                      <th className="py-3 px-4 font-medium">Class Details</th>
                      <th className="py-3 px-4 font-medium">Dates (Start - End)</th>
                      <th className="py-3 px-4 font-medium">Teacher</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {filteredModules.map((m: any) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{m.moduleTitle} ({m.moduleNumber})</td>
                        <td className="py-3 px-4">
                           {m.chapterName && <span className="block text-xs text-gray-500">Chapter: {m.chapterName}</span>}
                           {m.moduleDescription || '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {m.dueDate || '—'}
                        </td>
                        <td className="py-3 px-4">{m.teacherName || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            m.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button 
                            onClick={() => setModalState({ isOpen: true, data: m })}
                            className="text-blue-500 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-50"
                            title="Edit Module"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Delete this module?')) {
                                try {
                                  await deleteMutation.mutateAsync(m.id);
                                  showToast('Deleted module', 'success');
                                } catch(err) {
                                  showToast('Failed to delete', 'error');
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50"
                            title="Delete Module"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!filteredModules.length && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">No modules found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {!filters.batchName || !filters.subjectName ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
           <FileText size={48} className="mx-auto mb-3 opacity-20" />
           <p>Select both Batch and Subject to view syllabus modules</p>
        </div>
      ) : null}

      {/* Module Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-800">{modalState.data?.id ? 'Edit Module' : 'New Module'}</h3>
              <button onClick={() => setModalState({ isOpen: false, data: null })} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
               <form 
                 id="module-form"
                 onSubmit={async (e) => {
                   e.preventDefault();
                   try {
                     await saveMutation.mutateAsync(modalState.data);
                     showToast('Module saved', 'success');
                     setModalState({ isOpen: false, data: null });
                   } catch(err) {
                     showToast('Failed to save module', 'error');
                   }
                 }}
                 className="space-y-4"
               >
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
                     <input type="text" value={modalState.data.batchName || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, batchName: e.target.value}}))} required className="w-full border p-2 rounded-md" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                     <input type="text" value={modalState.data.subjectName || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, subjectName: e.target.value}}))} required className="w-full border p-2 rounded-md" />
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Module Name *</label>
                   <input type="text" value={modalState.data.moduleName || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, moduleName: e.target.value}}))} required className="w-full border p-2 rounded-md" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Class No</label>
                     <input type="text" value={modalState.data.classNo || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, classNo: e.target.value}}))} className="w-full border p-2 rounded-md" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                     <input type="text" value={modalState.data.classType || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, classType: e.target.value}}))} className="w-full border p-2 rounded-md" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                     <input type="date" value={modalState.data.startDate ? new Date(modalState.data.startDate).toISOString().split('T')[0] : ''} onChange={e => setModalState(s => ({...s, data: {...s.data, startDate: e.target.value}}))} className="w-full border p-2 rounded-md" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                     <input type="date" value={modalState.data.endDate ? new Date(modalState.data.endDate).toISOString().split('T')[0] : ''} onChange={e => setModalState(s => ({...s, data: {...s.data, endDate: e.target.value}}))} className="w-full border p-2 rounded-md" />
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
                     <input type="text" value={modalState.data.teacherName || ''} onChange={e => setModalState(s => ({...s, data: {...s.data, teacherName: e.target.value}}))} className="w-full border p-2 rounded-md" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <select value={modalState.data.status || 'Pending'} onChange={e => setModalState(s => ({...s, data: {...s.data, status: e.target.value}}))} className="w-full border p-2 rounded-md">
                       <option value="Pending">Pending</option>
                       <option value="Completed">Completed</option>
                     </select>
                   </div>
                 </div>
               </form>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setModalState({ isOpen: false, data: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button type="submit" form="module-form" disabled={saveMutation.isPending} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 shadow-sm disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : 'Save Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
