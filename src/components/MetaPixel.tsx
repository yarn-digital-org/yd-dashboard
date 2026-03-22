'use client';

/**
 * MetaPixel — shared client component
 * Injects the Meta Pixel snippet and exports helpers for event tracking.
 *
 * Fix (2026-03-22): Rewrote to use next/script with strategy="afterInteractive"
 * so the pixel initialises as early as possible after hydration and properly
 * captures fbclid from the URL into the _fbc cookie for Meta ad attribution.
 *
 * Root cause of zero lead attribution: the old implementation used
 * dangerouslySetInnerHTML inside a React render — Next.js does NOT execute
 * <script> tags injected this way. fbq was never actually initialised.
 *
 * Usage:
 *   <MetaPixel />   — place in page layout/body
 *   trackLead(data) — call on form submit
 */

import Script from 'next/script';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      {/* Meta Pixel base code — next/script executes this properly */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
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
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Noscript fallback */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
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
 *
 * fbclid is read at call time (form submit) — by this point fbq('init') has
 * already captured it into the _fbc cookie, so attribution should flow through.
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

  // 1. Browser pixel (immediate)
  trackPixelLead(eventId);

  // 2. CAPI (server-side — deduplication + ad blocker coverage)
  try {
    // fbclid from URL params — also passed to CAPI to build fbc for server-side attribution
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
