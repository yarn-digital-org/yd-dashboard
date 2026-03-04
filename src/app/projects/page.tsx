'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Search, Plus, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, MoreHorizontal, Trash2, Edit3, Grid3X3, List,
  ArrowUpRight, Tag, DollarSign, User, MapPin, Clock, FolderKanban
} from 'lucide-react';

// Types
interface WorkflowTask {
  id: string;
  name: string;
  isCompleted: boolean;
  subtasks: { id: string; name: string; isCompleted: boolean }[];
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
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
    stats: {
      total: number;
      byStatus: Record<ProjectStatus, number>;
      totalQuoted: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface ContactsResponse {
  success: boolean;
  data: {
    contacts: Contact[];
  };
}

// Constants
const STATUS_OPTIONS: ProjectStatus[] = ['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived'];

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
  active: { label: 'Active', color: '#10B981', bgColor: '#ECFDF5' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bgColor: '#FFFBEB' },
  completed: { label: 'Completed', color: '#3B82F6', bgColor: '#EFF6FF' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEF2F2' },
  archived: { label: 'Archived', color: '#9CA3AF', bgColor: '#F9FAFB' },
};

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ProjectsResponse['data']['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Filter state
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactId: '',
    description: '',
    serviceType: '',
    startDate: '',
    endDate: '',
    eventDate: '',
    location: '',
    quotedAmount: '',
    currency: 'GBP',
    status: 'draft' as ProjectStatus,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch contacts for dropdown
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/contacts?limit=500');
      const data: ContactsResponse = await res.json();
      if (data.success) {
        setContacts(data.data.contacts);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchContacts();
  }, [fetchContacts, user]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (contactFilter !== 'all') params.set('contactId', contactFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());

      const res = await fetch(`/api/projects?${params.toString()}`);
      const data: ProjectsResponse = await res.json();

      if (data.success) {
        setProjects(data.data.projects);
        setStats(data.data.stats);
        setTotalPages(Math.ceil(data.data.pagination.total / limit));
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user, activeStatus, contactFilter, searchQuery, page]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [fetchProjects, user]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeStatus, contactFilter, searchQuery]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactId) {
      alert('Please select a contact');
      return;
    }

    try {
      const payload = {
        ...formData,
        quotedAmount: formData.quotedAmount ? parseFloat(formData.quotedAmount) : undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        eventDate: formData.eventDate || undefined,
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingProject(null);
        resetForm();
        fetchProjects();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save project');
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      alert('Failed to save project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this project?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
      } else {
        alert('Failed to archive project');
      }
    } catch (err) {
      console.error('Failed to archive project:', err);
      alert('Failed to archive project');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus }),
      });

      if (res.ok) {
        fetchProjects();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setOpenDropdown(null);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      contactId: project.contactId,
      description: project.description || '',
      serviceType: project.serviceType || '',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
      eventDate: project.eventDate?.split('T')[0] || '',
      location: project.location || '',
      quotedAmount: project.quotedAmount?.toString() || '',
      currency: project.currency || 'GBP',
      status: project.status,
      tags: project.tags || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactId: '',
      description: '',
      serviceType: '',
      startDate: '',
      endDate: '',
      eventDate: '',
      location: '',
      quotedAmount: '',
      currency: 'GBP',
      status: 'draft',
      tags: [],
    });
    setTagInput('');
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown';
  };

  const getTaskProgress = (tasks: WorkflowTask[]) => {
    if (!tasks || tasks.length === 0) return null;
    const completed = tasks.filter(t => t.isCompleted).length;
    return { completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) };
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Projects</h1>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Manage your client projects and workflows
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* View Toggle */}
              <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    backgroundColor: viewMode === 'list' ? '#FF3300' : '#FFFFFF',
                    color: viewMode === 'list' ? '#FFFFFF' : '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderLeft: '1px solid #E5E7EB',
                    backgroundColor: viewMode === 'grid' ? '#FF3300' : '#FFFFFF',
                    color: viewMode === 'grid' ? '#FFFFFF' : '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Grid3X3 size={18} />
                </button>
              </div>
              <button
                onClick={() => {
                  setEditingProject(null);
                  resetForm();
                  setShowModal(true);
                }}
                style={{
                  backgroundColor: '#FF3300',
                  color: '#FFFFFF',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E62E00')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF3300')}
              >
                <Plus size={18} />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {STATUS_OPTIONS.filter(s => s !== 'archived').map((status) => {
              const config = STATUS_CONFIG[status];
              const count = stats.byStatus[status] || 0;
              const isActive = activeStatus === status;

              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(isActive ? 'all' : status)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: isActive ? `2px solid ${config.color}` : '1px solid #E5E7EB',
                    backgroundColor: isActive ? config.bgColor : '#FFFFFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: config.color }}>{count}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {config.label}
                  </div>
                </button>
              );
            })}
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                {formatCurrency(stats.totalQuoted, 'GBP')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Quoted</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              type="text"
              placeholder="Search projects by name, description, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '2.75rem',
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.625rem 1rem',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              backgroundColor: showFilters ? '#F3F4F6' : '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>

          {(activeStatus !== 'all' || contactFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveStatus('all');
                setContactFilter('all');
                setSearchQuery('');
              }}
              style={{
                padding: '0.625rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Contact
              </label>
              <select
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Contacts</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Status
              </label>
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value as ProjectStatus | 'all')}
                style={selectStyle}
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Projects View */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading projects...</div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <FolderKanban size={48} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
            <div style={{ marginBottom: '0.5rem' }}>No projects found</div>
            <div style={{ fontSize: '0.875rem' }}>
              {searchQuery || activeStatus !== 'all' || contactFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first project to get started'}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {projects.map((project) => {
              const statusConfig = STATUS_CONFIG[project.status];
              const progress = getTaskProgress(project.workflowTasks);

              return (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)')}
                  onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ padding: '1.25rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <Link
                        href={`/projects/${project.id}`}
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#111827',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {project.name}
                        <ArrowUpRight size={14} style={{ color: '#9CA3AF' }} />
                      </Link>
                      <span
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                        {project.description.length > 100 ? project.description.slice(0, 100) + '...' : project.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <User size={14} style={{ color: '#9CA3AF' }} />
                        {getContactName(project.contactId)}
                      </div>
                      {project.serviceType && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Tag size={14} style={{ color: '#9CA3AF' }} />
                          {project.serviceType}
                        </div>
                      )}
                      {project.quotedAmount && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#059669' }}>
                          <DollarSign size={14} />
                          {formatCurrency(project.quotedAmount, project.currency)}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {progress && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.375rem' }}>
                          <span>Progress</span>
                          <span>{progress.completed}/{progress.total} tasks</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
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

                  {/* Footer */}
                  <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      {formatDate(project.createdAt)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEdit(project)}
                        style={{
                          padding: '0.25rem',
                          border: 'none',
                          borderRadius: '0.25rem',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#6B7280',
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        style={{
                          padding: '0.25rem',
                          border: 'none',
                          borderRadius: '0.25rem',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#DC2626',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Project
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contact
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Progress
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Value
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Created
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const statusConfig = STATUS_CONFIG[project.status];
                  const progress = getTaskProgress(project.workflowTasks);

                  return (
                    <tr
                      key={project.id}
                      style={{ borderBottom: '1px solid #E5E7EB' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '1rem' }}>
                        <Link
                          href={`/projects/${project.id}`}
                          style={{
                            fontWeight: 600,
                            color: '#111827',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {project.name}
                          <ArrowUpRight size={14} style={{ color: '#9CA3AF' }} />
                        </Link>
                        {project.serviceType && (
                          <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem' }}>
                            {project.serviceType}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {getContactName(project.contactId)}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === project.id ? null : project.id)}
                            style={{
                              backgroundColor: statusConfig.bgColor,
                              color: statusConfig.color,
                              padding: '0.375rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                            }}
                          >
                            {statusConfig.label}
                            <ChevronDown size={14} />
                          </button>
                          {openDropdown === project.id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '0.25rem',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 50,
                                minWidth: '140px',
                              }}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(project.id, status)}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    textAlign: 'left',
                                    border: 'none',
                                    backgroundColor: project.status === status ? '#F3F4F6' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    color: STATUS_CONFIG[status].color,
                                  }}
                                >
                                  {STATUS_CONFIG[status].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        {progress ? (
                          <div style={{ minWidth: '100px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                              <span>{progress.percent}%</span>
                              <span>{progress.completed}/{progress.total}</span>
                            </div>
                            <div style={{ height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${progress.percent}%`,
                                  backgroundColor: progress.percent === 100 ? '#10B981' : '#3B82F6',
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>No tasks</span>
                        )}
                      </td>

                      <td style={{ padding: '1rem', color: '#059669', fontWeight: 500 }}>
                        {project.quotedAmount ? formatCurrency(project.quotedAmount, project.currency) : '-'}
                      </td>

                      <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8125rem' }}>
                        {formatDate(project.createdAt)}
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEdit(project)}
                            style={{
                              padding: '0.375rem',
                              border: '1px solid #E5E7EB',
                              borderRadius: '0.375rem',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              color: '#6B7280',
                            }}
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            style={{
                              padding: '0.375rem',
                              border: '1px solid #FEE2E2',
                              borderRadius: '0.375rem',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              color: '#DC2626',
                            }}
                            title="Archive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderTop: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  Page {page} of {totalPages}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      backgroundColor: '#FFFFFF',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      opacity: page === 1 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      backgroundColor: '#FFFFFF',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      opacity: page === totalPages ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Project Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Website Redesign"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* Contact */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Contact *
                    </label>
                    <select
                      value={formData.contactId}
                      onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                      style={selectStyle}
                      required
                    >
                      <option value="">Select a contact...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Description
                    </label>
                    <textarea
                      placeholder="Project description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Service Type & Location */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Service Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Web Development"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Belfast, UK"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Quoted Amount & Currency & Status */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Quoted Amount
                      </label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={formData.quotedAmount}
                        onChange={(e) => setFormData({ ...formData, quotedAmount: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                        style={selectStyle}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Tags
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Add a tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.5rem',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', padding: 0 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#FF3300',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    {editingProject ? 'Save Changes' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Close dropdown when clicking outside */}
      {openDropdown && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
