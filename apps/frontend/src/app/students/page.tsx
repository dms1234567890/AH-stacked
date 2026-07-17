'use client';

import { useState } from 'react';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useBatches,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useNewStudents,
  useSyncPreview,
  useSyncIds,
  useDuplicates,
  useBatchChange,
  useBatchHistory,
  useDeleteAdmission,
  useDeleteDuplicate,
} from '@/lib/hooks';

export default function StudentsPage() {
  const [activeSection, setActiveSection] = useState('students-manage');
  const [search, setSearch] = useState('');
  const [activeBatchFilter, setActiveBatchFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormValues, setEditFormValues] = useState<any>({});
  
  // Enroll New Student State
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [selectedEnrollBatch, setSelectedEnrollBatch] = useState('');
  const [selectedEnrollLanguage, setSelectedEnrollLanguage] = useState('');

  // Change Batch State
  const [changeBatchStudentId, setChangeBatchStudentId] = useState('');
  const [changeBatchTargetId, setChangeBatchTargetId] = useState('');
  const [historyStudentId, setHistoryStudentId] = useState('');
  const [searchedHistoryStudentId, setSearchedHistoryStudentId] = useState('');

  // Batch Manage State
  const [batchAction, setBatchAction] = useState('list'); // list, add, edit, delete
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchRoom, setNewBatchRoom] = useState('');
  const [newBatchSubjects, setNewBatchSubjects] = useState<string[]>([]);
  const [newBatchStep, setNewBatchStep] = useState(1);
  const [selectedEditBatchId, setSelectedEditBatchId] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editBatchRoom, setEditBatchRoom] = useState('');
  const [editBatchSubjects, setEditBatchSubjects] = useState<string[]>([]);
  const [selectedDeleteBatchId, setSelectedDeleteBatchId] = useState('');
  const [deleteBatchAction, setDeleteBatchAction] = useState('shift_students'); // shift_students, delete_students
  const [deleteBatchTargetId, setDeleteBatchTargetId] = useState('');

  // Subject Manage State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  // Message / Notification Toast State
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 5000);
  };

  // React Query Hooks
  const { data: activeStudents, isLoading: isLoadingActive, refetch: refetchActive } = useStudents({
    status: 'ACTIVE',
    limit: 200,
  });

  const { data: allStudents, isLoading: isLoadingAll, refetch: refetchAll } = useStudents({
    search: search || undefined,
    limit: 100,
  });

  const { data: newStudents, isLoading: isLoadingNew, refetch: refetchNew } = useNewStudents();
  const { data: syncPreview, isLoading: isLoadingSync, refetch: refetchSync } = useSyncPreview();
  const { data: duplicates, isLoading: isLoadingDupes, refetch: refetchDupes } = useDuplicates();
  const { data: batches, isLoading: isLoadingBatches, refetch: refetchBatches } = useBatches();
  const { data: subjects, isLoading: isLoadingSubjects, refetch: refetchSubjects } = useSubjects();
  const { data: batchHistory, refetch: refetchHistory } = useBatchHistory(searchedHistoryStudentId);

  // Mutations
  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const batchChangeMutation = useBatchChange();
  const syncIdsMutation = useSyncIds();
  const deleteAdmissionMutation = useDeleteAdmission();
  const deleteDuplicateMutation = useDeleteDuplicate();
  
  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();
  const deleteBatchMutation = useDeleteBatch();
  
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  // Helper: check if class is 4, 5, 6
  const isClassFourFiveSix = (classVal: string) => {
    const studentClass = (classVal || '').toString().trim().toLowerCase();
    return /(^|[^a-z0-9])(4|5|6|four|five|six)([^a-z0-9]|$)/i.test(studentClass);
  };

  // Helper: Auto generate subject code
  const handleSubjectNameChange = (val: string) => {
    setNewSubjectName(val);
    if (!val) {
      setNewSubjectCode('');
      return;
    }
    const words = val.split(' ');
    let code = '';
    if (words.length === 1) {
      code = val.substring(0, 3).toUpperCase();
    } else {
      words.forEach(word => {
        if (word.length > 0) code += word[0].toUpperCase();
      });
    }
    if (code.length < 3) {
      code += val.substring(1, 4 - code.length).toUpperCase();
    }
    setNewSubjectCode(code);
  };

  const handleEnrollSubmit = () => {
    if (!selectedAdmission || !selectedEnrollBatch) return;

    const requiresLanguage = isClassFourFiveSix(selectedAdmission.class);
    if (requiresLanguage && !selectedEnrollLanguage) {
      showToast('Additional language is required for Class 4, 5, or 6 students', true);
      return;
    }

    createStudentMutation.mutate(
      {
        studentId: selectedAdmission.studentId,
        studentName: selectedAdmission.studentName,
        startSession: selectedAdmission.startSession,
        endSession: selectedAdmission.endSession,
        dateOfApplication: selectedAdmission.dateOfApplication,
        fatherName: selectedAdmission.fatherName,
        dob: selectedAdmission.dob,
        mobileNumbers: selectedAdmission.mobileNumbers,
        email: selectedAdmission.email,
        motherName: selectedAdmission.motherName,
        category: selectedAdmission.category,
        fatherOccupation: selectedAdmission.fatherOccupation,
        defenceService: selectedAdmission.defenceService,
        jobDescription: selectedAdmission.jobDescription,
        class: selectedAdmission.class,
        presentSchool: selectedAdmission.presentSchool,
        program: selectedAdmission.program,
        batchId: selectedEnrollBatch,
        additionalLanguage: selectedEnrollLanguage || undefined,
      },
      {
        onSuccess: () => {
          showToast('Student enrolled successfully!');
          deleteAdmissionMutation.mutate(selectedAdmission.id);
          setSelectedAdmission(null);
          setSelectedEnrollBatch('');
          setSelectedEnrollLanguage('');
          refetchNew();
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error enrolling student', true);
        },
      }
    );
  };

  const handleBatchChangeSubmit = () => {
    if (!changeBatchStudentId || !changeBatchTargetId) return;

    batchChangeMutation.mutate(
      { studentId: changeBatchStudentId, newBatchId: changeBatchTargetId },
      {
        onSuccess: (res) => {
          showToast(res?.message || 'Batch changed successfully!');
          setChangeBatchStudentId('');
          setChangeBatchTargetId('');
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error changing batch', true);
        },
      }
    );
  };

  const handleActiveStudentEditSave = () => {
    if (!selectedStudent) return;
    updateStudentMutation.mutate(
      { id: selectedStudent.id, data: editFormValues },
      {
        onSuccess: (updated) => {
          showToast('Student details updated successfully!');
          setIsEditModalOpen(false);
          setSelectedStudent(updated);
          refetchActive();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error updating student', true);
        },
      }
    );
  };

  const handleCancelEnrollment = (id: string) => {
    if (confirm('Are you sure you want to cancel this student\'s enrollment?')) {
      deleteStudentMutation.mutate(id, {
        onSuccess: () => {
          showToast('Student enrollment cancelled successfully');
          setSelectedStudent(null);
          refetchActive();
        },
      });
    }
  };

  const handleSyncIds = () => {
    syncIdsMutation.mutate(undefined, {
      onSuccess: (res: any) => {
        showToast(res?.message || 'IDs synced successfully!');
        refetchSync();
      },
    });
  };

  const handleCreateSubject = () => {
    if (!newSubjectName || !newSubjectCode) return;
    createSubjectMutation.mutate(
      { name: newSubjectName, code: newSubjectCode },
      {
        onSuccess: () => {
          showToast('Subject created successfully!');
          setNewSubjectName('');
          setNewSubjectCode('');
          refetchSubjects();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error creating subject', true);
        },
      }
    );
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete subject "${name}"?`)) {
      deleteSubjectMutation.mutate(id, {
        onSuccess: () => {
          showToast('Subject deleted successfully');
          refetchSubjects();
        },
      });
    }
  };

  const handleCreateBatch = () => {
    if (!newBatchName || newBatchSubjects.length === 0) return;
    createBatchMutation.mutate(
      {
        name: newBatchName,
        classRoom: newBatchRoom || undefined,
        subjects: newBatchSubjects,
      },
      {
        onSuccess: () => {
          showToast('Batch created successfully!');
          setNewBatchName('');
          setNewBatchRoom('');
          setNewBatchSubjects([]);
          setNewBatchStep(1);
          setBatchAction('list');
          refetchBatches();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error creating batch', true);
        },
      }
    );
  };

  const handleEditBatchSelect = (id: string) => {
    setSelectedEditBatchId(id);
    const target = batches?.find((b: any) => b.id === id);
    if (target) {
      setEditBatchName(target.name);
      setEditBatchRoom(target.classRoom || '');
      setEditBatchSubjects(target.subjects?.map((s: any) => s.id) || []);
    }
  };

  const handleSaveEditBatch = () => {
    if (!selectedEditBatchId || !editBatchName) return;
    updateBatchMutation.mutate(
      {
        id: selectedEditBatchId,
        data: {
          name: editBatchName,
          classRoom: editBatchRoom || undefined,
          subjects: editBatchSubjects,
        },
      },
      {
        onSuccess: () => {
          showToast('Batch updated successfully!');
          setSelectedEditBatchId('');
          setEditBatchName('');
          setEditBatchRoom('');
          setEditBatchSubjects([]);
          setBatchAction('list');
          refetchBatches();
        },
        onError: (err: any) => {
          showToast(err?.response?.data?.message || 'Error updating batch', true);
        },
      }
    );
  };

  const handleDeleteBatch = () => {
    if (!selectedDeleteBatchId) return;
    const target = batches?.find((b: any) => b.id === selectedDeleteBatchId);
    if (!target) return;

    if (confirm(`Are you sure you want to delete batch "${target.name}"?`)) {
      deleteBatchMutation.mutate(
        {
          id: selectedDeleteBatchId,
          action: deleteBatchAction,
          targetBatchId: deleteBatchAction === 'shift_students' ? deleteBatchTargetId : undefined,
        },
        {
          onSuccess: (res: any) => {
            showToast(res?.message || 'Batch deleted successfully!');
            setSelectedDeleteBatchId('');
            setDeleteBatchTargetId('');
            setBatchAction('list');
            refetchBatches();
            refetchActive();
          },
          onError: (err: any) => {
            showToast(err?.response?.data?.message || 'Error deleting batch', true);
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <div className="max-w-7xl mx-auto bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 md:p-8">
        
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center p-4 rounded-xl shadow-xl transition-all duration-300 ${
            toast.isError ? 'bg-rose-500/90 border border-rose-400 text-white' : 'bg-emerald-500/90 border border-emerald-400 text-white'
          }`}>
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-700/60 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
              Academic Manager ERP
            </h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">
              High Performance Dual-Database Academic Management
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Sub-Dashboard Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {[
            { id: 'students-manage', name: 'Dashboard Home', color: 'from-slate-600 to-slate-700' },
            { id: 'enroll', name: 'Enroll Students', color: 'from-blue-600 to-blue-700' },
            { id: 'active', name: 'Active Students', color: 'from-emerald-600 to-emerald-700' },
            { id: 'change-batch', name: 'Change Batch', color: 'from-indigo-600 to-indigo-700' },
            { id: 'sync-ids', name: 'Sync Student IDs', color: 'from-amber-600 to-amber-700' },
            { id: 'db-duplicates', name: 'Duplicate Check', color: 'from-rose-600 to-rose-700' },
            { id: 'batch-manage', name: 'Batch Manage', color: 'from-purple-600 to-purple-700' },
            { id: 'add-subject', name: 'Subject Manage', color: 'from-cyan-600 to-cyan-700' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id);
                setSelectedStudent(null);
                setSelectedAdmission(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition transform hover:scale-[1.02] shadow-md ${
                activeSection === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-900`
                  : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600/60 text-slate-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Container */}
        <div className="bg-slate-850 border border-slate-700/50 rounded-2xl p-6 min-h-[400px]">

          {/* ==================== 0. DASHBOARD HOME ==================== */}
          {activeSection === 'students-manage' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-200">ERP Analytics Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700/60 shadow-lg hover:border-slate-600 transition">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Active Students</div>
                  <div className="text-4xl font-extrabold text-slate-100 mt-2">{activeStudents?.meta?.total ?? 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Currently enrolled in batch sessions</p>
                </div>

                <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700/60 shadow-lg hover:border-slate-600 transition">
                  <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Pending Admissions</div>
                  <div className="text-4xl font-extrabold text-slate-100 mt-2">{newStudents?.length ?? 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Awaiting verification & batch allocation</p>
                </div>

                <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700/60 shadow-lg hover:border-slate-600 transition">
                  <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Batches Configured</div>
                  <div className="text-4xl font-extrabold text-slate-100 mt-2">{batches?.length ?? 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Active class schedules and rooms</p>
                </div>

              </div>

              {/* Sync pipeline status */}
              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-700/60 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-bold text-slate-200">Google Sheets Sync Engine</h3>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <div className="text-sm font-semibold text-slate-400">PostgreSQL Status</div>
                    <div className="text-xs text-emerald-400 font-bold mt-1">Connected</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <div className="text-sm font-semibold text-slate-400">Queue Engine</div>
                    <div className="text-xs text-indigo-400 font-bold mt-1">BullMQ Queueing</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <div className="text-sm font-semibold text-slate-400">Google API</div>
                    <div className="text-xs text-amber-400 font-bold mt-1">Always-on Sync</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl">
                    <div className="text-sm font-semibold text-slate-400">Conflict Checks</div>
                    <div className="text-xs text-cyan-400 font-bold mt-1">Automatic</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 1. ENROLL STUDENTS ==================== */}
          {activeSection === 'enroll' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Admissions List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-200">New Admissions List</h3>
                  <button
                    onClick={() => refetchNew()}
                    className="bg-slate-700 hover:bg-slate-650 text-slate-200 border border-slate-600 text-xs px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingNew && (
                  <div className="text-center py-12 text-slate-400 text-sm">Loading admissions list...</div>
                )}

                {!isLoadingNew && (!newStudents || newStudents.length === 0) && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-sm">
                    No new students to enroll.
                  </div>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {newStudents?.map((student: any, idx: number) => {
                    const isDuplicate = student.status === 'possible_duplicate';
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedAdmission(student.fullData)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          selectedAdmission?.id === student.admissionRowNumber
                            ? 'border-blue-500 bg-blue-500/10'
                            : isDuplicate
                            ? 'border-amber-600/50 bg-amber-500/5 hover:bg-amber-500/10'
                            : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-100">{student.studentName}</div>
                            <div className="text-xs text-slate-400 mt-1">Student ID: {student.studentId}</div>
                            
                            {isDuplicate && (
                              <div className="mt-2 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded inline-block">
                                Possible Duplicate of: {student.duplicateOfName} ({student.duplicateOfId})
                              </div>
                            )}
                          </div>
                          
                          {isDuplicate ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAdmission(student.fullData);
                                  setSelectedEnrollBatch('');
                                  setSelectedEnrollLanguage('');
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1 rounded font-bold transition"
                              >
                                Enroll Anyway
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this duplicate entry from Admissions and database?')) {
                                    deleteDuplicateMutation.mutate(
                                      { id: student.admissionRowNumber, studentId: student.duplicateOfId },
                                      {
                                        onSuccess: (res: any) => {
                                          showToast(res.message);
                                          refetchNew();
                                        },
                                      }
                                    );
                                  }
                                }}
                                className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-2.5 py-1 rounded font-bold transition"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-blue-400 font-medium">Click to prefill</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Enrollment Prefilled Form */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700/60 pb-3">
                  Enrollment Form
                </h3>

                {!selectedAdmission ? (
                  <div className="text-center py-20 text-slate-500 text-sm">
                    Select a student from the list to prefill this form.
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* Prefilled Fields Preview */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-850 p-4 rounded-xl border border-slate-700 text-xs text-slate-300">
                      <div><strong>Student Name:</strong> {selectedAdmission.studentName}</div>
                      <div><strong>Student ID:</strong> {selectedAdmission.studentId}</div>
                      <div><strong>Class:</strong> {selectedAdmission.class}</div>
                      <div><strong>Program:</strong> {selectedAdmission.program || 'N/A'}</div>
                      <div><strong>Father's Name:</strong> {selectedAdmission.fatherName}</div>
                      <div><strong>DOB:</strong> {selectedAdmission.dob ? selectedAdmission.dob.split('T')[0] : 'N/A'}</div>
                      <div><strong>Mobile:</strong> {selectedAdmission.mobileNumbers}</div>
                      <div><strong>Email:</strong> {selectedAdmission.email || 'N/A'}</div>
                    </div>

                    {/* Batch Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Select Target Batch *
                      </label>
                      <select
                        value={selectedEnrollBatch}
                        onChange={(e) => setSelectedEnrollBatch(e.target.value)}
                        className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Batch</option>
                        {batches?.map((b: any) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Language Selection (Class 4, 5, 6 only) */}
                    {isClassFourFiveSix(selectedAdmission.class) && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Additional Language *
                        </label>
                        <select
                          value={selectedEnrollLanguage}
                          onChange={(e) => setSelectedEnrollLanguage(e.target.value)}
                          className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Language</option>
                          <option value="Hindi">Hindi</option>
                          <option value="English">English</option>
                        </select>
                        <p className="text-[11px] text-amber-400 mt-1">Required for students in Class 4, 5, or 6.</p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/60">
                      <button
                        onClick={() => {
                          setSelectedAdmission(null);
                          setSelectedEnrollBatch('');
                          setSelectedEnrollLanguage('');
                        }}
                        className="bg-slate-700 hover:bg-slate-650 text-slate-300 text-sm px-5 py-2.5 rounded-xl font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEnrollSubmit}
                        disabled={!selectedEnrollBatch || (isClassFourFiveSix(selectedAdmission.class) && !selectedEnrollLanguage)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Enrollment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. ACTIVE STUDENTS ==================== */}
          {activeSection === 'active' && (
            <div className="space-y-6">
              
              {/* Batch wise filters */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Batch-Wise Filters</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveBatchFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeBatchFilter === ''
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-650'
                    }`}
                  >
                    All ({activeStudents?.data?.length ?? 0})
                  </button>
                  {batches?.map((b: any) => {
                    const studentCountInBatch = activeStudents?.data?.filter((s: any) => s.batchName === b.name).length ?? 0;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setActiveBatchFilter(b.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          activeBatchFilter === b.name
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-650'
                        }`}
                      >
                        {b.name} ({studentCountInBatch})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid: List on left, Details on right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left panel: List */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search active students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => refetchActive()}
                      className="bg-slate-700 hover:bg-slate-650 text-slate-200 border border-slate-600 px-3.5 rounded-xl text-sm transition"
                    >
                      Refresh
                    </button>
                  </div>

                  {isLoadingActive && (
                    <div className="text-center py-10 text-slate-400 text-sm">Loading active students...</div>
                  )}

                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-2">
                    {activeStudents?.data
                      ?.filter((s: any) => {
                        if (activeBatchFilter && s.batchName !== activeBatchFilter) return false;
                        if (search) {
                          const query = search.toLowerCase();
                          return (
                            s.studentName.toLowerCase().includes(query) ||
                            s.studentId.toLowerCase().includes(query) ||
                            s.fatherName?.toLowerCase().includes(query)
                          );
                        }
                        return true;
                      })
                      ?.map((student: any) => (
                        <div
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition ${
                            selectedStudent?.id === student.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800'
                          }`}
                        >
                          <div className="font-bold text-slate-100 text-sm">{student.studentName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">ID: {student.studentId} | Class: {student.class || 'N/A'}</div>
                          <div className="text-[11px] text-emerald-400 font-semibold mt-1">Batch: {student.batchName || 'Unassigned'}</div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Right panel: Details sidebar */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                  {!selectedStudent ? (
                    <div className="text-center py-24 text-slate-500 text-sm">
                      Select a student to view details.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                        <h3 className="text-lg font-bold text-slate-200">{selectedStudent.studentName}</h3>
                        <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-md font-bold">
                          {selectedStudent.status}
                        </span>
                      </div>

                      {/* Detail Fields grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300 max-h-[350px] overflow-y-auto pr-2">
                        {[
                          { label: 'Student ID', value: selectedStudent.studentId },
                          { label: 'Start Session', value: selectedStudent.startSession },
                          { label: 'End Session', value: selectedStudent.endSession },
                          { label: 'Date of Application', value: selectedStudent.dateOfApplication ? selectedStudent.dateOfApplication.split('T')[0] : 'N/A' },
                          { label: "Father's Name", value: selectedStudent.fatherName },
                          { label: 'DOB', value: selectedStudent.dob },
                          { label: 'Mobile Numbers', value: selectedStudent.mobileNumbers },
                          { label: 'Email', value: selectedStudent.email },
                          { label: "Mother's Name", value: selectedStudent.motherName },
                          { label: 'Category', value: selectedStudent.category },
                          { label: "Father's Occupation", value: selectedStudent.fatherOccupation },
                          { label: 'Defence Service', value: selectedStudent.defenceService },
                          { label: 'Class', value: selectedStudent.class },
                          { label: 'Present School', value: selectedStudent.presentSchool },
                          { label: 'Program', value: selectedStudent.program },
                          { label: 'Batch Assigned', value: selectedStudent.batchName },
                          { label: 'Additional Language', value: selectedStudent.additionalLanguage },
                          { label: 'Job Description', value: selectedStudent.jobDescription },
                        ].map((item, idx) => (
                          <div key={idx} className="py-2 border-b border-slate-700/40">
                            <span className="font-semibold text-slate-400 text-xs block uppercase tracking-wider">{item.label}</span>
                            <span className="mt-0.5 block">{item.value || 'N/A'}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700/60 justify-end">
                        <button
                          onClick={() => {
                            setEditFormValues({ ...selectedStudent });
                            setIsEditModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition"
                        >
                          Edit Student Details
                        </button>
                        <button
                          onClick={() => handleCancelEnrollment(selectedStudent.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition"
                        >
                          Cancel Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ==================== 3. CHANGE BATCH ==================== */}
          {activeSection === 'change-batch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form Section */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700/60 pb-3">
                  Change Student Batch
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Student ID or System ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ID-1234 or alphanumeric ID"
                      value={changeBatchStudentId}
                      onChange={(e) => setChangeBatchStudentId(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Select Target Batch
                    </label>
                    <select
                      value={changeBatchTargetId}
                      onChange={(e) => setChangeBatchTargetId(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Batch</option>
                      {batches?.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleBatchChangeSubmit}
                    disabled={!changeBatchStudentId || !changeBatchTargetId}
                    className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                  >
                    Update Batch Assignment
                  </button>
                </div>
              </div>

              {/* History Section */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700/60 pb-3">
                  Batch Change History Log
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search Student ID to see history..."
                      value={historyStudentId}
                      onChange={(e) => setHistoryStudentId(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => setSearchedHistoryStudentId(historyStudentId)}
                      className="bg-slate-700 hover:bg-slate-650 border border-slate-600 text-slate-200 px-4 rounded-xl text-sm font-bold transition"
                    >
                      Search
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {!searchedHistoryStudentId && (
                      <div className="text-center py-10 text-slate-500 text-sm">Enter student ID and click search.</div>
                    )}
                    {searchedHistoryStudentId && (!batchHistory || batchHistory.length === 0) && (
                      <div className="text-center py-10 text-slate-500 text-sm">No batch shift logs found for this student.</div>
                    )}
                    {batchHistory?.map((log: any) => (
                      <div key={log.id} className="p-3 bg-slate-850 border border-slate-700 rounded-xl text-xs space-y-1 text-slate-300">
                        <div><strong>Student:</strong> {log.studentName} ({log.studentId})</div>
                        <div className="flex justify-between mt-1 text-slate-400">
                          <div><strong>From:</strong> {log.previousBatch || 'Admission'}</div>
                          <div><strong>To:</strong> {log.newBatch}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                          Shifted on: {new Date(log.dateOfChange).toLocaleString()} by {log.changedBy?.name || 'Admin'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== 4. SYNC STUDENT IDS ==================== */}
          {activeSection === 'sync-ids' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Database & Admissions Sync Checks</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Compiles mismatching student IDs between admissions applications and the students database records.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => refetchSync()}
                    className="bg-slate-700 hover:bg-slate-650 border border-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Check Mismatches
                  </button>
                  <button
                    onClick={handleSyncIds}
                    disabled={!syncPreview?.mismatches || syncPreview.mismatches.length === 0}
                    className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                  >
                    Sync Now
                  </button>
                </div>
              </div>

              {/* Statistics panels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Admissions</div>
                  <div className="text-2xl font-bold mt-1">{syncPreview?.admissionsCount ?? 0}</div>
                </div>
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Database Records</div>
                  <div className="text-2xl font-bold mt-1">{syncPreview?.databaseCount ?? 0}</div>
                </div>
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Exact Matches</div>
                  <div className="text-2xl font-bold mt-1">{syncPreview?.totalMatches ?? 0}</div>
                </div>
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mismatches Found</div>
                  <div className="text-2xl font-bold mt-1 text-amber-500">{syncPreview?.totalMismatches ?? 0}</div>
                </div>
              </div>

              {/* Mismatches List */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-200 mb-3 text-sm uppercase tracking-wider">Mismatching Details list</h4>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {isLoadingSync && (
                    <div className="text-center py-10 text-slate-400 text-sm">Checking database...</div>
                  )}
                  {!isLoadingSync && (!syncPreview?.mismatches || syncPreview.mismatches.length === 0) && (
                    <div className="text-center py-10 border border-dashed border-slate-700 text-slate-500 text-sm rounded-xl">
                      No mismatched student IDs detected. All student records are aligned.
                    </div>
                  )}
                  {syncPreview?.mismatches?.map((item: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-850 border border-slate-700 rounded-xl text-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{item.studentName}</div>
                        <div className="text-slate-400 mt-1">Class: {item.class} | DOB: {item.dob}</div>
                      </div>
                      <div className="space-y-1">
                        <div><strong className="text-slate-500">Admissions ID:</strong> <span className="text-amber-400">{item.admissionId}</span></div>
                        <div><strong className="text-slate-500">Database ID:</strong> <span className="text-slate-300">{item.databaseId}</span></div>
                      </div>
                      <div className="text-right text-slate-500">
                        Match Score: {item.matchedFields} fields | Type: {item.matchType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. DUPLICATE CHECK ==================== */}
          {activeSection === 'db-duplicates' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Database Integrity Duplicate Check</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Searches for exact matching row groups in the active database. Matches on Name, Father's Name, DOB, Category, Phone and email.
                  </p>
                </div>
                <button
                  onClick={() => refetchDupes()}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md"
                >
                  Check Exact Duplicates
                </button>
              </div>

              {/* Statistics panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Database Rows</div>
                  <div className="text-2xl font-bold mt-1">{duplicates?.totalRows ?? 0}</div>
                </div>
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duplicate Groups</div>
                  <div className="text-2xl font-bold mt-1 text-rose-500">{duplicates?.totalDuplicateGroups ?? 0}</div>
                </div>
                <div className="bg-slate-850 border border-slate-700/60 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Duplicate Rows Count</div>
                  <div className="text-2xl font-bold mt-1 text-rose-400">{duplicates?.totalDuplicateRows ?? 0}</div>
                </div>
              </div>

              {/* Duplicates List */}
              <div className="space-y-4">
                {isLoadingDupes && (
                  <div className="text-center py-10 text-slate-400 text-sm">Searching for duplicate records...</div>
                )}
                {!isLoadingDupes && (!duplicates?.groups || duplicates.groups.length === 0) && (
                  <div className="text-center py-10 border border-dashed border-slate-700 text-slate-500 text-sm rounded-xl">
                    No duplicate records found. Database integrity is clean.
                  </div>
                )}
                {duplicates?.groups?.map((group: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/30 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-700/50 pb-2">
                      Group {idx + 1} (Duplicate Count: {group.count})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.rows?.map((row: any, rowIdx: number) => (
                        <div key={rowIdx} className="p-4 bg-slate-850 border border-slate-700 rounded-xl relative">
                          <div className="text-sm font-bold text-slate-200">{row.studentName}</div>
                          <div className="text-xs text-slate-400 mt-1">ID: {row.studentId} | Class: {row.class}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Father: {row.fatherName} | Mother: {row.motherName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Mobile: {row.mobile} | DOB: {row.dob ? row.dob.split('T')[0] : 'N/A'}</div>
                          
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete this row for ${row.studentName}?`)) {
                                deleteStudentMutation.mutate(row.rowNumber, {
                                  onSuccess: () => {
                                    showToast('Duplicate row deleted successfully');
                                    refetchDupes();
                                    refetchActive();
                                  },
                                });
                              }
                            }}
                            className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded font-bold transition"
                          >
                            Delete Row
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ==================== 6. BATCH MANAGE ==================== */}
          {activeSection === 'batch-manage' && (
            <div className="space-y-6">
              
              {/* Batch Action Buttons */}
              <div className="flex flex-wrap gap-2.5 border-b border-slate-700/60 pb-4 mb-4">
                {[
                  { action: 'list', name: 'Batches Configuration list' },
                  { action: 'add', name: 'Create New Batch' },
                  { action: 'edit', name: 'Edit Batch Details' },
                  { action: 'delete', name: 'Delete Batch' },
                ].map((item) => (
                  <button
                    key={item.action}
                    onClick={() => {
                      setBatchAction(item.action);
                      setSelectedEditBatchId('');
                      setSelectedDeleteBatchId('');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                      batchAction === item.action
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-650'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* 6.1 List batches */}
              {batchAction === 'list' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Batch Name</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Mapped Subjects</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Class Room</th>
                        <th className="text-left py-3 px-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Students Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches?.map((b: any) => (
                        <tr key={b.id} className="border-b border-slate-700/40 hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3 font-bold text-slate-200">{b.name}</td>
                          <td className="py-3 px-3 text-xs text-slate-400">{b.subjectsCsv || 'No subjects mapped'}</td>
                          <td className="py-3 px-3">{b.classRoom || 'N/A'}</td>
                          <td className="py-3 px-3">
                            <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-semibold">
                              {b.studentCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6.2 Add Batch Wizard */}
              {batchAction === 'add' && (
                <div className="bg-slate-800/45 p-6 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center gap-1.5">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          newBatchStep === step ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {step}
                        </div>
                        <span className={`text-xs font-bold ${newBatchStep === step ? 'text-purple-400' : 'text-slate-500'}`}>
                          {step === 1 ? 'Batch Name' : step === 2 ? 'Subjects' : 'Classroom'}
                        </span>
                        {step < 3 && <span className="text-slate-600">/</span>}
                      </div>
                    ))}
                  </div>

                  {newBatchStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Batch Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Science Batch-A"
                          value={newBatchName}
                          onChange={(e) => setNewBatchName(e.target.value)}
                          className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <button
                        onClick={() => setNewBatchStep(2)}
                        disabled={!newBatchName}
                        className="bg-purple-600 hover:bg-purple-550 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition disabled:opacity-50"
                      >
                        Next: Choose Subjects
                      </button>
                    </div>
                  )}

                  {newBatchStep === 2 && (
                    <div className="space-y-4">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Select Subjects (Multiple Select)
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-700 p-3 rounded-xl bg-slate-850">
                        {subjects?.map((s: any) => (
                          <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer py-1">
                            <input
                              type="checkbox"
                              checked={newBatchSubjects.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewBatchSubjects([...newBatchSubjects, s.id]);
                                } else {
                                  setNewBatchSubjects(newBatchSubjects.filter(id => id !== s.id));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                            />
                            <span>{s.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewBatchStep(1)}
                          className="bg-slate-700 hover:bg-slate-650 text-slate-300 font-bold py-2 px-4 rounded-xl text-sm transition"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setNewBatchStep(3)}
                          disabled={newBatchSubjects.length === 0}
                          className="bg-purple-600 hover:bg-purple-550 text-white font-bold py-2 px-5 rounded-xl text-sm transition disabled:opacity-50"
                        >
                          Next: Room details
                        </button>
                      </div>
                    </div>
                  )}

                  {newBatchStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Classroom / Room Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Room-101 (optional)"
                          value={newBatchRoom}
                          onChange={(e) => setNewBatchRoom(e.target.value)}
                          className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewBatchStep(2)}
                          className="bg-slate-700 hover:bg-slate-650 text-slate-300 font-bold py-2 px-4 rounded-xl text-sm transition"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCreateBatch}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-xl text-sm transition"
                        >
                          Save Batch Configuration
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6.3 Edit Batch details */}
              {batchAction === 'edit' && (
                <div className="bg-slate-800/45 p-6 rounded-2xl border border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Select Batch to Edit
                    </label>
                    <select
                      value={selectedEditBatchId}
                      onChange={(e) => handleEditBatchSelect(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Batch</option>
                      {batches?.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedEditBatchId && (
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Batch Name
                          </label>
                          <input
                            type="text"
                            value={editBatchName}
                            onChange={(e) => setEditBatchName(e.target.value)}
                            className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Classroom / Room Number
                          </label>
                          <input
                            type="text"
                            value={editBatchRoom}
                            onChange={(e) => setEditBatchRoom(e.target.value)}
                            className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Edit Subjects Mapping
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-700 p-3 rounded-xl bg-slate-850">
                          {subjects?.map((s: any) => (
                            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={editBatchSubjects.includes(s.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditBatchSubjects([...editBatchSubjects, s.id]);
                                  } else {
                                    setEditBatchSubjects(editBatchSubjects.filter(id => id !== s.id));
                                  }
                                }}
                                className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                              />
                              <span>{s.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => {
                            setSelectedEditBatchId('');
                            setBatchAction('list');
                          }}
                          className="bg-slate-700 hover:bg-slate-650 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditBatch}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6.4 Delete Batch */}
              {batchAction === 'delete' && (
                <div className="bg-slate-800/45 p-6 rounded-2xl border border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Select Batch to Delete
                    </label>
                    <select
                      value={selectedDeleteBatchId}
                      onChange={(e) => setSelectedDeleteBatchId(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select Batch</option>
                      {batches?.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedDeleteBatchId && (
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                      {/* Student Impact Warn */}
                      {(() => {
                        const target = batches?.find((b: any) => b.id === selectedDeleteBatchId);
                        const count = target?.studentCount ?? 0;
                        return (
                          <>
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs md:text-sm">
                              <strong>Impact Warn:</strong> This batch currently has <strong>{count}</strong> enrolled active students.
                            </div>

                            {count > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Affected Students Action
                                  </label>
                                  <select
                                    value={deleteBatchAction}
                                    onChange={(e) => setDeleteBatchAction(e.target.value)}
                                    className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  >
                                    <option value="shift_students">Shift Students to Another Batch</option>
                                    <option value="delete_students">Delete/Cancel Students (Soft Delete)</option>
                                  </select>
                                </div>

                                {deleteBatchAction === 'shift_students' && (
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                      Select Target Batch for Shifting
                                    </label>
                                    <select
                                      value={deleteBatchTargetId}
                                      onChange={(e) => setDeleteBatchTargetId(e.target.value)}
                                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                      <option value="">Select Target Batch</option>
                                      {batches
                                        ?.filter((b: any) => b.id !== selectedDeleteBatchId)
                                        ?.map((b: any) => (
                                          <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => {
                            setSelectedDeleteBatchId('');
                            setBatchAction('list');
                          }}
                          className="bg-slate-700 hover:bg-slate-650 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-sm transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteBatch}
                          disabled={
                            deleteBatchAction === 'shift_students' &&
                            (batches?.find((b: any) => b.id === selectedDeleteBatchId)?.studentCount ?? 0) > 0 &&
                            !deleteBatchTargetId
                          }
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition disabled:opacity-50"
                        >
                          Confirm & Delete Batch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== 7. SUBJECT MANAGE ==================== */}
          {activeSection === 'add-subject' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form Section */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl h-fit">
                <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700/60 pb-3">
                  Add New Subject
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mathematics"
                      value={newSubjectName}
                      onChange={(e) => handleSubjectNameChange(e.target.value)}
                      className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Subject Code (Auto-Generated)
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Will auto-generate"
                      value={newSubjectCode}
                      className="bg-slate-800 border border-slate-700 text-slate-400 rounded-xl px-4 py-3 text-sm w-full focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateSubject}
                    disabled={!newSubjectName || !newSubjectCode}
                    className="w-full bg-cyan-600 hover:bg-cyan-550 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50"
                  >
                    Save Subject
                  </button>
                </div>
              </div>

              {/* Subjects List */}
              <div className="bg-slate-800/40 border border-slate-700 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4 border-b border-slate-700/60 pb-3">
                  <h3 className="text-lg font-bold text-slate-200">Saved Subjects List</h3>
                  <button
                    onClick={() => refetchSubjects()}
                    className="bg-slate-700 hover:bg-slate-650 text-slate-200 border border-slate-600 text-xs px-3 py-1.5 rounded-lg font-bold transition"
                  >
                    Refresh
                  </button>
                </div>

                {isLoadingSubjects && (
                  <div className="text-center py-10 text-slate-400 text-sm">Loading subjects...</div>
                )}

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {!isLoadingSubjects && (!subjects || subjects.length === 0) && (
                    <div className="text-center py-10 text-slate-500 text-sm">No subjects found.</div>
                  )}
                  {subjects?.map((subject: any) => (
                    <div key={subject.id} className="p-3 bg-slate-850 border border-slate-700 rounded-xl flex justify-between items-center text-sm">
                      <div>
                        <div className="font-bold text-slate-200">{subject.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Code: {subject.code}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ==================== EDIT STUDENT MODAL ==================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-750 p-6 rounded-2xl max-w-4xl w-full shadow-2xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
            <div className="flex justify-between items-center border-b border-slate-700 pb-3 mb-5">
              <h3 className="text-lg font-bold text-slate-200">Edit Student Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'studentName', label: 'Student Name' },
                { key: 'fatherName', label: 'Father\'s Name' },
                { key: 'motherName', label: 'Mother\'s Name' },
                { key: 'mobileNumbers', label: 'Mobile Numbers' },
                { key: 'email', label: 'Email' },
                { key: 'class', label: 'Class' },
                { key: 'program', label: 'Program' },
                { key: 'startSession', label: 'Start Session' },
                { key: 'endSession', label: 'End Session' },
                { key: 'category', label: 'Category' },
                { key: 'fatherOccupation', label: 'Father\'s Occupation' },
                { key: 'defenceService', label: 'Defence Service' },
                { key: 'presentSchool', label: 'Present School' },
                { key: 'dob', label: 'DOB (YYYY-MM-DD)' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={editFormValues[field.key] || ''}
                    onChange={(e) => setEditFormValues({ ...editFormValues, [field.key]: e.target.value })}
                    className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              
              {/* Batch selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Batch Assigned
                </label>
                <select
                  value={editFormValues.batchId || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, batchId: e.target.value })}
                  className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Batch</option>
                  {batches?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Additional Language selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Additional Language
                </label>
                <select
                  value={editFormValues.additionalLanguage || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, additionalLanguage: e.target.value })}
                  className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl block w-full p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Language</option>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                </select>
              </div>

              {/* Job Description (Full width) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Job Description
                </label>
                <textarea
                  rows={2}
                  value={editFormValues.jobDescription || ''}
                  onChange={(e) => setEditFormValues({ ...editFormValues, jobDescription: e.target.value })}
                  className="bg-slate-850 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 border-t border-slate-755 pt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-slate-700 hover:bg-slate-650 text-slate-350 text-xs md:text-sm px-5 py-2.5 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleActiveStudentEditSave}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm px-6 py-2.5 rounded-xl font-bold transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}