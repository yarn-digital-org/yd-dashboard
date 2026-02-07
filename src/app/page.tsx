'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ color: '#7A7A7A' }}>Loading...</div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
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
