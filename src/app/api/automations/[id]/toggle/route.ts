import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// POST - Toggle automation enabled/disabled
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('automations').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const currentData = doc.data();
    const newEnabled = !currentData?.enabled;

    await docRef.update({
      enabled: newEnabled,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      id,
      enabled: newEnabled,
      message: `Automation ${newEnabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error: unknown) {
    console.error('Error toggling automation:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
