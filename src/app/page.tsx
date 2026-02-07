'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to YD Dashboard</h1>
        <p className="text-gray-600 mb-8">Yarn Digital&apos;s CRM and Content Management Platform</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/leads"
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">📋 Leads CRM</h2>
          <p className="text-gray-600">Manage your leads and contacts. Track prospects through your sales pipeline.</p>
        </Link>
        <Link
          href="/content"
          className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <h2 className="text-2xl font-semibold text-purple-600 mb-2">📅 Content Scheduler</h2>
          <p className="text-gray-600">Schedule and manage social media content across platforms.</p>
        </Link>
      </div>
    </div>
  );
}
