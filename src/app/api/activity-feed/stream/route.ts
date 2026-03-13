// Server-Sent Events stream for real-time activity feed
// Client subscribes once; new events are pushed as they land in Firestore

import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function requireDb() {
  if (!adminDb) throw new Error('Firebase not initialized');
  return adminDb;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') ?? undefined;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Ping every 25s to keep the connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepAlive);
        }
      }, 25_000);

      let q = requireDb()
        .collection('activity_feed')
        .orderBy('createdAt', 'desc')
        .limit(1); // Only new docs after subscription

      if (agentId) q = (q as any).where('agentId', '==', agentId);

      // Send initial connection event
      const connectMsg = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      unsubscribe = q.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const event = { id: change.doc.id, ...change.doc.data() };
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'activity', event })}\n\n`)
              );
            } catch {
              // Client disconnected
            }
          }
        });
      });

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        if (unsubscribe) unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
      });
    },

    cancel() {
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
