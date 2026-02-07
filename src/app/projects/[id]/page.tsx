'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  ArrowLeft, Calendar, DollarSign, User, MapPin, Tag, 
  CheckCircle2, Circle, Plus, Trash2, Edit3, FileText, 
  MessageSquare, Receipt, FileSignature, FolderOpen, StickyNote,
  Clock, ChevronDown, MoreHorizontal, Save, X
} from 'lucide-react';

// Types
interface Subtask {
  id: string;
  name: string;
  isCompleted: boolean;
}

interface WorkflowTask {
  id: string;
  name: string;
  description?: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  subtasks: Subtask[];
  labels: string[];
}

interface Project {
  id: string;
  userId: string;
  contactId: string;
  leadId?: string;
  name: string;
  description?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  eventDate?: string;
  location?: string;
  quotedAmount?: number;
  currency: string;
  status: ProjectStatus;
  workflowTasks: WorkflowTask[];
  tags: string[];
  invoiceIds: string[];
  contractIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
}

interface ProjectNote {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  isShared: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectFile {
  id: string;
  projectId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  folder?: string;
  isShared: boolean;
  uploadedAt: string;
}

type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
type TabType = 'overview' | 'tasks' | 'files' | 'notes';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
  active: { label: 'Active', color: '#10B981', bgColor: '#ECFDF5' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bgColor: '#FFFBEB' },
  completed: { label: 'Completed', color: '#3B82F6', bgColor: '#EFF6FF' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEF2F2' },
  archived: { label: 'Archived', color: '#9CA3AF', bgColor: '#F9FAFB' },
};

const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['active', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

export default function ProjectDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // Data state
  const [project, setProject] = useState<Project | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Task state
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch project
  const fetchProject = useCallback(async () => {
    if (!user || !projectId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}?includeContact=true&includeNotes=true&includeFiles=true`);
      const data = await res.json();

      if (data.success) {
        setProject(data.data.project);
        setContact(data.data.contact);
        setNotes(data.data.notes || []);
        setFiles(data.data.files || []);
      } else {
        setError(data.error || 'Failed to load project');
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    if (user && projectId) fetchProject();
  }, [fetchProject, user, projectId]);

  // Status change
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus }),
      });

      if (res.ok) {
        setProject({ ...project, status: newStatus });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setStatusDropdownOpen(false);
  };

  // Task handlers
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_task', taskId, isCompleted }),
      });

      if (res.ok) {
        const data = await res.json();
        setProject({ ...project, workflowTasks: data.data.workflowTasks });
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, isCompleted: boolean) => {
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_task', taskId, subtaskId, subtaskCompleted: isCompleted }),
      });

      if (res.ok) {
        const data = await res.json();
        setProject({ ...project, workflowTasks: data.data.workflowTasks });
      }
    } catch (err) {
      console.error('Failed to update subtask:', err);
    }
  };

  const handleAddTask = async () => {
    if (!project || !newTaskName.trim()) return;

    const newTask: WorkflowTask = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim(),
      order: project.workflowTasks.length,
      isCompleted: false,
      subtasks: [],
      labels: [],
    };

    const updatedTasks = [...project.workflowTasks, newTask];

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowTasks: updatedTasks }),
      });

      if (res.ok) {
        setProject({ ...project, workflowTasks: updatedTasks });
        setNewTaskName('');
        setAddingTask(false);
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    if (!confirm('Delete this task?')) return;

    const updatedTasks = project.workflowTasks.filter(t => t.id !== taskId);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowTasks: updatedTasks }),
      });

      if (res.ok) {
        setProject({ ...project, workflowTasks: updatedTasks });
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Note handlers
  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent.trim(), isShared: false }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.data, ...notes]);
        setNewNoteContent('');
        setAddingNote(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingNoteContent.trim() }),
      });

      if (res.ok) {
        setNotes(notes.map(n => n.id === noteId ? { ...n, content: editingNoteContent.trim(), updatedAt: new Date().toISOString() } : n));
        setEditingNoteId(null);
        setEditingNoteContent('');
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  };

  const getTaskProgress = () => {
    if (!project?.workflowTasks?.length) return null;
    const completed = project.workflowTasks.filter(t => t.isCompleted).length;
    const total = project.workflowTasks.length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#6B7280' }}>Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
          <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', textDecoration: 'none', marginBottom: '1rem' }}>
            <ArrowLeft size={18} />
            Back to Projects
          </Link>
          <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>
            {error || 'Project not found'}
          </div>
        </main>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status];
  const progress = getTaskProgress();
  const validTransitions = VALID_TRANSITIONS[project.status];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <FileText size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckCircle2 size={16} /> },
    { id: 'files', label: 'Files', icon: <FolderOpen size={16} /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote size={16} /> },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        {/* Back Link */}
        <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={18} />
          Back to Projects
        </Link>

        {/* Header */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '0.5rem' }}>
                {project.name}
              </h1>
              {project.description && (
                <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {project.description}
                </p>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem' }}>
                {contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151' }}>
                    <User size={16} style={{ color: '#9CA3AF' }} />
                    <Link href={`/contacts/${contact.id}`} style={{ color: '#FF3300', textDecoration: 'none', fontWeight: 500 }}>
                      {contact.firstName} {contact.lastName}
                    </Link>
                    {contact.company && <span style={{ color: '#6B7280' }}>({contact.company})</span>}
                  </div>
                )}
                {project.serviceType && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280' }}>
                    <Tag size={16} style={{ color: '#9CA3AF' }} />
                    {project.serviceType}
                  </div>
                )}
                {project.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280' }}>
                    <MapPin size={16} style={{ color: '#9CA3AF' }} />
                    {project.location}
                  </div>
                )}
                {project.quotedAmount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 600 }}>
                    <DollarSign size={16} />
                    {formatCurrency(project.quotedAmount, project.currency)}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem' }}>
                {project.startDate && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    Start: <span style={{ color: '#374151' }}>{formatDate(project.startDate)}</span>
                  </div>
                )}
                {project.endDate && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    End: <span style={{ color: '#374151' }}>{formatDate(project.endDate)}</span>
                  </div>
                )}
                {project.eventDate && (
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                    Event: <span style={{ color: '#374151' }}>{formatDate(project.eventDate)}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem' }}>
                  {project.tags.map(tag => (
                    <span key={tag} style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: validTransitions.length > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {statusConfig.label}
                {validTransitions.length > 0 && <ChevronDown size={16} />}
              </button>
              {statusDropdownOpen && validTransitions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    minWidth: '160px',
                    overflow: 'hidden',
                  }}
                >
                  {validTransitions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: STATUS_CONFIG[status].color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_CONFIG[status].color }} />
                      {STATUS_CONFIG[status].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Progress</span>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>{progress.completed} of {progress.total} tasks completed</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress.percent}%`,
                    backgroundColor: progress.percent === 100 ? '#10B981' : '#3B82F6',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '1.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #FF3300' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: activeTab === tab.id ? '#FF3300' : '#6B7280',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '0.875rem',
                marginBottom: '-1px',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>Project Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Status</div>
                  <div style={{ fontSize: '0.9375rem', color: statusConfig.color, fontWeight: 500 }}>{statusConfig.label}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Value</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{project.quotedAmount ? formatCurrency(project.quotedAmount, project.currency) : '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Created</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{formatDate(project.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Last Updated</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{formatDate(project.updatedAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Tasks</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{progress ? `${progress.completed}/${progress.total} completed` : 'No tasks'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Notes</div>
                  <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{notes.length}</div>
                </div>
              </div>

              {contact && (
                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>Contact Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.125rem' }}>Name</div>
                      <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{contact.firstName} {contact.lastName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.125rem' }}>Email</div>
                      <a href={`mailto:${contact.email}`} style={{ fontSize: '0.9375rem', color: '#FF3300', textDecoration: 'none' }}>{contact.email}</a>
                    </div>
                    {contact.phone && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.125rem' }}>Phone</div>
                        <a href={`tel:${contact.phone}`} style={{ fontSize: '0.9375rem', color: '#FF3300', textDecoration: 'none' }}>{contact.phone}</a>
                      </div>
                    )}
                    {contact.company && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.125rem' }}>Company</div>
                        <div style={{ fontSize: '0.9375rem', color: '#111827' }}>{contact.company}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Workflow Tasks
                  {progress && <span style={{ fontWeight: 400, color: '#6B7280', marginLeft: '0.5rem' }}>({progress.completed}/{progress.total})</span>}
                </h3>
                {!addingTask && (
                  <button
                    onClick={() => setAddingTask(true)}
                    style={{
                      backgroundColor: '#FF3300',
                      color: '#FFFFFF',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                )}
              </div>

              {addingTask && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Task name..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    style={{ ...inputStyle, flex: 1 }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddTask}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => { setAddingTask(false); setNewTaskName(''); }}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {project.workflowTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  <CheckCircle2 size={40} style={{ color: '#D1D5DB', marginBottom: '0.75rem' }} />
                  <div>No tasks yet</div>
                  <div style={{ fontSize: '0.875rem' }}>Add tasks to track your project progress</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {project.workflowTasks
                    .sort((a, b) => a.order - b.order)
                    .map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: '1rem',
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          backgroundColor: task.isCompleted ? '#F9FAFB' : '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <button
                            onClick={() => handleToggleTask(task.id, !task.isCompleted)}
                            style={{
                              padding: 0,
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              marginTop: '0.125rem',
                            }}
                          >
                            {task.isCompleted ? (
                              <CheckCircle2 size={20} style={{ color: '#10B981' }} />
                            ) : (
                              <Circle size={20} style={{ color: '#D1D5DB' }} />
                            )}
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, color: task.isCompleted ? '#9CA3AF' : '#111827', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                              {task.name}
                            </div>
                            {task.description && (
                              <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem' }}>
                                {task.description}
                              </div>
                            )}
                            {task.dueDate && (
                              <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Clock size={12} />
                                Due: {formatDate(task.dueDate)}
                              </div>
                            )}
                            {/* Subtasks */}
                            {task.subtasks.length > 0 && (
                              <div style={{ marginTop: '0.75rem', marginLeft: '0.5rem' }}>
                                {task.subtasks.map((subtask) => (
                                  <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.375rem' }}>
                                    <button
                                      onClick={() => handleToggleSubtask(task.id, subtask.id, !subtask.isCompleted)}
                                      style={{ padding: 0, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                                    >
                                      {subtask.isCompleted ? (
                                        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                                      ) : (
                                        <Circle size={14} style={{ color: '#D1D5DB' }} />
                                      )}
                                    </button>
                                    <span style={{ fontSize: '0.8125rem', color: subtask.isCompleted ? '#9CA3AF' : '#374151', textDecoration: subtask.isCompleted ? 'line-through' : 'none' }}>
                                      {subtask.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ padding: '0.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#DC2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>Project Files</h3>
              {files.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  <FolderOpen size={40} style={{ color: '#D1D5DB', marginBottom: '0.75rem' }} />
                  <div>No files uploaded yet</div>
                  <div style={{ fontSize: '0.875rem' }}>File uploads coming soon</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {files.map((file) => (
                    <div key={file.id} style={{ padding: '0.75rem 1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} style={{ color: '#6B7280' }} />
                        <div>
                          <div style={{ fontWeight: 500, color: '#111827' }}>{file.filename}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{(file.size / 1024).toFixed(1)} KB • {formatDate(file.uploadedAt)}</div>
                        </div>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#FF3300', fontSize: '0.875rem' }}>Download</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: 0 }}>Project Notes</h3>
                {!addingNote && (
                  <button
                    onClick={() => setAddingNote(true)}
                    style={{
                      backgroundColor: '#FF3300',
                      color: '#FFFFFF',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    <Plus size={16} />
                    Add Note
                  </button>
                )}
              </div>

              {addingNote && (
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <textarea
                    placeholder="Write your note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical', marginBottom: '0.75rem' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setAddingNote(false); setNewNoteContent(''); }}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  <StickyNote size={40} style={{ color: '#D1D5DB', marginBottom: '0.75rem' }} />
                  <div>No notes yet</div>
                  <div style={{ fontSize: '0.875rem' }}>Add notes to keep track of important information</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notes.map((note) => (
                    <div key={note.id} style={{ padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', backgroundColor: '#FFFFFF' }}>
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '0.75rem' }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setEditingNoteId(null); setEditingNoteContent(''); }}
                              style={{ padding: '0.375rem 0.75rem', backgroundColor: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateNote(note.id)}
                              style={{ padding: '0.375rem 0.75rem', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem' }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note.content}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB' }}>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              {formatDate(note.createdAt)}
                              {note.updatedAt && note.updatedAt !== note.createdAt && ' (edited)'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => { setEditingNoteId(note.id); setEditingNoteContent(note.content); }}
                                style={{ padding: '0.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#6B7280' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                style={{ padding: '0.25rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#DC2626' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Close dropdown when clicking outside */}
      {statusDropdownOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setStatusDropdownOpen(false)}
        />
      )}
    </div>
  );
}
