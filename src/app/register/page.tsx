'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

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

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
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
          <p style={{ color: '#7A7A7A', marginTop: '0.5rem' }}>Create your account</p>
        </div>

        <div style={{ backgroundColor: '#F5F5F5', padding: '2rem', borderRadius: '1rem', border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '1.5rem', textAlign: 'center' }}>Get Started</h2>
          
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0A0A0A', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
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
              <label style={{ display: 'block', color: '#0A0A0A', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', color: '#0A0A0A', fontSize: '1rem', boxSizing: 'border-box' }}
                required
              />
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#7A7A7A', fontSize: '0.75rem', lineHeight: '1.5' }}>
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: '#FF3300', textDecoration: 'none' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#FF3300', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#7A7A7A', fontSize: '0.875rem' }}>
            Already have an account?{' '}
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
