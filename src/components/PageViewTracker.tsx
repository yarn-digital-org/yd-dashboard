'use client';

import { useEffect } from 'react';

/**
 * Drop this into any landing page to track views.
 * Fires once on mount. No Suspense boundary needed.
 */
export default function PageViewTracker({ page }: { page: string }) {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      fetch('/api/public/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          referrer: document.referrer || '',
          utm_source: params.get('utm_source') || '',
          utm_medium: params.get('utm_medium') || '',
          utm_campaign: params.get('utm_campaign') || '',
        }),
      }).catch(() => {});
    } catch {
      // Never break the page
    }
  }, [page]);

  return null;
}
