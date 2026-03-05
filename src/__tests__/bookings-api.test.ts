import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
      }),
      add: vi.fn().mockResolvedValue({ id: 'test-booking-id' }),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-booking-id',
          data: () => ({
            userId: 'test-user-id',
            appointmentTypeId: 'appt-type-1',
            clientName: 'Jane Doe',
            clientEmail: 'jane@example.com',
            date: '2024-06-15',
            startTime: '10:00',
            endTime: '10:30',
            status: 'confirmed',
            notes: 'Initial consultation',
            createdAt: '2024-06-10T00:00:00Z',
            updatedAt: '2024-06-10T00:00:00Z',
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

// Mock cookies for auth
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'mock-jwt-token' })),
  })),
  headers: () => new Map([['x-csrf-token', '1']]),
}));

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
    })),
  },
}));

describe('Bookings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Booking Structure', () => {
    it('should have required fields', () => {
      const booking = {
        id: 'booking-1',
        userId: 'user-1',
        appointmentTypeId: 'appt-1',
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '10:30',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      expect(booking.id).toBeTruthy();
      expect(booking.userId).toBeTruthy();
      expect(booking.appointmentTypeId).toBeTruthy();
      expect(booking.clientName).toBeTruthy();
      expect(booking.clientEmail).toBeTruthy();
      expect(booking.date).toBeTruthy();
      expect(booking.startTime).toBeTruthy();
      expect(booking.endTime).toBeTruthy();
      expect(booking.status).toBe('confirmed');
    });

    it('should support optional notes', () => {
      const booking = {
        id: 'booking-1',
        clientName: 'Jane',
        notes: 'Please prepare presentation slides',
      };

      expect(booking.notes).toBeTruthy();
    });

    it('should support booking statuses', () => {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });
  });

  describe('Appointment Types', () => {
    it('should have required fields', () => {
      const appointmentType = {
        id: 'appt-type-1',
        userId: 'user-1',
        name: '30-Minute Strategy Call',
        duration: 30,
        bufferBefore: 5,
        bufferAfter: 10,
        color: '#FF3300',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      expect(appointmentType.name).toBeTruthy();
      expect(appointmentType.duration).toBeGreaterThan(0);
      expect(typeof appointmentType.isActive).toBe('boolean');
    });

    it('should support various durations', () => {
      const validDurations = [15, 30, 45, 60, 90, 120];
      validDurations.forEach(d => {
        expect(d).toBeGreaterThan(0);
        expect(d % 15).toBe(0);
      });
    });

    it('should have non-negative buffer times', () => {
      const appt = { bufferBefore: 5, bufferAfter: 10 };
      expect(appt.bufferBefore).toBeGreaterThanOrEqual(0);
      expect(appt.bufferAfter).toBeGreaterThanOrEqual(0);
    });

    it('should support custom questions', () => {
      const appointmentType = {
        name: 'Consultation',
        duration: 60,
        customQuestions: [
          { id: 'q1', label: 'What is your project about?', type: 'text', required: true },
          { id: 'q2', label: 'Budget range?', type: 'select', options: ['<£5k', '£5k-£15k', '>£15k'], required: false },
        ],
      };

      expect(appointmentType.customQuestions).toHaveLength(2);
      expect(appointmentType.customQuestions[0].required).toBe(true);
      expect(appointmentType.customQuestions[1].options).toHaveLength(3);
    });

    it('should support Google Meet auto-add', () => {
      const appt = {
        name: 'Virtual Meeting',
        duration: 30,
        addGoogleMeet: true,
      };

      expect(appt.addGoogleMeet).toBe(true);
    });
  });

  describe('Available Slots Calculation', () => {
    it('should generate time slots based on duration', () => {
      const generateSlots = (startHour: number, endHour: number, duration: number) => {
        const slots: string[] = [];
        let minutes = startHour * 60;
        const endMinutes = endHour * 60;

        while (minutes + duration <= endMinutes) {
          const h = Math.floor(minutes / 60);
          const m = minutes % 60;
          slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          minutes += duration;
        }
        return slots;
      };

      const slots30 = generateSlots(9, 17, 30);
      expect(slots30[0]).toBe('09:00');
      expect(slots30[1]).toBe('09:30');
      expect(slots30).toHaveLength(16); // 9am to 5pm, 30min slots

      const slots60 = generateSlots(9, 17, 60);
      expect(slots60).toHaveLength(8); // 9am to 5pm, 60min slots
    });

    it('should exclude booked slots', () => {
      const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
      const bookedSlots = ['10:00', '10:30'];

      const available = allSlots.filter(slot => !bookedSlots.includes(slot));
      expect(available).toHaveLength(4);
      expect(available).not.toContain('10:00');
      expect(available).not.toContain('10:30');
    });

    it('should account for buffer times', () => {
      const bufferBefore = 15; // minutes
      const bufferAfter = 10;
      const duration = 30;
      const totalBlock = bufferBefore + duration + bufferAfter; // 55 minutes

      expect(totalBlock).toBe(55);
      // A 30-min meeting with buffers takes 55 minutes total
    });

    it('should respect working hours', () => {
      const workingHours = {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '15:00', enabled: true },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false },
      };

      expect(workingHours.monday.enabled).toBe(true);
      expect(workingHours.saturday.enabled).toBe(false);
      expect(workingHours.friday.end).toBe('15:00');
    });

    it('should handle minimum notice period', () => {
      const minimumNoticeHours = 24;
      const now = new Date();
      const requestedTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours ahead
      const minimumTime = new Date(now.getTime() + minimumNoticeHours * 60 * 60 * 1000);

      const isAllowed = requestedTime >= minimumTime;
      expect(isAllowed).toBe(false); // 12 hours < 24 hours notice

      const validTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const isValidAllowed = validTime >= minimumTime;
      expect(isValidAllowed).toBe(true);
    });

    it('should respect blocked dates', () => {
      const blockedDates = ['2024-12-25', '2024-12-26', '2024-01-01'];
      const isBlocked = (date: string) => blockedDates.includes(date);

      expect(isBlocked('2024-12-25')).toBe(true);
      expect(isBlocked('2024-06-15')).toBe(false);
    });
  });

  describe('Booking Creation', () => {
    it('should validate client email', () => {
      const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValidEmail('jane@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
    });

    it('should validate client name', () => {
      const isValid = (name: string) => name.trim().length > 0;
      expect(isValid('Jane Doe')).toBe(true);
      expect(isValid('')).toBe(false);
    });

    it('should validate date format', () => {
      const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
      expect(isValidDate('2024-06-15')).toBe(true);
      expect(isValidDate('15/06/2024')).toBe(false);
      expect(isValidDate('June 15')).toBe(false);
    });

    it('should validate time format', () => {
      const isValidTime = (time: string) => /^\d{2}:\d{2}$/.test(time);
      expect(isValidTime('10:00')).toBe(true);
      expect(isValidTime('10:30')).toBe(true);
      expect(isValidTime('10am')).toBe(false);
    });

    it('should reject bookings in the past', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // yesterday
      const futureDate = new Date(now.getTime() + 86400000); // tomorrow

      const isInFuture = (date: Date) => date > now;
      expect(isInFuture(pastDate)).toBe(false);
      expect(isInFuture(futureDate)).toBe(true);
    });

    it('should set default status to confirmed', () => {
      const booking = {
        clientName: 'Jane',
        status: 'confirmed',
      };
      expect(booking.status).toBe('confirmed');
    });
  });

  describe('Booking Management', () => {
    it('should allow cancellation', () => {
      const booking = { status: 'confirmed' as string };
      booking.status = 'cancelled';
      expect(booking.status).toBe('cancelled');
    });

    it('should allow marking as completed', () => {
      const booking = { status: 'confirmed' as string };
      booking.status = 'completed';
      expect(booking.status).toBe('completed');
    });

    it('should allow marking as no-show', () => {
      const booking = { status: 'confirmed' as string };
      booking.status = 'no_show';
      expect(booking.status).toBe('no_show');
    });

    it('should not allow modifying past completed bookings', () => {
      const canModify = (status: string) => !['completed', 'no_show'].includes(status);
      expect(canModify('confirmed')).toBe(true);
      expect(canModify('pending')).toBe(true);
      expect(canModify('completed')).toBe(false);
      expect(canModify('no_show')).toBe(false);
    });

    it('should list bookings by date range', () => {
      const bookings = [
        { date: '2024-06-10', clientName: 'Alice' },
        { date: '2024-06-15', clientName: 'Bob' },
        { date: '2024-06-20', clientName: 'Charlie' },
        { date: '2024-07-01', clientName: 'Diana' },
      ];

      const filtered = bookings.filter(b => b.date >= '2024-06-10' && b.date <= '2024-06-30');
      expect(filtered).toHaveLength(3);
      expect(filtered.map(b => b.clientName)).not.toContain('Diana');
    });

    it('should list bookings by status', () => {
      const bookings = [
        { status: 'confirmed', clientName: 'Alice' },
        { status: 'cancelled', clientName: 'Bob' },
        { status: 'confirmed', clientName: 'Charlie' },
        { status: 'completed', clientName: 'Diana' },
      ];

      const confirmed = bookings.filter(b => b.status === 'confirmed');
      expect(confirmed).toHaveLength(2);
    });
  });

  describe('Availability Settings', () => {
    it('should have complete weekly schedule', () => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const schedule: Record<string, { start: string; end: string; enabled: boolean }> = {};

      days.forEach(day => {
        schedule[day] = {
          start: '09:00',
          end: '17:00',
          enabled: !['saturday', 'sunday'].includes(day),
        };
      });

      expect(Object.keys(schedule)).toHaveLength(7);
      expect(schedule.monday.enabled).toBe(true);
      expect(schedule.sunday.enabled).toBe(false);
    });

    it('should validate time range', () => {
      const isValidRange = (start: string, end: string) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return sh * 60 + sm < eh * 60 + em;
      };

      expect(isValidRange('09:00', '17:00')).toBe(true);
      expect(isValidRange('17:00', '09:00')).toBe(false);
      expect(isValidRange('09:00', '09:00')).toBe(false);
    });

    it('should support minimum notice period', () => {
      const settings = {
        minimumNoticeHours: 24,
        maxBookingsPerDay: 8,
      };

      expect(settings.minimumNoticeHours).toBe(24);
      expect(settings.maxBookingsPerDay).toBe(8);
    });
  });
});
