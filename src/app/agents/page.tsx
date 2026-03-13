'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, Bot, X, Edit3, Trash2, MoreHorizontal,
  Zap, BookOpen, MessageSquare, Activity, Check,
  LayoutGrid, GitBranch, Wifi, WifiOff,
} from 'lucide-react';
import { OrgChart } from '@/components/OrgChart';
import { AGENT_MAPPING } from '@/lib/agent-mapping';

// Live status from OpenClaw kanban
interface LiveAgentStatus {
  name: string;
  status: 'working' | 'idle';
  currentTask: { id: string; title: string; dueDate?: string } | null;
  taskCounts: { inProgress: number; inReview: number; backlog: number; done: number; total: number };
}

// Types
interface AgentStats {
  tasksCompleted: number;
  tasksInProgress: number;
  learnings: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'idle' | 'offline';
  description: string;
  skills: string[];
  slackChannel?: string;
  personality: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  stats: AgentStats;
}

// Constants
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: '#10B981', bgColor: '#ECFDF5' },
  idle: { label: 'Idle', color: '#F59E0B', bgColor: '#FFFBEB' },
  offline: { label: 'Offline', color: '#6B7280', bgColor: '#F3F4F6' },
};

const DEFAULT_AGENTS: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>[] = [
  {
    name: 'Aria',
    role: 'Content Strategist',
    avatar: '✍️',
    status: 'active',
    description: 'Creates engaging social media content, manages content calendars, and writes compelling copy across all platforms.',
    skills: ['Social Media Strategy', 'Copywriting', 'Content Calendars', 'Brand Voice'],
    personality: 'Creative, trend-aware, and always on-brand. Thinks in hooks and stories.',
    stats: { tasksCompleted: 0, tasksInProgress: 0, learnings: 0 },
  },
  {
    name: 'Scout',
    role: 'SEO Specialist',
    avatar: '🔍',
    status: 'active',
    description: 'Handles technical SEO audits, keyword research, on-page optimisation, and search ranking strategies.',
    skills: ['Technical SEO', 'Keyword Research', 'On-Page SEO', 'Link Building', 'Analytics'],
    personality: 'Data-driven, methodical, obsessed with rankings and organic growth.',
    stats: { tasksCompleted: 0, tasksInProgress: 0, learnings: 0 },
  },
  {
    name: 'Bolt',
    role: 'Developer',
    avatar: '⚡',
    status: 'active',
    description: 'Builds web apps, implements technical solutions, manages deployments, and handles all coding tasks.',
    skills: ['React/Next.js', 'Node.js', 'Firebase', 'API Development', 'Shopify', 'WordPress'],
    personality: 'Ship fast, iterate faster. Clean code, practical solutions.',
    stats: { tasksCompleted: 0, tasksInProgress: 0, learnings: 0 },
  },
  {
    name: 'Radar',
    role: 'Marketing Analyst',
    avatar: '📊',
    status: 'active',
    description: 'Tracks campaign performance, analyses data, optimises for ROAS, and generates actionable reports.',
    skills: ['Google Analytics', 'Campaign Tracking', 'ROAS Optimisation', 'Reporting', 'A/B Testing'],
    personality: 'Numbers don\'t lie. Finds the signal in the noise.',
    stats: { tasksCompleted: 0, tasksInProgress: 0, learnings: 0 },
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, LiveAgentStatus>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'orgchart'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const router = useRouter();

  // Available skills from GitHub
  interface AvailableSkill {
    name: string;
    category: string;
    path: string;
  }
  const [availableSkills, setAvailableSkills] = useState<AvailableSkill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '🤖',
    status: 'active' as 'active' | 'idle' | 'offline',
    description: '',
    skills: '' as string,
    personality: '',
    slackChannel: '',
  });

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data.data?.agents || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/github?type=skills&action=tree');
      if (!res.ok) return;
      const data = await res.json();
      const tree = data.data?.tree || [];
      const skills: AvailableSkill[] = tree
        .filter((f: { path: string; type: string }) => f.type === 'file' && f.path.endsWith('.md') && f.path !== 'README.md' && f.path.includes('/'))
        .map((f: { path: string }) => {
          const parts = f.path.split('/');
          const category = parts[0];
          const name = parts[parts.length - 1].replace('.md', '');
          return { name, category, path: f.path };
        });
      setAvailableSkills(skills);
    } catch (err) {
      console.error('Error fetching skills:', err);
    }
  }, []);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status-live');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.agents) {
        const map: Record<string, LiveAgentStatus> = {};
        for (const a of data.agents) {
          map[a.name] = a;
        }
        setLiveStatus(map);
      }
    } catch {
      // Live status is best-effort — don't block the page
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchAvailableSkills();
      fetchLiveStatus();
      // Refresh live status every 60s
      const interval = setInterval(fetchLiveStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAgents, fetchAvailableSkills, fetchLiveStatus]);

  const handleSeedAgents = async () => {
    setLoading(true);
    try {
      for (const agent of DEFAULT_AGENTS) {
        await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agent),
        });
      }
      await fetchAgents();
    } catch (err) {
      console.error('Error seeding agents:', err);
      setError('Failed to create default agents');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role) return;

    const payload = {
      ...formData,
      skills: selectedSkills,
    };

    try {
      if (editingAgent) {
        const res = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update agent');
      } else {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create agent');
      }
      setShowModal(false);
      setEditingAgent(null);
      resetForm();
      await fetchAgents();
    } catch (err) {
      console.error('Error saving agent:', err);
      setError('Failed to save agent');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      await fetchAgents();
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
    setMenuOpen(null);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      role: agent.role,
      avatar: agent.avatar,
      status: agent.status,
      description: agent.description,
      skills: agent.skills.join(', '),
      personality: agent.personality,
      slackChannel: agent.slackChannel || '',
    });
    setSelectedSkills(agent.skills || []);
    setSkillSearch('');
    setShowModal(true);
    setMenuOpen(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      avatar: '🤖',
      status: 'active',
      description: '',
      skills: '',
      personality: '',
      slackChannel: '',
    });
    setSelectedSkills([]);
    setSkillSearch('');
  };

  const toggleSkill = (skillName: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  const skillsByCategory = availableSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, AvailableSkill[]>);

  const filteredSkillCategories = Object.entries(skillsByCategory)
    .map(([cat, skills]) => ({
      category: cat,
      skills: skills.filter(s =>
        !skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()) || s.category.toLowerCase().includes(skillSearch.toLowerCase())
      ),
    }))
    .filter(({ skills }) => skills.length > 0);

  const filteredAgents = agents.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );

  // Styles
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    padding: isMobile ? '1rem' : '2rem',
    paddingTop: isMobile ? '4rem' : '2rem',
    overflowY: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.5rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '0.75rem',
    border: '1px solid #E5E7EB',
    padding: '1.5rem',
    position: 'relative',
    transition: 'box-shadow 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#FF3300',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '0.375rem',
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div style={pageStyle}>
      <Sidebar />
      <main style={mainStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Agent Team
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0' }}>
              Manage your AI agent team and their roles
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{
              display: 'inline-flex', borderRadius: '0.5rem', border: '1px solid #E5E7EB',
              overflow: 'hidden', backgroundColor: '#F9FAFB',
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.15s',
                  backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? '#111827' : '#9CA3AF',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
              <button
                onClick={() => setViewMode('orgchart')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.15s',
                  backgroundColor: viewMode === 'orgchart' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'orgchart' ? '#111827' : '#9CA3AF',
                  boxShadow: viewMode === 'orgchart' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <GitBranch size={14} />
                Org Chart
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', width: '220px' }}
              />
            </div>
            <button onClick={() => { resetForm(); setEditingAgent(null); setShowModal(true); }} style={buttonStyle}>
              <Plus size={16} />
              Add Agent
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Empty state with seed button */}
        {!loading && agents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Bot size={48} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem' }}>
              No agents yet
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Set up your AI team with our recommended starter agents.
            </p>
            <button onClick={handleSeedAgents} style={buttonStyle}>
              <Zap size={16} />
              Create Default Team
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading agents...</div>
        )}

        {/* Org Chart View */}
        {!loading && viewMode === 'orgchart' && (
          <div style={{
            backgroundColor: '#0f0f0f',
            borderRadius: '0.75rem',
            border: '1px solid #2d2d2d',
            padding: isMobile ? '0.5rem' : '1.5rem',
            minHeight: '400px',
          }}>
            <OrgChart
              onNodeClick={(id) => {
                const agent = agents.find(a => a.name.toLowerCase() === id.toLowerCase());
                if (agent) {
                  setViewMode('grid');
                  setTimeout(() => {
                    const el = document.getElementById(`agent-card-${agent.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.style.boxShadow = '0 0 0 2px #FF3300';
                      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
                    }
                  }, 100);
                }
              }}
            />
          </div>
        )}

        {/* Agent Grid */}
        {!loading && viewMode === 'grid' && filteredAgents.length > 0 && (
          <div style={gridStyle}>
            {filteredAgents.map((agent) => {
              const live = liveStatus[agent.name];
              // Live status overrides Firestore status when available
              const resolvedStatus = live
                ? (live.status === 'working' ? 'active' : 'idle')
                : agent.status;
              const statusConfig = STATUS_CONFIG[resolvedStatus] || STATUS_CONFIG.offline;
              return (
                <div key={agent.id} id={`agent-card-${agent.id}`} style={cardStyle}>
                  {/* Menu button */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === agent.id ? null : agent.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9CA3AF' }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuOpen === agent.id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '100%', backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 10, minWidth: '140px', overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => handleEdit(agent)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#374151', textAlign: 'left' }}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#DC2626', textAlign: 'left' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Agent header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    }}>
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                        {agent.name}
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.125rem 0 0' }}>
                        {agent.role}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.25rem 0.625rem', borderRadius: '9999px',
                      backgroundColor: statusConfig.bgColor, color: statusConfig.color,
                      fontSize: '0.75rem', fontWeight: 500,
                    }}>
                      <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: statusConfig.color,
                      }} />
                      {live ? (live.status === 'working' ? 'Working' : 'Idle') : statusConfig.label}
                    </span>
                    {live && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: '#9CA3AF' }}>
                        live
                      </span>
                    )}
                  </div>
                  {/* Current task (from live kanban) */}
                  {live?.currentTask && (
                    <div style={{
                      marginBottom: '0.75rem', padding: '0.5rem 0.625rem',
                      backgroundColor: '#F0FDF4', borderRadius: '0.375rem',
                      borderLeft: '3px solid #10B981',
                    }}>
                      <p style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 600, margin: '0 0 0.125rem' }}>
                        Current task
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#111827', margin: 0, lineHeight: '1.4' }}>
                        {live.currentTask.title}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <p style={{
                    fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 1rem',
                    lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {agent.description}
                  </p>

                  {/* Skills */}
                  {agent.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
                      {agent.skills.slice(0, 4).map((skill, i) => (
                        <span key={i} style={{
                          padding: '0.125rem 0.5rem', backgroundColor: '#F3F4F6',
                          borderRadius: '0.25rem', fontSize: '0.6875rem', color: '#4B5563',
                        }}>
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 4 && (
                        <span style={{
                          padding: '0.125rem 0.5rem', backgroundColor: '#F3F4F6',
                          borderRadius: '0.25rem', fontSize: '0.6875rem', color: '#9CA3AF',
                        }}>
                          +{agent.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* OpenClaw Integration Badge */}
                  {(() => {
                    const ocConfig = AGENT_MAPPING[agent.name];
                    return ocConfig ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.375rem 0.5rem', marginBottom: '0.75rem',
                        backgroundColor: '#F0FDF4', borderRadius: '0.375rem',
                        border: '1px solid #BBF7D0',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#15803D', fontWeight: 500 }}>
                          <Wifi size={11} />
                          OpenClaw: <code style={{ fontSize: '0.65rem', fontFamily: 'monospace', backgroundColor: '#DCFCE7', padding: '0 0.25rem', borderRadius: '0.25rem' }}>{ocConfig.openclawId}</code>
                        </span>
                        {ocConfig.heartbeatEnabled && (
                          <span style={{ fontSize: '0.6rem', color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block' }} />
                            Autonomous
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.5rem', marginBottom: '0.75rem',
                        backgroundColor: '#F9FAFB', borderRadius: '0.375rem',
                        border: '1px solid #E5E7EB', fontSize: '0.6875rem', color: '#9CA3AF',
                      }}>
                        <WifiOff size={11} /> Not connected to OpenClaw
                      </div>
                    );
                  })()}

                  {/* Stats */}
                  <div style={{
                    display: 'flex', gap: '1rem', paddingTop: '0.75rem',
                    borderTop: '1px solid #F3F4F6', fontSize: '0.75rem', color: '#6B7280',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Activity size={12} /> {live?.taskCounts?.inProgress ?? agent.stats?.tasksInProgress ?? 0} active
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={12} /> {live?.taskCounts?.done ?? agent.stats?.tasksCompleted ?? 0} done
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MessageSquare size={12} /> {agent.stats?.learnings || 0} learnings
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '0.75rem', width: '100%',
              maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingAgent ? 'Edit Agent' : 'Add New Agent'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingAgent(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Avatar</label>
                    <input
                      value={formData.avatar}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', padding: '0.375rem' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Aria"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Role *</label>
                  <input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Content Strategist"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'idle' | 'offline' })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this agent do?"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Skills from Library ({selectedSkills.length} selected)</label>
                  {/* Selected skills tags */}
                  {selectedSkills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      {selectedSkills.map(skill => (
                        <span key={skill} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', backgroundColor: '#EFF6FF', color: '#1D4ED8',
                          borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 500,
                        }}>
                          {skill}
                          <button onClick={() => toggleSkill(skill)} style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8',
                            padding: '0', lineHeight: 1, fontSize: '0.875rem',
                          }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Search */}
                  <div style={{ position: 'relative', marginBottom: '0.375rem' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Search skills..."
                      style={{ ...inputStyle, paddingLeft: '2rem', fontSize: '0.8125rem' }}
                    />
                  </div>
                  {/* Skills list by category */}
                  <div style={{
                    maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem', backgroundColor: '#FAFAFA',
                  }}>
                    {filteredSkillCategories.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.8125rem' }}>
                        {availableSkills.length === 0 ? 'Loading skills from GitHub...' : 'No matching skills'}
                      </div>
                    ) : (
                      filteredSkillCategories.map(({ category, skills }) => (
                        <div key={category}>
                          <div style={{
                            padding: '0.375rem 0.75rem', backgroundColor: '#F3F4F6',
                            fontSize: '0.6875rem', fontWeight: 600, color: '#6B7280',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            position: 'sticky', top: 0,
                          }}>
                            {category}
                          </div>
                          {skills.map(skill => {
                            const isSelected = selectedSkills.includes(skill.name);
                            return (
                              <div
                                key={skill.path}
                                onClick={() => toggleSkill(skill.name)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  padding: '0.375rem 0.75rem', cursor: 'pointer',
                                  backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                  fontSize: '0.8125rem', color: isSelected ? '#1D4ED8' : '#374151',
                                  borderBottom: '1px solid #F3F4F6',
                                }}
                              >
                                <div style={{
                                  width: '16px', height: '16px', borderRadius: '0.25rem',
                                  border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                                  backgroundColor: isSelected ? '#3B82F6' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {isSelected && <Check size={10} style={{ color: '#FFFFFF' }} />}
                                </div>
                                {skill.name}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Personality</label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    placeholder="How does this agent approach work?"
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Slack Channel (optional)</label>
                  <input
                    value={formData.slackChannel}
                    onChange={(e) => setFormData({ ...formData, slackChannel: e.target.value })}
                    placeholder="#agent-content"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => { setShowModal(false); setEditingAgent(null); }}
                  style={{ ...buttonStyle, backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB' }}
                >
                  Cancel
                </button>
                <button onClick={handleSubmit} style={buttonStyle}>
                  {editingAgent ? 'Save Changes' : 'Create Agent'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
