import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Users, CheckCircle, Clock, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

const AGENT_COLORS = {
  Bolt: 'bg-blue-100 text-blue-800',
  Aria: 'bg-pink-100 text-pink-800',
  Scout: 'bg-green-100 text-green-800',
  Radar: 'bg-purple-100 text-purple-800',
  Blaze: 'bg-orange-100 text-orange-800',
  Jarvis: 'bg-gray-100 text-gray-800',
  Unassigned: 'bg-gray-100 text-gray-500',
};

const TYPE_CONFIG = {
  working: { icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Working' },
  review: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'In Review' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Done' },
  blocked: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: 'Overdue' },
};

export default function ActivityFeed() {
  const [data, setData] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const [actRes, agentRes] = await Promise.all([
        fetch('/api/activity'),
        fetch('/api/agents/status'),
      ]);
      const actJson = await actRes.json();
      const agentJson = await agentRes.json();
      if (actJson.success) setData(actJson);
      if (agentJson.success) setAgentData(agentJson);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch activity:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
                <p className="text-gray-600 text-sm">Live agent activity — auto-refreshes every 15s</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {lastUpdated && (
                <span className="text-xs text-gray-400">Updated {formatTime(lastUpdated.toISOString())}</span>
              )}
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading activity feed...</div>
        ) : (
          <>
            {/* Stats row */}
            {data?.stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-blue-600">{data.stats.working}</p>
                  <p className="text-xs text-gray-500 mt-1">Agents Working</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{data.stats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">In Progress</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-orange-600">{data.stats.review}</p>
                  <p className="text-xs text-gray-500 mt-1">In Review</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{data.stats.done}</p>
                  <p className="text-xs text-gray-500 mt-1">Done</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-gray-600">{data.stats.backlog}</p>
                  <p className="text-xs text-gray-500 mt-1">Backlog</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agent Status Cards */}
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  Agent Status
                </h2>
                <div className="space-y-3">
                  {agentData?.agents?.map(agent => (
                    <div key={agent.name} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${agent.status === 'working' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AGENT_COLORS[agent.name] || AGENT_COLORS.Unassigned}`}>
                            {agent.name}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${agent.status === 'working' ? 'text-green-600' : 'text-gray-400'}`}>
                          {agent.status === 'working' ? '● Active' : '○ Idle'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{agent.role}</p>
                      {agent.currentTask && (
                        <p className="text-xs text-gray-700 mt-1 font-medium truncate">
                          → {agent.currentTask.title}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>{agent.taskCounts.inProgress} active</span>
                        <span>{agent.taskCounts.inReview} review</span>
                        <span>{agent.taskCounts.done} done</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-500" />
                  Activity Log
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {data?.activities?.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No activity yet</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {data?.activities?.map((activity, i) => {
                        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.working;
                        const IconComponent = config.icon;
                        return (
                          <div key={activity.id || i} className={`flex items-start gap-3 p-4 ${config.bg}`}>
                            <IconComponent className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AGENT_COLORS[activity.agentName] || AGENT_COLORS.Unassigned}`}>
                                  {activity.agentName}
                                </span>
                                <span className="text-xs text-gray-500">{activity.action}</span>
                              </div>
                              <p className="text-sm text-gray-800 font-medium mt-0.5 truncate">
                                {activity.taskTitle}
                              </p>
                            </div>
                            <span className={`text-xs font-medium flex-shrink-0 ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
