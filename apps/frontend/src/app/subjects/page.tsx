'use client';

import { useState } from 'react';
import { useSubjects } from '@/lib/hooks';
import { subjectsApi } from '@/lib/api';

export default function SubjectsPage() {
  const [activeSection, setActiveSection] = useState('list');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: subjects, isLoading, isError, error, refetch } = useSubjects();

  const generateCode = (name: string) => {
    if (!name.trim()) return '';
    const words = name.trim().toUpperCase().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 4);
    return words.map(w => w[0]).join('').substring(0, 4);
  };

  const handleNameChange = (value: string) => {
    setNewSubjectName(value);
    const code = generateCode(value);
    setNewSubjectCode(code);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await subjectsApi.create({
        name: newSubjectName.trim(),
        code: newSubjectCode || generateCode(newSubjectName),
      });
      setNewSubjectName('');
      setNewSubjectCode('');
      setSaveSuccess(true);
      refetch();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Subject Management</h1>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="text-blue-600 hover:underline text-sm">Refresh</button>
            <button onClick={() => window.location.href = '/dashboard'} className="text-blue-600 hover:underline text-sm">← Back to Dashboard</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setActiveSection('add')}
            className={`px-4 py-2 rounded font-medium ${activeSection === 'add' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
            Add New Subject
          </button>
          <button onClick={() => setActiveSection('list')}
            className={`px-4 py-2 rounded font-medium ${activeSection === 'list' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            View Subjects
          </button>
        </div>

        {/* Add Subject */}
        {activeSection === 'add' && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-4">Add New Subject</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="border p-2 rounded w-full"
                  placeholder="Enter subject name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Auto-generated)</label>
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="border p-2 rounded w-full bg-gray-100"
                  placeholder="Auto-generated"
                />
              </div>
            </div>
            <button
              onClick={handleAddSubject}
              disabled={saving || !newSubjectName.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Subject'}
            </button>
            {saveSuccess && <p className="text-green-600 text-sm mt-2">Subject added successfully!</p>}
            {saveError && <p className="text-red-600 text-sm mt-2">{saveError}</p>}
          </div>
        )}

        {/* Subject List */}
        {activeSection === 'list' && (
          <div className="p-4 bg-gray-50 rounded-lg min-h-[200px]">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Loading subjects...</span>
              </div>
            )}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">Failed to load subjects. {(error as any)?.message}</p>
                <button onClick={() => refetch()} className="mt-2 text-red-700 underline text-sm">Retry</button>
              </div>
            )}
            {subjects && subjects.length === 0 && (
              <p className="text-gray-500 text-center py-8">No subjects found. Add a new subject to get started.</p>
            )}
            {subjects && subjects.length > 0 && (
              <div className="grid gap-2">
                {subjects.map((subject: any) => (
                  <div key={subject.id} className="border rounded-lg p-3 bg-white flex items-center justify-between hover:shadow-sm transition">
                    <div>
                      <span className="font-medium">{subject.name}</span>
                      <span className="ml-2 text-sm text-gray-500 font-mono">({subject.code})</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${subject.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {subject.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}