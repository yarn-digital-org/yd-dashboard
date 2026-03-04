import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// GET - Get single event by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const doc = await adminDb.collection('calendar_events').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error: any) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const data = await request.json();

    const docRef = adminDb.collection('calendar_events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate date format if provided
    if (data.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
      }
    }

    // Build update object
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    const allowedFields = [
      'title', 'description', 'date', 'startTime', 'endTime',
      'type', 'color', 'allDay'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (typeof data[field] === 'string' && field !== 'date' && field !== 'startTime' && field !== 'endTime') {
          updates[field] = data[field].trim();
        } else {
          updates[field] = data[field];
        }
      }
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    return NextResponse.json({
      id: updated.id,
      ...updated.data(),
      message: 'Event updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { id } = await params;
    const docRef = adminDb.collection('calendar_events').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      message: 'Event deleted successfully',
      id
    });
  } catch (error: any) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
