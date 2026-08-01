'use client';

import { useState, useEffect } from 'react';
import {
  useCallingDashboard,
  useCreateManualCallTask,
  useUpdateCallStatus,
  useSendDropMessage,
  useMarkCallCompleted,
  useBatches,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

export default function CallingPage() {
  const { user, loading } = useAuth();

  // State filters
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [taskTypeFilter, setTaskTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showDropMsgModal, setShowDropMsgModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);

  // Form states
  const [manualForm, setManualForm] = useState({
    studentId: '',
    studentName: '',
    fatherName: '',
    mobile: '',
    batch: '',
    reason: '',
    taskType: 'ANNOUNCEMENT',
  });

  const [dropMsgTemplate, setDropMsgTemplate] = useState('ABSENT');
  const [customDropMsg, setCustomDropMsg] = useState('');

  const [completeOutcome, setCompleteOutcome] = useState('Spoke to Parent - Informed');
  const [completeRemarks, setCompleteRemarks] = useState('');

  const [toasts, setToasts] = useState<Array<{ id: number; type: string; message: string }>>([]);

  // Queries & Mutations
  const { data: batches } = useBatches();
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useCallingDashboard({
    date: selectedDate,
    batch: batchFilter,
    taskType: taskTypeFilter,
  });

  const createManualTaskMutation = useCreateManualCallTask();
  const updateStatusMutation = useUpdateCallStatus();
  const sendDropMsgMutation = useSendDropMessage();
  const markCompletedMutation = useMarkCallCompleted();

  let nextToastId = 0;

  const showToast = (type: string, message: string) => {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  // Pre-configured Drop Message Templates
  const dropMsgTemplates: Record<string, string> = {
    ABSENT: `Dear Parent, your child {NAME} was marked ABSENT today ({DATE}) at Prime Classes. Please reply with the reason or contact us.`,
    HOMEWORK: `Dear Parent, {NAME} has PENDING HOMEWORK at Prime Classes. Kindly ensure the work is completed today.`,
    ANNOUNCEMENT: `Dear Parent, Important announcement from Prime Classes regarding upcoming test schedules. Please check student portal.`,
    FEE_REMINDER: `Dear Parent, gentle reminder regarding fee installment for {NAME}. Please contact management for details.`,
  };

  const handleOpenDropMsgModal = (task: any) => {
    setActiveTask(task);
    const templateText =
      dropMsgTemplates[task.taskType] || dropMsgTemplates['ANNOUNCEMENT'];
    const formattedText = templateText
      .replace(/{NAME}/g, task.studentName || 'Student')
      .replace(/{DATE}/g, selectedDate);
    setCustomDropMsg(formattedText);
    setShowDropMsgModal(true);
  };

  const handleSendDropMsgSubmit = async () => {
    if (!activeTask) return;
    try {
      await sendDropMsgMutation.mutateAsync({
        taskKey: activeTask.taskKey,
        studentId: activeTask.studentId,
        studentName: activeTask.studentName,
        fatherName: activeTask.fatherName,
        mobile: activeTask.mobile,
        batch: activeTask.batch,
        taskType: activeTask.taskType,
        messageContent: customDropMsg,
        callDate: selectedDate,
      });

      // Launch WhatsApp web API link
      if (activeTask.mobile) {
        const cleanMobile = activeTask.mobile.replace(/\D/g, '');
        const waMobile = cleanMobile.length === 10 ? '91' + cleanMobile : cleanMobile;
        const waUrl = `https://wa.me/${waMobile}?text=${encodeURIComponent(customDropMsg)}`;
        window.open(waUrl, '_blank');
      }

      showToast('success', 'Drop Message logged & WhatsApp launched!');
      setShowDropMsgModal(false);
      refetch();
    } catch (err: any) {
      showToast('error', 'Failed: ' + (err.message || 'Error sending drop message'));
    }
  };

  const handleNotPickedClick = async (task: any) => {
    try {
      await updateStatusMutation.mutateAsync({
        taskKey: task.taskKey,
        studentId: task.studentId,
        studentName: task.studentName,
        fatherName: task.fatherName,
        mobile: task.mobile,
        batch: task.batch,
        taskType: task.taskType,
        callStatus: 'NOT_PICKED',
        remarks: 'Call attempted - Not Picked',
        callDate: selectedDate,
      });
      showToast('info', `Marked as Not Picked for ${task.studentName}`);
      refetch();
    } catch (err: any) {
      showToast('error', 'Failed: ' + (err.message || 'Error updating status'));
    }
  };

  const handleOpenCompleteModal = (task: any) => {
    setActiveTask(task);
    setCompleteOutcome('Spoke to Parent - Informed');
    setCompleteRemarks('');
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async () => {
    if (!activeTask) return;
    try {
      await markCompletedMutation.mutateAsync({
        taskKey: activeTask.taskKey,
        studentId: activeTask.studentId,
        studentName: activeTask.studentName,
        fatherName: activeTask.fatherName,
        mobile: activeTask.mobile,
        batch: activeTask.batch,
        taskType: activeTask.taskType,
        outcome: completeOutcome,
        remarks: completeRemarks,
        callDate: selectedDate,
      });
      showToast('success', `Call completed for ${activeTask.studentName}`);
      setShowCompleteModal(false);
      refetch();
    } catch (err: any) {
      showToast('error', 'Failed: ' + (err.message || 'Error saving completion'));
    }
  };

  const handleCreateManualSubmit = async () => {
    if (!manualForm.studentName || !manualForm.mobile || !manualForm.reason) {
      showToast('error', 'Please fill in Student Name, Mobile, and Reason!');
      return;
    }
    try {
      await createManualTaskMutation.mutateAsync({
        ...manualForm,
        callDate: selectedDate,
      });
      showToast('success', 'Manual call task created!');
      setShowManualModal(false);
      setManualForm({
        studentId: '',
        studentName: '',
        fatherName: '',
        mobile: '',
        batch: '',
        reason: '',
        taskType: 'ANNOUNCEMENT',
      });
      refetch();
    } catch (err: any) {
      showToast('error', 'Failed: ' + (err.message || 'Error creating task'));
    }
  };

  // Filter tasks by search query
  const pendingTasks = dashboardData?.pendingTasks || [];
  const completedCalls = dashboardData?.completedCalls || [];

  const filteredPending = pendingTasks.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.studentId && t.studentId.toLowerCase().includes(q)) ||
      (t.mobile && t.mobile.includes(q)) ||
      (t.batch && t.batch.toLowerCase().includes(q))
    );
  });

  const summary = dashboardData?.summary || {
    absentPending: 0,
    homeworkPending: 0,
    manualPending: 0,
    grievancePending: 0,
    totalPending: 0,
    totalCompleted: 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 relative overflow-x-hidden">
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-xl text-white font-semibold text-xs shadow-2xl backdrop-blur-md border animate-bounce ${
              t.type === 'success'
                ? 'bg-emerald-600/90 border-emerald-400'
                : t.type === 'error'
                ? 'bg-rose-600/90 border-rose-400'
                : 'bg-sky-600/90 border-sky-400'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-sky-500/20">
              📞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Telecaller Calling Dashboard
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase tracking-widest">
                  LIVE OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                The Prime Classes – Student Operations & Calling Management
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            {/* Batch Filter */}
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Batches</option>
              {batches?.map((b: any) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition shadow"
              title="Refresh Data"
            >
              <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>

            {/* Create Task Button */}
            <button
              onClick={() => setShowManualModal(true)}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5"
            >
              <span>+</span> Manual Task
            </button>

            {/* Grievance Department Link */}
            <a
              href="/grievance"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 shadow"
            >
              <span>←</span> Grievance Dept
            </a>

            {/* Dashboard Link */}
            <a
              href="/dashboard"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1"
            >
              Dashboard
            </a>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            {
              label: 'Absent Pending',
              value: summary.absentPending,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
              icon: '🚨',
            },
            {
              label: 'Homework Pending',
              value: summary.homeworkPending,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10 border-blue-500/20',
              icon: '📚',
            },
            {
              label: 'Manual Pending',
              value: summary.manualPending,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
              icon: '📢',
            },
            {
              label: 'Grievance Pending',
              value: summary.grievancePending,
              color: 'text-rose-400',
              bg: 'bg-rose-500/10 border-rose-500/20',
              icon: '⚖️',
            },
            {
              label: 'Total Pending',
              value: summary.totalPending,
              color: 'text-sky-400',
              bg: 'bg-sky-500/10 border-sky-500/20',
              icon: '📊',
            },
            {
              label: 'Calls Completed',
              value: summary.totalCompleted,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10 border-emerald-500/20',
              icon: '✅',
            },
          ].map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${m.bg} backdrop-blur-md shadow-lg flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>{m.label}</span>
                <span className="text-base">{m.icon}</span>
              </div>
              <div className={`text-2xl font-black ${m.color} mt-2`}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Task Category Filter Tabs & Search Bar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All Tasks', icon: '📋' },
              { id: 'ABSENT', label: 'Absent Calls', icon: '🚨' },
              { id: 'HOMEWORK', label: 'Homework Calls', icon: '📚' },
              { id: 'MANUAL', label: 'Manual Tasks', icon: '📢' },
              { id: 'GRIEVANCE', label: 'Grievance', icon: '⚖️' },
              { id: 'COMPLETED_TAB', label: 'Completed History', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTaskTypeFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  taskTypeFilter === tab.id
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72 relative">
            <input
              type="text"
              placeholder="Search student, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs font-semibold px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
            />
          </div>
        </div>

        {/* ============= MAIN CONTENT SECTION ============= */}
        {taskTypeFilter !== 'COMPLETED_TAB' ? (
          /* Pending Tasks Roster */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>📞</span> Pending Call Roster ({filteredPending.length})
              </h2>
              <span className="text-xs text-slate-400">Date: {selectedDate}</span>
            </div>

            {filteredPending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPending.map((task: any, index: number) => {
                  const taskBadgeColor =
                    task.taskType === 'ABSENT'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : task.taskType === 'HOMEWORK'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : task.taskType === 'GRIEVANCE'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

                  return (
                    <div
                      key={index}
                      className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 p-5 rounded-2xl shadow-xl transition-all flex flex-col justify-between space-y-4 backdrop-blur-sm group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${taskBadgeColor}`}
                          >
                            {task.taskType}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ID: {task.studentId}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition">
                            {task.studentName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            Father: <span className="text-slate-200">{task.fatherName || 'N/A'}</span>
                          </p>
                          <p className="text-xs text-slate-400 font-medium">
                            Batch: <span className="text-sky-300 font-semibold">{task.batch}</span>
                          </p>
                        </div>

                        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-normal">
                          <span className="text-slate-400 font-semibold">Reason: </span>
                          {task.reason}
                        </div>
                      </div>

                      {/* Phone & Actions */}
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <span>📱</span> {task.mobile || 'No Mobile'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={`tel:${task.mobile}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow transition flex items-center justify-center gap-1"
                          >
                            <span>📞</span> Call
                          </a>

                          <button
                            onClick={() => handleOpenDropMsgModal(task)}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow transition flex items-center justify-center gap-1"
                          >
                            <span>💬</span> Drop Msg
                          </button>

                          <button
                            onClick={() => handleNotPickedClick(task)}
                            className="bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow transition flex items-center justify-center gap-1"
                          >
                            <span>📵</span> Not Picked
                          </button>

                          <button
                            onClick={() => handleOpenCompleteModal(task)}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2 px-3 rounded-xl text-center shadow transition flex items-center justify-center gap-1"
                          >
                            <span>✅</span> Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <span className="text-5xl block mb-3">🎉</span>
                <p className="text-base font-bold text-slate-200">No Pending Calls!</p>
                <p className="text-xs mt-1 text-slate-500">
                  All tasks for date {selectedDate} and filter criteria are complete.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Completed Call History Tab */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>📜</span> Completed Call History ({completedCalls.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-950/60">
                    <th className="p-3.5">Call ID</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Batch</th>
                    <th className="p-3.5">Mobile</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Outcome / Remarks</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {completedCalls.length > 0 ? (
                    completedCalls.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-sky-400 font-bold">{c.callId}</td>
                        <td className="p-3.5 font-bold text-white">{c.studentName}</td>
                        <td className="p-3.5 text-slate-300">{c.batch}</td>
                        <td className="p-3.5 font-mono text-emerald-400">{c.mobile}</td>
                        <td className="p-3.5">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            {c.callStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 max-w-xs truncate">
                          {c.outcome || c.remarks || '-'}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString() : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-500 py-10">
                        No completed call records for selected date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ============= MODAL: DROP MESSAGE ============= */}
      {showDropMsgModal && activeTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>💬</span> Drop WhatsApp / SMS Message
              </h3>
              <button
                onClick={() => setShowDropMsgModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Recipient Student
                </label>
                <p className="text-sm font-bold text-sky-400">
                  {activeTask.studentName} ({activeTask.mobile})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Select Template
                </label>
                <select
                  value={dropMsgTemplate}
                  onChange={(e) => {
                    setDropMsgTemplate(e.target.value);
                    const t = dropMsgTemplates[e.target.value] || '';
                    setCustomDropMsg(
                      t
                        .replace(/{NAME}/g, activeTask.studentName || 'Student')
                        .replace(/{DATE}/g, selectedDate),
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold"
                >
                  <option value="ABSENT">🚨 Absent Warning Template</option>
                  <option value="HOMEWORK">📚 Homework Pending Template</option>
                  <option value="ANNOUNCEMENT">📢 General Announcement Template</option>
                  <option value="FEE_REMINDER">💰 Fee Installment Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Message Content (Editable)
                </label>
                <textarea
                  rows={4}
                  value={customDropMsg}
                  onChange={(e) => setCustomDropMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowDropMsgModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDropMsgSubmit}
                disabled={sendDropMsgMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
              >
                {sendDropMsgMutation.isPending ? 'Logging...' : 'Launch WhatsApp & Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============= MODAL: COMPLETE CALL ============= */}
      {showCompleteModal && activeTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>✅</span> Record Call Outcome
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Student Name
                </label>
                <p className="text-sm font-bold text-sky-400">{activeTask.studentName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Call Outcome <span className="text-rose-500">*</span>
                </label>
                <select
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold"
                >
                  <option value="Spoke to Parent - Informed">✅ Spoke to Parent - Informed</option>
                  <option value="Parent Agreed to Send Homework">📚 Parent Agreed to Send Homework</option>
                  <option value="Student Sick / Medical Leave">🤒 Student Sick / Medical Leave</option>
                  <option value="Out of Station">✈️ Out of Station</option>
                  <option value="Will Report Tomorrow">🎒 Will Report Tomorrow</option>
                  <option value="Fee Payment Promised">💰 Fee Payment Promised</option>
                  <option value="Issue Escalated to HOD">⚠️ Issue Escalated to HOD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Additional Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed outcome notes..."
                  value={completeRemarks}
                  onChange={(e) => setCompleteRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSubmit}
                disabled={markCompletedMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              >
                {markCompletedMutation.isPending ? 'Saving...' : 'Save Completion Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============= MODAL: MANUAL TASK CREATION ============= */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>➕</span> Create Manual Call Task
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter student name..."
                  value={manualForm.studentName}
                  onChange={(e) => setManualForm({ ...manualForm, studentName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Father Name
                </label>
                <input
                  type="text"
                  placeholder="Father's name..."
                  value={manualForm.fatherName}
                  onChange={(e) => setManualForm({ ...manualForm, fatherName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="10 digit mobile..."
                  value={manualForm.mobile}
                  onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Batch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Target-1"
                  value={manualForm.batch}
                  onChange={(e) => setManualForm({ ...manualForm, batch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Task Category
                </label>
                <select
                  value={manualForm.taskType}
                  onChange={(e) => setManualForm({ ...manualForm, taskType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-semibold"
                >
                  <option value="ANNOUNCEMENT">📢 Announcement</option>
                  <option value="FEE_REMINDER">💰 Fee Reminder</option>
                  <option value="GENERAL_FOLLOWUP">📞 General Follow-up</option>
                  <option value="TEST_RESULT">📊 Test Result Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-1001"
                  value={manualForm.studentId}
                  onChange={(e) => setManualForm({ ...manualForm, studentId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Reason / Task Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter purpose of call..."
                value={manualForm.reason}
                onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualSubmit}
                disabled={createManualTaskMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/20"
              >
                {createManualTaskMutation.isPending ? 'Creating...' : 'Create Call Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
