'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, AlertCircle, Check, Loader2, Plus, X } from 'lucide-react';

interface WorkingHours {
  start: string;
  end: string;
}

interface AvailabilityData {
  workingDays: number[];
  workingHours: WorkingHours;
  breakTimes: WorkingHours[];
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  blockedDates: string[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function AvailabilitySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<AvailabilityData>({
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '17:00' },
    breakTimes: [],
    bufferMinutes: 15,
    minNoticeHours: 24,
    maxAdvanceDays: 30,
    blockedDates: [],
  });
  const [newBlockedDate, setNewBlockedDate] = useState('');

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await fetch('/api/settings/availability');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setFormData(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Availability settings updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  const addBreakTime = () => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: [...prev.breakTimes, { start: '12:00', end: '13:00' }],
    }));
  };

  const removeBreakTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index),
    }));
  };

  const updateBreakTime = (index: number, field: 'start' | 'end', value: string) => {
    setFormData((prev) => ({
      ...prev,
      breakTimes: prev.breakTimes.map((bt, i) =>
        i === index ? { ...bt, [field]: value } : bt
      ),
    }));
  };

  const addBlockedDate = () => {
    if (newBlockedDate && !formData.blockedDates.includes(newBlockedDate)) {
      setFormData((prev) => ({
        ...prev,
        blockedDates: [...prev.blockedDates, newBlockedDate].sort(),
      }));
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      blockedDates: prev.blockedDates.filter((d) => d !== date),
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your working hours and booking availability
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Working Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Working Days
          </label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleWorkingDay(day.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  formData.workingDays.includes(day.value)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                {day.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={formData.workingHours.start}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, start: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={formData.workingHours.end}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  workingHours: { ...prev.workingHours, end: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Break Times */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Break Times
            </label>
            <button
              type="button"
              onClick={addBreakTime}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Break
            </button>
          </div>
          <div className="space-y-2">
            {formData.breakTimes.map((breakTime, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  value={breakTime.start}
                  onChange={(e) => updateBreakTime(index, 'start', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={breakTime.end}
                  onChange={(e) => updateBreakTime(index, 'end', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeBreakTime(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buffer Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buffer Time Between Appointments (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="120"
            step="5"
            value={formData.bufferMinutes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bufferMinutes: parseInt(e.target.value) || 0 }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Time gap between consecutive appointments
          </p>
        </div>

        {/* Minimum Notice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Notice Period (hours)
          </label>
          <input
            type="number"
            min="0"
            max="168"
            value={formData.minNoticeHours}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, minNoticeHours: parseInt(e.target.value) || 0 }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            How far in advance clients must book
          </p>
        </div>

        {/* Maximum Advance Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Advance Booking (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={formData.maxAdvanceDays}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, maxAdvanceDays: parseInt(e.target.value) || 30 }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            How far into the future clients can book
          </p>
        </div>

        {/* Blocked Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Blocked Dates (Holidays, PTO)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addBlockedDate}
              disabled={!newBlockedDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {formData.blockedDates.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => removeBlockedDate(date)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.blockedDates.length === 0 && (
              <p className="text-sm text-gray-500 italic">No blocked dates</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
