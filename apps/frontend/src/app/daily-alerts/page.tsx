'use client';

import { AlertTriangle, CalendarDays, CheckCircle2, Clipboard, RefreshCw, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dailyAlertsApi } from '@/lib/api';

interface BatchSummary {
  batchKey: string;
  batchName: string;
  totalStudents: number;
  missingItems: string[];
  attendance: { updated: boolean; recordsCount: number; presentCount: number; absentCount: number; teacherNames: string[] };
  homework: { updated: boolean; recordsCount: number; completedCount: number; pendingCount: number; teacherNames: string[] };
  test: { updatedToday: boolean; updatedWeekly: boolean; rowsCountToday: number; weeklyRowCount: number; appearedCount: number; averageMarks: number; topPerformer: { name: string; percentage: number } | null };
}

interface DailyAlertsPayload {
  selectedDate: string;
  selectedDisplayDate: string;
  allBatchesUpdated: boolean;
  alerts: string[];
  batches: BatchSummary[];
  rosterMessage: string;
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export default function DailyAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const [date, setDate] = useState(todayString);
  const [data, setData] = useState<DailyAlertsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = '/auth/login';
  }, [authLoading, user]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dailyAlertsApi.get(date);
      setData(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load Daily Alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (user) loadAlerts();
  }, [user, loadAlerts]);

  const copyAlerts = async () => {
    if (!data) return;
    const text = data.allBatchesUpdated
      ? `All tracked batches are fully updated for ${data.selectedDisplayDate}!`
      : data.alerts.join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError('Copy failed. Select and copy the alert text manually.');
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen grid place-items-center bg-slate-50"><RefreshCw className="animate-spin text-indigo-600" size={34} /></div>;
  }

  const flaggedBatches = data?.batches.filter((batch) => batch.missingItems.length) || [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-7">
      <section className="mx-auto max-w-6xl">
        <a href="/dashboard" className="mb-5 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to dashboard</a>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Academic head workspace</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Daily academic alerts</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Review missing attendance, homework, and weekly test updates across every active batch.</p>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); loadAlerts(); }} className="grid gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-[minmax(150px,1fr)_auto]">
              <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-300">
                Report date
                <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/30 px-3 py-2.5 text-base text-white"><CalendarDays size={17} /><input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="w-full bg-transparent outline-none [color-scheme:dark]" /></span>
              </label>
              <button disabled={loading} className="self-end rounded-lg bg-amber-300 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Fetching…' : 'Fetch alerts'}
              </button>
            </form>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}

        {data && (
          <>
            <div className={`mt-6 rounded-2xl border p-5 shadow-sm ${data.allBatchesUpdated ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  {data.allBatchesUpdated ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" />}
                  <div>
                    <h2 className="font-bold text-slate-900">{data.allBatchesUpdated ? `All clear for ${data.selectedDisplayDate}` : `${flaggedBatches.length} batch${flaggedBatches.length === 1 ? '' : 'es'} need follow-up`}</h2>
                    <p className="mt-1 text-sm text-slate-600">{data.allBatchesUpdated ? 'All tracked batches have attendance, homework, and recent test data.' : 'Use Copy alerts to share the ready-to-send follow-up messages.'}</p>
                  </div>
                </div>
                <button onClick={copyAlerts} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-100"><Clipboard size={16} />{copied ? 'Copied' : 'Copy alerts'}</button>
              </div>
            </div>

            {!data.allBatchesUpdated && <div className="mt-6 grid gap-4">
              {flaggedBatches.map((batch) => <article key={batch.batchKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{batch.batchName}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Users size={15} /> {batch.totalStudents} active student{batch.totalStudents === 1 ? '' : 's'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">{batch.missingItems.map((item) => <span key={item} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">{item.replace(' not updated', '')}</span>)}</div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <Metric label="Attendance" ok={batch.attendance.updated} detail={batch.attendance.updated ? `${batch.attendance.presentCount} present · ${batch.attendance.absentCount} absent` : 'No update'} />
                  <Metric label="Homework" ok={batch.homework.updated} detail={batch.homework.updated ? `${batch.homework.completedCount} complete · ${batch.homework.pendingCount} pending` : 'No update'} />
                  <Metric label="Weekly test" ok={batch.test.updatedWeekly} detail={batch.test.updatedWeekly ? `${batch.test.weeklyRowCount} result record${batch.test.weeklyRowCount === 1 ? '' : 's'} in last 7 days` : 'No update in last 7 days'} />
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{data.alerts.find((alert) => alert.startsWith(`${batch.batchName} `))}</p>
              </article>)}
            </div>}

            <p className="mt-5 text-xs leading-5 text-slate-500">{data.rosterMessage}</p>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return <div className={`rounded-xl border px-3 py-3 ${ok ? 'border-emerald-100 bg-emerald-50/60' : 'border-rose-100 bg-rose-50/60'}`}><p className="font-bold text-slate-800">{label} <span className={ok ? 'text-emerald-600' : 'text-rose-600'}>{ok ? 'Updated' : 'Missing'}</span></p><p className="mt-1 text-xs text-slate-600">{detail}</p></div>;
}
