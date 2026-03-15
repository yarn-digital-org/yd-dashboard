'use client';

/**
 * MetaPixel — shared client component
 * Injects the Meta Pixel snippet and exports helpers for event tracking.
 *
 * Usage:
 *   <MetaPixel />   — place in page layout/body
 *   trackLead(data) — call on form submit
 */

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

interface MetaPixelProps {
  /** Override pixel ID (default: NEXT_PUBLIC_META_PIXEL_ID env var) */
  pixelId?: string;
}

export default function MetaPixel({ pixelId: propPixelId }: MetaPixelProps = {}) {
  const [pixelId, setPixelId] = useState<string | null>(null);

  useEffect(() => {
    const id = propPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (id) setPixelId(id);
  }, [propPixelId]);

  if (!pixelId) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

/**
 * Fire a browser-side Lead event.
 * Pass the same eventId to your CAPI call for deduplication.
 */
export function trackPixelLead(eventId?: string) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {}, eventId ? { eventID: eventId } : undefined);
  }
}

/**
 * Fire Lead event via both browser Pixel and Meta CAPI (server-side).
 * Deduplication: Meta matches events by eventId — both fire but only count once.
 */
export async function trackLead({
  email,
  name,
  phone,
  eventSourceUrl,
}: {
  email: string;
  name?: string;
  phone?: string;
  eventSourceUrl?: string;
}) {
  const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const url = eventSourceUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // 1. Browser pixel (immediate, async)
  trackPixelLead(eventId);

  // 2. CAPI (server-side, for verification + ad blocker coverage)
  try {
    // fbclid from URL params
    const fbclid = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('fbclid') || undefined
      : undefined;

    await fetch('/api/meta/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone, eventSourceUrl: url, eventId, fbclid }),
    });
  } catch {
    // Non-fatal — browser pixel already fired
  }
}
