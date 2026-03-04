import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireDb } from '@/lib/api-middleware';

const querySchema = z.object({
  userId: z.string(),
  appointmentTypeId: z.string(),
  date: z.string(), // YYYY-MM-DD
});

// GET - Get available time slots for a specific date (public route)
export async function GET(request: NextRequest) {
  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);

    const params = {
      userId: searchParams.get('userId'),
      appointmentTypeId: searchParams.get('appointmentTypeId'),
      date: searchParams.get('date'),
    };

    const validated = querySchema.parse(params);

    // Fetch appointment type
    const appointmentTypeDoc = await db
      .collection('appointmentTypes')
      .doc(validated.appointmentTypeId)
      .get();

    if (!appointmentTypeDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    const appointmentType = appointmentTypeDoc.data();
    if (!appointmentType?.isActive) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch availability settings
    const availabilityDoc = await db
      .collection('availabilitySettings')
      .doc(validated.userId)
      .get();

    const availability = availabilityDoc.data() || {
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      breakTimes: [],
      bufferMinutes: 15,
    };

    // Check if date is a working day
    const date = new Date(validated.date);
    const dayOfWeek = date.getDay();

    if (!availability.workingDays.includes(dayOfWeek)) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Check if date is blocked
    if (availability.blockedDates?.includes(validated.date)) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Generate time slots
    const slots: string[] = [];
    const [startHour, startMin] = availability.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = availability.workingHours.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const slotDuration = appointmentType.durationMinutes;
    const bufferMinutes = appointmentType.bufferMinutes || availability.bufferMinutes || 0;

    for (
      let minutes = startMinutes;
      minutes + slotDuration <= endMinutes;
      minutes += slotDuration + bufferMinutes
    ) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      // Check if slot overlaps with break times
      const slotEnd = minutes + slotDuration;
      let overlapsBreak = false;

      for (const breakTime of availability.breakTimes || []) {
        const [breakStartHour, breakStartMin] = breakTime.start.split(':').map(Number);
        const [breakEndHour, breakEndMin] = breakTime.end.split(':').map(Number);
        const breakStart = breakStartHour * 60 + breakStartMin;
        const breakEnd = breakEndHour * 60 + breakEndMin;

        if (
          (minutes >= breakStart && minutes < breakEnd) ||
          (slotEnd > breakStart && slotEnd <= breakEnd) ||
          (minutes < breakStart && slotEnd > breakEnd)
        ) {
          overlapsBreak = true;
          break;
        }
      }

      if (!overlapsBreak) {
        slots.push(timeStr);
      }
    }

    // Check existing bookings for this date
    const dateStart = new Date(validated.date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(validated.date);
    dateEnd.setHours(23, 59, 59, 999);

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', validated.userId)
      .where('scheduledAt', '>=', dateStart.toISOString())
      .where('scheduledAt', '<=', dateEnd.toISOString())
      .where('status', 'in', ['confirmed', 'pending'])
      .get();

    const bookedSlots = new Set<string>();
    bookingsSnapshot.docs.forEach((doc) => {
      const booking = doc.data();
      const bookingTime = new Date(booking.scheduledAt);
      const timeStr = `${bookingTime.getHours().toString().padStart(2, '0')}:${bookingTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      bookedSlots.add(timeStr);
    });

    // Filter out booked slots
    const availableSlots = slots.filter((slot) => !bookedSlots.has(slot));

    return NextResponse.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error('Available slots error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
