/**
 * Agent Communications Dashboard
 * Shows recent inter-agent Slack messages from #all-hands
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, RefreshCw, Users, Activity, ArrowLeft, Filter } from 'lucide-react';

const AGENT_COLORS = {
  Jarvis: 'bg-blue-600',
  Bolt:   'bg-purple-600',
  Aria:   'bg-pink-600',
  Scout:  'bg-green-600',
  Radar:  'bg-orange-600',
  Blaze:  'bg-red-600',
  Jonny:  'bg-gray-700'
};

const AGENT_EMOJIS = {
  Jarvis: '🧠',
  Bolt:   '⚡',
  Aria:   '🎨',
  Scout:  '🔍',
  Radar:  '📡',
  Blaze:  '🔥',
  Jonny:  '👤'
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AgentBadge({ name, small = false }) {
  const color = AGENT_COLORS[name] || 'bg-gray-500';
  const emoji = AGENT_EMOJIS[name] || '❓';
  const initials = name ? name[0] : '?';
  if (small) {
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${color} text-white text-xs font-bold`}>
        {initials}
      </span>
    );
  }
  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
      {initials}
    </div>
  );
}

function MessageCard({ msg }) {
  const isJonny = msg.agentName === 'Jonny';
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-lg border ${isJonny ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'} hover:shadow-sm transition-shadow`}>
      <AgentBadge name={msg.agentName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">{msg.agentName}</span>
          <span className="text-xs text-gray-400">{msg.agentRole}</span>
          <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{timeAgo(msg.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {msg.reactions.map(r => (
              <span key={r.name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                :{r.name}: {r.count > 1 && <span>{r.count}</span>}
              </span>
            ))}
          </div>
        )}
        {msg.replyCount > 0 && (
          <div className="mt-1 text-xs text-blue-500">{msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}</div>
        )}
      </div>
    </div>
  );
}

function AgentActivityCard({ name, count, lastMessage }) {
  const color = AGENT_COLORS[name] || 'bg-gray-500';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
      <AgentBadge name={name} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{name}</div>
        <div className="text-xs text-gray-500">{count} message{count !== 1 ? 's' : ''}</div>
      </div>
      {lastMessage && (
        <div className="text-xs text-gray-400 flex-shrink-0">{timeAgo(lastMessage)}</div>
      )}
    </div>
  );
}

export default function CommsPage() {
  const [messages, setMessages] = useState([]);
  const [agentActivity, setAgentActivity] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAgent, setFilterAgent] = useState('all');
  const [lastFetched, setLastFetched] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/slack/messages?agents=all&limit=100');
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
        setAgentActivity(data.data.agentActivity || {});
        setLastFetched(new Date());
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 60000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const agentNames = ['all', ...Object.keys(AGENT_COLORS)];

  const filteredMessages = filterAgent === 'all'
    ? messages
    : messages.filter(m => m.agentName === filterAgent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  Agent Communications
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Live feed from #all-hands · {lastFetched ? `Updated ${timeAgo(lastFetched.toISOString())}` : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchMessages()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: agent activity */}
        <aside className="lg:col-span-1 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Agent Activity
            </h2>
            <div className="space-y-2">
              {Object.entries(agentActivity)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([name, stats]) => (
                  <AgentActivityCard
                    key={name}
                    name={name}
                    count={stats.count}
                    lastMessage={stats.lastMessage}
                  />
                ))}
              {!loading && Object.keys(agentActivity).length === 0 && (
                <p className="text-sm text-gray-400">No activity yet</p>
              )}
            </div>
          </div>

          {/* Filter */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter by Agent
            </h2>
            <div className="flex flex-col gap-1">
              {agentNames.map(name => (
                <button
                  key={name}
                  onClick={() => setFilterAgent(name)}
                  className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    filterAgent === name
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {name !== 'all' && <AgentBadge name={name} small />}
                  {name === 'all' ? 'All Agents' : name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main feed */}
        <main className="lg:col-span-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3" />
              <p>Loading messages…</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 font-semibold mb-1">Could not load messages</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              {error.includes('SLACK_BOT_TOKEN') && (
                <p className="text-sm text-gray-600">
                  Add <code className="bg-gray-100 px-1 rounded">SLACK_BOT_TOKEN</code> to Vercel environment variables to enable this feature.
                </p>
              )}
              <button
                onClick={() => fetchMessages()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredMessages.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No messages found</p>
              {filterAgent !== 'all' && (
                <p className="text-sm mt-1">No recent messages from {filterAgent}</p>
              )}
            </div>
          )}

          {!loading && !error && filteredMessages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                  {filterAgent !== 'all' && ` from ${filterAgent}`}
                </span>
              </div>
              {filteredMessages.map(msg => (
                <MessageCard key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
