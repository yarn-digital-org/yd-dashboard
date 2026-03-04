'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2, Check, AlertCircle, Mail, Smartphone } from 'lucide-react';

interface NotificationSettings {
  email: {
    newLead: boolean;
    newMessage: boolean;
    invoicePaid: boolean;
    invoiceOverdue: boolean;
    contractSigned: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  push: {
    newLead: boolean;
    newMessage: boolean;
    invoicePaid: boolean;
  };
}

interface NotificationOption {
  key: string;
  label: string;
  description: string;
}

const emailOptions: NotificationOption[] = [
  { key: 'newLead', label: 'New Lead', description: 'When a new lead is captured from a form' },
  { key: 'newMessage', label: 'New Message', description: 'When you receive a new message from a client' },
  { key: 'invoicePaid', label: 'Invoice Paid', description: 'When a client pays an invoice' },
  { key: 'invoiceOverdue', label: 'Invoice Overdue', description: 'When an invoice becomes overdue' },
  { key: 'contractSigned', label: 'Contract Signed', description: 'When a client signs a contract' },
  { key: 'dailyDigest', label: 'Daily Digest', description: 'Daily summary of activity' },
  { key: 'weeklyReport', label: 'Weekly Report', description: 'Weekly business performance report' },
];

const pushOptions: NotificationOption[] = [
  { key: 'newLead', label: 'New Lead', description: 'Instant notification for new leads' },
  { key: 'newMessage', label: 'New Message', description: 'Instant notification for new messages' },
  { key: 'invoicePaid', label: 'Invoice Paid', description: 'Instant notification when invoices are paid' },
];

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      newLead: true,
      newMessage: true,
      invoicePaid: true,
      invoiceOverdue: true,
      contractSigned: true,
      dailyDigest: false,
      weeklyReport: true,
    },
    push: {
      newLead: true,
      newMessage: true,
      invoicePaid: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSettings({
            email: {
              newLead: data.data.email?.newLead ?? true,
              newMessage: data.data.email?.newMessage ?? true,
              invoicePaid: data.data.email?.invoicePaid ?? true,
              invoiceOverdue: data.data.email?.invoiceOverdue ?? true,
              contractSigned: data.data.email?.contractSigned ?? true,
              dailyDigest: data.data.email?.dailyDigest ?? false,
              weeklyReport: data.data.email?.weeklyReport ?? true,
            },
            push: {
              newLead: data.data.push?.newLead ?? true,
              newMessage: data.data.push?.newMessage ?? true,
              invoicePaid: data.data.push?.invoicePaid ?? true,
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Notification settings updated successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = (key: keyof typeof settings.email) => {
    setSettings((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: !prev.email[key],
      },
    }));
  };

  const handlePushToggle = (key: keyof typeof settings.push) => {
    setSettings((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: !prev.push[key],
      },
    }));
  };

  const toggleAllEmail = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      email: Object.fromEntries(
        Object.keys(prev.email).map((key) => [key, enabled])
      ) as typeof prev.email,
    }));
  };

  const toggleAllPush = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      push: Object.fromEntries(
        Object.keys(prev.push).map((key) => [key, enabled])
      ) as typeof prev.push,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-500">
                Choose how you want to be notified about activity
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Message */}
          {message && (
            <div
              className={`mx-6 mt-6 flex items-center gap-2 p-4 rounded-lg ${
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

          {/* Email Notifications */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Email Notifications</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => toggleAllEmail(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Enable all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllEmail(false)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Disable all
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {emailOptions.map((option) => (
                <div key={option.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.email[option.key as keyof typeof settings.email]}
                    onClick={() => handleEmailToggle(option.key as keyof typeof settings.email)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.email[option.key as keyof typeof settings.email]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.email[option.key as keyof typeof settings.email]
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-900">Push Notifications</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => toggleAllPush(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Enable all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllPush(false)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Disable all
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {pushOptions.map((option) => (
                <div key={option.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.push[option.key as keyof typeof settings.push]}
                    onClick={() => handlePushToggle(option.key as keyof typeof settings.push)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.push[option.key as keyof typeof settings.push]
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.push[option.key as keyof typeof settings.push]
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Push notifications require browser permission. 
              <button type="button" className="text-blue-600 hover:text-blue-700 ml-1">
                Enable browser notifications
              </button>
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end p-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
