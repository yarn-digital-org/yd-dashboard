'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Check, Zap, Building2, Users, FolderOpen, HardDrive, Clock } from 'lucide-react';

interface UsageStats {
  contacts: number;
  projects: number;
  invoices: number;
  forms: number;
}

const plans = [
  {
    name: 'Free',
    price: 0,
    period: '',
    description: 'Perfect for getting started',
    badge: null,
    features: [
      'Up to 50 contacts',
      'Up to 5 active projects',
      '3 forms',
      'Basic invoicing',
      'Email support',
      '500MB storage',
    ],
    limits: { contacts: 50, projects: 5, forms: 3, storage: 500 },
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Pro',
    price: 29,
    period: '/mo',
    description: 'For growing freelancers',
    badge: 'Popular',
    features: [
      'Unlimited contacts',
      'Unlimited projects',
      'Unlimited forms',
      'Advanced invoicing & contracts',
      'Client portal',
      'Workflow automations',
      'Priority support',
      '10GB storage',
    ],
    limits: { contacts: Infinity, projects: Infinity, forms: Infinity, storage: 10240 },
    cta: 'Upgrade to Pro',
    disabled: false,
  },
  {
    name: 'Business',
    price: 79,
    period: '/mo',
    description: 'For agencies and teams',
    badge: null,
    features: [
      'Everything in Pro',
      'Team collaboration (up to 5)',
      'Custom domain for portal',
      'White-label branding',
      'API access',
      'Advanced automations',
      'Dedicated support',
      '100GB storage',
    ],
    limits: { contacts: Infinity, projects: Infinity, forms: Infinity, storage: 102400 },
    cta: 'Upgrade to Business',
    disabled: false,
  },
];

export default function SubscriptionSettingsPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats>({ contacts: 0, projects: 0, invoices: 0, forms: 0 });
  const [loading, setLoading] = useState(true);
  const currentPlan = 'Free';

  useEffect(() => {
    async function loadUsage() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsage({
              contacts: data.data?.totalContacts || 0,
              projects: data.data?.activeProjects || 0,
              invoices: data.data?.totalInvoices || 0,
              forms: 0,
            });
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    loadUsage();
  }, []);

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-500">Manage your subscription and billing</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Current Plan</span>
              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">Active</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{currentPlan}</h3>
            <p className="text-sm text-gray-500 mt-1">Basic features with limited usage</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Contacts', value: usage.contacts, limit: 50, icon: Users },
            { label: 'Projects', value: usage.projects, limit: 5, icon: FolderOpen },
            { label: 'Invoices', value: usage.invoices, limit: '∞', icon: CreditCard },
            { label: 'Storage', value: '0 MB', limit: '500 MB', icon: HardDrive },
          ].map((stat) => (
            <div key={stat.label} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">{stat.label}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {typeof stat.value === 'number' ? stat.value : stat.value}
                <span className="text-sm font-normal text-gray-400"> / {stat.limit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg shadow-sm border-2 p-6 relative ${
              plan.name === currentPlan
                ? 'border-green-500'
                : plan.badge
                ? 'border-blue-500'
                : 'border-gray-200'
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.period && (
                  <span className="text-gray-500">{plan.period}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={plan.disabled}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                plan.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : plan.badge
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {plan.name === currentPlan ? 'Current Plan' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Billing History</h3>
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No billing history yet</p>
            <p className="text-xs text-gray-400 mt-1">Invoices will appear here after your first payment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
