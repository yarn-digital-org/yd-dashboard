import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Calendar Event type definitions
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  type: 'meeting' | 'deadline' | 'reminder' | 'other';
  color: string;
  allDay: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// GET - List events with optional month filter
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format
    const type = searchParams.get('type');

    let query: FirebaseFirestore.Query = adminDb.collection('calendar_events').orderBy('date', 'asc');

    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-31`;
      
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.get();
    let events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as CalendarEvent[];

    // Filter by type (post-query)
    if (type && type !== 'all') {
      events = events.filter(e => e.type === type);
    }

    return NextResponse.json({
      events,
      total: events.length
    });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const data = await request.json();
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      type,
      color,
      allDay,
      userId
    } = data;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const event: Omit<CalendarEvent, 'id'> = {
      title: title.trim(),
      description: description?.trim() || '',
      date,
      startTime: startTime || '',
      endTime: endTime || '',
      type: type || 'other',
      color: color || '#FF3300',
      allDay: allDay ?? true,
      userId: userId || 'system',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('calendar_events').add(event);

    return NextResponse.json({
      id: docRef.id,
      ...event,
      message: 'Event created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
