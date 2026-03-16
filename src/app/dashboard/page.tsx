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
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { AdFunnelWidget } from '@/components/dashboard/AdFunnelWidget';
import { LandingPageAnalyticsWidget } from '@/components/dashboard/LandingPageAnalyticsWidget';
import type { RevenueDataPoint } from '@/components/dashboard/RevenueChart';

interface DashboardMetrics {
  revenue: number;
  outstanding: number;
  projectsCount: number;
  leadsCount: number;
  clientsCount: number;
  contactsCount: number;
  recentActivity: ActivityItem[];
  revenueChart: RevenueDataPoint[];
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
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('6m');
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
  }, [period, chartPeriod]);

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
      setError(null);
      const res = await fetch(`/api/dashboard?period=${period}&chartPeriod=${chartPeriod}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError('Failed to load dashboard data');
      // Set empty metrics so the page still renders
      setMetrics({
        revenue: 0,
        outstanding: 0,
        projectsCount: 0,
        leadsCount: 0,
        clientsCount: 0,
        contactsCount: 0,
        recentActivity: [],
        revenueChart: [],
      });
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
            <h1 className="text-2xl font-bold text-[#0a0a0a]" style={{ letterSpacing: '-0.04em' }}>Dashboard</h1>
            <p className="text-[#666] text-sm mt-1">
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
          <div className="bg-white p-6 rounded-xl border border-[#e5e5e5] hover:shadow-sm transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <DollarSign size={20} className="text-[#0a0a0a]" />
              </div>
              <span className="text-xs font-medium text-[#666]">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.04em' }}>
              {metrics ? formatCurrency(metrics.revenue) : '£0'}
            </p>
            <p className="text-sm text-[#666]">
              {chartPeriod === 'month' ? 'This month' : chartPeriod === '6months' ? 'Last 6 months' : 'Last 12 months'}
            </p>
          </div>

          {/* Outstanding Card */}
          <div className="bg-white p-6 rounded-xl border border-[#e5e5e5] hover:shadow-sm transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <Clock size={20} className="text-[#0a0a0a]" />
              </div>
              <span className="text-xs font-medium text-[#666]">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.04em' }}>
              {metrics ? formatCurrency(metrics.outstanding) : '£0'}
            </p>
            <p className="text-sm text-[#666]">Pending payments</p>
          </div>

          {/* Projects Card */}
          <div className="bg-white p-6 rounded-xl border border-[#e5e5e5] hover:shadow-sm transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <FolderKanban size={20} className="text-[#0a0a0a]" />
              </div>
              <Link 
                href="/projects"
                className="flex items-center gap-1 text-xs font-medium text-[#666] hover:text-[#0a0a0a] transition"
              >
                View <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.04em' }}>
              {metrics?.projectsCount ?? 0}
            </p>
            <p className="text-sm text-[#666]">Total projects</p>
          </div>

          {/* Leads Card */}
          <div className="bg-white p-6 rounded-xl border border-[#e5e5e5] hover:shadow-sm transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#f5f5f5] rounded-lg">
                <Users size={20} className="text-[#0a0a0a]" />
              </div>
              <Link 
                href="/leads"
                className="flex items-center gap-1 text-xs font-medium text-[#666] hover:text-[#0a0a0a] transition"
              >
                View <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.04em' }}>
              {metrics?.leadsCount ?? 0}
            </p>
            <p className="text-sm text-[#666]">Active leads</p>
          </div>
        </div>

        {/* Pipeline Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e5e5e5]">
            <p className="text-sm text-[#666] mb-1">Total Contacts</p>
            <p className="text-xl font-bold text-[#0a0a0a]" style={{ letterSpacing: '-0.04em' }}>{metrics?.contactsCount ?? 0}</p>
          </div>
          <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e5e5e5]">
            <p className="text-sm text-[#666] mb-1">Active Clients</p>
            <p className="text-xl font-bold text-[#0a0a0a]" style={{ letterSpacing: '-0.04em' }}>{metrics?.clientsCount ?? 0}</p>
          </div>
          <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e5e5e5]">
            <p className="text-sm text-[#666] mb-1">Lead → Client</p>
            <p className="text-xl font-bold text-[#0a0a0a]" style={{ letterSpacing: '-0.04em' }}>
              {metrics && metrics.leadsCount > 0 
                ? `${Math.round((metrics.clientsCount / (metrics.clientsCount + metrics.leadsCount)) * 100)}%`
                : '—'
              }
            </p>
          </div>
          <div className="bg-[#f5f5f5] p-4 rounded-xl border border-[#e5e5e5]">
            <p className="text-sm text-[#666] mb-1">Avg Deal Value</p>
            <p className="text-xl font-bold text-[#0a0a0a]" style={{ letterSpacing: '-0.04em' }}>
              {metrics && metrics.revenue > 0 && metrics.clientsCount > 0
                ? formatCurrency(metrics.revenue / metrics.clientsCount)
                : '—'
              }
            </p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mb-8">
          <RevenueChart
            data={metrics?.revenueChart || []}
            activePeriod={chartPeriod}
            onPeriodChange={setChartPeriod}
          />
        </div>

        {/* Ad Funnel Widget */}
        <div className="mb-8">
          <AdFunnelWidget />
        </div>

        {/* Landing Page Analytics Widget */}
        <div className="mb-8">
          <LandingPageAnalyticsWidget />
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <CalendarWidget />

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#f0f0f0]">
              <h2 className="text-base font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>Recent Activity</h2>
              <Link 
                href="/contacts"
                className="text-sm text-[#FF3300] hover:text-[#E62E00] font-medium"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 hover:bg-[#f5f5f5] transition">
                    <div className="p-2 bg-[#f5f5f5] rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0a0a0a] truncate">{activity.title}</p>
                      <p className="text-xs text-[#666] truncate">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-[#999] flex-shrink-0">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[#666]">
                  <Clock className="mx-auto mb-2 text-[#ccc]" size={32} />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Attention Needed */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
            <div className="p-4 border-b border-[#f0f0f0]">
              <h2 className="text-base font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>Attention Needed</h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Outstanding invoices */}
              {metrics && metrics.outstanding > 0 && (
                <Link href="/invoices?status=outstanding" className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition group">
                  <div className="p-2 bg-white rounded-lg border border-[#e5e5e5]">
                    <Clock size={16} className="text-[#FF3300]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">{formatCurrency(metrics.outstanding)} outstanding</p>
                    <p className="text-xs text-[#666]">Unpaid invoices</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#ccc] group-hover:text-[#666]" />
                </Link>
              )}
              {/* New leads */}
              {metrics && metrics.leadsCount > 0 && (
                <Link href="/leads" className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition group">
                  <div className="p-2 bg-white rounded-lg border border-[#e5e5e5]">
                    <Target size={16} className="text-[#0a0a0a]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0a0a0a]">{metrics.leadsCount} open leads</p>
                    <p className="text-xs text-[#666]">Waiting for follow-up</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#ccc] group-hover:text-[#666]" />
                </Link>
              )}
              {/* Quick actions */}
              <Link href="/contacts?action=new" className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition group">
                <div className="p-2 bg-white rounded-lg border border-[#e5e5e5]">
                  <UserPlus size={16} className="text-[#0a0a0a]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0a0a0a]">Add Contact</p>
                </div>
                <ArrowUpRight size={14} className="text-[#ccc] group-hover:text-[#666]" />
              </Link>
              <Link href="/invoices?action=new" className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-lg hover:bg-[#eee] transition group">
                <div className="p-2 bg-white rounded-lg border border-[#e5e5e5]">
                  <DollarSign size={16} className="text-[#0a0a0a]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0a0a0a]">Create Invoice</p>
                </div>
                <ArrowUpRight size={14} className="text-[#ccc] group-hover:text-[#666]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
