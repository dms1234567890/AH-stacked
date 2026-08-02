'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/api';

interface Requisition {
  id: string;
  timestamp: string;
  requesterEmpId: string;
  requesterDept: string;
  requesterPos: string;
  department: string;
  position: string;
  numCandidates: number;
  salary: string;
  requiredBy: string;
  jobDescription: string;
  candidateRequirements: string;
  status: string;
}

const DEFAULT_DEPARTMENTS = [
  'ACADEMIC', 'ADMINISTRATION', 'ACCOUNTS', 'ADMISSION', 'MARKETING',
  'HR', 'IT & TECH', 'TRANSPORT', 'HOSTEL', 'EXAM & EVALUATION', 'MANAGEMENT'
];

const DEFAULT_POSITIONS = [
  'Faculty / Teacher', 'Senior Teacher', 'Subject Head', 'Telecaller',
  'Academic Counsellor', 'Receptionist / Front Desk', 'Office Assistant',
  'Accountant', 'HR Executive', 'IT Support Engineer', 'Hostel Warden',
  'Transport Manager', 'Lab Assistant', 'DTP Operator'
];

export default function JobRequirementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'roster'>('submit');

  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState<string[]>(DEFAULT_POSITIONS);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    requesterEmpId: '',
    requesterDept: '',
    requesterPos: '',
    department: '',
    positionSelect: '',
    customPosition: '',
    numCandidates: 1,
    salary: '',
    requiredBy: '',
    jobDescription: '',
    candidateRequirements: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Roster Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);

  // Load Bootstrap Data safely
  useEffect(() => {
    fetchBootstrapData();
  }, []);

  // Auto-fill logged-in user details
  useEffect(() => {
    if (user) {
      const u = user as any;
      setFormData((prev) => ({
        ...prev,
        requesterEmpId: prev.requesterEmpId || u.id || '',
        requesterDept: prev.requesterDept || u.department || '',
        requesterPos: prev.requesterPos || u.post || '',
      }));
    }
  }, [user]);

  const fetchBootstrapData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/bootstrap`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
        }
        if (Array.isArray(data.positions) && data.positions.length > 0) {
          setPositions(data.positions);
        }
        if (Array.isArray(data.requisitions)) {
          setRequisitions(data.requisitions);
        }
      }
    } catch (err) {
      console.warn('Backend job requirement bootstrap offline, using defaults:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const position =
      formData.positionSelect === 'Other' ? formData.customPosition : formData.positionSelect;

    if (!formData.requesterEmpId.trim()) {
      setErrorMessage('Please enter your Employee ID.');
      return;
    }
    if (!formData.department || !position) {
      setErrorMessage('Please select Department and Position for the job.');
      return;
    }

    setSubmitting(true);

    const payload = {
      requesterEmpId: formData.requesterEmpId.toUpperCase().trim(),
      requesterDept: formData.requesterDept,
      requesterPos: formData.requesterPos,
      department: formData.department,
      position,
      numCandidates: Number(formData.numCandidates) || 1,
      salary: formData.salary,
      requiredBy: formData.requiredBy,
      jobDescription: formData.jobDescription,
      candidateRequirements: formData.candidateRequirements,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage('Job Requirement submitted successfully!');
        setFormData({
          requesterEmpId: user?.id || '',
          requesterDept: (user as any)?.department || '',
          requesterPos: user?.post || '',
          department: '',
          positionSelect: '',
          customPosition: '',
          numCandidates: 1,
          salary: '',
          requiredBy: '',
          jobDescription: '',
          candidateRequirements: '',
        });
        fetchBootstrapData();
        setTimeout(() => setActiveTab('roster'), 1500);
      } else {
        setErrorMessage('Failed to submit requisition. Please try again.');
      }
    } catch (err) {
      console.error('Submit requisition error:', err);
      setErrorMessage('Network error while submitting requisition. Please check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Roster
  const filteredRequisitions = requisitions.filter((r) => {
    if (deptFilter !== 'ALL' && r.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmp = (r.requesterEmpId || '').toLowerCase().includes(q);
      const matchPos = (r.position || '').toLowerCase().includes(q);
      const matchDept = (r.department || '').toLowerCase().includes(q);
      const matchDesc = (r.jobDescription || '').toLowerCase().includes(q);
      if (!matchEmp && !matchPos && !matchDept && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase mb-1">
            <span>PRIME CLASSES</span>
            <span>•</span>
            <span>HR & Staffing Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>💼</span> Job Requisition Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Submit new hiring requirements and track open job vacancies across all departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/grievance"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center gap-2"
          >
            <span>📩</span> Grievance Portal
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>📝</span> Submit Job Requirement
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>📋</span> Requisitions Roster ({requisitions.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'submit' ? (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-cyan-400">📝</span> नई नौकरी की रिक्वायरमेंट दर्ज करें (Job Requisition Form)
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Requester's Info Section */}
              <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>👤</span> 1. रिक्वेस्ट करने वाले की जानकारी (Requester Information)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      आपका एम्प्लॉई आईडी (Your Employee ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-101"
                      value={formData.requesterEmpId}
                      onChange={(e) => setFormData({ ...formData, requesterEmpId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      आपका विभाग (Your Department)
                    </label>
                    <select
                      value={formData.requesterDept}
                      onChange={(e) => setFormData({ ...formData, requesterDept: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- अपना विभाग चुनें --</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      आपका पद (Your Position)
                    </label>
                    <select
                      value={formData.requesterPos}
                      onChange={(e) => setFormData({ ...formData, requesterPos: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- अपना पद चुनें --</option>
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Job Info Section */}
              <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>💼</span> 2. नौकरी की जानकारी (Job & Candidate Details)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      किस विभाग के लिए पद है (Department for Job) *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                      required
                    >
                      <option value="">-- एक विभाग चुनें --</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      पद (Position) *
                    </label>
                    <select
                      value={formData.positionSelect}
                      onChange={(e) => setFormData({ ...formData, positionSelect: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium"
                      required
                    >
                      <option value="">-- एक पद चुनें --</option>
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                      <option value="Other">कस्टम / अन्य (Custom / Other)</option>
                    </select>
                  </div>

                  {formData.positionSelect === 'Other' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                        कस्टम पद का नाम लिखें (Custom Position Name) *
                      </label>
                      <input
                        type="text"
                        placeholder="जैसे: Senior Physics Faculty, Graphic Designer..."
                        value={formData.customPosition}
                        onChange={(e) => setFormData({ ...formData, customPosition: e.target.value })}
                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      उम्मीदवारों की संख्या (Number of Candidates) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="जैसे: 2"
                      value={formData.numCandidates}
                      onChange={(e) => setFormData({ ...formData, numCandidates: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      मासिक सैलरी (Monthly Salary in INR) *
                    </label>
                    <input
                      type="text"
                      placeholder="जैसे: 50,000 / month"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      कब तक चाहिए (Required By Date) *
                    </label>
                    <input
                      type="date"
                      value={formData.requiredBy}
                      onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      नौकरी का विवरण (Job Description) *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe key responsibilities and duties of this role..."
                      value={formData.jobDescription}
                      onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      उम्मीदवार से अपेक्षाएं (Candidate Requirements & Skills) *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Specify required experience, qualifications, language skills, etc..."
                      value={formData.candidateRequirements}
                      onChange={(e) => setFormData({ ...formData, candidateRequirements: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-cyan-500"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Submitting Requirement...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> रिक्वायरमेंट सबमिट करें (Submit Requisition)
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by Emp ID, Position, Description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Department
                  </label>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchBootstrapData}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
                  >
                    🔄 Refresh List
                  </button>
                </div>
              </div>
            </div>

            {/* Requisitions List */}
            {loading ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="animate-spin text-3xl mb-2 text-cyan-400">⏳</div>
                <div className="text-slate-400 text-sm">Loading Job Requisitions...</div>
              </div>
            ) : filteredRequisitions.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="text-4xl mb-2">📭</div>
                <div className="text-white font-semibold mb-1">No Requisitions Found</div>
                <div className="text-slate-400 text-sm">No job requirements match your search criteria.</div>
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Requester</th>
                        <th className="p-4">Target Job & Dept</th>
                        <th className="p-4">Candidates</th>
                        <th className="p-4">Salary</th>
                        <th className="p-4">Required By</th>
                        <th className="p-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredRequisitions.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 text-xs text-slate-400 font-mono">{req.timestamp}</td>
                          <td className="p-4">
                            <div className="font-semibold text-cyan-300">{req.requesterEmpId || 'N/A'}</div>
                            <div className="text-xs text-slate-400">
                              {req.requesterDept} {req.requesterPos ? `• ${req.requesterPos}` : ''}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">{req.position}</div>
                            <div className="text-xs text-slate-400">{req.department}</div>
                          </td>
                          <td className="p-4 font-bold text-emerald-400">{req.numCandidates} Openings</td>
                          <td className="p-4 text-slate-300">{req.salary || 'N/A'}</td>
                          <td className="p-4 text-xs text-slate-300 font-medium">{req.requiredBy || 'ASAP'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedReq(req)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
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

      {/* Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{selectedReq.id}</span>
                <h3 className="text-xl font-extrabold text-white">{selectedReq.position}</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Requester ID</div>
                  <div className="text-white font-medium">{selectedReq.requesterEmpId}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Job Department</div>
                  <div className="text-cyan-300 font-semibold">{selectedReq.department}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Candidates Required</div>
                  <div className="text-emerald-400 font-bold">{selectedReq.numCandidates} Candidate(s)</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-semibold">Required By Date</div>
                  <div className="text-white">{selectedReq.requiredBy || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Job Description</div>
                <div className="text-slate-200 whitespace-pre-wrap">{selectedReq.jobDescription}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Candidate Requirements</div>
                <div className="text-slate-200 whitespace-pre-wrap">{selectedReq.candidateRequirements}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReq(null)}
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
