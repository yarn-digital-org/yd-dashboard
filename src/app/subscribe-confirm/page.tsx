'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SubscribeConfirmContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const email = searchParams.get('email');

  const isSuccess = success === 'true';

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
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 1.5rem', color: '#0A0A0A' }}>
          YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
        </h1>

        {isSuccess ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.75rem' }}>
              You&apos;re subscribed!
            </h2>
            <p style={{ color: '#666', fontSize: '0.9375rem', margin: 0, lineHeight: 1.5 }}>
              {email ? `${email} has been ` : 'You have been '}successfully added to the mailing list.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.75rem' }}>
              Confirmation failed
            </h2>
            <p style={{ color: '#666', fontSize: '0.9375rem', margin: 0, lineHeight: 1.5 }}>
              {error === 'invalid_token'
                ? 'This confirmation link is invalid or has expired.'
                : 'Something went wrong. Please try subscribing again.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscribeConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}><span style={{ color: '#666' }}>Loading...</span></div>}>
      <SubscribeConfirmContent />
    </Suspense>
  );
}
