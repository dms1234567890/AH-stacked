'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useClassesBootstrap, useRecurringSchedule, useSaveRecurringSchedule,
  useScheduleForDate, usePartialOverrides, useSavePartialOverride,
  useTeacherWorkTimes, useSaveWorkTime, useDeleteWorkTime,
  useTeacherAbsences, useSaveAbsence,
  useMergedClasses, useSaveMergedClass, useDeleteMergedClass,
  useSundayDuties, useSaveSundayDuty, useDeleteSundayDuty,
  useFreeTimeAnalytics, useAvailableTeachers
} from '@/lib/hooks';

// ============================================
// Toast Notification
// ============================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white font-medium z-[100] flex items-center gap-3 animate-slide-in ${type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
      <span>{type === 'success' ? '✓' : '✗'}</span>
      {message}
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">×</button>
    </div>
  );
}

// ============================================
// Shared Modal
// ============================================
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ============================================
// Spinner
// ============================================
function Spinner() {
  return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
}

// ============================================
// Sidebar Icons
// ============================================
const ICONS: Record<string, string> = {
  'Dashboard': '📊',
  'Permanent Schedule': '📅',
  'Partial Schedule': '🔄',
  'Sunday Duty': '🏫',
  'Teacher Time Setup': '⏰',
  'Leave Tracking': '📋',
  'Free Time Analytics': '📈',
  'Batch Subjects': '📚',
};

// ============================================
// TAB 1: Dashboard
// ============================================
function DashboardTab({ bootstrap }: { bootstrap: any }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { data: scheduleData, isLoading } = useScheduleForDate(date);
  const schedule = Array.isArray(scheduleData) ? scheduleData : (scheduleData?.recurring || []);
  const totalRecurring = bootstrap?.recurring?.length || 0;
  const unassigned = bootstrap?.recurring?.filter((r: any) => !r.teacherId)?.length || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Batches', value: bootstrap?.batches?.length || 0, color: 'from-indigo-500 to-indigo-600', icon: '🎓' },
          { label: 'Total Teachers', value: bootstrap?.teachers?.length || 0, color: 'from-teal-500 to-teal-600', icon: '👨‍🏫' },
          { label: 'Scheduled Classes', value: totalRecurring, color: 'from-blue-500 to-blue-600', icon: '📅' },
          { label: 'Unassigned Slots', value: unassigned, color: unassigned > 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-emerald-600', icon: '⚠️' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white shadow-lg`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">Today&apos;s Schedule</h3>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>
        <div className="p-4 overflow-x-auto">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-left text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="p-3 border-b">Time Slot</th><th className="p-3 border-b">Batch</th>
                  <th className="p-3 border-b">Subject</th><th className="p-3 border-b">Teacher</th>
                  <th className="p-3 border-b">Room</th>
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No classes scheduled for this date</td></tr>}
                {schedule.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-indigo-50/30 transition">
                    <td className="p-3 font-mono text-xs">{item.timeSlot}</td>
                    <td className="p-3"><span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">{item.batch?.name || item.batchName || '—'}</span></td>
                    <td className="p-3">{item.subject || item.subjectName}</td>
                    <td className="p-3">{item.teacher?.name || item.teacherName || 'Unassigned'}</td>
                    <td className="p-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.classRoom || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 2: Permanent Schedule
// ============================================
function PermanentScheduleTab({ bootstrap }: { bootstrap: any }) {
  const [batchId, setBatchId] = useState('');
  const { data: schedule, isLoading } = useRecurringSchedule(batchId || undefined);
  const saveMutation = useSaveRecurringSchedule();
  const [entries, setEntries] = useState<any[]>([]);
  const [toast, setToast] = useState<any>(null);
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (schedule) setEntries(Array.isArray(schedule) ? schedule : []);
  }, [schedule]);

  const handleSave = async () => {
    if (!batchId) return;
    try {
      await saveMutation.mutateAsync({ batchId, weekDay: null, entries });
      setToast({ message: 'Schedule saved successfully!', type: 'success' });
    } catch { setToast({ message: 'Error saving schedule', type: 'error' }); }
  };

  const addRow = () => setEntries([...entries, { weekDay: 'Monday', timeSlot: '', subject: '', teacherId: '', teacherName: '', classRoom: '' }]);
  const updateRow = (idx: number, field: string, val: any) => {
    const newE = [...entries];
    if (field === 'teacherId') {
      const teacher = bootstrap?.teachers?.find((t: any) => t.id === val);
      newE[idx].teacherName = teacher?.name || '';
    }
    newE[idx][field] = val;
    setEntries(newE);
  };
  const removeRow = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Permanent Schedule</h2>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
        <label className="font-medium text-gray-600 text-sm">Select Batch:</label>
        <select value={batchId} onChange={e => setBatchId(e.target.value)} className="border border-gray-200 p-2 rounded-lg flex-1 min-w-[200px] text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none">
          <option value="">— Select Batch —</option>
          {bootstrap?.batches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {batchId && (
          <button onClick={handleSave} disabled={saveMutation.isPending} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
            {saveMutation.isPending && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
            Save Changes
          </button>
        )}
      </div>

      {batchId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 overflow-x-auto">
            {isLoading ? <Spinner /> : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                      <th className="p-3 border-b text-left">Day</th>
                      <th className="p-3 border-b text-left">Time Slot</th>
                      <th className="p-3 border-b text-left">Subject</th>
                      <th className="p-3 border-b text-left">Teacher</th>
                      <th className="p-3 border-b text-left">Room</th>
                      <th className="p-3 border-b text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-2">
                          <select value={item.weekDay || 'Monday'} onChange={e => updateRow(idx, 'weekDay', e.target.value)} className="border border-gray-200 p-1.5 rounded w-full text-gray-700 text-sm">
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><input type="text" value={item.timeSlot || ''} onChange={e => updateRow(idx, 'timeSlot', e.target.value)} className="border border-gray-200 p-1.5 rounded w-full text-gray-700 text-sm" placeholder="09:00-10:00" /></td>
                        <td className="p-2"><input type="text" value={item.subject || ''} onChange={e => updateRow(idx, 'subject', e.target.value)} className="border border-gray-200 p-1.5 rounded w-full text-gray-700 text-sm" placeholder="Subject" /></td>
                        <td className="p-2">
                          <select value={item.teacherId || ''} onChange={e => updateRow(idx, 'teacherId', e.target.value)} className="border border-gray-200 p-1.5 rounded w-full text-gray-700 text-sm">
                            <option value="">— Unassigned —</option>
                            {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><input type="text" value={item.classRoom || ''} onChange={e => updateRow(idx, 'classRoom', e.target.value)} className="border border-gray-200 p-1.5 rounded w-full text-gray-700 text-sm" placeholder="Room" /></td>
                        <td className="p-2 text-center">
                          <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600 transition text-lg" title="Delete">🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addRow} className="mt-4 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">+ Add Row</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TAB 3: Partial Schedule (Overrides)
// ============================================
function PartialScheduleTab({ bootstrap }: { bootstrap: any }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const { data: overrides, isLoading } = usePartialOverrides(date);
  const saveMutation = useSavePartialOverride();
  const [toast, setToast] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ batchId: '', timeSlot: '', subject: '', originalTeacherId: '', replacementTeacherId: '', reason: '' });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ ...form, date });
      setToast({ message: 'Override saved!', type: 'success' });
      setModalOpen(false);
      setForm({ batchId: '', timeSlot: '', subject: '', originalTeacherId: '', replacementTeacherId: '', reason: '' });
    } catch { setToast({ message: 'Error saving override', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Partial Schedule (Overrides)</h2>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="font-medium text-gray-600 text-sm">Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-teal-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-teal-700 transition">+ Add Override</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 overflow-x-auto">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="p-3 border-b">Batch</th><th className="p-3 border-b">Time Slot</th>
                  <th className="p-3 border-b">Subject</th>
                  <th className="p-3 border-b">Original Teacher</th><th className="p-3 border-b">Replacement</th>
                  <th className="p-3 border-b">Reason</th>
                </tr>
              </thead>
              <tbody>
                {(!overrides || overrides.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-gray-400">No overrides for this date</td></tr>}
                {overrides?.map((o: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3"><span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">{o.batch?.name || o.batchName}</span></td>
                    <td className="p-3 font-mono text-xs">{o.timeSlot}</td>
                    <td className="p-3">{o.subject}</td>
                    <td className="p-3 text-red-500 line-through">{o.originalTeacher?.name || o.originalTeacherName || '—'}</td>
                    <td className="p-3 text-emerald-600 font-semibold">{o.replacementTeacher?.name || o.replacementTeacherName || '—'}</td>
                    <td className="p-3 text-gray-500 italic">{o.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Add Schedule Override" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })}>
                <option value="">Select Batch</option>
                {bootstrap?.batches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })} placeholder="10:00-11:00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Teacher</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.originalTeacherId} onChange={e => setForm({ ...form, originalTeacherId: e.target.value })}>
                <option value="">Select</option>
                {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Teacher</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.replacementTeacherId} onChange={e => setForm({ ...form, replacementTeacherId: e.target.value })}>
                <option value="">Select</option>
                {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Teacher on leave" />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// TAB 4: Sunday Duty
// ============================================
function SundayDutyTab({ bootstrap }: { bootstrap: any }) {
  const getNextSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()) % 7);
    return d.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getNextSunday);
  const { data: duties, isLoading } = useSundayDuties(date);
  const saveMutation = useSaveSundayDuty();
  const deleteMutation = useDeleteSundayDuty();
  const [toast, setToast] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ roomNumber: '', startTime: '09:00', endTime: '12:00', teacherId: '', teacherName: '', remarks: '' });

  const handleSave = async () => {
    try {
      const teacher = bootstrap?.teachers?.find((t: any) => t.id === form.teacherId);
      await saveMutation.mutateAsync({ ...form, date, teacherName: teacher?.name || '' });
      setToast({ message: 'Sunday duty saved!', type: 'success' });
      setModalOpen(false);
      setForm({ roomNumber: '', startTime: '09:00', endTime: '12:00', teacherId: '', teacherName: '', remarks: '' });
    } catch { setToast({ message: 'Error saving duty', type: 'error' }); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setToast({ message: 'Duty removed', type: 'success' });
    } catch { setToast({ message: 'Error removing', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Sunday Duty</h2>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="font-medium text-gray-600 text-sm">Sunday Date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">+ Add Duty</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 overflow-x-auto">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="p-3 border-b">Room</th><th className="p-3 border-b">Start</th>
                  <th className="p-3 border-b">End</th><th className="p-3 border-b">Teacher</th>
                  <th className="p-3 border-b">Remarks</th><th className="p-3 border-b text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!duties || duties.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-gray-400">No Sunday duties for this date</td></tr>}
                {duties?.map((d: any) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3 font-semibold">{d.roomNumber}</td>
                    <td className="p-3 font-mono text-xs">{d.startTime}</td>
                    <td className="p-3 font-mono text-xs">{d.endTime}</td>
                    <td className="p-3">{d.teacherName || d.teacher?.name || '—'}</td>
                    <td className="p-3 text-gray-500 italic">{d.remarks || '—'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600 transition">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Add Sunday Duty" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
              <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. Room 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select Teacher</option>
                {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional" />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// TAB 5: Teacher Time Setup
// ============================================
function TeacherTimeSetupTab({ bootstrap }: { bootstrap: any }) {
  const { data: workTimes, isLoading } = useTeacherWorkTimes();
  const saveMutation = useSaveWorkTime();
  const deleteMutation = useDeleteWorkTime();
  const [toast, setToast] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ teacherId: '', startTime: '09:00', endTime: '17:00' });

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(form);
      setToast({ message: 'Work time saved!', type: 'success' });
      setModalOpen(false);
      setForm({ teacherId: '', startTime: '09:00', endTime: '17:00' });
    } catch { setToast({ message: 'Error saving', type: 'error' }); }
  };

  const handleDelete = async (teacherId: string) => {
    try {
      await deleteMutation.mutateAsync(teacherId);
      setToast({ message: 'Work time removed', type: 'success' });
    } catch { setToast({ message: 'Error removing', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Teacher Time Setup</h2>
        <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">+ Add Work Time</button>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 overflow-x-auto">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="p-3 border-b">Teacher</th><th className="p-3 border-b">Start Time</th>
                  <th className="p-3 border-b">End Time</th><th className="p-3 border-b">Total Hours</th>
                  <th className="p-3 border-b text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!workTimes || workTimes.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No teacher work times configured</td></tr>}
                {workTimes?.map((wt: any) => {
                  const hrs = ((wt.endMinutes || 0) - (wt.startMinutes || 0)) / 60;
                  return (
                    <tr key={wt.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium">{wt.teacherName || wt.teacher?.name}</td>
                      <td className="p-3 font-mono text-xs">{wt.startTime}</td>
                      <td className="p-3 font-mono text-xs">{wt.endTime}</td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">{hrs.toFixed(1)}h</span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleDelete(wt.teacherId)} className="text-red-400 hover:text-red-600 transition">🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Set Teacher Work Time" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select Teacher</option>
                {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// TAB 6: Leave Tracking
// ============================================
function LeaveTrackingTab({ bootstrap }: { bootstrap: any }) {
  const [teacherFilter, setTeacherFilter] = useState('');
  const { data: absences, isLoading } = useTeacherAbsences(teacherFilter ? { teacherId: teacherFilter } : undefined);
  const saveMutation = useSaveAbsence();
  const [toast, setToast] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ teacherId: '', startDate: '', endDate: '', absenceType: 'Full Day', reason: '' });
  const TYPES = ['Full Day', 'Half Day', 'Late Entry', 'Specific Time Range'];

  const handleSave = async () => {
    try {
      const teacher = bootstrap?.teachers?.find((t: any) => t.id === form.teacherId);
      await saveMutation.mutateAsync({ ...form, teacherName: teacher?.name || '' });
      setToast({ message: 'Leave recorded!', type: 'success' });
      setModalOpen(false);
      setForm({ teacherId: '', startDate: '', endDate: '', absenceType: 'Full Day', reason: '' });
    } catch { setToast({ message: 'Error recording leave', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Leave Tracking</h2>
        <button onClick={() => setModalOpen(true)} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-amber-700 transition">+ Record Leave</button>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
        <label className="font-medium text-gray-600 text-sm">Filter by Teacher:</label>
        <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="border border-gray-200 p-2 rounded-lg flex-1 min-w-[200px] text-gray-700">
          <option value="">All Teachers</option>
          {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 overflow-x-auto">
          {isLoading ? <Spinner /> : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <th className="p-3 border-b">Teacher</th><th className="p-3 border-b">From</th>
                  <th className="p-3 border-b">To</th><th className="p-3 border-b">Type</th>
                  <th className="p-3 border-b">Reason</th>
                </tr>
              </thead>
              <tbody>
                {(!absences || absences.length === 0) && <tr><td colSpan={5} className="p-6 text-center text-gray-400">No leave records found</td></tr>}
                {absences?.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3 font-medium">{a.teacherName || a.teacher?.name}</td>
                    <td className="p-3 font-mono text-xs">{a.startDate ? new Date(a.startDate).toLocaleDateString() : '—'}</td>
                    <td className="p-3 font-mono text-xs">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        a.absenceType === 'Full Day' ? 'bg-red-100 text-red-700' :
                        a.absenceType === 'Half Day' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{a.absenceType}</span>
                    </td>
                    <td className="p-3 text-gray-500 italic">{a.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <Modal title="Record Teacher Leave" onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}>
                <option value="">Select Teacher</option>
                {bootstrap?.teachers?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" value={form.absenceType} onChange={e => setForm({ ...form, absenceType: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input className="w-full border border-gray-200 p-2.5 rounded-lg text-gray-700" type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Personal leave" />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================
// TAB 7: Free Time Analytics
// ============================================
function FreeTimeAnalyticsTab({ bootstrap }: { bootstrap: any }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchSlot, setSearchSlot] = useState('');
  const { data: analytics, isLoading } = useFreeTimeAnalytics({ date });
  const { data: available } = useAvailableTeachers({ date, timeSlot: searchSlot || undefined });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Free Time Analytics</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
        <label className="font-medium text-gray-600 text-sm">Date:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">Teacher Utilization</h3>
        </div>
        <div className="p-4">
          {isLoading ? <Spinner /> : (
            <div className="space-y-3">
              {(!analytics || analytics.length === 0) && <p className="text-center text-gray-400 py-4">No analytics data available</p>}
              {analytics?.map((a: any, idx: number) => {
                const pct = Math.min(a.utilization || 0, 100);
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-36 text-sm font-medium text-gray-700 truncate">{a.teacherName}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-gradient-to-r from-red-400 to-red-500' : pct > 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="w-14 text-right text-sm font-semibold text-gray-600">{pct.toFixed(0)}%</span>
                    <span className="text-xs text-gray-400 w-24">{a.busySlots || 0}/{a.totalSlots || 0} slots</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-4">
          <h3 className="font-semibold text-gray-700">Find Available Teachers</h3>
          <input type="text" value={searchSlot} onChange={e => setSearchSlot(e.target.value)} className="border border-gray-200 p-2 rounded-lg text-gray-700 text-sm" placeholder="Enter time slot e.g. 10:00-11:00" />
        </div>
        <div className="p-4">
          {searchSlot && available ? (
            <div className="flex flex-wrap gap-2">
              {available.length === 0 && <p className="text-gray-400">No available teachers for this slot</p>}
              {available.map((t: any, idx: number) => (
                <span key={idx} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium">{t.name || t.teacherName}</span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Enter a time slot above to find available teachers</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 8: Batch Subjects
// ============================================
function BatchSubjectsTab({ bootstrap }: { bootstrap: any }) {
  const [batchFilter, setBatchFilter] = useState('');

  const batches = bootstrap?.batches || [];
  const filteredBatches = batchFilter ? batches.filter((b: any) => b.id === batchFilter) : batches;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Batch Subjects</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
        <label className="font-medium text-gray-600 text-sm">Filter by Batch:</label>
        <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} className="border border-gray-200 p-2 rounded-lg flex-1 min-w-[200px] text-gray-700">
          <option value="">All Batches</option>
          {batches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch: any) => (
          <div key={batch.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3">
              <h3 className="font-bold text-white">{batch.name}</h3>
              {batch.section && <p className="text-indigo-200 text-xs">Section: {batch.section}</p>}
            </div>
            <div className="p-4">
              {batch.subjects?.length > 0 ? (
                <div className="space-y-2">
                  {batch.subjects.map((s: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-700">{s.name || s.subject?.name}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">{s.classRoom || '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No subjects assigned</p>
              )}
            </div>
          </div>
        ))}
        {filteredBatches.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-8">No batches found</div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
const TABS = ['Dashboard', 'Permanent Schedule', 'Partial Schedule', 'Sunday Duty', 'Teacher Time Setup', 'Leave Tracking', 'Free Time Analytics', 'Batch Subjects'];

export default function ClassesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: bootstrap, isLoading: bootstrapLoading } = useClassesBootstrap();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  if (authLoading || !user || bootstrapLoading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-400 text-sm">Loading Classes Manager...</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-indigo-900 via-indigo-800 to-teal-800 text-white flex flex-col shadow-xl z-10 overflow-hidden`}>
        <div className="p-5 font-bold text-lg tracking-wide border-b border-white/10 flex items-center gap-2 whitespace-nowrap">
          <span className="text-2xl">📚</span> Classes Manager
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3 whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white/20 shadow-lg shadow-black/10 text-white'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}>
              <span>{ICONS[tab] || '📋'}</span>
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/10">
          <a href="/dashboard" className="text-sm font-medium text-indigo-200 hover:text-white flex items-center transition gap-2 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Dashboard
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Logged in as</span>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">{user?.username || 'Admin'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {activeTab === 'Dashboard' && <DashboardTab bootstrap={bootstrap} />}
          {activeTab === 'Permanent Schedule' && <PermanentScheduleTab bootstrap={bootstrap} />}
          {activeTab === 'Partial Schedule' && <PartialScheduleTab bootstrap={bootstrap} />}
          {activeTab === 'Sunday Duty' && <SundayDutyTab bootstrap={bootstrap} />}
          {activeTab === 'Teacher Time Setup' && <TeacherTimeSetupTab bootstrap={bootstrap} />}
          {activeTab === 'Leave Tracking' && <LeaveTrackingTab bootstrap={bootstrap} />}
          {activeTab === 'Free Time Analytics' && <FreeTimeAnalyticsTab bootstrap={bootstrap} />}
          {activeTab === 'Batch Subjects' && <BatchSubjectsTab bootstrap={bootstrap} />}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes slide-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
