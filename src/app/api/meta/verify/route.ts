import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-middleware';

/**
 * GET /api/meta/verify
 * Checks Meta Pixel + CAPI configuration and returns status.
 * Used in the dashboard to verify pixel is set up correctly.
 */
export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);

    const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const publicPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

    const browserPixelConfigured = !!publicPixelId;
    const capiConfigured = !!(pixelId && accessToken);

    let capiStatus: 'ok' | 'error' | 'unconfigured' = 'unconfigured';
    let capiMessage = '';
    let pixelInfo: any = null;

    // Verify token by fetching pixel info from Graph API
    if (capiConfigured) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${pixelId}?fields=id,name,creation_time&access_token=${accessToken}`,
          { signal: AbortSignal.timeout(5000) }
        );
        const data = await res.json();

        if (res.ok && data.id) {
          capiStatus = 'ok';
          capiMessage = `Connected to pixel: ${data.name || data.id}`;
          pixelInfo = { id: data.id, name: data.name, createdAt: data.creation_time };
        } else {
          capiStatus = 'error';
          capiMessage = data.error?.message || 'Invalid token or pixel ID';
        }
      } catch (err: any) {
        capiStatus = 'error';
        capiMessage = err.message || 'Failed to connect to Meta Graph API';
      }
    }

    return NextResponse.json({
      browserPixel: {
        configured: browserPixelConfigured,
        pixelId: publicPixelId || null,
        status: browserPixelConfigured ? 'ok' : 'unconfigured',
        message: browserPixelConfigured
          ? `Pixel ID ${publicPixelId} loaded on all landing pages`
          : 'Set NEXT_PUBLIC_META_PIXEL_ID to enable browser pixel',
      },
      capi: {
        configured: capiConfigured,
        status: capiStatus,
        message: capiStatus === 'unconfigured'
          ? 'Set META_PIXEL_ID and META_ACCESS_TOKEN to enable server-side CAPI'
          : capiMessage,
        pixelInfo,
      },
      overall: browserPixelConfigured && capiStatus === 'ok'
        ? 'full'
        : browserPixelConfigured || capiStatus === 'ok'
        ? 'partial'
        : 'unconfigured',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
