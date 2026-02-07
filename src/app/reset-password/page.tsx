'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1rem' }}>Password Reset!</h2>
            <p style={{ color: '#7A7A7A', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Your password has been reset successfully. Redirecting you to login...
            </p>
            <Link
              href="/login"
              style={{ display: 'inline-block', backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1rem' }}>Invalid Link</h2>
            <p style={{ color: '#7A7A7A', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              style={{ display: 'inline-block', backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 500, textDecoration: 'none' }}
            >
              Request New Link
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
          <p style={{ color: '#7A7A7A', marginTop: '0.5rem' }}>Create a new password</p>
        </div>

        <div style={{ backgroundColor: '#F5F5F5', padding: '2rem', borderRadius: '1rem', border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h2>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0A0A0A', fontSize: '1rem', boxSizing: 'border-box' }}
                required
              />
              <p style={{ color: '#7A7A7A', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Min 8 characters, with uppercase, lowercase, and number
              </p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ color: '#7A7A7A' }}>Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
