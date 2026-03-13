'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Mail,
  Download,
  RefreshCw,
  Target,
  Users,
  DollarSign,
  Eye
} from 'lucide-react';

interface DailySummaryData {
  date: string;
  metrics: {
    analytics: {
      sessions: number;
      pageviews: number;
      bounce_rate: number;
      avg_session_duration: number;
      trend: 'up' | 'down' | 'stable';
    };
    campaigns: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      cpc: number;
      ctr: number;
    };
    tasks: {
      completed: number;
      in_progress: number;
      overdue: number;
      completion_rate: number;
    };
    system: {
      uptime: number;
      errors: number;
      response_time: number;
      api_calls: number;
    };
  };
  insights: string[];
  anomalies: {
    metric: string;
    current: number;
    expected: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  actions: {
    priority: 'high' | 'medium' | 'low';
    task: string;
    assigned_to: string;
    deadline: string;
  }[];
}

export default function DailySummaryReport() {
  const [summaryData, setSummaryData] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSummaryData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSummaryData, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [selectedDate, autoRefresh]);

  const loadSummaryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/daily-summary?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      }
    } catch (error) {
      console.error('Failed to load summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/daily-summary/export?date=${selectedDate}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `daily-summary-${selectedDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handleEmailReport = async () => {
    try {
      await fetch('/api/daily-summary/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
    } catch (error) {
      console.error('Failed to email report:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <span className="h-4 w-4 text-gray-400">—</span>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading daily summary...</span>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-gray-600">No summary data found for {selectedDate}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Summary Report</h1>
          <p className="text-gray-600">Performance overview and insights for {summaryData.date}</p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <button
            onClick={loadSummaryData}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
          <button
            onClick={handleEmailReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Website Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(summaryData.metrics.analytics.sessions)}</p>
              <p className="text-xs text-gray-500">{formatPercentage(summaryData.metrics.analytics.bounce_rate)} bounce rate</p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon(summaryData.metrics.analytics.trend)}
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Campaign Spend</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.metrics.campaigns.spend)}</p>
              <p className="text-xs text-gray-500">{summaryData.metrics.campaigns.conversions} conversions</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">{summaryData.metrics.tasks.completed}</p>
              <p className="text-xs text-gray-500">{formatPercentage(summaryData.metrics.tasks.completion_rate)} completion rate</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(summaryData.metrics.system.uptime)}</p>
              <p className="text-xs text-gray-500">{summaryData.metrics.system.errors} errors</p>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Analytics Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Sessions</span>
              <span className="font-medium">{formatNumber(summaryData.metrics.analytics.sessions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Page Views</span>
              <span className="font-medium">{formatNumber(summaryData.metrics.analytics.pageviews)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bounce Rate</span>
              <span className="font-medium">{formatPercentage(summaryData.metrics.analytics.bounce_rate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Session Duration</span>
              <span className="font-medium">{Math.round(summaryData.metrics.analytics.avg_session_duration)}s</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Impressions</span>
              <span className="font-medium">{formatNumber(summaryData.metrics.campaigns.impressions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Clicks</span>
              <span className="font-medium">{formatNumber(summaryData.metrics.campaigns.clicks)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CTR</span>
              <span className="font-medium">{formatPercentage(summaryData.metrics.campaigns.ctr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CPC</span>
              <span className="font-medium">{formatCurrency(summaryData.metrics.campaigns.cpc)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights and Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="space-y-3">
            {summaryData.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm text-blue-800">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Anomalies</h3>
          <div className="space-y-3">
            {summaryData.anomalies.map((anomaly, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{anomaly.metric}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{anomaly.description}</p>
                <div className="text-xs text-gray-500">
                  Current: {anomaly.current} | Expected: {anomaly.expected}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Recommended Actions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.actions.map((action, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{action.task}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{action.assigned_to}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{action.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
