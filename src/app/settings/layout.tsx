'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Building2, 
  Bell, 
  Palette, 
  CreditCard, 
  Link2, 
  Shield,
  Globe,
  Users,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const settingsNav = [
  {
    title: 'Account',
    items: [
      { name: 'Profile', href: '/settings/profile', icon: User },
      { name: 'Business', href: '/settings/business', icon: Building2 },
      { name: 'Notifications', href: '/settings/notifications', icon: Bell },
    ],
  },
  {
    title: 'Appearance',
    items: [
      { name: 'Branding', href: '/settings/branding', icon: Palette },
    ],
  },
  {
    title: 'Billing',
    items: [
      { name: 'Subscription', href: '/settings/subscription', icon: CreditCard },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { name: 'Connected Apps', href: '/settings/integrations', icon: Link2 },
    ],
  },
  {
    title: 'Client Portal',
    items: [
      { name: 'Portal', href: '/settings/portal', icon: Globe },
    ],
  },
  {
    title: 'Team',
    items: [
      { name: 'Users & Permissions', href: '/settings/users', icon: Users },
    ],
  },
  {
    title: 'Security',
    items: [
      { name: 'Security', href: '/settings/security', icon: Shield },
    ],
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <nav className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {settingsNav.map((section) => (
                <div key={section.title} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.name}
                            {isActive && (
                              <ChevronRight className="h-4 w-4 ml-auto" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
