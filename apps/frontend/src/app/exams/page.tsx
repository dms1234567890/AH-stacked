'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useExamTypes,
  useSaveExamType,
  useDeleteExamType,
  useBootstrapExams,
  useSubjects,
} from '@/lib/hooks';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Pencil,
  Sparkles,
  Layers,
  ArrowLeft,
  ChevronRight,
  Database,
  Flame,
} from 'lucide-react';

interface SubjectMark {
  subject: string;
  maxMarks: number;
}

export default function ExamsPage() {
  const { user, loading: authLoading } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Form State
  const [examId, setExamId] = useState<string>('');
  const [examName, setExamName] = useState<string>('');
  const [mainSubjects, setMainSubjects] = useState<Array<{ subject: string; maxMarks: string }>>([
    { subject: '', maxMarks: '' }
  ]);
  const [hasOptional, setHasOptional] = useState<boolean>(false);
  const [optionalSubjects, setOptionalSubjects] = useState<Array<{ subject: string; maxMarks: string }>>([]);
  
  // Confirm Delete State
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  // API Queries & Mutations
  const { data: exams = [], isLoading: isExamsLoading, refetch: refetchExams } = useExamTypes();
  const { data: subjects = [] } = useSubjects();
  
  const saveMutation = useSaveExamType();
  const deleteMutation = useDeleteExamType();
  const bootstrapMutation = useBootstrapExams();

  const OPTIONAL_SUFFIX = ' (OPTIONAL)';

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setExamId('');
    setExamName('');
    setMainSubjects([{ subject: '', maxMarks: '' }]);
    setHasOptional(false);
    setOptionalSubjects([]);
  };

  const handleEdit = (exam: any) => {
    setExamId(exam.id);
    setExamName(exam.name);
    
    // Parse subjects details
    let subjectsList: SubjectMark[] = [];
    if (Array.isArray(exam.subjectsWithMarks)) {
      subjectsList = exam.subjectsWithMarks;
    } else {
      try {
        subjectsList = typeof exam.subjectsWithMarks === 'string' 
          ? JSON.parse(exam.subjectsWithMarks)
          : (exam.subjectsWithMarks as any) || [];
      } catch {
        subjectsList = [];
      }
    }

    const mainList: Array<{ subject: string; maxMarks: string }> = [];
    const optList: Array<{ subject: string; maxMarks: string }> = [];

    subjectsList.forEach((item) => {
      const isOpt = item.subject && item.subject.includes('(OPTIONAL)');
      const cleanSub = item.subject ? item.subject.replace('(OPTIONAL)', '').trim() : '';
      const marksVal = String(item.maxMarks || '');

      if (isOpt) {
        optList.push({ subject: cleanSub, maxMarks: marksVal });
      } else {
        mainList.push({ subject: cleanSub, maxMarks: marksVal });
      }
    });

    setMainSubjects(mainList.length > 0 ? mainList : [{ subject: '', maxMarks: '' }]);
    if (optList.length > 0) {
      setHasOptional(true);
      setOptionalSubjects(optList);
    } else {
      setHasOptional(false);
      setOptionalSubjects([]);
    }

    showToast('Editing exam type: ' + exam.name, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddMainRow = () => {
    setMainSubjects([...mainSubjects, { subject: '', maxMarks: '' }]);
  };

  const handleRemoveMainRow = (index: number) => {
    const updated = [...mainSubjects];
    updated.splice(index, 1);
    setMainSubjects(updated.length > 0 ? updated : [{ subject: '', maxMarks: '' }]);
  };

  const handleMainRowChange = (index: number, field: 'subject' | 'maxMarks', value: string) => {
    const updated = [...mainSubjects];
    updated[index][field] = value;
    setMainSubjects(updated);
  };

  const handleAddOptionalRow = () => {
    setOptionalSubjects([...optionalSubjects, { subject: '', maxMarks: '' }]);
  };

  const handleRemoveOptionalRow = (index: number) => {
    const updated = [...optionalSubjects];
    updated.splice(index, 1);
    setOptionalSubjects(updated);
  };

  const handleOptionalRowChange = (index: number, field: 'subject' | 'maxMarks', value: string) => {
    const updated = [...optionalSubjects];
    updated[index][field] = value;
    setOptionalSubjects(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      showToast('Please enter an exam name', 'error');
      return;
    }

    // Collect subjects mapping
    const finalSubjects: SubjectMark[] = [];
    
    // Add main subjects
    for (const item of mainSubjects) {
      if (item.subject && item.maxMarks) {
        finalSubjects.push({
          subject: item.subject,
          maxMarks: parseInt(item.maxMarks, 10),
        });
      }
    }

    // Add optional subjects if enabled
    if (hasOptional) {
      for (const item of optionalSubjects) {
        if (item.subject && item.maxMarks) {
          finalSubjects.push({
            subject: `${item.subject}${OPTIONAL_SUFFIX}`,
            maxMarks: parseInt(item.maxMarks, 10),
          });
        }
      }
    }

    if (finalSubjects.length === 0) {
      showToast('Please add at least one subject with max marks', 'error');
      return;
    }

    try {
      await saveMutation.mutateAsync({
        id: examId || undefined,
        name: examName.trim(),
        subjectsWithMarks: finalSubjects,
      });

      showToast(
        examId ? 'Exam type updated successfully' : 'Exam type created successfully',
        'success'
      );
      resetForm();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save exam type', 'error');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      showToast(`Deleted ${pendingDelete.name} successfully`, 'success');
      setPendingDelete(null);
    } catch (err: any) {
      showToast('Failed to delete exam type', 'error');
    }
  };

  const handleBootstrap = async () => {
    try {
      showToast('Syncing with Google Sheets...', 'info');
      const result = await bootstrapMutation.mutateAsync();
      showToast(`Sync complete! Imported ${result.imported} new items.`, 'success');
      refetchExams();
    } catch (err: any) {
      showToast('Failed to bootstrap exam types', 'error');
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part.charAt(0).toUpperCase()).join('') || 'E';
  };

  const formatSubjectsPreview = (subjectsWithMarks: any) => {
    let parsed: SubjectMark[] = [];
    if (Array.isArray(subjectsWithMarks)) {
      parsed = subjectsWithMarks;
    } else {
      try {
        parsed = typeof subjectsWithMarks === 'string'
          ? JSON.parse(subjectsWithMarks)
          : (subjectsWithMarks as any) || [];
      } catch {
        parsed = [];
      }
    }

    return parsed.map((item, i) => {
      const isOptional = item.subject && item.subject.includes('(OPTIONAL)');
      const name = item.subject ? item.subject.replace('(OPTIONAL)', '').trim() : 'Unknown';
      return (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isOptional
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}
        >
          {name}
          <span className="font-bold text-gray-500">({item.maxMarks})</span>
          {isOptional && (
            <span className="text-[10px] uppercase font-bold text-purple-400">Opt</span>
          )}
        </span>
      );
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Glow effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </a>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="text-indigo-400" size={22} />
                Exam Type Manager
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Bidirectional Google Sheet & Database Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBootstrap}
              disabled={bootstrapMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={bootstrapMutation.isPending ? 'animate-spin' : ''} />
              Sync Sheets
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Toast Region */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-xl shadow-xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/90 border-indigo-500/30 text-indigo-200'
            }`}>
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
              {toast.type === 'info' && <Sparkles size={18} className="text-indigo-400" />}
              <span className="text-sm font-semibold">{toast.message}</span>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Hero stats */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Layers size={12} />
              Blueprints Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Exam Blueprints</h2>
            <p className="text-slate-400 text-sm mt-1">Design exam definitions, configure subjects, and marks distributions.</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-1 md:w-40">
              <span className="text-xs font-semibold text-slate-500 block">Saved Exams</span>
              <span className="text-2xl font-bold block mt-1 text-indigo-400">{exams.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-1 md:w-40">
              <span className="text-xs font-semibold text-slate-500 block">Registered Subjects</span>
              <span className="text-2xl font-bold block mt-1 text-purple-400">{subjects.length}</span>
            </div>
          </div>
        </section>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Configuration Form */}
          <section className="lg:col-span-5">
            <div className="bg-slate-900 rounded-2xl border border-slate-800/85 overflow-hidden sticky top-24 shadow-2xl">
              <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/20 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{examId ? 'Update Exam Blueprint' : 'New Exam Blueprint'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Specify name and configure subjects & max marks</p>
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Sparkles size={20} />
                </div>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                
                {/* Exam Name */}
                <div className="space-y-2">
                  <label htmlFor="examName" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Exam Type Name
                  </label>
                  <input
                    type="text"
                    id="examName"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. RMS-CET JUNIOR"
                    required
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                  />
                </div>

                {/* Main Subjects */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Subjects & Max Marks
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMainRow}
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                    >
                      <Plus size={14} /> Add Row
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {mainSubjects.map((row, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={row.subject}
                          onChange={(e) => handleMainRowChange(index, 'subject', e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm focus:outline-none transition-all"
                        >
                          <option value="">Select Subject...</option>
                          {subjects.map((sub: any) => (
                            <option key={sub.id} value={sub.name}>{sub.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Max"
                          value={row.maxMarks}
                          onChange={(e) => handleMainRowChange(index, 'maxMarks', e.target.value)}
                          className="w-20 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm focus:outline-none transition-all text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMainRow(index)}
                          className="p-2 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Toggle */}
                <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        Optional Subjects
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-extrabold uppercase">Optional</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Enable if this exam has optional tracks</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasOptional}
                        onChange={(e) => {
                          setHasOptional(e.target.checked);
                          if (e.target.checked && optionalSubjects.length === 0) {
                            setOptionalSubjects([{ subject: '', maxMarks: '' }]);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {hasOptional && (
                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-400">Optional Subject Roster</span>
                        <button
                          type="button"
                          onClick={handleAddOptionalRow}
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors"
                        >
                          <Plus size={14} /> Add Row
                        </button>
                      </div>

                      <div className="space-y-2">
                        {optionalSubjects.map((row, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={row.subject}
                              onChange={(e) => handleOptionalRowChange(index, 'subject', e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm focus:outline-none transition-all"
                            >
                              <option value="">Select Subject...</option>
                              {subjects.map((sub: any) => (
                                <option key={sub.id} value={sub.name}>{sub.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              placeholder="Max"
                              value={row.maxMarks}
                              onChange={(e) => handleOptionalRowChange(index, 'maxMarks', e.target.value)}
                              className="w-20 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm focus:outline-none transition-all text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionalRow(index)}
                              className="p-2 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {saveMutation.isPending ? 'Saving...' : examId ? 'Update Exam Type' : 'Save Exam Blueprint'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </div>
          </section>

          {/* Right: Saved blueprints list */}
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800/85 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Saved Exam Types</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Showing registered exam specifications synced with Sheets</p>
                </div>
                <button
                  onClick={() => refetchExams()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Reload list"
                >
                  <RefreshCw size={18} className={isExamsLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {isExamsLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : exams.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-slate-600 mb-4 border border-slate-800">
                    <Database size={22} />
                  </div>
                  <h4 className="text-base font-bold text-slate-300">No Exam Blueprints Defined</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Configure a new exam type configuration using the constructor panel, or sync with Sheets.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-800">
                        <th className="py-4 px-6">Blueprint ID / Name</th>
                        <th className="py-4 px-6">Subject Setup</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {exams.map((exam: any) => (
                        <tr key={exam.id} className="hover:bg-slate-900/20 transition-colors group">
                          {/* Name & Avatar */}
                          <td className="py-4 px-6 vertical-align-top">
                            <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                                {getInitials(exam.name)}
                              </span>
                              <div>
                                <span className="font-bold text-slate-200 block">{exam.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                  ID: {exam.sheetId || exam.id.substring(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Subjects preview */}
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {formatSubjectsPreview(exam.subjectsWithMarks)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(exam)}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-lg transition-all"
                                title="Edit layout"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setPendingDelete({ id: exam.id, name: exam.name })}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                                title="Delete blueprint"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </div>

      </main>

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in scale-in duration-200">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl w-fit mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Delete Exam Blueprint?</h3>
            <p className="text-sm text-slate-400 mt-2">
              This will permanently delete the exam blueprint <strong className="text-slate-300">"{pendingDelete.name}"</strong> from Supabase and sync the deletion to Google Sheets.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
              >
                {deleteMutation.isPending && <RefreshCw size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
