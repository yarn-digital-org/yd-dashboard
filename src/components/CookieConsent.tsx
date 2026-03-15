'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  // Hide on public landing pages
  const isPublicPage = ['/free-audit'].some(p => pathname?.startsWith(p));

  useEffect(() => {
    if (isPublicPage) return;
    // Check if consent was already given
    const consent = document.cookie
      .split('; ')
      .find((c) => c.startsWith('cookie_consent='));
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    // Set cookie_consent for 1 year
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `cookie_consent=accepted; expires=${expires}; path=/; SameSite=Strict`;
    setVisible(false);
  };

  const declineCookies = () => {
    // Set minimal cookie to remember decline
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `cookie_consent=declined; expires=${expires}; path=/; SameSite=Strict`;
    setVisible(false);
  };

  if (!visible || isPublicPage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1F2937',
        color: '#FFFFFF',
        padding: '1rem 1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', flex: '1 1 300px' }}>
        We use essential cookies to keep you logged in and provide our service.
        No tracking or analytics cookies are used.
        Read our{' '}
        <Link href="/privacy" style={{ color: '#FF8866', textDecoration: 'underline' }}>
          Privacy Policy
        </Link>{' '}
        for more information.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={declineCookies}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #6B7280',
            backgroundColor: 'transparent',
            color: '#D1D5DB',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Decline
        </button>
        <button
          onClick={acceptCookies}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: '#FF3300',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
