'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  FolderKanban,
  Users,
  UserPlus,
  Briefcase,
  Target,
  Plus,
  ChevronDown,
  Calendar,
  ArrowUpRight,
  Loader2
} from 'lucide-react';

interface DashboardMetrics {
  revenue: number;
  outstanding: number;
  projectsCount: number;
  leadsCount: number;
  clientsCount: number;
  contactsCount: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'contact_created' | 'lead_created' | 'project_created' | 'invoice_paid';
  title: string;
  subtitle: string;
  timestamp: string;
}

const PERIOD_OPTIONS = [
  { value: 'month', label: 'This Month' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchMetrics();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [period]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'contact_created':
        return <UserPlus size={16} className="text-blue-500" />;
      case 'lead_created':
        return <Target size={16} className="text-orange-500" />;
      case 'project_created':
        return <Briefcase size={16} className="text-purple-500" />;
      case 'invoice_paid':
        return <DollarSign size={16} className="text-green-500" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getPeriodLabel = () => {
    return PERIOD_OPTIONS.find(p => p.value === period)?.label || 'This Month';
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="relative" ref={periodRef}>
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
              >
                <Calendar size={16} />
                {getPeriodLabel()}
                <ChevronDown size={16} className={`transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[160px]">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPeriod(option.value);
                        setShowPeriodDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                        period === option.value ? 'text-[#FF3300] font-medium bg-orange-50' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="relative" ref={quickActionsRef}>
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg transition text-sm font-medium"
              >
                <Plus size={16} />
                Quick Actions
                <ChevronDown size={16} className={`transition-transform ${showQuickActions ? 'rotate-180' : ''}`} />
              </button>
              
              {showQuickActions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
                  <Link
                    href="/contacts?action=create"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setShowQuickActions(false)}
                  >
                    <UserPlus size={16} className="text-blue-500" />
                    New Contact
                  </Link>
                  <Link
                    href="/leads?action=create"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setShowQuickActions(false)}
                  >
                    <Target size={16} className="text-orange-500" />
                    New Lead
                  </Link>
                  <Link
                    href="/projects?action=create"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setShowQuickActions(false)}
                  >
                    <Briefcase size={16} className="text-purple-500" />
                    New Project
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <TrendingUp size={12} />
                Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {metrics ? formatCurrency(metrics.revenue) : '£0'}
            </p>
            <p className="text-sm text-gray-500">Total lifetime value</p>
          </div>

          {/* Outstanding Card */}
          <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock size={20} className="text-amber-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                <TrendingDown size={12} />
                Outstanding
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {metrics ? formatCurrency(metrics.outstanding) : '£0'}
            </p>
            <p className="text-sm text-gray-500">Pending payments</p>
          </div>

          {/* Projects Card */}
          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FolderKanban size={20} className="text-purple-600" />
              </div>
              <Link 
                href="/projects"
                className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition"
              >
                View <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {metrics?.projectsCount ?? 0}
            </p>
            <p className="text-sm text-gray-500">Total projects</p>
          </div>

          {/* Leads Card */}
          <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border border-orange-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users size={20} className="text-orange-600" />
              </div>
              <Link 
                href="/leads"
                className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 transition"
              >
                View <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {metrics?.leadsCount ?? 0}
            </p>
            <p className="text-sm text-gray-500">Active leads</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Contacts</p>
            <p className="text-xl font-bold text-gray-900">{metrics?.contactsCount ?? 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Active Clients</p>
            <p className="text-xl font-bold text-gray-900">{metrics?.clientsCount ?? 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Leads</p>
            <p className="text-xl font-bold text-gray-900">{metrics?.leadsCount ?? 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
            <p className="text-xl font-bold text-gray-900">
              {metrics && metrics.leadsCount > 0 
                ? `${Math.round((metrics.clientsCount / (metrics.clientsCount + metrics.leadsCount)) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link 
                href="/contacts"
                className="text-sm text-[#FF3300] hover:text-[#E62E00] font-medium"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="mx-auto mb-2 text-gray-300" size={32} />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/contacts"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
              >
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Contacts</h3>
                  <p className="text-sm text-gray-500">Manage your contacts and clients</p>
                </div>
                <ArrowUpRight size={20} className="text-gray-400 group-hover:text-gray-600 transition" />
              </Link>
              
              <Link
                href="/leads"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
              >
                <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                  <Target size={24} className="text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Leads CRM</h3>
                  <p className="text-sm text-gray-500">Track and manage your sales pipeline</p>
                </div>
                <ArrowUpRight size={20} className="text-gray-400 group-hover:text-gray-600 transition" />
              </Link>
              
              <Link
                href="/content"
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
              >
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Content Scheduler</h3>
                  <p className="text-sm text-gray-500">Schedule social media content</p>
                </div>
                <ArrowUpRight size={20} className="text-gray-400 group-hover:text-gray-600 transition" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
