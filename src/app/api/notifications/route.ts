// Notifications API
// Tracks completions, blockers, and urgent items; delivers to dashboard + Slack

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function requireDb() {
  if (!adminDb) throw new Error('Firebase not initialized');
  return adminDb;
}
import { FieldValue } from 'firebase-admin/firestore';

export interface Notification {
  id: string;
  type: 'task_completed' | 'task_blocked' | 'urgent' | 'review_needed' | 'agent_idle';
  title: string;
  body: string;
  agentId: string;
  agentName: string;
  taskId?: string;
  taskTitle?: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// POST — create a notification (called by agents when they complete/block)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, body: notifBody, agentId, agentName, taskId, taskTitle, priority } = body;

    if (!type || !title || !notifBody || !agentId || !agentName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification: Omit<Notification, 'id'> = {
      type,
      title,
      body: notifBody,
      agentId,
      agentName,
      taskId:    taskId    ?? null,
      taskTitle: taskTitle ?? null,
      read:      false,
      createdAt: new Date().toISOString(),
      priority:  priority ?? 'medium',
    };

    const docRef = await requireDb().collection('notifications').add({
      ...notification,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Also log to activity feed
    await requireDb().collection('activity_feed').add({
      agentId,
      agentName,
      eventType: type === 'task_completed' ? 'task_completed'
               : type === 'task_blocked'   ? 'task_blocked'
               : 'status_change',
      taskId:    taskId    ?? null,
      taskTitle: taskTitle ?? null,
      message:   notifBody,
      severity:  priority === 'critical' ? 'error'
               : priority === 'high'     ? 'warning'
               : priority === 'medium'   ? 'success'
               : 'info',
      createdAt: FieldValue.serverTimestamp(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Notification POST error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// GET — fetch unread / recent notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limitN     = parseInt(searchParams.get('limit') ?? '30', 10);

    let q = requireDb()
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limitN, 100));

    if (unreadOnly) q = (q as any).where('read', '==', false);

    const snapshot = await q.get();
    const notifications: Notification[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Notification, 'id'>),
    }));

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Notification GET error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// PATCH — mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const { ids, all } = await request.json();

    if (all) {
      // Mark all unread as read
      const unreadSnap = await requireDb()
        .collection('notifications')
        .where('read', '==', false)
        .get();

      const batch = requireDb().batch();
      unreadSnap.docs.forEach(doc => batch.update(doc.ref, { read: true }));
      await batch.commit();

      return NextResponse.json({ success: true, marked: unreadSnap.size });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Provide ids array or all:true' }, { status: 400 });
    }

    const batch = requireDb().batch();
    ids.forEach((id: string) => {
      batch.update(requireDb().collection('notifications').doc(id), { read: true });
    });
    await batch.commit();

    return NextResponse.json({ success: true, marked: ids.length });
  } catch (error) {
    console.error('Notification PATCH error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
