'use client';

import { useEffect, useState, Suspense } from 'react';
import { Link2, Check, ExternalLink, Loader2, AlertCircle, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface GoogleCalendarStatus {
  connected: boolean;
  email: string | null;
  connectedAt: string | null;
  tokenExpired?: boolean;
  hasRefreshToken?: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  comingSoon?: boolean;
  email?: string;
}

const staticIntegrations: Integration[] = [
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Automatically create meeting links',
    icon: '🎥',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments on invoices',
    icon: '💳',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices and payments to accounting',
    icon: '📊',
    connected: false,
    comingSoon: true,
  },
];

// Separate component that uses useSearchParams
function NotificationHandler({ 
  onNotification 
}: { 
  onNotification: (notification: { type: 'success' | 'error'; message: string } | null) => void 
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (success === 'true') {
      onNotification({ type: 'success', message: message || 'Google Calendar connected successfully!' });
    } else if (error) {
      onNotification({ type: 'error', message: message || 'Failed to connect Google Calendar' });
    }

    // Clean up URL params
    if (success || error) {
      window.history.replaceState({}, '', '/settings/integrations');
    }
  }, [searchParams, onNotification]);

  return null;
}

function IntegrationsContent() {
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Google Calendar connection status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/auth/google/status');
        if (res.ok) {
          const data = await res.json();
          setGoogleStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch Google Calendar status:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleConnectGoogle = () => {
    // Redirect to OAuth authorize endpoint
    window.location.href = '/api/auth/google/authorize';
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch('/api/auth/google/disconnect', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setGoogleStatus({ connected: false, email: null, connectedAt: null });
        setNotification({ type: 'success', message: 'Google Calendar disconnected successfully' });
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to disconnect' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to disconnect Google Calendar' });
    } finally {
      setDisconnecting(false);
    }
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Handle URL params for notifications */}
      <Suspense fallback={null}>
        <NotificationHandler onNotification={setNotification} />
      </Suspense>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Link2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <p className="text-sm text-gray-500">
              Connect your favorite apps and services
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={dismissNotification}
              className="p-1 hover:bg-white/50 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Google Calendar Integration */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg text-2xl">
                📅
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Google Calendar
                </h3>
                <p className="text-sm text-gray-500">
                  {googleStatus?.connected && googleStatus.email
                    ? `Connected as ${googleStatus.email}`
                    : 'Sync your calendar events and availability'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </div>
            ) : googleStatus?.connected ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Connected
                </span>
                <button
                  onClick={handleDisconnectGoogle}
                  disabled={disconnecting}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Connect
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Other Integrations (Coming Soon) */}
          {staticIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg text-2xl">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {integration.name}
                    {integration.comingSoon && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
              </div>

              <button
                disabled
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Connect
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Need another integration?</h4>
          <p className="text-sm text-blue-700">
            We&apos;re constantly adding new integrations. Let us know what you need!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
