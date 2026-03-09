'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, X, Building2, Users, FolderOpen,
  FileText, Edit3, Trash2, Save, ChevronRight,
  Mail, Phone, Briefcase,
} from 'lucide-react';

interface ClientDocContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

interface ClientDocProject {
  name: string;
  status: string;
  description: string;
}

interface ClientDoc {
  id: string;
  clientName: string;
  industry: string;
  status: 'active' | 'prospect' | 'past';
  overview: string;
  contacts: ClientDocContact[];
  projects: ClientDocProject[];
  meetingNotes: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  prospect: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  past: { bg: 'rgba(161,161,170,0.15)', text: '#a1a1aa', border: 'rgba(161,161,170,0.3)' },
};

type TabKey = 'overview' | 'contacts' | 'projects' | 'notes';

export default function ClientsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [clients, setClients] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<ClientDoc | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'prospect' | 'past'>('prospect');
  const [editOverview, setEditOverview] = useState('');
  const [editContacts, setEditContacts] = useState<ClientDocContact[]>([]);
  const [editProjects, setEditProjects] = useState<ClientDocProject[]>([]);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/client-docs?${params.toString()}`);
      const data = await res.json();
      if (data.success) setClients(data.data.clients);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (user) fetchClients();
  }, [user, fetchClients]);

  const openClient = (client: ClientDoc) => {
    setSelectedClient(client);
    loadEditState(client);
    setActiveTab('overview');
    setIsEditing(false);
  };

  const loadEditState = (client: ClientDoc) => {
    setEditName(client.clientName);
    setEditIndustry(client.industry);
    setEditStatus(client.status);
    setEditOverview(client.overview);
    setEditContacts([...client.contacts]);
    setEditProjects([...client.projects]);
    setEditNotes(client.meetingNotes);
  };

  const saveClient = async () => {
    if (!selectedClient) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/client-docs/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editName,
          industry: editIndustry,
          status: editStatus,
          overview: editOverview,
          contacts: editContacts,
          projects: editProjects,
          meetingNotes: editNotes,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchClients();
        setSelectedClient(null);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const createClient = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/client-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: editName,
          industry: editIndustry,
          status: editStatus,
          overview: editOverview,
          contacts: editContacts,
          projects: editProjects,
          meetingNotes: editNotes,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchClients();
      }
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client documentation?')) return;
    try {
      await fetch(`/api/client-docs/${id}`, { method: 'DELETE' });
      setSelectedClient(null);
      fetchClients();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const resetForm = () => {
    setEditName('');
    setEditIndustry('');
    setEditStatus('prospect');
    setEditOverview('');
    setEditContacts([]);
    setEditProjects([]);
    setEditNotes('');
  };

  const addContact = () => {
    setEditContacts([...editContacts, { name: '', role: '', email: '', phone: '' }]);
  };

  const updateContact = (idx: number, field: keyof ClientDocContact, value: string) => {
    const updated = [...editContacts];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditContacts(updated);
  };

  const removeContact = (idx: number) => {
    setEditContacts(editContacts.filter((_, i) => i !== idx));
  };

  const addProject = () => {
    setEditProjects([...editProjects, { name: '', status: '', description: '' }]);
  };

  const updateProject = (idx: number, field: keyof ClientDocProject, value: string) => {
    const updated = [...editProjects];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditProjects(updated);
  };

  const removeProject = (idx: number) => {
    setEditProjects(editProjects.filter((_, i) => i !== idx));
  };

  if (authLoading || !user) return null;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <FileText size={14} /> },
    { key: 'contacts', label: 'Contacts', icon: <Users size={14} /> },
    { key: 'projects', label: 'Projects', icon: <FolderOpen size={14} /> },
    { key: 'notes', label: 'Meeting Notes', icon: <FileText size={14} /> },
  ];

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 8,
    background: '#09090b', border: '1px solid #3f3f46',
    color: '#fafafa', fontSize: 14, width: '100%',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', margin: 0 }}>Client Knowledge Base</h1>
            <p style={{ color: '#a1a1aa', margin: '4px 0 0', fontSize: 14 }}>
              {clients.length} client{clients.length !== 1 ? 's' : ''} documented
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: '#3b82f6', color: '#fff', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            <Plus size={18} /> Add Client
          </button>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#71717a' }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 40px',
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 8, color: '#fafafa', fontSize: 14, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'active', 'prospect', 'past'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 16px', borderRadius: 20, border: '1px solid',
                  borderColor: statusFilter === s ? '#3b82f6' : '#27272a',
                  background: statusFilter === s ? '#3b82f6' : 'transparent',
                  color: statusFilter === s ? '#fff' : '#a1a1aa',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div style={{ color: '#71717a', textAlign: 'center', padding: 60 }}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#71717a' }}>
            <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 16, margin: '0 0 8px' }}>No clients found</p>
            <p style={{ fontSize: 13 }}>Add your first client to start building your knowledge base</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {clients.map((client) => {
              const sc = STATUS_COLORS[client.status] || STATUS_COLORS.prospect;
              return (
                <div
                  key={client.id}
                  onClick={() => openClient(client)}
                  style={{
                    background: '#18181b', border: '1px solid #27272a',
                    borderRadius: 12, padding: 20, cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f3f46')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: 0 }}>{client.clientName}</h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11,
                      fontWeight: 600, border: '1px solid',
                      background: sc.bg, color: sc.text, borderColor: sc.border,
                      textTransform: 'capitalize',
                    }}>
                      {client.status}
                    </span>
                  </div>
                  <p style={{ color: '#71717a', fontSize: 13, margin: '0 0 12px' }}>{client.industry}</p>
                  <div style={{ display: 'flex', gap: 16, color: '#a1a1aa', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} /> {client.contacts.length} contact{client.contacts.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FolderOpen size={12} /> {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Client Detail Modal */}
        {selectedClient && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, padding: 16,
            }}
            onClick={() => setSelectedClient(null)}
          >
            <div
              style={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 16, width: '100%', maxWidth: 800,
                maxHeight: '90vh', overflow: 'auto', padding: 28,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 12, flex: 1, marginRight: 12 }}>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Client name" style={{ ...inputStyle, flex: 1 }} />
                    <input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} placeholder="Industry" style={{ ...inputStyle, width: 160 }} />
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} style={{ ...inputStyle, width: 120 }}>
                      <option value="active">Active</option>
                      <option value="prospect">Prospect</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', margin: 0 }}>{selectedClient.clientName}</h2>
                    <p style={{ color: '#71717a', fontSize: 13, margin: '4px 0 0' }}>{selectedClient.industry}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {isEditing ? (
                    <button onClick={saveClient} disabled={saving} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      background: '#22c55e', color: '#fff', border: 'none',
                      cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      opacity: saving ? 0.6 : 1,
                    }}>
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      background: '#27272a', color: '#fafafa', border: 'none',
                      cursor: 'pointer', fontWeight: 500, fontSize: 13,
                    }}>
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                  <button onClick={() => deleteClient(selectedClient.id)} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: '#27272a', color: '#ef4444', border: 'none', cursor: 'pointer',
                  }}>
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setSelectedClient(null)} style={{
                    padding: 8, borderRadius: 8,
                    background: '#27272a', color: '#a1a1aa', border: 'none', cursor: 'pointer',
                  }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #27272a', paddingBottom: 0 }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 16px', border: 'none', cursor: 'pointer',
                      background: 'transparent', fontSize: 13, fontWeight: 500,
                      color: activeTab === tab.key ? '#fafafa' : '#71717a',
                      borderBottom: `2px solid ${activeTab === tab.key ? '#3b82f6' : 'transparent'}`,
                      marginBottom: -1,
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                isEditing ? (
                  <textarea
                    value={editOverview}
                    onChange={(e) => setEditOverview(e.target.value)}
                    placeholder="Client overview (markdown)..."
                    rows={14}
                    style={{
                      ...inputStyle, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6,
                    }}
                  />
                ) : (
                  <div style={{
                    background: '#09090b', border: '1px solid #27272a',
                    borderRadius: 8, padding: 20,
                    color: '#d4d4d8', fontSize: 14, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', minHeight: 200,
                  }}>
                    {selectedClient.overview || 'No overview yet.'}
                  </div>
                )
              )}

              {activeTab === 'contacts' && (
                <div>
                  {isEditing && (
                    <button onClick={addContact} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, marginBottom: 12,
                      background: '#27272a', color: '#fafafa', border: 'none',
                      cursor: 'pointer', fontSize: 13,
                    }}>
                      <Plus size={14} /> Add Contact
                    </button>
                  )}
                  {(isEditing ? editContacts : selectedClient.contacts).length === 0 ? (
                    <p style={{ color: '#71717a', fontSize: 14, textAlign: 'center', padding: 40 }}>No contacts yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(isEditing ? editContacts : selectedClient.contacts).map((contact, idx) => (
                        <div key={idx} style={{
                          background: '#09090b', border: '1px solid #27272a',
                          borderRadius: 8, padding: 16,
                        }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input value={contact.name} onChange={(e) => updateContact(idx, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, flex: 1 }} />
                                <input value={contact.role} onChange={(e) => updateContact(idx, 'role', e.target.value)} placeholder="Role" style={{ ...inputStyle, flex: 1 }} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input value={contact.email} onChange={(e) => updateContact(idx, 'email', e.target.value)} placeholder="Email" style={{ ...inputStyle, flex: 1 }} />
                                <input value={contact.phone || ''} onChange={(e) => updateContact(idx, 'phone', e.target.value)} placeholder="Phone" style={{ ...inputStyle, width: 160 }} />
                                <button onClick={() => removeContact(idx)} style={{
                                  padding: '8px 12px', borderRadius: 8,
                                  background: '#27272a', color: '#ef4444', border: 'none', cursor: 'pointer',
                                }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ color: '#fafafa', fontWeight: 600, fontSize: 14 }}>{contact.name}</span>
                                <span style={{ color: '#a1a1aa', fontSize: 12 }}>{contact.role}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 16, color: '#71717a', fontSize: 13 }}>
                                {contact.email && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Mail size={12} /> {contact.email}
                                  </span>
                                )}
                                {contact.phone && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Phone size={12} /> {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'projects' && (
                <div>
                  {isEditing && (
                    <button onClick={addProject} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8, marginBottom: 12,
                      background: '#27272a', color: '#fafafa', border: 'none',
                      cursor: 'pointer', fontSize: 13,
                    }}>
                      <Plus size={14} /> Add Project
                    </button>
                  )}
                  {(isEditing ? editProjects : selectedClient.projects).length === 0 ? (
                    <p style={{ color: '#71717a', fontSize: 14, textAlign: 'center', padding: 40 }}>No projects yet</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {(isEditing ? editProjects : selectedClient.projects).map((project, idx) => (
                        <div key={idx} style={{
                          background: '#09090b', border: '1px solid #27272a',
                          borderRadius: 8, padding: 16,
                        }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <input value={project.name} onChange={(e) => updateProject(idx, 'name', e.target.value)} placeholder="Project name" style={{ ...inputStyle, flex: 1 }} />
                                <input value={project.status} onChange={(e) => updateProject(idx, 'status', e.target.value)} placeholder="Status" style={{ ...inputStyle, width: 140 }} />
                                <button onClick={() => removeProject(idx)} style={{
                                  padding: '8px 12px', borderRadius: 8,
                                  background: '#27272a', color: '#ef4444', border: 'none', cursor: 'pointer',
                                }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <textarea value={project.description} onChange={(e) => updateProject(idx, 'description', e.target.value)} placeholder="Description" rows={2} style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ color: '#fafafa', fontWeight: 600, fontSize: 14 }}>{project.name}</span>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 6, fontSize: 11,
                                  background: '#27272a', color: '#a1a1aa',
                                }}>
                                  {project.status}
                                </span>
                              </div>
                              <p style={{ color: '#a1a1aa', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{project.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                isEditing ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Meeting notes (markdown)..."
                    rows={14}
                    style={{
                      ...inputStyle, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6,
                    }}
                  />
                ) : (
                  <div style={{
                    background: '#09090b', border: '1px solid #27272a',
                    borderRadius: 8, padding: 20,
                    color: '#d4d4d8', fontSize: 14, lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', minHeight: 200,
                  }}>
                    {selectedClient.meetingNotes || 'No meeting notes yet.'}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, padding: 16,
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 16, width: '100%', maxWidth: 600,
                maxHeight: '85vh', overflow: 'auto', padding: 28,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', margin: 0 }}>New Client</h2>
                <button onClick={() => setShowCreateModal(false)} style={{
                  padding: 8, borderRadius: 8, background: '#27272a', color: '#a1a1aa', border: 'none', cursor: 'pointer',
                }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Client name" style={inputStyle} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} placeholder="Industry" style={{ ...inputStyle, flex: 1 }} />
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} style={{ ...inputStyle, width: 140 }}>
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="past">Past</option>
                  </select>
                </div>
                <textarea
                  value={editOverview}
                  onChange={(e) => setEditOverview(e.target.value)}
                  placeholder="Overview (markdown)..."
                  rows={6}
                  style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
                />
                <button
                  onClick={createClient}
                  disabled={saving || !editName || !editIndustry}
                  style={{
                    padding: '12px 20px', borderRadius: 8,
                    background: '#3b82f6', color: '#fff', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    opacity: saving || !editName || !editIndustry ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
