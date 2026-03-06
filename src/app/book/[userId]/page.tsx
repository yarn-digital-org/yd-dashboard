'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  description?: string;
  color?: string;
  isActive?: boolean;
  addGoogleMeet?: boolean;
  bufferMinutes?: number;
  customQuestions?: {
    id: string;
    question: string;
    required: boolean;
    type: string;
  }[];
}

export default function PublicBookingPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    customAnswers: {} as Record<string, string>,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointmentTypes();
  }, [userId]);

  useEffect(() => {
    if (selectedType && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedType, selectedDate]);

  const fetchAppointmentTypes = async () => {
    try {
      const res = await fetch(`/api/appointment-types?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const active = (data.data || []).filter((t: AppointmentType) => t.isActive !== false);
          setAppointmentTypes(active);
        }
      }
    } catch (err) {
      console.error('Failed to fetch appointment types:', err);
      setError('Failed to load appointment types');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedType || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/bookings/available-slots?userId=${userId}&appointmentTypeId=${selectedType.id}&date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAvailableSlots(data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          appointmentTypeId: selectedType!.id,
          scheduledAt: scheduledDate.toISOString(),
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          customAnswers: formData.customAnswers,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to create booking');
      }
    } catch (err) {
      setError('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDatePast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Your appointment has been scheduled. You&apos;ll receive a confirmation email shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Appointment Type</p>
            <p className="font-semibold text-gray-900">{selectedType?.name}</p>
            <p className="text-sm text-gray-600 mt-3 mb-1">Date & Time</p>
            <p className="font-semibold text-gray-900">
              {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Schedule an Appointment</h1>
          <p className="text-gray-600">Choose an appointment type and pick a time that works for you.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Step 1: Choose Appointment Type */}
        {!selectedType && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Appointment Type</h2>
            <div className="grid gap-4">
              {appointmentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1.5"
                    style={{ backgroundColor: type.color || '#3B82F6' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
                    {type.description && <p className="text-sm text-gray-600 mb-2">{type.description}</p>}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {type.durationMinutes} minutes
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Date & Time */}
        {selectedType && !selectedDate && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setSelectedType(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to appointment types
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h2>

            {/* Calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />;
                  }

                  const isPast = isDatePast(date);
                  const dateStr = formatDate(date);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isPast && setSelectedDate(dateStr)}
                      disabled={isPast}
                      className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                        isPast
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-900 hover:bg-blue-50 hover:border-blue-500 border border-gray-200'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Choose Time Slot */}
        {selectedType && selectedDate && !selectedTime && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setSelectedDate('')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to date selection
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Time - {new Date(selectedDate).toLocaleDateString()}
            </h2>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-gray-600 text-center py-12">No available time slots for this date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className="px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm font-medium transition-colors"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Guest Information */}
        {selectedType && selectedDate && selectedTime && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setSelectedTime('')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to time selection
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium mb-1">Selected Appointment</p>
              <p className="text-sm text-blue-800">
                {selectedType.name} on {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guestName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, guestName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.guestEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, guestEmail: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.guestPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, guestPhone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Custom Questions */}
              {selectedType.customQuestions?.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {q.question} {q.required && '*'}
                  </label>
                  {q.type === 'long_text' ? (
                    <textarea
                      required={q.required}
                      value={formData.customAnswers[q.id] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customAnswers: { ...prev.customAnswers, [q.id]: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : 'text'}
                      required={q.required}
                      value={formData.customAnswers[q.id] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customAnswers: { ...prev.customAnswers, [q.id]: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
