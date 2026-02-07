'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Search, Plus, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, MoreHorizontal, Trash2, Edit3, ArrowUpRight, 
  Copy, CheckCircle2, ListTodo, Tag, Star, Layers
} from 'lucide-react';

// Types
interface Subtask {
  id: string;
  name: string;
}

interface WorkflowTask {
  id: string;
  name: string;
  description?: string;
  order: number;
  dueDaysOffset?: number;
  dueFrom: 'start_date' | 'event_date';
  subtasks: Subtask[];
  labels: string[];
}

interface WorkflowTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  serviceType?: string;
  tasks: WorkflowTask[];
  isDefault: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowsResponse {
  success: boolean;
  data: {
    workflows: WorkflowTemplate[];
    stats: {
      total: number;
      byServiceType: Record<string, number>;
      totalTasks: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// Constants
const SERVICE_TYPE_COLORS: Record<string, { color: string; bgColor: string }> = {
  'wedding': { color: '#EC4899', bgColor: '#FDF2F8' },
  'portrait': { color: '#8B5CF6', bgColor: '#F5F3FF' },
  'commercial': { color: '#3B82F6', bgColor: '#EFF6FF' },
  'event': { color: '#F59E0B', bgColor: '#FFFBEB' },
  'branding': { color: '#10B981', bgColor: '#ECFDF5' },
  'web': { color: '#6366F1', bgColor: '#EEF2FF' },
  'default': { color: '#6B7280', bgColor: '#F3F4F6' },
};

function getServiceTypeColor(type?: string) {
  if (!type) return SERVICE_TYPE_COLORS.default;
  const normalized = type.toLowerCase();
  for (const key of Object.keys(SERVICE_TYPE_COLORS)) {
    if (normalized.includes(key)) return SERVICE_TYPE_COLORS[key];
  }
  return SERVICE_TYPE_COLORS.default;
}

export default function WorkflowsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Data state
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<WorkflowsResponse['data']['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (serviceTypeFilter !== 'all') params.set('serviceType', serviceTypeFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());

      const res = await fetch(`/api/workflows?${params.toString()}`);
      const data: WorkflowsResponse = await res.json();

      if (data.success) {
        setWorkflows(data.data.workflows);
        setStats(data.data.stats);
        setTotalPages(Math.ceil(data.data.pagination.total / limit));
      } else {
        setError('Failed to load workflows');
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [user, serviceTypeFilter, searchQuery, page]);

  useEffect(() => {
    if (user) fetchWorkflows();
  }, [fetchWorkflows, user]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [serviceTypeFilter, searchQuery]);

  // Delete workflow
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow template?')) return;

    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflows();
      } else {
        alert('Failed to delete workflow');
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert('Failed to delete workflow');
    }
    setOpenDropdown(null);
  };

  // Duplicate workflow
  const handleDuplicate = async (workflow: WorkflowTemplate) => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          serviceType: workflow.serviceType,
          tasks: workflow.tasks,
          isDefault: false,
        }),
      });

      if (res.ok) {
        fetchWorkflows();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to duplicate workflow');
      }
    } catch (err) {
      console.error('Failed to duplicate workflow:', err);
      alert('Failed to duplicate workflow');
    }
    setOpenDropdown(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Get unique service types for filter dropdown
  const serviceTypes = stats ? Object.keys(stats.byServiceType).filter(t => t !== 'unassigned') : [];

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
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Workflow Templates</h1>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Create reusable task sequences for your projects
              </p>
            </div>
            <Link
              href="/workflows/new"
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
                textDecoration: 'none',
                transition: 'background-color 0.15s',
              }}
            >
              <Plus size={18} />
              New Workflow
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Layers size={18} style={{ color: '#FF3300' }} />
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Workflows</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{stats.total}</div>
            </div>
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <ListTodo size={18} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Tasks</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{stats.totalTasks}</div>
            </div>
            <div
              style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Tag size={18} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Service Types</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                {Object.keys(stats.byServiceType).filter(t => t !== 'unassigned').length}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Search */}
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
              placeholder="Search workflows by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '2.75rem',
              }}
            />
          </div>

          {/* Service Type Filter */}
          {serviceTypes.length > 0 && (
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              style={{ ...selectStyle, width: '200px' }}
            >
              <option value="all">All Service Types</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}

          {/* Clear Filter Button */}
          {(serviceTypeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setServiceTypeFilter('all');
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

        {/* Workflows Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading workflows...</div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>{error}</div>
        ) : workflows.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB',
            }}
          >
            <Layers size={48} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
            <div style={{ color: '#6B7280', marginBottom: '0.5rem', fontWeight: 500 }}>No workflows found</div>
            <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '1rem' }}>
              {searchQuery || serviceTypeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first workflow template to get started'}
            </div>
            {!searchQuery && serviceTypeFilter === 'all' && (
              <Link
                href="/workflows/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#FF3300',
                  color: '#FFFFFF',
                  padding: '0.625rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                <Plus size={18} />
                Create Workflow
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {workflows.map((workflow) => {
              const typeColor = getServiceTypeColor(workflow.serviceType);
              const taskCount = workflow.tasks?.length || 0;
              const subtaskCount = workflow.tasks?.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0) || 0;

              return (
                <div
                  key={workflow.id}
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
                  {/* Card Header */}
                  <div style={{ padding: '1rem', borderBottom: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <Link
                            href={`/workflows/${workflow.id}`}
                            style={{
                              fontWeight: 600,
                              color: '#111827',
                              textDecoration: 'none',
                              fontSize: '1rem',
                            }}
                          >
                            {workflow.name}
                          </Link>
                          {workflow.isDefault && (
                            <Star size={14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                          )}
                        </div>
                        {workflow.description && (
                          <p
                            style={{
                              color: '#6B7280',
                              fontSize: '0.8125rem',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '250px',
                            }}
                          >
                            {workflow.description}
                          </p>
                        )}
                      </div>

                      {/* Actions Dropdown */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === workflow.id ? null : workflow.id)}
                          style={{
                            padding: '0.375rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            color: '#6B7280',
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {openDropdown === workflow.id && (
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
                            }}
                          >
                            <Link
                              href={`/workflows/${workflow.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                color: '#374151',
                                textDecoration: 'none',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <Edit3 size={14} />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDuplicate(workflow)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                color: '#374151',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <Copy size={14} />
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(workflow.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                color: '#DC2626',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1rem' }}>
                    {/* Service Type Badge */}
                    {workflow.serviceType && (
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: typeColor.bgColor,
                          color: typeColor.color,
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          marginBottom: '0.75rem',
                        }}
                      >
                        {workflow.serviceType}
                      </span>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <ListTodo size={14} style={{ color: '#9CA3AF' }} />
                        <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                          {taskCount} task{taskCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {subtaskCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CheckCircle2 size={14} style={{ color: '#9CA3AF' }} />
                          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                            {subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preview of tasks */}
                    {workflow.tasks && workflow.tasks.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {workflow.tasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.25rem 0',
                              fontSize: '0.8125rem',
                              color: '#374151',
                            }}
                          >
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#D1D5DB',
                              }}
                            />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {task.name}
                            </span>
                            {task.dueDaysOffset !== undefined && (
                              <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                                +{task.dueDaysOffset}d
                              </span>
                            )}
                          </div>
                        ))}
                        {workflow.tasks.length > 3 && (
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', paddingLeft: '1rem' }}>
                            +{workflow.tasks.length - 3} more tasks
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #F3F4F6',
                        fontSize: '0.75rem',
                        color: '#9CA3AF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={12} />
                        {formatDate(workflow.updatedAt)}
                      </div>
                      {workflow.usageCount > 0 && (
                        <span>Used {workflow.usageCount} time{workflow.usageCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              border: '1px solid #E5E7EB',
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
