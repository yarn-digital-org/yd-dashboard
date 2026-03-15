import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/meta/lead
 * Server-side Meta Conversions API (CAPI) — sends a Lead event.
 * Used alongside the browser Pixel for deduplication + verification.
 *
 * Required env vars:
 *   META_PIXEL_ID        — your Pixel / Dataset ID
 *   META_ACCESS_TOKEN    — system user or page access token with ads_management permission
 *
 * Body: { email, name, phone?, eventSourceUrl, eventId, fbclid? }
 */

const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function hashPhone(phone: string): string {
  // E.164 normalisation: strip spaces, dashes, parens; keep + prefix
  const normalized = phone.replace(/[\s\-().]/g, '');
  return sha256(normalized);
}

export async function POST(request: NextRequest) {
  try {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          message: 'Meta CAPI not configured. Set META_PIXEL_ID and META_ACCESS_TOKEN env vars.',
        },
        { status: 200 } // 200 so callers don't throw — it's a config warning, not an error
      );
    }

    const body = await request.json();
    const { email, name, phone, eventSourceUrl, eventId, fbclid } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'email required' }, { status: 400 });
    }

    // Build hashed user data (GDPR-safe — never send plain PII)
    const userData: Record<string, string | string[]> = {
      em: sha256(email),
    };

    if (name) {
      const parts = name.trim().split(' ');
      if (parts[0]) userData.fn = sha256(parts[0]);
      if (parts.length > 1) userData.ln = sha256(parts.slice(1).join(' '));
    }

    if (phone) {
      userData.ph = hashPhone(phone);
    }

    // Extract fbc from fbclid if provided (for click attribution)
    if (fbclid) {
      const ts = Math.floor(Date.now() / 1000);
      userData.fbc = `fb.1.${ts}.${fbclid}`;
    }

    // Client IP from headers (for geo matching)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;

    if (clientIp) userData.client_ip_address = clientIp;

    const userAgent = request.headers.get('user-agent');
    if (userAgent) userData.client_user_agent = userAgent;

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId || `lead_${Date.now()}`,
          event_source_url: eventSourceUrl || '',
          action_source: 'website',
          user_data: userData,
        },
      ],
      // test_event_code: 'TEST12345', // Uncomment to test in Meta Events Manager Test Events tab
    };

    const response = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[meta-capi] Error:', JSON.stringify(result));
      return NextResponse.json({ success: false, error: result.error?.message || 'CAPI error' }, { status: 200 });
    }

    console.log('[meta-capi] Lead event sent:', result);
    return NextResponse.json({ success: true, events_received: result.events_received });
  } catch (err: any) {
    console.error('[meta-capi] Unexpected error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 200 });
  }
}
