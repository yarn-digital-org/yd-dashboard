'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, Building2, Calendar, Edit3, Trash2,
  DollarSign, Tag, MessageSquare, Plus, Check, X, ChevronRight,
  ExternalLink, Clock, User, Briefcase, Link2, Send, UserPlus,
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
  utm?: { source?: string; medium?: string; campaign?: string; content?: string };
  convertedToProjectId?: string;
  convertedToContactId?: string;
  createdAt: string;
  updatedAt: string;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
type LeadPriority = 'low' | 'medium' | 'high';

// Constants
const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const PRIORITY_OPTIONS: LeadPriority[] = ['low', 'medium', 'high'];

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string; description: string }> = {
  new: { label: 'New', color: '#3B82F6', bgColor: '#EFF6FF', description: 'Newly received lead, not yet contacted' },
  contacted: { label: 'Contacted', color: '#F59E0B', bgColor: '#FFFBEB', description: 'Initial contact made' },
  qualified: { label: 'Qualified', color: '#8B5CF6', bgColor: '#F5F3FF', description: 'Lead is a good fit for services' },
  proposal_sent: { label: 'Proposal Sent', color: '#F97316', bgColor: '#FFF7ED', description: 'Proposal has been sent' },
  won: { label: 'Won', color: '#10B981', bgColor: '#ECFDF5', description: 'Lead converted to client' },
  lost: { label: 'Lost', color: '#EF4444', bgColor: '#FEF2F2', description: 'Lead did not convert' },
};

const PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High Priority', color: '#EF4444', bgColor: '#FEF2F2' },
  medium: { label: 'Medium Priority', color: '#F59E0B', bgColor: '#FFFBEB' },
  low: { label: 'Low Priority', color: '#6B7280', bgColor: '#F3F4F6' },
};

export default function LeadDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  // Note state
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Tag state
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && leadId) {
      fetchLead();
    }
  }, [user, leadId]);

  const fetchLead = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();

      if (data.success) {
        setLead(data.data);
        setEditData(data.data);
      } else {
        setError(data.error || 'Failed to load lead');
      }
    } catch (err) {
      console.error('Failed to fetch lead:', err);
      setError('Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    if (!lead) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', priority: newPriority }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: { content: newNote } }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
        setNewNote('');
        setShowNoteInput(false);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_note', note: { id: noteId, content: editingNoteContent } }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
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
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_note', noteId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleAddTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || lead?.tags.includes(tag)) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_tag', tag }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
        setNewTag('');
        setShowTagInput(false);
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_tag', tag }),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const data = await res.json();
        setLead(data.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/leads');
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
    if (min) return `From £${min.toLocaleString()}`;
    if (max) return `Up to £${max.toLocaleString()}`;
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem' }}>
          <Link
            href="/leads"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', textDecoration: 'none', marginBottom: '1rem' }}
          >
            <ArrowLeft size={18} />
            Back to Leads
          </Link>
          <div style={{ textAlign: 'center', padding: '3rem', color: '#DC2626' }}>
            {error || 'Lead not found'}
          </div>
        </main>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[lead.status];
  const priorityConfig = PRIORITY_CONFIG[lead.priority];

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
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/leads"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#6B7280',
              textDecoration: 'none',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            <ArrowLeft size={16} />
            Back to Leads
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>{lead.name}</h1>
                <span
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color,
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}
                >
                  {statusConfig.label}
                </span>
                <span
                  style={{
                    backgroundColor: priorityConfig.bgColor,
                    color: priorityConfig.color,
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                  }}
                >
                  {priorityConfig.label}
                </span>
              </div>
              {lead.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280' }}>
                  <Building2 size={16} />
                  {lead.company}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                }}
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #FEE2E2',
                  borderRadius: '0.5rem',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#DC2626',
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Status Workflow */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                Lead Status
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {STATUS_OPTIONS.map((status, index) => {
                  const config = STATUS_CONFIG[status];
                  const isActive = lead.status === status;
                  const isPast = STATUS_OPTIONS.indexOf(lead.status) > index;

                  return (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <button
                        onClick={() => handleStatusChange(status)}
                        style={{
                          flex: 1,
                          padding: '0.75rem 0.5rem',
                          borderRadius: '0.5rem',
                          border: isActive ? `2px solid ${config.color}` : '1px solid #E5E7EB',
                          backgroundColor: isActive ? config.bgColor : isPast ? '#F3F4F6' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? config.color : isPast ? '#374151' : '#9CA3AF',
                          }}
                        >
                          {config.label}
                        </div>
                      </button>
                      {index < STATUS_OPTIONS.length - 1 && (
                        <ChevronRight size={16} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.75rem', margin: '0.75rem 0 0' }}>
                {statusConfig.description}
              </p>
            </div>

            {/* Notes */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0 }}>Notes</h3>
                <button
                  onClick={() => setShowNoteInput(true)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.8125rem',
                    color: '#374151',
                  }}
                >
                  <Plus size={14} />
                  Add Note
                </button>
              </div>

              {/* New Note Input */}
              {showNoteInput && (
                <div style={{ marginBottom: '1rem' }}>
                  <textarea
                    placeholder="Write a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setShowNoteInput(false);
                        setNewNote('');
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: '#6B7280',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: '#FF3300',
                        cursor: newNote.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '0.8125rem',
                        color: '#FFFFFF',
                        opacity: newNote.trim() ? 1 : 0.5,
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}

              {/* Notes List */}
              {lead.notes && lead.notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {lead.notes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '0.875rem',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '0.5rem',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      {editingNoteId === note.id ? (
                        <>
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', marginBottom: '0.5rem' }}
                            autoFocus
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingNoteContent('');
                              }}
                              style={{
                                padding: '0.25rem 0.5rem',
                                border: '1px solid #E5E7EB',
                                borderRadius: '0.25rem',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateNote(note.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                border: 'none',
                                borderRadius: '0.25rem',
                                backgroundColor: '#FF3300',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                color: '#FFFFFF',
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '0.8125rem', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
                            {note.content}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              {formatDate(note.createdAt)}
                              {note.updatedAt && ' (edited)'}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingNoteContent(note.content);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#6B7280',
                                  padding: '0.25rem',
                                }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#DC2626',
                                  padding: '0.25rem',
                                }}
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
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '1.5rem' }}>
                  No notes yet. Add your first note above.
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Contact Info */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                Contact Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Mail size={16} style={{ color: '#9CA3AF' }} />
                  <a href={`mailto:${lead.email}`} style={{ color: '#3B82F6', fontSize: '0.875rem', textDecoration: 'none' }}>
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone size={16} style={{ color: '#9CA3AF' }} />
                    <a href={`tel:${lead.phone}`} style={{ color: '#374151', fontSize: '0.875rem', textDecoration: 'none' }}>
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={16} style={{ color: '#9CA3AF' }} />
                    <span style={{ color: '#374151', fontSize: '0.875rem' }}>{lead.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                Project Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>Service</div>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>{lead.service || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>Budget</div>
                  <div style={{ fontSize: '0.875rem', color: lead.budgetMin || lead.budgetMax ? '#059669' : '#374151', fontWeight: lead.budgetMin || lead.budgetMax ? 500 : 400 }}>
                    {formatBudget(lead.budgetMin, lead.budgetMax)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>Source</div>
                  <div style={{ fontSize: '0.875rem', color: '#374151', textTransform: 'capitalize' }}>
                    {lead.source?.replace('_', ' ') || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* UTM Tracking */}
            {(lead.utm?.source || lead.utm?.medium || lead.utm?.campaign || lead.utm?.content) && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.75rem',
                  border: '1px solid #E5E7EB',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                  UTM Tracking
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Source', value: lead.utm?.source },
                    { label: 'Medium', value: lead.utm?.medium },
                    { label: 'Campaign', value: lead.utm?.campaign },
                    { label: 'Content', value: lead.utm?.content },
                  ].filter(item => item.value).map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.875rem', color: '#374151' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Selection */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                Priority
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {PRIORITY_OPTIONS.map((priority) => {
                  const config = PRIORITY_CONFIG[priority];
                  const isActive = lead.priority === priority;

                  return (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: isActive ? `2px solid ${config.color}` : '1px solid #E5E7EB',
                        backgroundColor: isActive ? config.bgColor : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? config.color : '#6B7280',
                        textTransform: 'capitalize',
                      }}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0 }}>Tags</h3>
                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280',
                    padding: '0.25rem',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {showTagInput && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    style={{ ...inputStyle, flex: 1 }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddTag}
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      backgroundColor: '#FF3300',
                      cursor: 'pointer',
                      color: '#FFFFFF',
                    }}
                  >
                    <Check size={16} />
                  </button>
                </div>
              )}

              {lead.tags && lead.tags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {lead.tags.map((tag) => (
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
                        onClick={() => handleRemoveTag(tag)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', padding: 0, lineHeight: 1 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>No tags yet</p>
              )}
            </div>

            {/* Timestamps */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                  <Calendar size={14} style={{ color: '#9CA3AF' }} />
                  Created: {formatDate(lead.createdAt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                  <Clock size={14} style={{ color: '#9CA3AF' }} />
                  Updated: {formatDate(lead.updatedAt)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                border: '1px solid #E5E7EB',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', margin: '0 0 1rem' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a
                  href={`mailto:${lead.email}`}
                  style={{
                    padding: '0.625rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    backgroundColor: '#FFFFFF',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.8125rem',
                    color: '#374151',
                  }}
                >
                  <Send size={16} style={{ color: '#9CA3AF' }} />
                  Send Email
                </a>
                {lead.status !== 'won' && (
                  <button
                    onClick={() => handleStatusChange('won')}
                    style={{
                      padding: '0.625rem',
                      border: '1px solid #D1FAE5',
                      borderRadius: '0.5rem',
                      backgroundColor: '#ECFDF5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.8125rem',
                      color: '#059669',
                    }}
                  >
                    <UserPlus size={16} />
                    Mark as Won
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
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
            onClick={() => setIsEditing(false)}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Edit Lead</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
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
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={editData.company || ''}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                    Service
                  </label>
                  <input
                    type="text"
                    value={editData.service || ''}
                    onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Budget Min (£)
                    </label>
                    <input
                      type="number"
                      value={editData.budgetMin || ''}
                      onChange={(e) => setEditData({ ...editData, budgetMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                      Budget Max (£)
                    </label>
                    <input
                      type="number"
                      value={editData.budgetMax || ''}
                      onChange={(e) => setEditData({ ...editData, budgetMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                    Source
                  </label>
                  <select
                    value={editData.source || 'direct'}
                    onChange={(e) => setEditData({ ...editData, source: e.target.value })}
                    style={{ ...inputStyle, backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                  >
                    {['direct', 'referral', 'website', 'social', 'ads', 'cold_outreach', 'event', 'other'].map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setIsEditing(false)}
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
                  onClick={handleSaveEdit}
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
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
