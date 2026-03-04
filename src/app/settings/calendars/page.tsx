'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface CalendarItem {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

interface CalendarSettings {
  selectedCalendars: CalendarItem[];
  defaultCalendarId: string;
  syncEnabled: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

export default function CalendarSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<CalendarSettings>({
    selectedCalendars: [],
    defaultCalendarId: '',
    syncEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/calendars');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setFormData(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch calendar settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/calendars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Calendar settings updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const addCalendar = () => {
    const newCalendar: CalendarItem = {
      id: `cal-${Date.now()}`,
      name: 'New Calendar',
      color: DEFAULT_COLORS[formData.selectedCalendars.length % DEFAULT_COLORS.length],
      enabled: true,
    };

    setFormData((prev) => ({
      ...prev,
      selectedCalendars: [...prev.selectedCalendars, newCalendar],
    }));
  };

  const updateCalendar = (id: string, updates: Partial<CalendarItem>) => {
    setFormData((prev) => ({
      ...prev,
      selectedCalendars: prev.selectedCalendars.map((cal) =>
        cal.id === id ? { ...cal, ...updates } : cal
      ),
    }));
  };

  const removeCalendar = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCalendars: prev.selectedCalendars.filter((cal) => cal.id !== id),
      defaultCalendarId:
        prev.defaultCalendarId === id ? '' : prev.defaultCalendarId,
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
          Calendar Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage multiple calendars and sync settings
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

        {/* Sync Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Calendar Sync</h3>
            <p className="text-sm text-gray-600">
              Automatically sync with Google Calendar
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.syncEnabled}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, syncEnabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Calendars List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Calendars
            </label>
            <button
              type="button"
              onClick={addCalendar}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Calendar
            </button>
          </div>

          {formData.selectedCalendars.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No calendars configured</p>
              <button
                type="button"
                onClick={addCalendar}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Add your first calendar
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.selectedCalendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg"
                >
                  {/* Color Picker */}
                  <input
                    type="color"
                    value={calendar.color}
                    onChange={(e) => updateCalendar(calendar.id, { color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />

                  {/* Name Input */}
                  <input
                    type="text"
                    value={calendar.name}
                    onChange={(e) => updateCalendar(calendar.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Calendar name"
                  />

                  {/* Enabled Toggle */}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={calendar.enabled}
                      onChange={(e) =>
                        updateCalendar(calendar.id, { enabled: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Enabled
                  </label>

                  {/* Default Radio */}
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="defaultCalendar"
                      checked={formData.defaultCalendarId === calendar.id}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          defaultCalendarId: calendar.id,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    Default
                  </label>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeCalendar(calendar.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Multi-Calendar Features</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• View events from multiple calendars in one place</li>
            <li>• Color-code events by calendar source</li>
            <li>• Set a default calendar for new events</li>
            <li>• Enable/disable calendars without removing them</li>
          </ul>
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
