import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withAuth,
  validateBody,
  successResponse,
  requireDb,
  BadRequestError,
} from '@/lib/api-middleware';
import { sendBookingConfirmationEmail } from '@/lib/email-service';
import { fireAutomations } from '@/lib/automation-engine';

// Validation schema for creating a booking (public - no auth)
const createBookingSchema = z.object({
  userId: z.string().min(1),
  appointmentTypeId: z.string().min(1),
  scheduledAt: z.string(), // ISO timestamp
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(20).optional(),
  customAnswers: z.record(z.string()).optional(),
});

// POST - Create booking (public route, no auth)
export async function POST(request: NextRequest) {
  try {
    const db = requireDb();
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Fetch appointment type
    const appointmentTypeDoc = await db
      .collection('appointmentTypes')
      .doc(data.appointmentTypeId)
      .get();

    if (!appointmentTypeDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Appointment type not found' },
        { status: 404 }
      );
    }

    const appointmentType = appointmentTypeDoc.data();
    if (!appointmentType?.isActive) {
      return NextResponse.json(
        { success: false, error: 'This appointment type is not available' },
        { status: 400 }
      );
    }

    // Check availability settings
    const availabilityDoc = await db
      .collection('availabilitySettings')
      .doc(data.userId)
      .get();
    const availability = availabilityDoc.data();

    // Validate booking time against availability
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();

    // Check minimum notice
    const minNoticeHours = availability?.minNoticeHours || 24;
    const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntil < minNoticeHours) {
      return NextResponse.json(
        { success: false, error: `Bookings require at least ${minNoticeHours} hours notice` },
        { status: 400 }
      );
    }

    // Check max advance days
    const maxAdvanceDays = availability?.maxAdvanceDays || 30;
    const daysUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil > maxAdvanceDays) {
      return NextResponse.json(
        { success: false, error: `Bookings can only be made up to ${maxAdvanceDays} days in advance` },
        { status: 400 }
      );
    }

    // Check if date is blocked
    const blockedDates = availability?.blockedDates || [];
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0];
    if (blockedDates.includes(scheduledDateStr)) {
      return NextResponse.json(
        { success: false, error: 'This date is not available' },
        { status: 400 }
      );
    }

    // Create calendar event
    const calendarEventRef = await db.collection('calendarEvents').add({
      userId: data.userId,
      title: `${appointmentType.name} - ${data.guestName}`,
      description: `Booked by ${data.guestName} (${data.guestEmail})`,
      type: 'meeting',
      startTime: data.scheduledAt,
      endTime: new Date(
        scheduledDate.getTime() + appointmentType.durationMinutes * 60 * 1000
      ).toISOString(),
      isAllDay: false,
      timezone: 'UTC',
      location: appointmentType.addGoogleMeet ? 'Google Meet' : undefined,
      isRecurring: false,
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create booking record
    const booking = {
      userId: data.userId,
      appointmentTypeId: data.appointmentTypeId,
      scheduledAt: data.scheduledAt,
      duration: appointmentType.durationMinutes,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || '',
      customAnswers: data.customAnswers || {},
      status: 'confirmed',
      calendarEventId: calendarEventRef.id,
      createdAt: new Date().toISOString(),
    };

    const bookingRef = await db.collection('bookings').add(booking);

    // Send confirmation email
    try {
      await sendBookingConfirmationEmail(
        data.guestEmail,
        data.guestName,
        appointmentType.name,
        new Date(data.scheduledAt).toLocaleDateString(),
        new Date(data.scheduledAt).toLocaleTimeString(),
        appointmentType.addGoogleMeet ? 'Google Meet (link will be sent)' : undefined
      );

      // Update booking to mark email sent
      await bookingRef.update({
        confirmationSentAt: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Fetch user info for owner notification
    const userDoc = await db.collection('users').doc(data.userId).get();
    const userData = userDoc.data();

    // Send notification to owner
    if (userData?.email) {
      try {
        await sendBookingConfirmationEmail(
          userData.email,
          userData.name || 'Owner',
          `New Booking: ${appointmentType.name}`,
          new Date(data.scheduledAt).toLocaleDateString(),
          new Date(data.scheduledAt).toLocaleTimeString(),
          `Client: ${data.guestName} (${data.guestEmail})`
        );
      } catch (emailError) {
        console.error('Failed to send owner notification:', emailError);
      }
    }

    // Fire automations
    try {
      await fireAutomations('new_booking', {
        id: bookingRef.id,
        ...booking,
        _collection: 'bookings',
      }, data.userId);
    } catch (automationError) {
      console.error('Failed to fire automations:', automationError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: bookingRef.id,
        ...booking,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Booking creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// GET - List bookings (authenticated)
export const GET = withAuth(async (request, { user }) => {
  const db = requireDb();

  const snapshot = await db
    .collection('bookings')
    .where('userId', '==', user.userId)
    .orderBy('scheduledAt', 'desc')
    .get();

  const bookings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return successResponse(bookings);
});
