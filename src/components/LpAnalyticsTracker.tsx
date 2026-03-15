'use client';

import { useEffect } from 'react';

interface LpAnalyticsTrackerProps {
  pageId: string;
}

export function LpAnalyticsTracker({ pageId }: LpAnalyticsTrackerProps) {
  useEffect(() => {
    if (!pageId) return;
    const page = `lp-${pageId}`;
    fetch('/api/public/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        referrer: document.referrer || '',
        search: window.location.search || '',
      }),
    }).catch(() => {});
  }, [pageId]);

  return null;
}
