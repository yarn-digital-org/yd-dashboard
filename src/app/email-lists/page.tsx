'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Zap,
  List,
  Filter,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Mail,
  Tag,
  RefreshCw,
} from 'lucide-react';

interface SegmentRule {
  field: 'type' | 'tags' | 'company' | 'city' | 'country' | 'leadId';
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value?: string;
}

interface EmailList {
  id: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic';
  rules?: SegmentRule[];
  tags?: string[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  contactId: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
  tags: string[];
}

const FIELD_OPTIONS = [
  { value: 'type', label: 'Contact type' },
  { value: 'tags', label: 'Tag' },
  { value: 'company', label: 'Company' },
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country' },
  { value: 'leadId', label: 'Is a lead' },
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  type: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  tags: [
    { value: 'contains', label: 'includes' },
    { value: 'not_contains', label: 'does not include' },
  ],
  company: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'exists', label: 'is set' },
    { value: 'not_exists', label: 'is not set' },
  ],
  city: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'exists', label: 'is set' },
  ],
  country: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  leadId: [
    { value: 'exists', label: 'is set (is a lead)' },
    { value: 'not_exists', label: 'is not set' },
  ],
};

const TYPE_VALUES = ['lead', 'client', 'past_client', 'vendor', 'other'];

export default function EmailListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'static' as 'static' | 'dynamic',
    rules: [] as SegmentRule[],
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchLists();
  }, [user, authLoading]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-lists');
      const data = await res.json();
      setLists(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (listId: string) => {
    setLoadingMembers(listId);
    try {
      const res = await fetch(`/api/email-lists/${listId}/members`);
      const data = await res.json();
      setMembers(prev => ({ ...prev, [listId]: data.data || [] }));
    } finally {
      setLoadingMembers(null);
    }
  };

  const toggleExpand = async (listId: string) => {
    if (expandedList === listId) {
      setExpandedList(null);
    } else {
      setExpandedList(listId);
      if (!members[listId]) {
        await fetchMembers(listId);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/email-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchLists();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete list "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/email-lists/${id}`, { method: 'DELETE' });
    fetchLists();
  };

  const addRule = () => {
    setForm(prev => ({
      ...prev,
      rules: [...prev.rules, { field: 'type', operator: 'equals', value: '' }],
    }));
  };

  const updateRule = (idx: number, updates: Partial<SegmentRule>) => {
    setForm(prev => {
      const rules = [...prev.rules];
      rules[idx] = { ...rules[idx], ...updates };
      // Reset operator/value when field changes
      if (updates.field) {
        const ops = OPERATOR_OPTIONS[updates.field] || [];
        rules[idx].operator = (ops[0]?.value || 'equals') as SegmentRule['operator'];
        rules[idx].value = '';
      }
      return { ...prev, rules };
    });
  };

  const removeRule = (idx: number) => {
    setForm(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));
  };

  const resetForm = () => {
    setForm({ name: '', description: '', type: 'static', rules: [] });
  };

  const needsValue = (rule: SegmentRule) => !['exists', 'not_exists'].includes(rule.operator);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Lists</h1>
            <p className="text-sm text-gray-500 mt-1">
              {lists.length} {lists.length === 1 ? 'list' : 'lists'} · manage segments for campaigns
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={18} />
            New List
          </button>
        </div>

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lists yet</h3>
            <p className="text-gray-500 mb-4">
              Create static lists to manage subscribers manually, or dynamic segments that auto-update based on contact rules.
            </p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus size={18} />
              Create First List
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map(list => (
              <div key={list.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* List header row */}
                <div
                  className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => toggleExpand(list.id)}
                >
                  {/* Type icon */}
                  <div className={`p-2 rounded-lg ${list.type === 'dynamic' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                    {list.type === 'dynamic' ? (
                      <Zap size={18} className="text-purple-600" />
                    ) : (
                      <List size={18} className="text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{list.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        list.type === 'dynamic'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {list.type}
                      </span>
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-500 truncate">{list.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{list.memberCount}</div>
                      <div className="text-xs text-gray-400">members</div>
                    </div>
                    {list.type === 'dynamic' && list.rules && (
                      <div className="text-center">
                        <div className="font-bold text-gray-900">{list.rules.length}</div>
                        <div className="text-xs text-gray-400">rules</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { fetchMembers(list.id); setExpandedList(list.id); }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Refresh"
                    >
                      <RefreshCw size={14} className={loadingMembers === list.id ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => handleDelete(list.id, list.name)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expandedList === list.id ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Rules (dynamic lists) */}
                {list.type === 'dynamic' && list.rules && list.rules.length > 0 && (
                  <div className="px-4 pb-2 bg-purple-50/50 border-t border-purple-100 flex flex-wrap gap-2 pt-2">
                    {list.rules.map((rule, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs">
                        <Filter size={10} />
                        <span className="font-medium">{rule.field}</span>
                        <span>{rule.operator}</span>
                        {rule.value && <span className="font-semibold">&quot;{rule.value}&quot;</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Members panel */}
                {expandedList === list.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    {loadingMembers === list.id ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 size={14} className="animate-spin" /> Loading members…
                      </div>
                    ) : members[list.id]?.length === 0 ? (
                      <p className="text-sm text-gray-500">No members yet.</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                          {members[list.id]?.length} members
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                          {(members[list.id] || []).map(m => (
                            <div key={m.contactId} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 text-sm">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                                {(m.firstName?.[0] || m.email?.[0] || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {m.firstName} {m.lastName}
                                </div>
                                <div className="text-gray-400 truncate text-xs">{m.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create List Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">New Email List</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    placeholder="e.g. All Leads, VIP Clients…"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    placeholder="Optional description"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">List type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['static', 'dynamic'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type, rules: [] }))}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          form.type === type
                            ? type === 'dynamic'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {type === 'dynamic' ? (
                            <Zap size={16} className={form.type === type ? 'text-purple-600' : 'text-gray-400'} />
                          ) : (
                            <List size={16} className={form.type === type ? 'text-blue-600' : 'text-gray-400'} />
                          )}
                          <span className="font-semibold text-sm capitalize">{type}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {type === 'static'
                            ? 'Manually add/remove contacts'
                            : 'Auto-updates based on rules'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules (dynamic only) */}
                {form.type === 'dynamic' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Segment rules</label>
                      <button
                        type="button"
                        onClick={addRule}
                        className="text-xs text-[#FF3300] hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add rule
                      </button>
                    </div>
                    {form.rules.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No rules — all contacts will be included.</p>
                    ) : (
                      <div className="space-y-2">
                        {form.rules.map((rule, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            {/* Field */}
                            <select
                              value={rule.field}
                              onChange={e => updateRule(idx, { field: e.target.value as SegmentRule['field'] })}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF3300] bg-white"
                            >
                              {FIELD_OPTIONS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>

                            {/* Operator */}
                            <select
                              value={rule.operator}
                              onChange={e => updateRule(idx, { operator: e.target.value as SegmentRule['operator'] })}
                              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF3300] bg-white"
                            >
                              {(OPERATOR_OPTIONS[rule.field] || OPERATOR_OPTIONS.company).map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>

                            {/* Value */}
                            {needsValue(rule) && (
                              rule.field === 'type' ? (
                                <select
                                  value={rule.value || ''}
                                  onChange={e => updateRule(idx, { value: e.target.value })}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF3300] bg-white"
                                >
                                  <option value="">Select type</option>
                                  {TYPE_VALUES.map(v => (
                                    <option key={v} value={v}>{v.replace('_', ' ')}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={rule.value || ''}
                                  onChange={e => updateRule(idx, { value: e.target.value })}
                                  placeholder={rule.field === 'tags' ? 'tag name' : 'value'}
                                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#FF3300] flex-1 min-w-[100px]"
                                />
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => removeRule(idx)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      All rules are combined with AND logic.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || saving}
                  className="px-4 py-2 text-sm font-medium bg-[#FF3300] text-white rounded-lg hover:bg-[#E62E00] disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
