'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Logo/Brand */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
              YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
            </h1>
          </div>

          <div style={{ backgroundColor: '#F5F5F5', padding: '2rem', borderRadius: '1rem', border: '1px solid #E0E0E0', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1rem' }}>Check Your Email</h2>
            <p style={{ color: '#7A7A7A', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              If an account exists with <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <p style={{ color: '#7A7A7A', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Didn&apos;t receive an email? Check your spam folder or try again.
            </p>
            <Link
              href="/login"
              style={{ display: 'inline-block', backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo/Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
          </h1>
          <p style={{ color: '#7A7A7A', marginTop: '0.5rem' }}>Reset your password</p>
        </div>

        <div style={{ backgroundColor: '#F5F5F5', padding: '2rem', borderRadius: '1rem', border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.5rem', textAlign: 'center' }}>Forgot Password?</h2>
          <p style={{ color: '#7A7A7A', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
            Enter your email and we&apos;ll send you a reset link.
          </p>

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
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 500, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem', opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#7A7A7A', fontSize: '0.875rem' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#FF3300', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
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
