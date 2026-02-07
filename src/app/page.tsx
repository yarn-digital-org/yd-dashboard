'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ color: '#7A7A7A' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1rem' }}>
            YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
          </h1>
          <p style={{ color: '#7A7A7A', marginBottom: '2rem' }}>Yarn Digital&apos;s CRM and Content Management Platform</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              href="/login"
              style={{ backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              style={{ backgroundColor: '#F5F5F5', color: '#0A0A0A', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none', border: '1px solid #E0E0E0' }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #E0E0E0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#7A7A7A', margin: '0.25rem 0 0' }}>Welcome back, {user.name || user.email}</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#F5F5F5', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>👥</span>
              <span style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>Total Leads</span>
            </div>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>--</p>
          </div>
          <div style={{ backgroundColor: '#F5F5F5', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📈</span>
              <span style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>Conversions</span>
            </div>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>--</p>
          </div>
          <div style={{ backgroundColor: '#F5F5F5', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📅</span>
              <span style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>Scheduled Posts</span>
            </div>
            <p style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>--</p>
          </div>
        </div>

        {/* Quick Links */}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1rem' }}>Quick Access</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <Link
            href="/leads"
            style={{ backgroundColor: '#F5F5F5', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E0E0E0', textDecoration: 'none', display: 'block' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>👥</span>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Leads CRM</h3>
                <p style={{ color: '#7A7A7A', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Manage leads and track your sales pipeline</p>
              </div>
            </div>
          </Link>
          <Link
            href="/content"
            style={{ backgroundColor: '#F5F5F5', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E0E0E0', textDecoration: 'none', display: 'block' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>📅</span>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0A0A0A', margin: 0 }}>Content Scheduler</h3>
                <p style={{ color: '#7A7A7A', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Schedule social media content across platforms</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
