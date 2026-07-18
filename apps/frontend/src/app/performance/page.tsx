'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePerformanceLeaderboard,
  useStudentPerformanceReport,
} from '@/lib/hooks';
import {
  Award,
  Calendar,
  Search,
  BookOpen,
  Users,
  Trophy,
  Activity,
  FileText,
  AlertTriangle,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  Sliders,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export default function PerformancePage() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, authLoading]);

  // Set default date range to current month
  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      fromDate: firstDay.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0],
    };
  };

  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [languageMode, setLanguageMode] = useState('AUTO');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'batches' | 'subjects'>('students');

  // Modal details
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Leaderboard query
  const { data: leaderboardData, isLoading: isLeaderboardLoading, refetch } = usePerformanceLeaderboard({
    fromDate,
    toDate,
    languageMode,
    batchFilter,
  });

  // Report query
  const { data: reportData, isLoading: isReportLoading } = useStudentPerformanceReport(
    selectedStudentId || '',
    {
      fromDate,
      toDate,
      languageMode,
      batchFilter,
    }
  );

  const handleViewReport = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsReportOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter student rankings client-side by search query
  const filteredStudents = (leaderboardData?.students || []).filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Top metric calculations
  const topStudent = leaderboardData?.students?.[0] || null;
  const bestAttStudent = leaderboardData?.students
    ? [...leaderboardData.students].sort((a: any, b: any) => b.attendance - a.attendance)[0]
    : null;
  const topBatch = leaderboardData?.batchRankings?.[0] || null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Award className="text-red-500" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Performance & Analytics</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-gray-600 hover:text-red-500 text-sm font-semibold transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Toolbar card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-bold border-b pb-2 mb-2">
            <Sliders size={18} />
            <span>Filter Parameters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Batch</label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:outline-none"
              >
                <option value="ALL">All Batches</option>
                {leaderboardData?.batches?.map((b: string) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Language Mode</label>
              <select
                value={languageMode}
                onChange={(e) => setLanguageMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-200 focus:outline-none"
              >
                <option value="AUTO">Auto (Student Language)</option>
                <option value="ENGLISH">English Only</option>
                <option value="HINDI">Hindi Only</option>
                <option value="BOTH">Both Languages</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-4">
            {/* View Mode Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-lg w-full sm:w-auto">
              {[
                { id: 'students', label: 'Student Rankings', icon: Award },
                { id: 'batches', label: 'Batch Rankings', icon: Users },
                { id: 'subjects', label: 'Subject Performance', icon: BookOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search filter for students */}
            {activeTab === 'students' && (
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search student by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-red-200 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Top KPIs Roster */}
        {leaderboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-yellow-100 text-xs font-bold uppercase tracking-wider">Top Performer</span>
                <h3 className="text-2xl font-bold">{topStudent ? topStudent.name : '—'}</h3>
                <p className="text-yellow-100 text-xs font-medium">{topStudent ? topStudent.batch : 'No batch'}</p>
                {topStudent && <span className="inline-block mt-2 bg-yellow-400/20 text-white text-xs px-2.5 py-1 rounded-full font-bold">Score: {topStudent.overall}</span>}
              </div>
              <Trophy size={48} className="text-yellow-100 opacity-60" />
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">Best Attendance</span>
                <h3 className="text-2xl font-bold">{bestAttStudent ? bestAttStudent.name : '—'}</h3>
                <p className="text-blue-100 text-xs font-medium">{bestAttStudent ? bestAttStudent.batch : 'No batch'}</p>
                {bestAttStudent && <span className="inline-block mt-2 bg-blue-500/20 text-white text-xs px-2.5 py-1 rounded-full font-bold">Rate: {bestAttStudent.attendance}%</span>}
              </div>
              <Activity size={48} className="text-blue-100 opacity-60" />
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Top Batch</span>
                <h3 className="text-2xl font-bold">{topBatch ? topBatch.batch : '—'}</h3>
                <p className="text-emerald-100 text-xs font-medium">{topBatch ? `Head: ${topBatch.headName}` : 'No coordinator'}</p>
                {topBatch && <span className="inline-block mt-2 bg-emerald-500/20 text-white text-xs px-2.5 py-1 rounded-full font-bold">Avg Score: {topBatch.score}</span>}
              </div>
              <TrendingUp size={48} className="text-emerald-100 opacity-60" />
            </div>
          </div>
        )}

        {/* Dynamic Section Contents */}
        {isLeaderboardLoading ? (
          <div className="bg-white rounded-xl py-16 text-center border shadow-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
            <span className="mt-3 block text-gray-500 font-medium">Analyzing performance data...</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {activeTab === 'students' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-20">Rank</th>
                      <th className="py-4 px-6">Student Name</th>
                      <th className="py-4 px-6">Batch</th>
                      <th className="py-4 px-6 w-64">Attendance</th>
                      <th className="py-4 px-6">Homework Avg</th>
                      <th className="py-4 px-6">Result %</th>
                      <th className="py-4 px-6">Overall Score</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-gray-700">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-gray-400">
                          No student records matched current criteria
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s: any, index: number) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-6 font-bold text-gray-500">#{index + 1}</td>
                          <td className="py-4 px-6 font-semibold text-gray-900">{s.name}</td>
                          <td className="py-4 px-6">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                              {s.batch}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative flex items-center justify-center text-[10px] font-bold text-white">
                              <div
                                className="bg-blue-500 h-full absolute left-0 top-0 transition-all duration-500"
                                style={{ width: `${s.attendance}%` }}
                              ></div>
                              <span className="z-10 shadow-sm">{s.attendance}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-indigo-700">{s.homework}</span>
                            <span className="text-gray-400 text-xs"> / 10</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-emerald-600">{s.result}%</td>
                          <td className="py-4 px-6 font-extrabold text-red-600">{s.overall}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleViewReport(s.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                            >
                              View Report <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'batches' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-20">Rank</th>
                      <th className="py-4 px-6">Batch Name</th>
                      <th className="py-4 px-6">Coordinator / Head</th>
                      <th className="py-4 px-6">Avg Attendance</th>
                      <th className="py-4 px-6">Avg Homework</th>
                      <th className="py-4 px-6">Avg Result</th>
                      <th className="py-4 px-6">Overall Score</th>
                      <th className="py-4 px-6">Total Max Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-gray-700">
                    {(leaderboardData?.batchRankings || []).map((b: any, index: number) => (
                      <tr key={b.batch} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-6 font-bold text-gray-500">#{index + 1}</td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{b.batch}</td>
                        <td className="py-4 px-6">{b.headName || '—'}</td>
                        <td className="py-4 px-6 text-blue-600 font-semibold">{b.att}%</td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-indigo-700">{((b.hw / 100) * 10).toFixed(1)}</span>
                          <span className="text-gray-400 text-xs"> / 10</span>
                        </td>
                        <td className="py-4 px-6 text-emerald-600 font-semibold">{b.res}%</td>
                        <td className="py-4 px-6 font-bold text-red-600">{b.score}</td>
                        <td className="py-4 px-6 text-gray-500">{b.totalMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6 w-20">Rank</th>
                      <th className="py-4 px-6">Subject</th>
                      <th className="py-4 px-6">Batch</th>
                      <th className="py-4 px-6">Avg %</th>
                      <th className="py-4 px-6">Avg Obtained</th>
                      <th className="py-4 px-6">Avg Max</th>
                      <th className="py-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm text-gray-700">
                    {(leaderboardData?.subjectRankings || []).map((s: any, index: number) => (
                      <tr key={`${s.batch}-${s.subject}`} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-6 font-bold text-gray-500">#{index + 1}</td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{s.subject}</td>
                        <td className="py-4 px-6">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                            {s.batch}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-emerald-600 font-semibold">{s.avgPct}%</td>
                        <td className="py-4 px-6">{s.avgObtained}</td>
                        <td className="py-4 px-6 text-gray-500">{s.avgMax}</td>
                        <td className="py-4 px-6 text-right">
                          {s.tag === 'Dominant' && (
                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                              Dominant
                            </span>
                          )}
                          {s.tag === 'Weak' && (
                            <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">
                              Weak
                            </span>
                          )}
                          {!s.tag && <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* STUDENT PERFORMANCE REPORT CARD MODAL */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Student Performance Report</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAuditOpen(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <TrendingUp size={14} /> Result Audit
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Printer size={14} /> Download PDF
                </button>
                <button onClick={() => setIsReportOpen(false)} className="text-gray-500 hover:text-gray-700 ml-2">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isReportLoading ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                  <span className="mt-2 block text-sm text-gray-500">Loading student dossier...</span>
                </div>
              ) : reportData?.error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>{reportData.error}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Student Dossier Header Card */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-inner">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Student ID: {reportData?.student?.id}</span>
                        <h2 className="text-2xl font-bold">{reportData?.student?.name}</h2>
                        <p className="text-gray-300 text-sm">Batch: {reportData?.student?.batch}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-gray-300 border-t md:border-t-0 md:border-l border-slate-700 pt-3 md:pt-0 md:pl-8">
                        <div><strong>Father's Name:</strong> {reportData?.student?.fatherName}</div>
                        <div><strong>Language Mode:</strong> {reportData?.student?.language || '—'}</div>
                        <div><strong>Mobile No:</strong> {reportData?.student?.mobile || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                      <span className="text-red-500 text-xs font-bold uppercase tracking-wider block">Overall Score</span>
                      <h4 className="text-3xl font-extrabold text-red-600 mt-1">{reportData?.metrics?.overall}</h4>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                      <span className="text-blue-500 text-xs font-bold uppercase tracking-wider block">Attendance Rate</span>
                      <h4 className="text-3xl font-extrabold text-blue-600 mt-1">{reportData?.metrics?.attendance}%</h4>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                      <span className="text-indigo-500 text-xs font-bold uppercase tracking-wider block">Homework Avg</span>
                      <h4 className="text-3xl font-extrabold text-indigo-600 mt-1">{reportData?.metrics?.homework} / 10</h4>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                      <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider block">Result Avg</span>
                      <h4 className="text-3xl font-extrabold text-emerald-600 mt-1">{reportData?.metrics?.result}%</h4>
                    </div>
                  </div>

                  {/* Syllabus / Subject Performance */}
                  <div className="border rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-800 text-base border-b pb-2 flex items-center gap-2">
                      <BookOpen size={18} className="text-red-500" />
                      <span>Subject Performance Summary</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <strong className="text-emerald-800 block text-xs uppercase tracking-wider font-bold">Strongest Subject</strong>
                        <span className="text-emerald-900 font-semibold mt-1 block">{reportData?.results?.strongest}</span>
                      </div>
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                        <strong className="text-red-800 block text-xs uppercase tracking-wider font-bold">Weakest Subject</strong>
                        <span className="text-red-900 font-semibold mt-1 block">{reportData?.results?.weakest}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase">
                            <th className="py-2.5 px-4">Subject</th>
                            <th className="py-2.5 px-4">Avg Marks Obtained</th>
                            <th className="py-2.5 px-4">Avg Max Marks</th>
                            <th className="py-2.5 px-4">Subject Percentage</th>
                            <th className="py-2.5 px-4">Records Counted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                          {reportData?.results?.subjects?.map((sub: any) => (
                            <tr key={sub.subject} className="hover:bg-gray-50">
                              <td className="py-2.5 px-4 font-semibold">{sub.subject}</td>
                              <td className="py-2.5 px-4">{sub.avgObtained}</td>
                              <td className="py-2.5 px-4">{sub.avgMax}</td>
                              <td className="py-2.5 px-4 text-emerald-600 font-bold">{sub.avgPct}%</td>
                              <td className="py-2.5 px-4 text-gray-400">{sub.recordsCounted} test(s)</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Homework Status Breakdown */}
                  <div className="border rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-800 text-base border-b pb-2 flex items-center gap-2">
                      <FileText size={18} className="text-indigo-500" />
                      <span>Homework Tracking Details</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
                      <div className="border rounded-lg p-2.5">
                        <strong className="block text-lg font-bold text-gray-900">{reportData?.homework?.total}</strong>
                        <span className="text-gray-400 font-semibold uppercase block">Total Homeworks</span>
                      </div>
                      <div className="border rounded-lg p-2.5 bg-emerald-50 border-emerald-100">
                        <strong className="block text-lg font-bold text-emerald-600">{reportData?.homework?.complete}</strong>
                        <span className="text-emerald-700 font-semibold uppercase block">Completed</span>
                      </div>
                      <div className="border rounded-lg p-2.5 bg-red-50 border-red-100">
                        <strong className="block text-lg font-bold text-red-600">{reportData?.homework?.incomplete}</strong>
                        <span className="text-red-700 font-semibold uppercase block">Incomplete</span>
                      </div>
                      <div className="border rounded-lg p-2.5">
                        <strong className="block text-lg font-bold text-gray-500">{reportData?.homework?.breakdown?.ABSENT || 0}</strong>
                        <span className="text-gray-400 font-semibold uppercase block">Absent Logs</span>
                      </div>
                      <div className="border rounded-lg p-2.5 bg-yellow-50 border-yellow-100">
                        <strong className="block text-lg font-bold text-yellow-700">{reportData?.homework?.breakdown?.['HW COPY FORGET'] || 0}</strong>
                        <span className="text-yellow-800 font-semibold uppercase block">Forget Copy</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log Details */}
                  <div className="border rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-800 text-base border-b pb-2 flex items-center gap-2">
                      <Activity size={18} className="text-blue-500" />
                      <span>Attendance Register History</span>
                    </h4>
                    <div className="overflow-x-auto max-h-48 border rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase sticky top-0">
                            <th className="py-2 px-4">Date</th>
                            <th className="py-2 px-4">Batch</th>
                            <th className="py-2 px-4">Presence Status</th>
                            <th className="py-2 px-4">Teacher Assigned</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                          {reportData?.attendance?.records?.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-gray-400">
                                No attendance register logs found for the selected period
                              </td>
                            </tr>
                          ) : (
                            reportData?.attendance?.records?.map((rec: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2 px-4">{rec.date}</td>
                                <td className="py-2 px-4">{rec.batch}</td>
                                <td className="py-2 px-4">
                                  <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                    rec.presenceType === 'PRESENT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {rec.presenceType}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-gray-500">{rec.teacherName || '—'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Complaints Log */}
                  <div className="border rounded-xl p-5 space-y-4">
                    <h4 className="font-bold text-gray-800 text-base border-b pb-2 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-yellow-500" />
                      <span>Student Complaints & Observations</span>
                    </h4>
                    {reportData?.complaints?.length === 0 ? (
                      <div className="text-xs text-gray-400 py-3 text-center">No reports or complaints recorded for this student.</div>
                    ) : (
                      <div className="space-y-3">
                        {reportData?.complaints?.map((c: any, idx: number) => (
                          <div key={idx} className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-gray-500">
                              <span>Date: {c.date}</span>
                              <span className="text-red-700 uppercase tracking-wider">{c.status}</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed font-semibold">{c.text}</p>
                            {c.pdf && (
                              <a href={c.pdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline block mt-1">
                                View Linked Observation File &rarr;
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsReportOpen(false)}
                className="bg-gray-600 text-white font-semibold text-sm px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATIONS AUDIT MODAL */}
      {isAuditOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] animate-fade-in print:hidden">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Result Calculation Audit</h3>
              <button onClick={() => setIsAuditOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-gray-700">
              <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-xs space-y-1.5 text-yellow-900">
                <h5 className="font-bold uppercase tracking-wider flex items-center gap-1"><HelpCircle size={14} /> Overall Performance Calculation Formula</h5>
                <p><strong>Overall Score = (Attendance Rate * 0.3) + (Homework Completion Rate * 0.3) + (Exam Result Percentage * 0.4)</strong></p>
                <p className="text-gray-500">Each sub-rating is weighted out of 100 points, yielding a comprehensive aggregate score.</p>
              </div>

              <div className="border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-gray-800 text-sm border-b pb-1.5">Exam Weighting Audited Rows</h4>
                <div className="overflow-x-auto max-h-48 border rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-500 font-bold uppercase sticky top-0">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Test ID</th>
                        <th className="py-2 px-3">Exam Type</th>
                        <th className="py-2 px-3">Sum Obtained</th>
                        <th className="py-2 px-3">Sum Max</th>
                        <th className="py-2 px-3">Weight %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {reportData?.testAudit?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-3 text-gray-400">
                            No test groups registered
                          </td>
                        </tr>
                      ) : (
                        reportData?.testAudit?.map((t: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">{t.examDate}</td>
                            <td className="py-2 px-3">{t.testId}</td>
                            <td className="py-2 px-3">{t.examType}</td>
                            <td className="py-2 px-3">{t.obtainedMarks}</td>
                            <td className="py-2 px-3">{t.maximumMarks}</td>
                            <td className="py-2 px-3 font-bold text-emerald-600">{t.percentage}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-xl p-4 space-y-2.5">
                <h4 className="font-bold text-gray-800 text-sm border-b pb-1.5">Audit Metrics Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><strong>Total Max Marks Available:</strong> {reportData?.results?.totalMaximumMarks}</div>
                  <div><strong>Total Obtained Marks:</strong> {reportData?.results?.totalObtainedMarks}</div>
                  <div><strong>Calculated Result Score:</strong> {reportData?.results?.overallPercentage}%</div>
                  <div><strong>Active Subjects Evaluated:</strong> {reportData?.results?.subjects?.length}</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsAuditOpen(false)}
                className="bg-indigo-600 text-white font-semibold text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY AREA FOR GENERATING PRINT PDF */}
      {reportData && (
        <div id="printArea" className="hidden print:block w-[210mm] min-h-[297mm] p-[15mm] bg-white text-gray-800 font-serif">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold tracking-wider uppercase">THE PRIME CLASSES</h1>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Student Performance Certificate Dossier</p>
          </div>

          {/* Student details */}
          <div className="border border-gray-300 rounded-lg p-4 mb-6 grid grid-cols-2 gap-y-2 text-sm bg-gray-50/50">
            <div><strong>Student ID:</strong> {reportData?.student?.id}</div>
            <div><strong>Student Name:</strong> {reportData?.student?.name}</div>
            <div><strong>Batch Name:</strong> {reportData?.student?.batch}</div>
            <div><strong>Father's Name:</strong> {reportData?.student?.fatherName}</div>
            <div><strong>Evaluation Period:</strong> {fromDate} to {toDate}</div>
            <div><strong>Language mode:</strong> {reportData?.student?.language || '—'}</div>
          </div>

          {/* Performance summary KPI grid */}
          <div className="grid grid-cols-4 gap-4 text-center border-t-2 border-b-2 border-gray-800 py-4 mb-8">
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block">Overall Score</span>
              <strong className="text-3xl font-extrabold">{reportData?.metrics?.overall}</strong>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block">Attendance Rate</span>
              <strong className="text-3xl font-extrabold">{reportData?.metrics?.attendance}%</strong>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block">Homework Avg</span>
              <strong className="text-3xl font-extrabold">{reportData?.metrics?.homework} / 10</strong>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-gray-500 block">Result Average</span>
              <strong className="text-3xl font-extrabold">{reportData?.metrics?.result}%</strong>
            </div>
          </div>

          {/* Subject Performance Details */}
          <div className="mb-6 space-y-3">
            <h3 className="font-bold border-b text-sm uppercase tracking-wider">Subject Rankings</h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-gray-600 font-bold uppercase">
                  <th className="py-2 w-1/3">Subject</th>
                  <th className="py-2">Avg Obtained</th>
                  <th className="py-2">Avg Max</th>
                  <th className="py-2">Subject %</th>
                  <th className="py-2">Tests Evaluated</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-800">
                {reportData?.results?.subjects?.map((sub: any) => (
                  <tr key={sub.subject} className="border-b">
                    <td className="py-2 font-semibold">{sub.subject}</td>
                    <td className="py-2">{sub.avgObtained}</td>
                    <td className="py-2">{sub.avgMax}</td>
                    <td className="py-2 font-bold">{sub.avgPct}%</td>
                    <td className="py-2 text-gray-500">{sub.recordsCounted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Homework and Attendance Register Summary */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="space-y-3">
              <h3 className="font-bold border-b text-sm uppercase tracking-wider">Homework Register</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                <div><strong>Total Homeworks:</strong> {reportData?.homework?.total}</div>
                <div><strong>Completed:</strong> {reportData?.homework?.complete}</div>
                <div><strong>Incomplete:</strong> {reportData?.homework?.incomplete}</div>
                <div><strong>Absences Logged:</strong> {reportData?.homework?.breakdown?.ABSENT || 0}</div>
                <div><strong>Completion Rate:</strong> {reportData?.homework?.completionRate}%</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold border-b text-sm uppercase tracking-wider">Attendance Statistics</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                <div><strong>Total Sessions:</strong> {reportData?.attendance?.total}</div>
                <div><strong>Present:</strong> {reportData?.attendance?.present}</div>
                <div><strong>Absent:</strong> {reportData?.attendance?.absent}</div>
                <div><strong>First Attendance:</strong> {reportData?.attendance?.audit?.firstAttendanceDate}</div>
                <div><strong>Last Attendance:</strong> {reportData?.attendance?.audit?.lastAttendanceDate}</div>
              </div>
            </div>
          </div>

          {/* Observations and Complaints */}
          {reportData?.complaints?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold border-b text-sm uppercase tracking-wider">Academic Observations & Complaints</h3>
              <div className="space-y-2">
                {reportData.complaints.map((c: any, idx: number) => (
                  <div key={idx} className="text-xs border p-2.5 rounded bg-gray-50/50">
                    <div className="flex justify-between font-bold text-gray-500 mb-1">
                      <span>Date: {c.date}</span>
                      <span className="text-red-700">{c.status}</span>
                    </div>
                    <p>{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between mt-20 pt-8 border-t text-xs text-gray-500 text-center font-sans">
            <div className="w-1/3">
              <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
              <span>Class Teacher Signature</span>
            </div>
            <div className="w-1/3">
              <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
              <span>Academic Coordinator Signature</span>
            </div>
            <div className="w-1/3">
              <div className="border-b border-gray-400 w-40 mx-auto mb-2"></div>
              <span>Director's Seal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
