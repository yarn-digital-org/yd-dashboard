'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { 
  Search, Plus, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Mail, Phone, Building2, Calendar, MoreHorizontal, Trash2, Edit3,
  ArrowUpRight, Tag, DollarSign
} from 'lucide-react';

// Types
interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

interface Lead {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  budgetMin?: number;
  budgetMax?: number;
  source?: string;
  status: LeadStatus;
  priority: LeadPriority;
  tags: string[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high';

interface LeadsResponse {
  success: boolean;
  data: {
    leads: Lead[];
    stats: {
      total: number;
      byStatus: Record<LeadStatus, number>;
      byPriority: Record<LeadPriority, number>;
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
const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const PRIORITY_OPTIONS: LeadPriority[] = ['low', 'medium', 'high'];
const SOURCE_OPTIONS = ['direct', 'referral', 'website', 'social', 'ads', 'cold_outreach', 'event', 'other'];

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: '#3B82F6', bgColor: '#EFF6FF' },
  contacted: { label: 'Contacted', color: '#F59E0B', bgColor: '#FFFBEB' },
  qualified: { label: 'Qualified', color: '#8B5CF6', bgColor: '#F5F3FF' },
  proposal_sent: { label: 'Proposal Sent', color: '#F97316', bgColor: '#FFF7ED' },
  won: { label: 'Won', color: '#10B981', bgColor: '#ECFDF5' },
  lost: { label: 'Lost', color: '#EF4444', bgColor: '#FEF2F2' },
};

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High', color: '#EF4444', bgColor: '#FEF2F2' },
  medium: { label: 'Medium', color: '#F59E0B', bgColor: '#FFFBEB' },
  low: { label: 'Low', color: '#6B7280', bgColor: '#F3F4F6' },
};

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsResponse['data']['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeStatus, setActiveStatus] = useState<LeadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: '',
    budgetMin: '',
    budgetMax: '',
    status: 'new' as LeadStatus,
    priority: 'medium' as LeadPriority,
    source: 'direct',
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

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeStatus !== 'all') params.set('status', activeStatus);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', limit.toString());
      params.set('offset', ((page - 1) * limit).toString());

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data: LeadsResponse = await res.json();

      if (data.success) {
        setLeads(data.data.leads);
        setStats(data.data.stats);
        setTotalPages(Math.ceil(data.data.pagination.total / limit));
      } else {
        setError('Failed to load leads');
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [user, activeStatus, priorityFilter, sourceFilter, searchQuery, page]);

  useEffect(() => {
    if (user) fetchLeads();
  }, [fetchLeads, user]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeStatus, priorityFilter, sourceFilter, searchQuery]);

  // Form handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
      };

      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads';
      const method = editingLead ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingLead(null);
        resetForm();
        fetchLeads();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save lead');
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
      alert('Failed to save lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
      } else {
        alert('Failed to delete lead');
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
      alert('Failed to delete lead');
    }
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus }),
      });

      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
    setOpenDropdown(null);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      company: lead.company || '',
      phone: lead.phone || '',
      service: lead.service || '',
      budgetMin: lead.budgetMin?.toString() || '',
      budgetMax: lead.budgetMax?.toString() || '',
      status: lead.status,
      priority: lead.priority,
      source: lead.source || 'direct',
      tags: lead.tags || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      service: '',
      budgetMin: '',
      budgetMax: '',
      status: 'new',
      priority: 'medium',
      source: 'direct',
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

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
    if (min) return `From £${min.toLocaleString()}`;
    if (max) return `Up to £${max.toLocaleString()}`;
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
      <main style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Leads</h1>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Manage and track your potential clients
              </p>
            </div>
            <button
              onClick={() => {
                setEditingLead(null);
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
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E62E00')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF3300')}
            >
              <Plus size={18} />
              Add Lead
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {STATUS_OPTIONS.map((status) => {
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
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'capitalize' }}>
                    {config.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : '200px', position: 'relative' }}>
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
              placeholder="Search leads by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '2.75rem',
              }}
            />
          </div>

          {/* Filter Toggle */}
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

          {/* Clear Filter Button */}
          {(activeStatus !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveStatus('all');
                setPriorityFilter('all');
                setSourceFilter('all');
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
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
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
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as LeadPriority | 'all')}
                style={selectStyle}
              >
                <option value="all">All Priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Sources</option>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
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
                onChange={(e) => setActiveStatus(e.target.value as LeadStatus | 'all')}
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

        {/* Leads Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Loading leads...</div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>{error}</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
              <div style={{ marginBottom: '0.5rem' }}>No leads found</div>
              <div style={{ fontSize: '0.875rem' }}>
                {searchQuery || activeStatus !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first lead to get started'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Lead
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contact
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Priority
                  </th>
                  <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Source
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
                {leads.map((lead) => {
                  const statusConfig = STATUS_CONFIG[lead.status];
                  const priorityConfig = PRIORITY_CONFIG[lead.priority];
                  const budget = formatBudget(lead.budgetMin, lead.budgetMax);

                  return (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: '1px solid #E5E7EB' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Lead Info */}
                      <td style={{ padding: '1rem' }}>
                        <Link
                          href={`/leads/${lead.id}`}
                          style={{
                            fontWeight: 600,
                            color: '#111827',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {lead.name}
                          <ArrowUpRight size={14} style={{ color: '#9CA3AF' }} />
                        </Link>
                        {lead.company && (
                          <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Building2 size={14} />
                            {lead.company}
                          </div>
                        )}
                        {lead.service && (
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                            {lead.service}
                          </div>
                        )}
                        {budget && (
                          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <DollarSign size={12} />
                            {budget}
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.8125rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Mail size={14} style={{ color: '#9CA3AF' }} />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Phone size={14} style={{ color: '#9CA3AF' }} />
                            {lead.phone}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === lead.id ? null : lead.id)}
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
                          {openDropdown === lead.id && (
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
                                  onClick={() => handleStatusChange(lead.id, status)}
                                  style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    textAlign: 'left',
                                    border: 'none',
                                    backgroundColor: lead.status === status ? '#F3F4F6' : 'transparent',
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

                      {/* Priority */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            backgroundColor: priorityConfig.bgColor,
                            color: priorityConfig.color,
                            padding: '0.25rem 0.625rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                        >
                          {priorityConfig.label}
                        </span>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                        {lead.source?.replace('_', ' ') || '-'}
                      </td>

                      {/* Created */}
                      <td style={{ padding: '1rem', color: '#6B7280', fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={14} style={{ color: '#9CA3AF' }} />
                          {formatDate(lead.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => openEdit(lead)}
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
                            onClick={() => handleDelete(lead.id)}
                            style={{
                              padding: '0.375rem',
                              border: '1px solid #FEE2E2',
                              borderRadius: '0.375rem',
                              backgroundColor: '#FFFFFF',
                              cursor: 'pointer',
                              color: '#DC2626',
                            }}
                            title="Delete"
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
          )}
          </div>{/* end scroll wrapper */}

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
                borderRadius: isMobile ? '0.5rem' : '0.75rem',
                padding: isMobile ? '1rem' : '1.5rem',
                width: isMobile ? '95vw' : '100%',
                maxWidth: isMobile ? '95vw' : '500px',
                maxHeight: isMobile ? '92vh' : '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {editingLead ? 'Edit Lead' : 'Add New Lead'}
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
                  {/* Name & Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>

                  {/* Company & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="Acme Inc."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+44 7700 900000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Service / Project Type
                    </label>
                    <input
                      type="text"
                      placeholder="Website redesign, Branding, etc."
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Budget Range */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Budget Min (£)
                      </label>
                      <input
                        type="number"
                        placeholder="1000"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Budget Max (£)
                      </label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Status, Priority, Source */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                        style={selectStyle}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                        style={selectStyle}
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {PRIORITY_CONFIG[p].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                        Source
                      </label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        style={selectStyle}
                      >
                        {SOURCE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace('_', ' ')}
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
                    {editingLead ? 'Save Changes' : 'Create Lead'}
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
