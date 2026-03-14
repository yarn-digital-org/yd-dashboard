import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, BarChart, Users, Settings, Calendar, Search, Bell, Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const TYPE_CONFIG = {
  working:   { icon: Activity,      color: 'text-blue-500',   dot: 'bg-blue-500 animate-pulse' },
  review:    { icon: Clock,         color: 'text-yellow-500', dot: 'bg-yellow-500' },
  completed: { icon: CheckCircle,   color: 'text-green-500',  dot: 'bg-green-500' },
  blocked:   { icon: AlertTriangle, color: 'text-red-500',    dot: 'bg-red-500' },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ inProgress: 0, review: 0, done: 0, total: 0 });
  const [activities, setActivities] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [workingAgents, setWorkingAgents] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        setActivities(json.activities.slice(0, 6));
        setWorkingAgents(json.workingAgents || []);
      }
    } catch (e) {
      console.error('Activity fetch error:', e);
    } finally {
      setLoadingActivity(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/daily-summary');
      const json = await res.json();
      if (json.success && json.summary) {
        setHighlights(json.summary.highlights || []);
      }
    } catch (e) {
      console.error('Summary fetch error:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchActivity();
    fetchSummary();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      title: 'Activity Feed',
      description: 'Live agent activity and task status',
      icon: Activity,
      href: '/activity',
      color: 'bg-teal-500 hover:bg-teal-600',
      priority: true
    },
    {
      title: 'Agent Team',
      description: 'View AI team members and org chart',
      icon: Users,
      href: '/team',
      color: 'bg-blue-500 hover:bg-blue-600',
      priority: true
    },
    {
      title: 'Agent Comms',
      description: 'Live inter-agent Slack message feed',
      icon: Users,
      href: '/comms',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      priority: true
    },
    {
      title: 'GitHub Documents',
      description: 'Review and manage client documents in GitHub',
      icon: FileText,
      href: '/documents-github',
      color: 'bg-green-500 hover:bg-green-600',
      priority: true
    },
    {
      title: 'Skill Editor',
      description: 'Edit skills with Git commits',
      icon: Settings,
      href: '/skill-editor',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Skill Import',
      description: 'Import skills from external repositories',
      icon: Settings,
      href: '/skill-import',
      color: 'bg-violet-500 hover:bg-violet-600'
    },
    {
      title: 'Version History',
      description: 'Track changes across all documents',
      icon: BarChart,
      href: '/version-history',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Legacy Documents',
      description: 'Original document management system',
      icon: FileText,
      href: '/documents',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const getActivityIcon = (type) => {
    return (TYPE_CONFIG[type] || TYPE_CONFIG.working).icon;
  };

  const getActivityColor = (type) => {
    return (TYPE_CONFIG[type] || TYPE_CONFIG.working).color;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yarn Digital Dashboard</h1>
              <p className="text-gray-600">AI Team Operations Hub</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                {stats.review > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid — live data */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inProgress ?? '—'}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Review</p>
                <p className="text-3xl font-bold text-gray-900">{stats.review ?? '—'}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.done ?? '—'}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Agents Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.working ?? '—'}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Daily Summary Highlights */}
        {!loadingSummary && highlights.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Today&apos;s Summary</h2>
            <ul className="space-y-1.5">
              {highlights.map((h, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <div className={`card-hover bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer ${action.priority ? 'ring-2 ring-blue-200' : ''}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg text-white ${action.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-gray-600 text-sm">{action.description}</p>
                          {action.priority && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              Live Activity
              {workingAgents.length > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {loadingActivity ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, i) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id || i} className="flex items-start space-x-3">
                        <IconComponent className={`w-5 h-5 mt-1 ${getActivityColor(activity.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">
                            <span className="text-gray-500">{activity.agentName}</span>{' '}
                            {activity.action.toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{activity.taskTitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View full activity feed →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
