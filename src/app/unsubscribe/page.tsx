'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setMessage(error === 'missing_token' ? 'Invalid unsubscribe link.' : 'Something went wrong.');
    }
  }, [error]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/public/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setMessage(data.message || 'You have been unsubscribed.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f9f9f9', fontFamily: 'Inter, sans-serif',
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px',
        border: '1px solid #e5e5e5', padding: '2.5rem',
        maxWidth: '480px', width: '100%', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.75rem', color: '#0A0A0A' }}>
          YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
        </h1>

        {status === 'done' ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.5rem' }}>
              Unsubscribed
            </h2>
            <p style={{ color: '#666', fontSize: '0.9375rem', margin: 0, lineHeight: 1.5 }}>
              {message}
            </p>
          </>
        ) : status === 'error' ? (
          <>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.5rem' }}>
              Invalid link
            </h2>
            <p style={{ color: '#666', fontSize: '0.9375rem', margin: 0 }}>{message}</p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.75rem' }}>
              Unsubscribe
            </h2>
            <p style={{ color: '#666', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Click below to unsubscribe from this mailing list. You won't receive any more emails from this list.
            </p>
            {token ? (
              <button
                onClick={handleUnsubscribe}
                disabled={status === 'loading'}
                style={{
                  backgroundColor: '#0A0A0A', color: '#fff',
                  border: 'none', padding: '0.875rem 2rem',
                  borderRadius: '8px', fontSize: '0.9375rem',
                  fontWeight: 600, cursor: 'pointer',
                  width: '100%', opacity: status === 'loading' ? 0.6 : 1,
                }}
              >
                {status === 'loading' ? 'Processing...' : 'Confirm Unsubscribe'}
              </button>
            ) : (
              <p style={{ color: '#999', fontSize: '0.875rem' }}>No unsubscribe token found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}><span style={{ color: '#666' }}>Loading...</span></div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
