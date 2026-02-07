'use client';

import { Link2, Check, ExternalLink } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  comingSoon?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'google',
    name: 'Google Calendar',
    description: 'Sync your calendar events and availability',
    icon: '📅',
    connected: false,
    comingSoon: true,
  },
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

export default function IntegrationsSettingsPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
        <div className="space-y-4">
          {integrations.map((integration) => (
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

              {integration.connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Connected
                  </span>
                  <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  disabled={integration.comingSoon}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Connect
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Need another integration?</h4>
          <p className="text-sm text-blue-700">
            We're constantly adding new integrations. Let us know what you need!
          </p>
        </div>
      </div>
    </div>
  );
}
