'use client';

import { CreditCard } from 'lucide-react';

export default function SubscriptionSettingsPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            <p className="text-sm text-gray-500">
              Manage your subscription and billing
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current Plan */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Current Plan</span>
            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Free Tier</h3>
          <p className="text-sm text-gray-500 mt-1">
            Basic features with limited usage
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Premium Plans Coming Soon</h3>
            <p className="text-gray-500 max-w-sm">
              Stripe integration for subscription management will be available 
              in a future update. Stay tuned for Pro and Enterprise plans!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
