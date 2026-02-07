'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
          </h1>
          <p style={{ color: '#7A7A7A', marginTop: '0.5rem' }}>Sign in to your account</p>
        </div>

        <div style={{ backgroundColor: '#F5F5F5', padding: '2rem', borderRadius: '1rem', border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>
          
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0A0A0A', fontSize: '1rem', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                <Link href="/forgot-password" style={{ color: '#FF3300', fontSize: '0.75rem', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0A0A0A', fontSize: '1rem', boxSizing: 'border-box' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#7A7A7A', fontSize: '0.875rem' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#FF3300', fontWeight: 500, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: '#7A7A7A', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </div>
    </div>
  );
}
