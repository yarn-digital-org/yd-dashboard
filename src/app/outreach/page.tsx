'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Plus, ExternalLink, Trash2, Edit, Check, Loader2, X,
  Target, Search, Mail, Linkedin, MessageCircle,
  Phone, Users, Send, CheckCircle2, TrendingUp, Globe,
  ChevronDown, ChevronUp, FileText, Save, Eye, Pencil,
  AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
type OutreachStatus =
  | 'identified' | 'pending_approval' | 'approved' | 'sent'
  | 'replied' | 'call_booked' | 'closed' | 'not_interested';

type ContactMethod = 'email' | 'linkedin' | 'instagram' | 'phone';
type TemplateChannel = 'email' | 'linkedin' | 'instagram';

interface Prospect {
  id: string;
  company: string;
  sector: string;
  website: string;
  decisionMaker: string;
  decisionMakerTitle?: string | null;
  contactMethod: ContactMethod;
  contactValue: string;
  painPoint: string;
  notes?: string | null;
  draftSubject?: string | null;
  draftMessage?: string | null;
  status: OutreachStatus;
  approvedAt?: string | null;
  sentAt?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OutreachTemplate {
  id: string;
  sector: string;
  channel: TemplateChannel;
  subject: string;
  body: string;
  tailoredServices?: string | null;
}

interface ProspectStats {
  total: number;
  identified: number;
  pending_approval: number;
  approved: number;
  sent: number;
  replied: number;
  call_booked: number;
  closed: number;
  not_interested: number;
}

// ─── Constants ───────────────────────────────────────────
const SECTORS = [
  'Accountancy', 'Solicitors', 'Physio/Sports Rehab', 'Restaurant/Hospitality',
  'Construction/Trades', 'Estate Agent', 'Retail', 'Gym/Fitness', 'Wedding Venue', 'Other',
];

const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; bg: string }> = {
  identified:       { label: 'Identified',       color: '#6B7280', bg: '#F3F4F6' },
  pending_approval: { label: 'Pending Approval',  color: '#D97706', bg: '#FFFBEB' },
  approved:         { label: 'Approved',           color: '#2563EB', bg: '#EFF6FF' },
  sent:             { label: 'Sent',               color: '#7C3AED', bg: '#F5F3FF' },
  replied:          { label: 'Replied',            color: '#059669', bg: '#ECFDF5' },
  call_booked:      { label: 'Call Booked',        color: '#065F46', bg: '#D1FAE5' },
  closed:           { label: 'Closed',             color: '#1E3A5F', bg: '#DBEAFE' },
  not_interested:   { label: 'Not Interested',     color: '#DC2626', bg: '#FEF2F2' },
};

const CHANNEL_CONFIG: Record<TemplateChannel, { label: string; color: string }> = {
  email:     { label: 'Email',     color: '#2563EB' },
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2' },
  instagram: { label: 'Instagram', color: '#E1306C' },
};

const CONTACT_ICONS: Record<ContactMethod, React.ElementType> = {
  email: Mail, linkedin: Linkedin, instagram: MessageCircle, phone: Phone,
};

const DEFAULT_PROSPECT_FORM = {
  company: '', sector: 'Accountancy', website: '',
  decisionMaker: '', decisionMakerTitle: '',
  contactMethod: 'email' as ContactMethod, contactValue: '',
  painPoint: '', notes: '',
};

const DEFAULT_TEMPLATE_FORM = {
  sector: 'Accountancy', channel: 'email' as TemplateChannel,
  subject: '', body: '', tailoredServices: '',
};

// ─── Personalise template ─────────────────────────────────
function personalise(text: string, prospect: Prospect): string {
  return text
    .replace(/\[Name\]/g, prospect.decisionMaker)
    .replace(/\[name\]/g, prospect.decisionMaker)
    .replace(/\[Firm name\]/g, prospect.company)
    .replace(/\[firm name\]/g, prospect.company)
    .replace(/\[Company name\]/g, prospect.company)
    .replace(/\[company name\]/g, prospect.company)
    .replace(/\[Clinic name\]/g, prospect.company)
    .replace(/\[clinic name\]/g, prospect.company)
    .replace(/\[Store name\]/g, prospect.company)
    .replace(/\[practice area\]/g, '[practice area]');
}

// ─── Component ───────────────────────────────────────────
export default function OutreachPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'prospects' | 'templates'>('prospects');

  // Prospects
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<ProspectStats | null>(null);
  const [loadingProspects, setLoadingProspects] = useState(true);
  const [prospectsError, setProspectsError] = useState('');
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | ''>('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Draft panel
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, { subject: string; body: string }>>({});
  const [savingDraft, setSavingDraft] = useState<string | null>(null);
  const [draftModes, setDraftModes] = useState<Record<string, 'preview' | 'edit'>>({});

  // Templates (needed for draft auto-fill)
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Prospect modal
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [prospectForm, setProspectForm] = useState(DEFAULT_PROSPECT_FORM);
  const [savingProspect, setSavingProspect] = useState(false);
  const [prospectError, setProspectError] = useState('');

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutreachTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState(DEFAULT_TEMPLATE_FORM);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchProspects = useCallback(async () => {
    setLoadingProspects(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (sectorFilter) params.set('sector', sectorFilter);
      const res = await fetch(`/api/outreach/prospects?${params}`);
      const json = await res.json();
      if (json.success) {
        setProspects(json.data.prospects);
        setStats(json.data.stats);
      }
    } catch { /* silent */ }
    setLoadingProspects(false);
  }, [statusFilter, sectorFilter]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/outreach/templates');
      const json = await res.json();
      if (json.success) setTemplates(json.data.templates);
    } catch { /* silent */ }
    setLoadingTemplates(false);
  }, []);

  useEffect(() => {
    if (user) { fetchProspects(); fetchTemplates(); }
  }, [user, fetchProspects, fetchTemplates]);

  useEffect(() => {
    if (user && activeTab === 'templates') fetchTemplates();
  }, [user, activeTab, fetchTemplates]);

  const filteredProspects = prospects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.company.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q) ||
      p.decisionMaker.toLowerCase().includes(q) ||
      p.painPoint.toLowerCase().includes(q)
    );
  });

  // ── Draft helpers ──
  const getTemplateForProspect = (p: Prospect) =>
    templates.find(t => t.sector === p.sector) || templates.find(t => t.sector.toLowerCase() === p.sector.toLowerCase()) || null;

  const toggleDraft = (p: Prospect) => {
    if (expandedDraft === p.id) { setExpandedDraft(null); return; }
    setExpandedDraft(p.id);
    // If already has a saved draft, use it; otherwise auto-fill from template
    if (!draftEdits[p.id]) {
      const existing = { subject: p.draftSubject || '', body: p.draftMessage || '' };
      if (existing.subject || existing.body) {
        setDraftEdits(prev => ({ ...prev, [p.id]: existing }));
      } else {
        const tmpl = getTemplateForProspect(p);
        if (tmpl) {
          setDraftEdits(prev => ({
            ...prev,
            [p.id]: {
              subject: personalise(tmpl.subject, p),
              body: personalise(tmpl.body, p),
            },
          }));
        } else {
          setDraftEdits(prev => ({ ...prev, [p.id]: { subject: '', body: '' } }));
        }
      }
    }
  };

  const saveDraft = async (id: string) => {
    const draft = draftEdits[id];
    if (!draft) return;
    setSavingDraft(id);
    await fetch(`/api/outreach/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftSubject: draft.subject, draftMessage: draft.body }),
    });
    setSavingDraft(null);
    fetchProspects();
  };

  // ── Selection ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredProspects.length ? new Set() : new Set(filteredProspects.map(p => p.id)));
  };

  // ── Prospect actions ──
  const handleApprove = async (p: Prospect) => {
    // Require a draft before approving
    if (!p.draftMessage || !p.draftSubject) {
      setSendResult(prev => ({ ...prev, [p.id]: { ok: false, msg: 'Write and save a draft first' } }));
      setTimeout(() => setSendResult(prev => { const n = { ...prev }; delete n[p.id]; return n; }), 4000);
      return;
    }

    const isEmail = p.contactMethod === 'email';
    const confirmMsg = isEmail
      ? `Approve & send email to ${p.decisionMaker} at ${p.company}?\n\nTo: ${p.contactValue}\nSubject: ${p.draftSubject}\n\nSends immediately from jonny@yarndigital.co.uk.`
      : `Approve & mark as sent via ${p.contactMethod}?\n\nContact: ${p.contactValue}\n\nMake sure you've sent it manually.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(p.id);

    // Step 1: Approve
    const approveRes = await fetch(`/api/outreach/prospects/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    if (!approveRes.ok) {
      setActionLoading(null);
      setSendResult(prev => ({ ...prev, [p.id]: { ok: false, msg: 'Approval failed' } }));
      return;
    }

    // Step 2: Send
    const sendRes = await fetch(`/api/outreach/prospects/${p.id}/send`, { method: 'POST' });
    const sendJson = await sendRes.json();
    setActionLoading(null);

    if (sendRes.ok) {
      const via = sendJson.data?.via || p.contactMethod;
      const note = sendJson.data?.manual
        ? `✓ Approved & marked sent via ${via}`
        : `✓ Approved & sent to ${p.contactValue}`;
      setSendResult(prev => ({ ...prev, [p.id]: { ok: true, msg: note } }));
      setTimeout(() => setSendResult(prev => { const n = { ...prev }; delete n[p.id]; return n; }), 5000);
    } else {
      // Approved but send failed — show warning
      setSendResult(prev => ({ ...prev, [p.id]: { ok: false, msg: `Approved but send failed: ${sendJson.error || 'unknown'}` } }));
    }
    fetchProspects();
  };

  const [sendResult, setSendResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const handleSend = async (p: Prospect) => {
    if (!p.draftMessage) {
      setSendResult(prev => ({ ...prev, [p.id]: { ok: false, msg: 'Save a draft first' } }));
      return;
    }
    const isEmail = p.contactMethod === 'email';
    const confirm = isEmail
      ? window.confirm(`Send email to ${p.contactValue}?\n\nSubject: ${p.draftSubject}\n\nThis will send immediately from jonny@yarndigital.co.uk.`)
      : window.confirm(`Mark as sent via ${p.contactMethod}?\n\nContact: ${p.contactValue}\n\nMake sure you've sent it manually first.`);
    if (!confirm) return;
    setActionLoading(p.id + '-send');
    const res = await fetch(`/api/outreach/prospects/${p.id}/send`, { method: 'POST' });
    const json = await res.json();
    setActionLoading(null);
    if (res.ok) {
      const via = json.data?.via || p.contactMethod;
      const note = json.data?.manual ? `Marked sent via ${via}` : `Sent via ${via}`;
      setSendResult(prev => ({ ...prev, [p.id]: { ok: true, msg: note } }));
      setTimeout(() => setSendResult(prev => { const n = { ...prev }; delete n[p.id]; return n; }), 4000);
    } else {
      setSendResult(prev => ({ ...prev, [p.id]: { ok: false, msg: json.error || 'Send failed' } }));
    }
    fetchProspects();
  };

  const handlePromoteToLead = async (id: string) => {
    setActionLoading(id + '-promote');
    await fetch(`/api/outreach/prospects/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'promote_to_lead' }),
    });
    setActionLoading(null);
    fetchProspects();
  };

  const handleBulkApprove = async () => {
    if (!selectedIds.size) return;
    setBulkApproving(true);
    await fetch('/api/outreach/prospects/bulk-approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    setSelectedIds(new Set());
    setBulkApproving(false);
    fetchProspects();
  };

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Delete this prospect?')) return;
    await fetch(`/api/outreach/prospects/${id}`, { method: 'DELETE' });
    fetchProspects();
  };

  // ── Prospect modal ──
  const openCreateProspect = () => {
    setEditingProspect(null); setProspectForm(DEFAULT_PROSPECT_FORM); setProspectError(''); setShowProspectModal(true);
  };
  const openEditProspect = (p: Prospect) => {
    setEditingProspect(p);
    setProspectForm({ company: p.company, sector: p.sector, website: p.website, decisionMaker: p.decisionMaker, decisionMakerTitle: p.decisionMakerTitle || '', contactMethod: p.contactMethod, contactValue: p.contactValue, painPoint: p.painPoint, notes: p.notes || '' });
    setProspectError(''); setShowProspectModal(true);
  };
  const handleSaveProspect = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingProspect(true); setProspectError('');
    try {
      const url = editingProspect ? `/api/outreach/prospects/${editingProspect.id}` : '/api/outreach/prospects';
      const res = await fetch(url, { method: editingProspect ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prospectForm) });
      const json = await res.json();
      if (!res.ok) { setProspectError(json.error || 'Failed to save'); return; }
      setShowProspectModal(false); fetchProspects();
    } finally { setSavingProspect(false); }
  };

  // ── Template modal ──
  const openCreateTemplate = () => { setEditingTemplate(null); setTemplateForm(DEFAULT_TEMPLATE_FORM); setTemplateError(''); setShowTemplateModal(true); };
  const openEditTemplate = (t: OutreachTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ sector: t.sector, channel: t.channel, subject: t.subject, body: t.body, tailoredServices: t.tailoredServices || '' });
    setTemplateError(''); setShowTemplateModal(true);
  };
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingTemplate(true); setTemplateError('');
    try {
      const url = editingTemplate ? `/api/outreach/templates/${editingTemplate.id}` : '/api/outreach/templates';
      const res = await fetch(url, { method: editingTemplate ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateForm) });
      const json = await res.json();
      if (!res.ok) { setTemplateError(json.error || 'Failed to save'); return; }
      setShowTemplateModal(false); fetchTemplates();
    } finally { setSavingTemplate(false); }
  };
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/outreach/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>Outreach</h1>
            <p className="text-sm text-gray-500 mt-1">Manage cold outreach prospects and templates</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'prospects' && (
              <>
                {selectedIds.size > 0 && (
                  <button onClick={handleBulkApprove} disabled={bulkApproving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
                    {bulkApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve Selected ({selectedIds.size})
                  </button>
                )}
                <button onClick={openCreateProspect} className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium text-sm hover:bg-[#E62E00] transition">
                  <Plus size={16} /> Add Prospect
                </button>
              </>
            )}
            {activeTab === 'templates' && (
              <button onClick={openCreateTemplate} className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium text-sm hover:bg-[#E62E00] transition">
                <Plus size={16} /> Add Template
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {(['prospects', 'templates'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab ? 'bg-[#FF3300] text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ─── PROSPECTS TAB ─── */}
        {activeTab === 'prospects' && (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Total', value: stats.total, icon: Target },
                  { label: 'Pending Approval', value: stats.pending_approval + stats.identified, icon: Users },
                  { label: 'Approved', value: stats.approved, icon: CheckCircle2 },
                  { label: 'Sent', value: stats.sent, icon: Send },
                  { label: 'Replied', value: stats.replied + stats.call_booked, icon: TrendingUp },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-gray-400" /><span className="text-xs text-gray-500 font-medium">{label}</span></div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search prospects..." className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] w-56" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OutreachStatus | '')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]">
                <option value="">All Statuses</option>
                {(Object.keys(STATUS_CONFIG) as OutreachStatus[]).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
              <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]">
                <option value="">All Sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loadingProspects ? (
                <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
              ) : filteredProspects.length === 0 ? (
                <div className="py-16 text-center">
                  <Target size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No prospects yet</p>
                  <p className="text-sm text-gray-400 mb-4">Add your first outreach prospect to get started</p>
                  <button onClick={openCreateProspect} className="px-4 py-2 bg-[#FF3300] text-white rounded-lg text-sm font-medium hover:bg-[#E62E00] transition">Add Prospect</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-left w-10">
                          <input type="checkbox" checked={selectedIds.size === filteredProspects.length && filteredProspects.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Sector</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Decision-maker</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Pain point</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProspects.map(p => {
                        const ContactIcon = CONTACT_ICONS[p.contactMethod];
                        const sc = STATUS_CONFIG[p.status];
                        const isDraftOpen = expandedDraft === p.id;
                        const draft = draftEdits[p.id];
                        const hasDraft = !!(p.draftMessage || p.draftSubject);

                        return (
                          <>
                            <tr key={p.id} className={`border-b ${isDraftOpen ? 'border-[#FF3300]/20 bg-orange-50/30' : 'border-gray-50 hover:bg-gray-50/50'} transition`}>
                              <td className="px-4 py-3">
                                <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-gray-300" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{p.company}</div>
                                {p.website && (
                                  <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#FF3300] hover:underline text-xs font-medium mt-0.5">
                                    <Globe size={10} />{p.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}<ExternalLink size={10} />
                                  </a>
                                )}
                                {/* Draft status pill */}
                                <div className="mt-1">
                                  {p.draftMessage ? (
                                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ Draft ready</span>
                                  ) : getTemplateForProspect(p) ? (
                                    <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">⚠ Needs personalising</span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">No template</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{p.sector}</span>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <ContactIcon size={12} className="text-gray-400 flex-shrink-0" />
                                  <div>
                                    <div className="font-medium text-gray-800 text-xs">{p.decisionMaker}</div>
                                    {p.decisionMakerTitle && <div className="text-gray-400 text-xs">{p.decisionMakerTitle}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden xl:table-cell text-gray-500 max-w-[180px]">
                                <span title={p.painPoint} className="text-xs">{p.painPoint.length > 55 ? p.painPoint.slice(0, 55) + '…' : p.painPoint}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ color: sc.color, backgroundColor: sc.bg }}>{sc.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1 flex-wrap">
                                  {/* Draft toggle */}
                                  <button
                                    onClick={() => toggleDraft(p)}
                                    title={isDraftOpen ? 'Hide draft' : 'View / edit draft message'}
                                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                                      isDraftOpen
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : hasDraft
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    <FileText size={11} />
                                    {isDraftOpen ? 'Hide' : hasDraft ? 'Draft ✓' : 'Draft'}
                                    {isDraftOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                  </button>

                                  {/* Approve & Send */}
                                  {(p.status === 'identified' || p.status === 'pending_approval') && (
                                    <button
                                      onClick={() => handleApprove(p)}
                                      disabled={actionLoading === p.id}
                                      title={p.draftMessage ? `Approve & ${p.contactMethod === 'email' ? 'send email to ' + p.contactValue : 'mark sent via ' + p.contactMethod}` : 'Save a draft first'}
                                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 disabled:opacity-50 ${
                                        p.draftMessage
                                          ? 'bg-[#FF3300] text-white hover:bg-[#E62E00]'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      {actionLoading === p.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                                      {p.draftMessage ? (p.contactMethod === 'email' ? 'Approve & Send' : 'Approve & Mark Sent') : 'Draft needed'}
                                    </button>
                                  )}

                                  {/* Send result flash */}
                                  {sendResult[p.id] && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sendResult[p.id].ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                      {sendResult[p.id].msg}
                                    </span>
                                  )}

                                  {/* Promote to lead */}
                                  {(p.status === 'replied' || p.status === 'call_booked') && (
                                    <button onClick={() => handlePromoteToLead(p.id)} disabled={actionLoading === p.id + '-promote'} title="Promote to Lead" className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1">
                                      {actionLoading === p.id + '-promote' ? <Loader2 size={11} className="animate-spin" /> : <TrendingUp size={11} />} → Lead
                                    </button>
                                  )}

                                  <button onClick={() => openEditProspect(p)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Edit"><Edit size={14} /></button>
                                  <button onClick={() => handleDeleteProspect(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>

                            {/* ── DRAFT PANEL ── */}
                            {isDraftOpen && (() => {
                              const tmpl = getTemplateForProspect(p);
                              const isEditing = draftEdits[p.id] !== undefined;
                              const editDraft = draftEdits[p.id];
                              const displaySubject = isEditing ? editDraft.subject : (p.draftSubject || (tmpl ? personalise(tmpl.subject, p) : ''));
                              const displayBody = isEditing ? editDraft.body : (p.draftMessage || (tmpl ? personalise(tmpl.body, p) : ''));
                              const isPersonalised = !!(p.draftMessage);
                              const draftMode = draftModes[p.id] || 'preview';
                              const setDraftMode = (mode: 'preview' | 'edit') => setDraftModes(prev => ({ ...prev, [p.id]: mode }));

                              return (
                                <tr key={p.id + '-draft'} className="border-b border-blue-100 bg-blue-50/10">
                                  <td colSpan={7} className="px-6 py-0">
                                    <div className="max-w-4xl py-5">

                                      {/* Panel header */}
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <div className="flex items-center gap-1.5">
                                            <Mail size={14} className="text-gray-500" />
                                            <span className="text-sm font-semibold text-gray-800">Outreach message — {p.company}</span>
                                          </div>
                                          {/* Template badge */}
                                          {tmpl ? (
                                            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                                              Template: {tmpl.sector}
                                            </span>
                                          ) : (
                                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                              <AlertCircle size={10} /> No template for {p.sector}
                                            </span>
                                          )}
                                          {/* Personalisation status */}
                                          {isPersonalised ? (
                                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                                              ✓ Personalised &amp; saved
                                            </span>
                                          ) : tmpl ? (
                                            <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                                              ⚠ Template only — not yet personalised
                                            </span>
                                          ) : null}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {/* Preview / Edit toggle */}
                                          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
                                            <button onClick={() => setDraftMode('preview')} className={`px-3 py-1.5 rounded-md transition flex items-center gap-1 ${draftMode === 'preview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                                              <Eye size={11} /> Preview
                                            </button>
                                            <button onClick={() => { setDraftMode('edit'); if (!draftEdits[p.id]) setDraftEdits(prev => ({ ...prev, [p.id]: { subject: displaySubject, body: displayBody } })); }} className={`px-3 py-1.5 rounded-md transition flex items-center gap-1 ${draftMode === 'edit' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                                              <Pencil size={11} /> Edit
                                            </button>
                                          </div>
                                          {draftMode === 'edit' && (
                                            <button onClick={() => saveDraft(p.id)} disabled={savingDraft === p.id || !draftEdits[p.id]} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF3300] text-white rounded-lg text-xs font-medium hover:bg-[#E62E00] transition disabled:opacity-50">
                                              {savingDraft === p.id ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save Draft
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Preview mode — readable email */}
                                      {draftMode === 'preview' && (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                          {/* Email header strip */}
                                          <div className="border-b border-gray-100 px-5 py-3 bg-gray-50 space-y-1">
                                            <div className="flex items-baseline gap-2 text-sm">
                                              <span className="text-xs font-semibold text-gray-400 w-14 flex-shrink-0">TO</span>
                                              <span className="font-medium text-gray-800">{p.decisionMaker}{p.decisionMakerTitle ? `, ${p.decisionMakerTitle}` : ''} — {p.company}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2 text-sm">
                                              <span className="text-xs font-semibold text-gray-400 w-14 flex-shrink-0">VIA</span>
                                              <span className="text-gray-600 capitalize">{p.contactMethod} — {p.contactValue}</span>
                                            </div>
                                            {displaySubject && (
                                              <div className="flex items-baseline gap-2 text-sm">
                                                <span className="text-xs font-semibold text-gray-400 w-14 flex-shrink-0">SUBJECT</span>
                                                <span className="font-semibold text-gray-900">{displaySubject}</span>
                                              </div>
                                            )}
                                          </div>
                                          {/* Body */}
                                          <div className="px-5 py-5">
                                            {displayBody ? (
                                              <div className="text-sm text-gray-800 leading-7 whitespace-pre-wrap font-sans" style={{ maxWidth: '60ch' }}>
                                                {displayBody}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-gray-400 italic py-4 text-center">
                                                No message yet — click Edit to write one, or add a template for the {p.sector} sector first.
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Edit mode */}
                                      {draftMode === 'edit' && (
                                        <div className="space-y-3">
                                          {/* Template selector */}
                                          {templates.length > 0 && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                              <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Load template:</label>
                                              <select
                                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                                                defaultValue=""
                                                onChange={e => {
                                                  const tid = e.target.value;
                                                  if (!tid) return;
                                                  const t = templates.find(t => t.id === tid);
                                                  if (!t) return;
                                                  setDraftEdits(prev => ({
                                                    ...prev,
                                                    [p.id]: {
                                                      subject: personalise(t.subject, p),
                                                      body: personalise(t.body, p),
                                                    },
                                                  }));
                                                  e.target.value = '';
                                                }}
                                              >
                                                <option value="">— pick a template to load —</option>
                                                {templates.map(t => (
                                                  <option key={t.id} value={t.id}>{t.sector} ({t.channel})</option>
                                                ))}
                                              </select>
                                              <span className="text-xs text-gray-400">Replaces current draft</span>
                                            </div>
                                          )}
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5" style={{ letterSpacing: '0.05em' }}>Subject / Opening line</label>
                                            <input
                                              value={editDraft?.subject ?? displaySubject}
                                              onChange={e => setDraftEdits(prev => ({ ...prev, [p.id]: { subject: e.target.value, body: prev[p.id]?.body ?? displayBody } }))}
                                              placeholder="Subject line..."
                                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] bg-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5" style={{ letterSpacing: '0.05em' }}>Message body</label>
                                            <textarea
                                              rows={14}
                                              value={editDraft?.body ?? displayBody}
                                              onChange={e => setDraftEdits(prev => ({ ...prev, [p.id]: { subject: prev[p.id]?.subject ?? displaySubject, body: e.target.value } }))}
                                              placeholder="Personalise the message here..."
                                              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm leading-7 focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] bg-white resize-none"
                                              style={{ maxWidth: '65ch', fontFamily: 'inherit' }}
                                            />
                                          </div>
                                          <p className="text-xs text-gray-400">Edit the message, then hit <span className="font-semibold text-gray-600">Save Draft</span>. Switch back to Preview to read it. Hit <span className="font-semibold text-gray-600">Approve &amp; Send</span> when ready.</p>
                                        </div>
                                      )}

                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── TEMPLATES TAB ─── */}
        {activeTab === 'templates' && (
          <>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
            ) : templates.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                <Mail size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No templates yet</p>
                <p className="text-sm text-gray-400 mb-4">Add sector-specific outreach templates</p>
                <button onClick={openCreateTemplate} className="px-4 py-2 bg-[#FF3300] text-white rounded-lg text-sm font-medium hover:bg-[#E62E00] transition">Add Template</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {templates.map(t => {
                  const cc = CHANNEL_CONFIG[t.channel];
                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{t.sector}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: cc.color, backgroundColor: cc.color + '18' }}>{cc.label}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEditTemplate(t)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"><Edit size={13} /></button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{t.subject}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{t.body.slice(0, 120)}{t.body.length > 120 ? '…' : ''}</p>
                      </div>
                      {t.tailoredServices && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1" style={{ letterSpacing: '0.05em' }}>Tailored Pitch</p>
                          <p className="text-xs text-gray-500">{t.tailoredServices.slice(0, 100)}{t.tailoredServices.length > 100 ? '…' : ''}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─── PROSPECT MODAL ─── */}
        {showProspectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProspectModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{editingProspect ? 'Edit Prospect' : 'Add Prospect'}</h2>
                <button onClick={() => setShowProspectModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
              </div>
              <form onSubmit={handleSaveProspect} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className={labelClass}>Company <span className="text-red-500">*</span></label><input required className={inputClass} value={prospectForm.company} onChange={e => setProspectForm({...prospectForm, company: e.target.value})} placeholder="Company name" /></div>
                  <div><label className={labelClass}>Sector <span className="text-red-500">*</span></label><select required className={inputClass} value={prospectForm.sector} onChange={e => setProspectForm({...prospectForm, sector: e.target.value})}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className={labelClass}>Website <span className="text-red-500">*</span></label><input required className={inputClass} value={prospectForm.website} onChange={e => setProspectForm({...prospectForm, website: e.target.value})} placeholder="example.co.uk" /></div>
                  <div><label className={labelClass}>Decision-maker <span className="text-red-500">*</span></label><input required className={inputClass} value={prospectForm.decisionMaker} onChange={e => setProspectForm({...prospectForm, decisionMaker: e.target.value})} placeholder="Full name" /></div>
                  <div><label className={labelClass}>Title</label><input className={inputClass} value={prospectForm.decisionMakerTitle} onChange={e => setProspectForm({...prospectForm, decisionMakerTitle: e.target.value})} placeholder="Managing Partner" /></div>
                  <div><label className={labelClass}>Contact method <span className="text-red-500">*</span></label><select required className={inputClass} value={prospectForm.contactMethod} onChange={e => setProspectForm({...prospectForm, contactMethod: e.target.value as ContactMethod})}><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="instagram">Instagram</option><option value="phone">Phone</option></select></div>
                  <div><label className={labelClass}>Contact value <span className="text-red-500">*</span></label><input required className={inputClass} value={prospectForm.contactValue} onChange={e => setProspectForm({...prospectForm, contactValue: e.target.value})} placeholder="email / LinkedIn URL / @handle" /></div>
                </div>
                <div><label className={labelClass}>Pain point <span className="text-red-500">*</span></label><textarea required rows={2} className={inputClass + ' resize-none'} value={prospectForm.painPoint} onChange={e => setProspectForm({...prospectForm, painPoint: e.target.value})} placeholder="What's wrong with their digital presence?" /></div>
                <div><label className={labelClass}>Notes</label><textarea rows={2} className={inputClass + ' resize-none'} value={prospectForm.notes} onChange={e => setProspectForm({...prospectForm, notes: e.target.value})} placeholder="Additional context..." /></div>
                {prospectError && <p className="text-sm text-red-600">{prospectError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowProspectModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition">Cancel</button>
                  <button type="submit" disabled={savingProspect} className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm transition flex items-center gap-2 disabled:opacity-50">
                    {savingProspect ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editingProspect ? 'Save Changes' : 'Add Prospect')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── TEMPLATE MODAL ─── */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTemplateModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">{editingTemplate ? 'Edit Template' : 'Add Template'}</h2>
                <button onClick={() => setShowTemplateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
              </div>
              <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Sector <span className="text-red-500">*</span></label><select required className={inputClass} value={templateForm.sector} onChange={e => setTemplateForm({...templateForm, sector: e.target.value})}>{SECTORS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className={labelClass}>Channel <span className="text-red-500">*</span></label><select required className={inputClass} value={templateForm.channel} onChange={e => setTemplateForm({...templateForm, channel: e.target.value as TemplateChannel})}><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="instagram">Instagram</option></select></div>
                </div>
                <div><label className={labelClass}>Subject <span className="text-red-500">*</span></label><input required className={inputClass} value={templateForm.subject} onChange={e => setTemplateForm({...templateForm, subject: e.target.value})} placeholder="Email subject or opening line" /></div>
                <div><label className={labelClass}>Body <span className="text-red-500">*</span></label><textarea required rows={8} className={inputClass + ' resize-none font-mono text-xs'} value={templateForm.body} onChange={e => setTemplateForm({...templateForm, body: e.target.value})} placeholder={'Hi [Name],\n\n...\n\nJonny'} /></div>
                <div><label className={labelClass}>Tailored services pitch</label><textarea rows={3} className={inputClass + ' resize-none'} value={templateForm.tailoredServices} onChange={e => setTemplateForm({...templateForm, tailoredServices: e.target.value})} placeholder="What Yarn Digital specifically offers this sector..." /></div>
                {templateError && <p className="text-sm text-red-600">{templateError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition">Cancel</button>
                  <button type="submit" disabled={savingTemplate} className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm transition flex items-center gap-2 disabled:opacity-50">
                    {savingTemplate ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editingTemplate ? 'Save Changes' : 'Add Template')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
