'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Complaint {
  complaintId: string;
  studentId?: string;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  parentEmail?: string;
  complainantName?: string;
  complainantRelation?: string;
  complainantMobile?: string;
  department: string;
  complaintType?: string;
  complaintText: string;
  priority: string;
  status: string;
  assignedTo?: string;
  hodResponse?: string;
  employeeResponse?: string;
  createdDate?: string;
  lastUpdated?: string;
  resolutionDate?: string;
}

interface Student {
  id: string;
  studentId: string;
  studentName: string;
  fatherName?: string;
  motherName?: string;
  mobileNumbers?: string;
  email?: string;
  batch?: { name: string };
}

export default function ComplaintPage() {
  const [activeTab, setActiveTab] = useState<'register' | 'roster'>('register');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Student search state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    parentEmail: '',
    complainantName: '',
    complainantRelation: 'Father',
    complainantMobile: '',
    department: 'ACADEMIC',
    complaintType: 'Academic Issue',
    priority: 'NORMAL',
    complaintText: '',
  });

  // Filter State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Fetch Complaints on mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/grievance/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Live Student Search
  useEffect(() => {
    if (!studentSearch || studentSearch.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingStudents(true);
      try {
        const res = await fetch(`http://localhost:3001/api/v1/students?search=${encodeURIComponent(studentSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setStudentResults(Array.isArray(data) ? data.slice(0, 8) : []);
        }
      } catch (err) {
        console.error('Student search failed:', err);
      } finally {
        setSearchingStudents(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData((prev) => ({
      ...prev,
      studentId: student.studentId || '',
      studentName: student.studentName || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      parentEmail: student.email || '',
      complainantName: prev.complainantName || student.fatherName || student.studentName || '',
      complainantMobile: prev.complainantMobile || student.mobileNumbers || '',
    }));
    setStudentSearch(`${student.studentName} (${student.studentId})`);
    setStudentResults([]);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complaintText.trim()) {
      setErrorMessage('Please provide complaint description text.');
      return;
    }

    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('http://localhost:3001/api/v1/grievance/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const created = await res.json();
        setSuccessMessage(`Complaint Registered Successfully! Complaint ID: ${created.complaintId}`);
        setFormData({
          studentId: '',
          studentName: '',
          fatherName: '',
          motherName: '',
          parentEmail: '',
          complainantName: '',
          complainantRelation: 'Father',
          complainantMobile: '',
          department: 'ACADEMIC',
          complaintType: 'Academic Issue',
          priority: 'NORMAL',
          complaintText: '',
        });
        setSelectedStudent(null);
        setStudentSearch('');
        fetchComplaints();
        setTimeout(() => setActiveTab('roster'), 1500);
      } else {
        setErrorMessage('Failed to register complaint. Please try again.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage('Network error while submitting complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Roster
  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && c.department !== deptFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = (c.complaintId || '').toLowerCase().includes(q);
      const matchStudent = (c.studentName || '').toLowerCase().includes(q);
      const matchMobile = (c.complainantMobile || '').toLowerCase().includes(q);
      const matchText = (c.complaintText || '').toLowerCase().includes(q);
      if (!matchId && !matchStudent && !matchMobile && !matchText) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>;
      case 'IN PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">RESOLVED</span>;
      case 'CANNOT RESOLVE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">CANNOT RESOLVE</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'HIGH PRIORITY') {
      return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">🔥 HIGH</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">NORMAL</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-1">
            <span>PRIME CLASSES</span>
            <span>•</span>
            <span>Grievance Department</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>📩</span> Complaint Management Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Register, assign, and track student & parent grievances in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/grievance"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            ← Grievance Dept
          </Link>
          <Link
            href="/calling"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-2"
          >
            <span>📞</span> Calling Roster
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>📝</span> Register Complaint
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>📋</span> Complaint Roster ({complaints.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'register' ? (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-indigo-400">📝</span> Register New Student / Parent Complaint
            </h2>

            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>{successMessage}</div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              {/* Student Lookup Section */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 relative">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  1. Search & Select Student (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type Student Name or Student ID (e.g. 2602050003)..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  {searchingStudents && (
                    <div className="absolute right-3 top-3 text-xs text-indigo-400 animate-pulse">Searching...</div>
                  )}
                </div>

                {/* Dropdown Search Results */}
                {studentResults.length > 0 && (
                  <div className="absolute left-5 right-5 z-20 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                    {studentResults.map((st) => (
                      <div
                        key={st.id || st.studentId}
                        onClick={() => handleSelectStudent(st)}
                        className="p-3 hover:bg-indigo-600/20 cursor-pointer border-b border-slate-800 text-sm flex items-center justify-between transition"
                      >
                        <div>
                          <div className="font-semibold text-white">{st.studentName}</div>
                          <div className="text-xs text-slate-400">ID: {st.studentId} | Father: {st.fatherName || 'N/A'}</div>
                        </div>
                        <div className="text-xs text-indigo-400 font-medium">Select →</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="Student ID (e.g., 2602050003)"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Student Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full Student Name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Complainant Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name of person lodging complaint"
                    value={formData.complainantName}
                    onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Complainant Relation
                  </label>
                  <select
                    value={formData.complainantRelation}
                    onChange={(e) => setFormData({ ...formData, complainantRelation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Student">Student (Self)</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Complainant Mobile Number *
                  </label>
                  <input
                    type="text"
                    placeholder="10-digit Mobile Number"
                    value={formData.complainantMobile}
                    onChange={(e) => setFormData({ ...formData, complainantMobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Target Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="ACADEMIC">ACADEMIC (Teaching & Curriculum)</option>
                    <option value="ACCOUNTS">ACCOUNTS (Fees & Receipts)</option>
                    <option value="ADMISSION">ADMISSION (Registration & Batching)</option>
                    <option value="TRANSPORT">TRANSPORT (Bus & Van Routes)</option>
                    <option value="MANAGEMENT">MANAGEMENT (Administration)</option>
                    <option value="HOSTEL">HOSTEL (Accommodation)</option>
                    <option value="EXAM">EXAM (Marks & Tests)</option>
                    <option value="MISC">MISC (Other Enquiries)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH PRIORITY">🔥 HIGH PRIORITY (Urgent Action Needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Parent Email (For Updates)
                  </label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Complaint Details & Specific Notes *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the complaint or grievance in detail..."
                  value={formData.complaintText}
                  onChange={(e) => setFormData({ ...formData, complaintText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Registering Complaint...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Submit & Register Complaint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Roster Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="ID, Student Name, Mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CANNOT RESOLVE">CANNOT RESOLVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Department
                  </label>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="ACCOUNTS">ACCOUNTS</option>
                    <option value="ADMISSION">ADMISSION</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="MANAGEMENT">MANAGEMENT</option>
                    <option value="HOSTEL">HOSTEL</option>
                    <option value="EXAM">EXAM</option>
                    <option value="MISC">MISC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH PRIORITY">HIGH PRIORITY</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Complaints List Table */}
            {loading ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="animate-spin text-3xl mb-2 text-indigo-400">⏳</div>
                <div className="text-slate-400 text-sm">Loading Grievance Complaints...</div>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-white font-semibold mb-1">No Complaints Found</div>
                <div className="text-slate-400 text-sm">Try adjusting your filters or search terms.</div>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Complaint ID</th>
                        <th className="p-4">Student & Complainant</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredComplaints.map((c) => (
                        <tr key={c.complaintId} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono font-bold text-indigo-300">{c.complaintId}</td>
                          <td className="p-4">
                            <div className="font-semibold text-white">{c.studentName || 'N/A'}</div>
                            <div className="text-xs text-slate-400">
                              {c.complainantName} ({c.complainantRelation || 'Parent'}) • {c.complainantMobile || 'No Phone'}
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-300">{c.department}</td>
                          <td className="p-4">{getPriorityBadge(c.priority)}</td>
                          <td className="p-4">{getStatusBadge(c.status)}</td>
                          <td className="p-4 text-xs text-slate-400">{c.createdDate || 'Recent'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedComplaint(c)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">{selectedComplaint.complaintId}</span>
                <h3 className="text-xl font-extrabold text-white">{selectedComplaint.studentName}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Department</div>
                  <div className="text-white font-medium">{selectedComplaint.department}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Priority</div>
                  <div>{getPriorityBadge(selectedComplaint.priority)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Status</div>
                  <div>{getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Created Date</div>
                  <div className="text-white">{selectedComplaint.createdDate || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Complainant Contact</div>
                <div className="text-white font-medium">
                  {selectedComplaint.complainantName} ({selectedComplaint.complainantRelation})
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">📞 {selectedComplaint.complainantMobile || 'N/A'}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Complaint Details</div>
                <div className="text-slate-200 whitespace-pre-wrap">{selectedComplaint.complaintText}</div>
              </div>

              {selectedComplaint.hodResponse && (
                <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-500/30">
                  <div className="text-xs text-emerald-400 uppercase font-semibold mb-1">HOD Response</div>
                  <div className="text-emerald-200">{selectedComplaint.hodResponse}</div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
