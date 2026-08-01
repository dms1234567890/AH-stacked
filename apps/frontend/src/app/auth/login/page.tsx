'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (!err?.response) {
        setError('Authentication service is unavailable. Start the backend on port 3001 and try again.');
      } else if (status === 404) {
        setError('Authentication service is unavailable on port 3001. Check that the Nest backend is running.');
      } else if (status >= 500) {
        setError('Authentication service could not complete the request. Check the backend connection and try again.');
      } else {
        setError(message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://content.jdmagicbox.com/comp/gwalior/z3/9999px751.x751.190227154234.i9z3/catalogue/the-prime-classes-deen-dayal-nagar-gwalior-military-schools-ekri38mt5y.jpg"
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{
            background: 'linear-gradient(to right, #10B981, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ACADEMIC MANAGER LOGIN
        </h1>

        {/* Login Card */}
        <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 p-6 rounded-lg shadow-md border">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your username"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white bg-gradient-to-r from-green-500 to-purple-600 font-medium rounded-lg text-sm px-5 py-2.5 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
