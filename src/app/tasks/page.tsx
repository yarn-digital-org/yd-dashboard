'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, X, Filter, ChevronDown,
  Calendar, Clock, AlertCircle, CheckCircle2, Circle,
  LayoutGrid, List, Repeat, GripVertical,
  Edit3, Trash2, Power, PowerOff, Timer,
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface RecurringConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  nextDue?: string;
}

interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: {
    kind: 'every' | 'at';
    everyMs?: number;
    at?: string;
    anchorMs?: number;
  };
  payload?: {
    kind?: string;
    message?: string;
    text?: string;
  };
  state?: {
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    consecutiveErrors?: number;
    lastError?: string;
  };
  agentId?: string;
  sessionTarget?: string;
  createdAtMs?: number;
  updatedAtMs?: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | string[];
  assignedToName: string | string[];
  labels: string[];
  dueDate?: string;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes: string;
  feedbackNotes?: string;
}

// Helper to normalize assignedTo to array
const toArray = (val: string | string[] | undefined): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val ? [val] : [];
};

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'board' | 'list' | 'recurring';

// Constants
const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'backlog', label: 'Backlog', color: '#6B7280', icon: <Circle size={14} /> },
  { key: 'in-progress', label: 'In Progress', color: '#3B82F6', icon: <Clock size={14} /> },
  { key: 'review', label: 'Review', color: '#F59E0B', icon: <AlertCircle size={14} /> },
  { key: 'done', label: 'Done', color: '#10B981', icon: <CheckCircle2 size={14} /> },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: '#DC2626', bgColor: '#FEF2F2' },
  high: { label: 'High', color: '#F97316', bgColor: '#FFF7ED' },
  medium: { label: 'Medium', color: '#F59E0B', bgColor: '#FFFBEB' },
  low: { label: 'Low', color: '#6B7280', bgColor: '#F3F4F6' },
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clientDocs, setClientDocs] = useState<{id: string; clientName: string; status: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [showCronModal, setShowCronModal] = useState(false);
  const [cronForm, setCronForm] = useState({
    name: '',
    description: '',
    frequency: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    message: '',
  });
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'backlog' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignedTo: [] as string[],
    assignedToNames: [] as string[],
    clientId: '',
    clientName: '',
    dueDate: '',
    isRecurring: false,
    recurringFrequency: 'weekly' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    recurringDayOfWeek: 1,
    recurringDayOfMonth: 1,
    createAsCron: false,
    cronMessage: '',
    notes: '',
    labels: '',
  });

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.data?.tasks || []);
      setStats(data.data?.stats?.byStatus || {});
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCronJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/cron-jobs');
      if (!res.ok) return;
      const data = await res.json();
      setCronJobs(data.data?.jobs || []);
    } catch (err) {
      console.error('Error fetching cron jobs:', err);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) return;
      const data = await res.json();
      setAgents(data.data?.agents || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  }, []);

  const fetchClientDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/client-docs');
      if (!res.ok) return;
      const data = await res.json();
      setClientDocs(data.data?.clients || []);
    } catch (err) {
      console.error('Error fetching client docs:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCronJobs();
      fetchAgents();
      fetchClientDocs();
    }
  }, [user, fetchTasks, fetchCronJobs, fetchAgents, fetchClientDocs]);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAgent && !toArray(t.assignedTo).includes(filterAgent)) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);
  const recurringTasks = filteredTasks.filter(t => t.isRecurring);

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDraggedTask(null);
    setDragOverColumn(null);

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update task status');
      await fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      await fetchTasks(); // Revert on error
    }
  };

  // Selection helpers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const selectAllInColumn = (status: TaskStatus) => {
    const colTasks = getTasksByStatus(status);
    setSelectedTasks(prev => {
      const next = new Set(prev);
      const allSelected = colTasks.every(t => next.has(t.id));
      if (allSelected) colTasks.forEach(t => next.delete(t.id));
      else colTasks.forEach(t => next.add(t.id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
    setShowBulkMenu(false);
  };

  const handleBulkMove = async (targetStatus: TaskStatus) => {
    if (selectedTasks.size === 0) return;
    const taskIds = Array.from(selectedTasks);

    // Optimistic update
    setTasks(prev => prev.map(t => taskIds.includes(t.id) ? { ...t, status: targetStatus } : t));

    // Update each task via API
    const updates = taskIds.map(id =>
      fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      }).catch(err => console.error(`Failed to update ${id}:`, err))
    );
    await Promise.all(updates);
    clearSelection();
    await fetchTasks();
  };

  // CRUD
  const handleSubmit = async () => {
    if (!formData.title) return;

    const assignedNames = formData.assignedTo.map(id => {
      const a = agents.find(ag => ag.id === id);
      return a?.name || 'Unknown';
    });
    const payload: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      assignedTo: formData.assignedTo,
      assignedToName: assignedNames.length > 0 ? assignedNames : ['Unassigned'],
      clientId: formData.clientId || undefined,
      clientName: formData.clientId ? (clientDocs.find(c => c.id === formData.clientId)?.clientName || '') : undefined,
      dueDate: formData.dueDate || undefined,
      isRecurring: formData.isRecurring,
      notes: formData.notes,
      labels: formData.labels.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (formData.isRecurring) {
      payload.recurringConfig = {
        frequency: formData.recurringFrequency,
        ...(formData.recurringFrequency === 'weekly' ? { dayOfWeek: formData.recurringDayOfWeek } : {}),
        ...(formData.recurringFrequency === 'monthly' ? { dayOfMonth: formData.recurringDayOfMonth } : {}),
      };
    }

    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update task');
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create task');
      }
      // Create cron job if requested
      if (formData.isRecurring && formData.createAsCron && formData.cronMessage) {
        try {
          await fetch('/api/cron-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.title,
              description: formData.description || `Recurring task: ${formData.title}`,
              frequency: formData.recurringFrequency,
              message: formData.cronMessage,
            }),
          });
          await fetchCronJobs();
        } catch (cronErr) {
          console.error('Error creating cron job:', cronErr);
          // Don't fail the whole save — task was created, cron failed
        }
      }

      setShowModal(false);
      setEditingTask(null);
      resetForm();
      await fetchTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Failed to save task');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: toArray(task.assignedTo),
      assignedToNames: toArray(task.assignedToName),
      clientId: (task as any).clientId || '',
      clientName: (task as any).clientName || '',
      dueDate: task.dueDate || '',
      isRecurring: task.isRecurring,
      recurringFrequency: task.recurringConfig?.frequency || 'weekly',
      recurringDayOfWeek: task.recurringConfig?.dayOfWeek ?? 1,
      recurringDayOfMonth: task.recurringConfig?.dayOfMonth ?? 1,
      createAsCron: false,
      cronMessage: '',
      notes: task.notes || '',
      labels: task.labels?.join(', ') || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', status: 'backlog', priority: 'medium',
      assignedTo: [], assignedToNames: [], clientId: '', clientName: '', dueDate: '', isRecurring: false,
      recurringFrequency: 'weekly', recurringDayOfWeek: 1, recurringDayOfMonth: 1,
      createAsCron: false, cronMessage: '',
      notes: '', labels: '',
    });
  };

  // Cron job helpers
  const toggleCronJob = async (id: string, enabled: boolean) => {
    // Optimistic update
    setCronJobs(prev => prev.map(j => j.id === id ? { ...j, enabled } : j));
    try {
      const res = await fetch('/api/cron-jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      if (!res.ok) throw new Error('Failed to update cron job');
    } catch (err) {
      console.error('Error toggling cron job:', err);
      await fetchCronJobs(); // Revert
    }
  };

  const handleCreateCronJob = async () => {
    if (!cronForm.name || !cronForm.message) return;
    try {
      const res = await fetch('/api/cron-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cronForm),
      });
      if (!res.ok) throw new Error('Failed to create cron job');
      setShowCronModal(false);
      setCronForm({ name: '', description: '', frequency: 'hourly', message: '' });
      await fetchCronJobs();
    } catch (err) {
      console.error('Error creating cron job:', err);
      setError('Failed to create cron job');
    }
  };

  const formatCronSchedule = (schedule: CronJob['schedule']): string => {
    if (schedule.kind === 'at' && schedule.at) {
      return `One-time: ${new Date(schedule.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    }
    if (schedule.kind === 'every' && schedule.everyMs) {
      const ms = schedule.everyMs;
      if (ms < 60000) return `Every ${Math.round(ms / 1000)}s`;
      if (ms < 3600000) return `Every ${Math.round(ms / 60000)} min`;
      if (ms === 3600000) return 'Every hour';
      if (ms < 86400000) return `Every ${(ms / 3600000).toFixed(1).replace('.0', '')} hours`;
      if (ms === 86400000) return 'Every day';
      return `Every ${(ms / 86400000).toFixed(1).replace('.0', '')} days`;
    }
    return 'Unknown schedule';
  };

  // Styles
  const pageStyle: React.CSSProperties = { display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' };
  const mainStyle: React.CSSProperties = { flex: 1, padding: isMobile ? '1rem' : '2rem', paddingTop: isMobile ? '4rem' : '2rem', overflowY: 'auto' };
  const buttonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
    backgroundColor: '#FF3300', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem',
    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
  };
  const secondaryBtnStyle: React.CSSProperties = {
    ...buttonStyle, backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #D1D5DB',
    borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem',
  };

  if (!user) { router.push('/login'); return null; }

  // =========================================
  // TASK CARD COMPONENT
  // =========================================
  const TaskCard = ({ task, isDraggable = true }: { task: Task; isDraggable?: boolean }) => {
    const prioConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const assignedIds = toArray(task.assignedTo);
    const assignedNames = toArray(task.assignedToName);
    const taskAgents = assignedIds.map((id, i) => {
      const a = agents.find(ag => ag.id === id);
      return { id, name: a?.name || assignedNames[i] || 'Unknown', avatar: a?.avatar || '👤' };
    });
    const isSelected = selectedTasks.has(task.id);

    return (
      <div
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, task.id)}
        style={{
          backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
          borderRadius: '0.5rem',
          border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
          padding: '0.875rem', cursor: isDraggable ? 'grab' : 'default',
          opacity: draggedTask === task.id ? 0.5 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
            style={{
              width: '20px', height: '20px', minWidth: '20px', borderRadius: '4px',
              border: isSelected ? '2px solid #3B82F6' : '2px solid #9CA3AF',
              backgroundColor: isSelected ? '#3B82F6' : '#FFFFFF',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginRight: '0.5rem', marginTop: '1px', flexShrink: 0, padding: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
            title="Select task"
          >
            {isSelected && (
              <svg width="12" height="9" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0, flex: 1, lineHeight: '1.4' }}>
            {task.title}
          </h4>
          <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', flexShrink: 0 }}>
            <button onClick={() => handleEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', color: '#9CA3AF' }}>
              <Edit3 size={13} />
            </button>
            <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem', color: '#9CA3AF' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Priority */}
          <span style={{
            padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.6875rem',
            fontWeight: 500, backgroundColor: prioConfig.bgColor, color: prioConfig.color,
          }}>
            {prioConfig.label}
          </span>

          {/* Recurring indicator */}
          {task.isRecurring && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', color: '#8B5CF6', fontSize: '0.6875rem' }}>
              <Repeat size={10} /> Recurring
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', color: '#6B7280', fontSize: '0.6875rem' }}>
              <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Agent & Client */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {taskAgents.length > 0 ? taskAgents.map((ta, i) => (
            <div key={ta.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem',
              }}>
                {ta.avatar}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {ta.name}
              </span>
            </div>
          )) : (
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Unassigned</span>
          )}
          {(task as any).clientName && (
            <span style={{
              fontSize: '0.6875rem', color: '#8B5CF6', backgroundColor: '#F5F3FF',
              padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontWeight: 500,
            }}>
              {(task as any).clientName}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      <Sidebar />
      <main style={mainStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Tasks</h1>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0' }}>
              {filteredTasks.length} tasks · {stats['in-progress'] || 0} in progress
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text" placeholder="Search tasks..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '2.25rem', width: '200px' }}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} style={{ ...secondaryBtnStyle, padding: '0.625rem 0.875rem' }}>
              <Filter size={16} />
            </button>
            <button onClick={() => { resetForm(); setEditingTask(null); setShowModal(true); }} style={buttonStyle}>
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{
            display: 'flex', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem',
            backgroundColor: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid #E5E7EB', flexWrap: 'wrap',
          }}>
            <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '160px' }}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
              <option value="">All Priorities</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            {(filterAgent || filterPriority) && (
              <button onClick={() => { setFilterAgent(''); setFilterPriority(''); }}
                style={{ ...secondaryBtnStyle, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
                Clear
              </button>
            )}
          </div>
        )}

        {/* View Tabs */}
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', padding: '0.25rem',
          backgroundColor: '#F3F4F6', borderRadius: '0.5rem', width: 'fit-content',
        }}>
          {([
            { key: 'board', label: 'Board', icon: <LayoutGrid size={14} /> },
            { key: 'list', label: 'List', icon: <List size={14} /> },
            { key: 'recurring', label: 'Recurring', icon: <Repeat size={14} /> },
          ] as { key: ViewMode; label: string; icon: React.ReactNode }[]).map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: '0.375rem', border: 'none',
                fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                backgroundColor: view === v.key ? '#FFFFFF' : 'transparent',
                color: view === v.key ? '#111827' : '#6B7280',
                boxShadow: view === v.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Loading tasks...</div>}

        {/* ======================== BOARD VIEW ======================== */}
        {!loading && view === 'board' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '1rem',
            alignItems: 'flex-start',
          }}>
            {STATUS_COLUMNS.map(col => {
              const colTasks = getTasksByStatus(col.key);
              const isOver = dragOverColumn === col.key;
              return (
                <div key={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.key)}
                  style={{
                    backgroundColor: isOver ? '#EFF6FF' : '#F9FAFB',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    minHeight: '200px',
                    border: isOver ? '2px dashed #3B82F6' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Column header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '0.75rem', padding: '0 0.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {colTasks.length > 0 && (() => {
                        const allSel = colTasks.every(t => selectedTasks.has(t.id));
                        return (
                          <button
                            onClick={() => selectAllInColumn(col.key)}
                            style={{
                              width: '18px', height: '18px', borderRadius: '4px',
                              border: allSel ? '2px solid #3B82F6' : '2px solid #9CA3AF',
                              backgroundColor: allSel ? '#3B82F6' : '#FFFFFF',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', padding: 0, flexShrink: 0,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                            }}
                            title={allSel ? 'Deselect all' : 'Select all in column'}
                          >
                            {allSel && (
                              <svg width="10" height="7" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        );
                      })()}
                      <span style={{ color: col.color }}>{col.icon}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>{col.label}</span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 500, color: '#9CA3AF',
                      backgroundColor: '#FFFFFF', padding: '0.125rem 0.5rem', borderRadius: '9999px',
                    }}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {colTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>

                  {/* Quick add */}
                  <button onClick={() => {
                    resetForm();
                    setFormData(f => ({ ...f, status: col.key }));
                    setEditingTask(null);
                    setShowModal(true);
                  }} style={{
                    width: '100%', padding: '0.5rem', marginTop: '0.5rem',
                    backgroundColor: 'transparent', border: '1px dashed #D1D5DB', borderRadius: '0.375rem',
                    color: '#9CA3AF', fontSize: '0.8125rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                  }}>
                    <Plus size={14} /> Add task
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================== LIST VIEW ======================== */}
        {!loading && view === 'list' && (
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr auto' : '2fr 1fr 1fr 1fr 1fr auto',
              padding: '0.75rem 1rem',
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <span>Task</span>
              {!isMobile && <span>Agent</span>}
              {!isMobile && <span>Status</span>}
              {!isMobile && <span>Priority</span>}
              {!isMobile && <span>Due</span>}
              <span></span>
            </div>

            {/* Rows */}
            {filteredTasks.filter(t => t.status !== 'archived').length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                No tasks found
              </div>
            )}
            {filteredTasks.filter(t => t.status !== 'archived').map(task => {
              const prioConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const statusCol = STATUS_COLUMNS.find(c => c.key === task.status);
              const listAssignedIds = toArray(task.assignedTo);
              const listAssignedNames = toArray(task.assignedToName);
              const listAgents = listAssignedIds.map((id, i) => {
                const a = agents.find(ag => ag.id === id);
                return { name: a?.name || listAssignedNames[i] || 'Unknown', avatar: a?.avatar || '👤' };
              });

              return (
                <div key={task.id} style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr auto' : '2fr 1fr 1fr 1fr 1fr auto',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #F3F4F6',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                }}>
                  <div>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{task.title}</span>
                    {task.isRecurring && (
                      <Repeat size={12} style={{ marginLeft: '0.375rem', color: '#8B5CF6', verticalAlign: 'middle' }} />
                    )}
                  </div>
                  {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                      {listAgents.length > 0 ? listAgents.map((la, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.125rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                          <span style={{ fontSize: '0.75rem' }}>{la.avatar}</span> {la.name}{i < listAgents.length - 1 ? ',' : ''}
                        </span>
                      )) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.8125rem' }}>Unassigned</span>
                      )}
                    </div>
                  )}
                  {!isMobile && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.125rem 0.5rem', borderRadius: '9999px',
                      fontSize: '0.75rem', fontWeight: 500,
                      backgroundColor: statusCol ? `${statusCol.color}15` : '#F3F4F6',
                      color: statusCol?.color || '#6B7280',
                      width: 'fit-content',
                    }}>
                      {statusCol?.icon} {statusCol?.label || task.status}
                    </span>
                  )}
                  {!isMobile && (
                    <span style={{
                      padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.75rem',
                      fontWeight: 500, backgroundColor: prioConfig.bgColor, color: prioConfig.color,
                      width: 'fit-content',
                    }}>
                      {prioConfig.label}
                    </span>
                  )}
                  {!isMobile && (
                    <span style={{ color: '#6B7280', fontSize: '0.8125rem' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9CA3AF' }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9CA3AF' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ======================== RECURRING VIEW ======================== */}
        {!loading && view === 'recurring' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recurring Tasks Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Repeat size={16} style={{ color: '#8B5CF6' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Recurring Tasks
                </h3>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 500, color: '#6B7280',
                  backgroundColor: '#F3F4F6', padding: '0.125rem 0.5rem', borderRadius: '9999px',
                }}>
                  {recurringTasks.length}
                </span>
              </div>
              {recurringTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '2.5rem', color: '#9CA3AF',
                  backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB',
                }}>
                  <Repeat size={32} style={{ marginBottom: '0.5rem', color: '#D1D5DB' }} />
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>No recurring tasks set up yet</p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden',
                }}>
                  {recurringTasks.map(task => {
                    const freq = task.recurringConfig?.frequency || 'weekly';
                    let scheduleText = '';
                    if (freq === 'hourly') scheduleText = 'Every hour';
                    else if (freq === 'daily') scheduleText = 'Every day';
                    else if (freq === 'weekly') scheduleText = `Every ${DAYS_OF_WEEK[task.recurringConfig?.dayOfWeek ?? 1]}`;
                    else if (freq === 'monthly') scheduleText = `Monthly on the ${task.recurringConfig?.dayOfMonth || 1}${getOrdinalSuffix(task.recurringConfig?.dayOfMonth || 1)}`;

                    return (
                      <div key={task.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6',
                        gap: '1rem', flexWrap: 'wrap',
                      }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Repeat size={14} style={{ color: '#8B5CF6' }} />
                            <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{task.title}</span>
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                            {scheduleText}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                          {(() => {
                            const rIds = toArray(task.assignedTo);
                            const rNames = toArray(task.assignedToName);
                            const rAgents = rIds.map((id, i) => {
                              const a = agents.find(ag => ag.id === id);
                              return { avatar: a?.avatar || '👤', name: a?.name || rNames[i] || 'Unknown' };
                            });
                            return rAgents.length > 0 ? rAgents.map((ra, i) => (
                              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.125rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                                <span style={{ fontSize: '0.75rem' }}>{ra.avatar}</span> {ra.name}
                              </span>
                            )) : <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>Unassigned</span>;
                          })()}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => handleEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9CA3AF' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#9CA3AF' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cron Jobs Section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Timer size={16} style={{ color: '#F59E0B' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Cron Jobs
                  </h3>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 500, color: '#6B7280',
                    backgroundColor: '#F3F4F6', padding: '0.125rem 0.5rem', borderRadius: '9999px',
                  }}>
                    {cronJobs.length}
                  </span>
                </div>
                <button onClick={() => setShowCronModal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.75rem', backgroundColor: '#F59E0B', color: '#FFFFFF',
                  border: 'none', borderRadius: '0.375rem', fontWeight: 500, fontSize: '0.8125rem', cursor: 'pointer',
                }}>
                  <Plus size={14} /> Add Cron Job
                </button>
              </div>
              {cronJobs.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '2.5rem', color: '#9CA3AF',
                  backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB',
                }}>
                  <Timer size={32} style={{ marginBottom: '0.5rem', color: '#D1D5DB' }} />
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>No cron jobs synced yet</p>
                  <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0', color: '#D1D5DB' }}>
                    Run the sync script to pull in OpenClaw cron jobs
                  </p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', overflow: 'hidden',
                }}>
                  {cronJobs.map(job => (
                    <div key={job.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6',
                      gap: '1rem', flexWrap: 'wrap',
                      opacity: job.enabled ? 1 : 0.6,
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Timer size={14} style={{ color: job.enabled ? '#F59E0B' : '#9CA3AF' }} />
                          <span style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{job.name}</span>
                          <span style={{
                            fontSize: '0.6875rem', fontWeight: 500,
                            padding: '0.0625rem 0.375rem', borderRadius: '0.25rem',
                            backgroundColor: job.enabled ? '#ECFDF5' : '#FEF2F2',
                            color: job.enabled ? '#059669' : '#DC2626',
                          }}>
                            {job.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                          {formatCronSchedule(job.schedule)}
                        </span>
                        {job.description && (
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.125rem', display: 'block' }}>
                            {job.description}
                          </span>
                        )}
                        {job.state?.lastRunAtMs && (
                          <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' }}>
                            Last run: {new Date(job.state.lastRunAtMs).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            {job.state.lastStatus && ` · ${job.state.lastStatus}`}
                            {job.state.lastError && (
                              <span style={{ color: '#DC2626' }}> · {job.state.lastError}</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {job.agentId && (
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>
                            {job.agentId}
                          </span>
                        )}
                        <button
                          onClick={() => toggleCronJob(job.id, !job.enabled)}
                          title={job.enabled ? 'Disable' : 'Enable'}
                          style={{
                            background: 'none', border: '1px solid #E5E7EB', borderRadius: '0.375rem',
                            cursor: 'pointer', padding: '0.375rem 0.625rem',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            color: job.enabled ? '#DC2626' : '#059669',
                            fontSize: '0.75rem', fontWeight: 500,
                          }}
                        >
                          {job.enabled ? <><PowerOff size={12} /> Disable</> : <><Power size={12} /> Enable</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================== BULK ACTION BAR ======================== */}
        {selectedTasks.size > 0 && (
          <div style={{
            position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 90, display: 'flex', alignItems: 'center', gap: '0.75rem',
            backgroundColor: '#1F2937', color: '#FFFFFF', padding: '0.75rem 1.25rem',
            borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {selectedTasks.size} selected
            </span>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.875rem', backgroundColor: '#FF3300',
                  color: '#FFFFFF', border: 'none', borderRadius: '0.5rem',
                  fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Move to… <ChevronDown size={14} />
              </button>
              {showBulkMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: '0.5rem',
                  backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  overflow: 'hidden', minWidth: '160px',
                }}>
                  {[...STATUS_COLUMNS, { key: 'archived' as TaskStatus, label: 'Archived', color: '#6B7280', icon: null }].map(col => (
                    <button
                      key={col.key}
                      onClick={() => handleBulkMove(col.key)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.625rem 1rem', border: 'none',
                        backgroundColor: 'transparent', cursor: 'pointer',
                        fontSize: '0.8125rem', fontWeight: 500, color: '#374151',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={clearSelection}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.375rem', color: 'rgba(255,255,255,0.6)', display: 'flex',
              }}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ======================== CREATE/EDIT MODAL ======================== */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '0.75rem', width: '100%',
              maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <button onClick={() => { setShowModal(false); setEditingTask(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Title *</label>
                  <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What needs to be done?" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="More details..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="backlog">Backlog</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Assign to Agents</label>
                  <div style={{
                    border: '1px solid #D1D5DB', borderRadius: '0.5rem', padding: '0.5rem',
                    maxHeight: '160px', overflowY: 'auto', backgroundColor: '#FAFAFA',
                  }}>
                    {agents.map(a => {
                      const isChecked = formData.assignedTo.includes(a.id);
                      return (
                        <label key={a.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.25rem',
                          cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.875rem',
                          backgroundColor: isChecked ? '#EFF6FF' : 'transparent',
                        }}>
                          <input type="checkbox" checked={isChecked}
                            onChange={() => {
                              const newAssigned = isChecked
                                ? formData.assignedTo.filter(id => id !== a.id)
                                : [...formData.assignedTo, a.id];
                              const newNames = newAssigned.map(id => {
                                const ag = agents.find(x => x.id === id);
                                return ag?.name || 'Unknown';
                              });
                              setFormData({ ...formData, assignedTo: newAssigned, assignedToNames: newNames });
                            }}
                            style={{ width: '16px', height: '16px', accentColor: '#FF3300' }} />
                          <span style={{ fontSize: '1rem' }}>{a.avatar}</span>
                          <span style={{ color: '#111827', fontWeight: isChecked ? 600 : 400 }}>
                            {a.name}
                          </span>
                          <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>— {a.role}</span>
                        </label>
                      );
                    })}
                    {agents.length === 0 && (
                      <span style={{ color: '#9CA3AF', fontSize: '0.8125rem', padding: '0.25rem' }}>No agents available</span>
                    )}
                  </div>
                  {formData.assignedTo.length > 0 && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: '#6B7280' }}>
                      {formData.assignedTo.length} agent{formData.assignedTo.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Client</label>
                  <select value={formData.clientId} onChange={(e) => {
                    const client = clientDocs.find(c => c.id === e.target.value);
                    setFormData({ ...formData, clientId: e.target.value, clientName: client?.clientName || '' });
                  }} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">No client</option>
                    {clientDocs.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Labels (comma-separated)</label>
                  <input value={formData.labels} onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                    placeholder="e.g. content, urgent, client-work" style={inputStyle} />
                </div>

                {/* Recurring config */}
                <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                    <input type="checkbox" checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#FF3300' }} />
                    <Repeat size={14} /> Recurring task
                  </label>

                  {formData.isRecurring && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Frequency</label>
                        <select value={formData.recurringFrequency}
                          onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'monthly' })}
                          style={{ ...inputStyle, width: 'auto' }}>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      {formData.recurringFrequency === 'weekly' && (
                        <div>
                          <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Day of Week</label>
                          <select value={formData.recurringDayOfWeek}
                            onChange={(e) => setFormData({ ...formData, recurringDayOfWeek: parseInt(e.target.value) })}
                            style={{ ...inputStyle, width: 'auto' }}>
                            {DAYS_OF_WEEK.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </div>
                      )}
                      {formData.recurringFrequency === 'monthly' && (
                        <div>
                          <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Day of Month</label>
                          <input type="number" min={1} max={31} value={formData.recurringDayOfMonth}
                            onChange={(e) => setFormData({ ...formData, recurringDayOfMonth: parseInt(e.target.value) || 1 })}
                            style={{ ...inputStyle, width: '80px' }} />
                        </div>
                      )}
                    </div>
                  )}

                  {formData.isRecurring && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#FFFBEB', borderRadius: '0.375rem', border: '1px solid #FDE68A' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: '#92400E' }}>
                        <input type="checkbox" checked={formData.createAsCron}
                          onChange={(e) => setFormData({ ...formData, createAsCron: e.target.checked })}
                          style={{ width: '16px', height: '16px', accentColor: '#F59E0B' }} />
                        <Timer size={14} /> Also create as Cron Job
                      </label>
                      <p style={{ fontSize: '0.75rem', color: '#B45309', margin: '0.25rem 0 0 1.75rem' }}>
                        Creates a scheduled cron job that actually runs this task automatically
                      </p>

                      {formData.createAsCron && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Agent Instructions *</label>
                          <textarea value={formData.cronMessage}
                            onChange={(e) => setFormData({ ...formData, cronMessage: e.target.value })}
                            placeholder="What should the agent do each time? e.g. Check the lead inbox and post a summary to Slack"
                            rows={3} style={{ ...inputStyle, resize: 'vertical', fontSize: '0.8125rem' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => { setShowModal(false); setEditingTask(null); }}
                  style={{ ...buttonStyle, backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} style={buttonStyle}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================== CREATE CRON JOB MODAL ======================== */}
        {showCronModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '0.75rem', width: '100%',
              maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Timer size={20} style={{ color: '#F59E0B' }} />
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Create Cron Job
                  </h2>
                </div>
                <button onClick={() => setShowCronModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input value={cronForm.name} onChange={(e) => setCronForm({ ...cronForm, name: e.target.value })}
                    placeholder="e.g. Hourly Lead Check" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={cronForm.description} onChange={(e) => setCronForm({ ...cronForm, description: e.target.value })}
                    placeholder="Brief description of what this does" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Frequency</label>
                  <select value={cronForm.frequency}
                    onChange={(e) => setCronForm({ ...cronForm, frequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'monthly' })}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Instructions *</label>
                  <textarea value={cronForm.message}
                    onChange={(e) => setCronForm({ ...cronForm, message: e.target.value })}
                    placeholder="What should the agent do when this runs? e.g. Check the lead inbox and send a summary to Slack"
                    rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0.25rem 0 0' }}>
                    This is the prompt that gets sent to the agent each time the cron fires.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => setShowCronModal(false)}
                  style={{ ...buttonStyle, backgroundColor: '#FFFFFF', color: '#374151', border: '1px solid #D1D5DB' }}>
                  Cancel
                </button>
                <button onClick={handleCreateCronJob}
                  style={{ ...buttonStyle, backgroundColor: '#F59E0B' }}>
                  <Timer size={14} /> Create Cron Job
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
