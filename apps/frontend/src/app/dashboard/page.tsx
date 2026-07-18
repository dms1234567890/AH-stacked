'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl p-6 md:p-10">
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg mb-6 shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
            <div><strong>Name:</strong> <span id="user-name">{user.name}</span></div>
            <div><strong>ID:</strong> <span id="user-id">{user.id}</span></div>
            <div><strong>Post:</strong> <span id="user-post">{user.post}</span></div>
            <div><strong>Email:</strong> <span id="user-email">{user.email || 'N/A'}</span></div>
            <div><strong>Mobile:</strong> <span id="user-mobile">{user.mobile || 'N/A'}</span></div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          <a href="/classes"
             className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            CLASSES MANAGE
          </a>
          <a href="/heads"
             className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            HEADS MANAGE
          </a>
          <a href="/tasks"
             className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            TASK MANAGE
          </a>
          <a href="/performance"
             className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            PERFORMANCE
          </a>
          <a href="https://script.google.com/macros/s/AKfycbx7AVQNfzBWkeb90fOyrL5knQGNBSI2hBBkfzb6my_0pe-PH5IzSLBoigSFj1KbKT5jwQ/exec"
             target="_blank" rel="noopener noreferrer"
             className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            EXAM SECTION
          </a>
          <a href="/students"
             className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            STUDENTS MANAGE
          </a>
          <button onClick={() => openExternal('https://classplusapp.com/diy/login')}
             className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg shadow">
            CLASSPLUS LOGIN
          </button>
          <a href="https://script.google.com/macros/s/AKfycbwccBgWzNkrYOs5XQVM7PBN2umTVNUZk9ZMA8x9DJbVmNOZaNI7q46eczSEbnOTZbdd/exec"
             target="_blank" rel="noopener noreferrer"
             className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            FOR GRIEVANCE DEPARTMENT
          </a>
          <a href="https://script.google.com/macros/s/AKfycbz1lCEVseoDkLizFlOHR3U5YOjfTyro8-TdBjnbTn4YKlVKCpEC8dlXIAvkzpaXR_Yu/exec"
             target="_blank" rel="noopener noreferrer"
             className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-4 rounded-lg shadow text-center">
            JOB REQUIREMENT
          </a>
          <a href="https://script.google.com/macros/s/AKfycbxMWgrK3NBYdSyc_9oQ1PwHZ94os5vdozZZRQ-XXfAC4YFVTg2Rnhso-uv3fupwEsbA/exec"
             target="_blank" rel="noopener noreferrer"
             className="bg-black text-white font-semibold py-3 px-4 rounded-lg border border-neutral-800 shadow-lg hover:bg-neutral-900 text-center">
            DAILY ALERTS
          </a>
          <button onClick={logout}
             className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg shadow">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}