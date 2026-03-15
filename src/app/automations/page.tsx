'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Zap,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Play,
  Pause,
  Mail,
  CheckSquare,
  RefreshCw,
  Bell,
  UserPlus,
  Users,
  FileWarning,
  FileText,
  ChevronDown,
  Clock,
  Hash,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface AutomationTrigger {
  type: 'new_contact' | 'new_lead' | 'invoice_overdue' | 'form_submission';
  config: Record<string, any>;
}

interface AutomationAction {
  type: 'send_email' | 'create_task' | 'update_status' | 'notify';
  config: {
    to?: string;
    subject?: string;
    body?: string;
    title?: string;
    assignee?: string;
    field?: string;
    value?: string;
    message?: string;
  };
}

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'new_contact' | 'new_lead' | 'invoice_overdue' | 'form_submission';
    config?: Record<string, any>;
  };
  actions: AutomationAction[];
  enabled: boolean;
  lastRun?: string;
  runCount: number;
  createdAt: string;
}

const TRIGGER_OPTIONS = [
  { value: 'new_contact', label: 'New Contact Added', icon: UserPlus, description: 'When a new contact is created' },
  { value: 'new_lead', label: 'New Lead Added', icon: Users, description: 'When a new lead is created' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', icon: FileWarning, description: 'When an invoice becomes overdue' },
  { value: 'form_submission', label: 'Form Submission', icon: FileText, description: 'When a form is submitted' },
];

const ACTION_OPTIONS = [
  { value: 'send_email', label: 'Send Email', icon: Mail, description: 'Send an automated email' },
  { value: 'create_task', label: 'Create Task', icon: CheckSquare, description: 'Create a new task' },
  { value: 'update_status', label: 'Update Status', icon: RefreshCw, description: 'Update a field value' },
  { value: 'notify', label: 'Send Notification', icon: Bell, description: 'Send a notification' },
];

export default function AutomationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('all');

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    trigger: AutomationTrigger;
    actions: AutomationAction[];
  }>({
    name: '',
    description: '',
    trigger: { type: 'new_contact', config: {} },
    actions: [{ type: 'send_email', config: {} }],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchAutomations();
      fetch('/api/automations/templates').then(r => r.json()).then(d => setTemplates(d.data || [])).catch(() => {});
    }
  }, [user, authLoading, router]);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      setAutomations(data.automations || []);
    } catch (err) {
      console.error('Failed to fetch automations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    setUsingTemplate(templateId);
    try {
      const res = await fetch('/api/automations/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });
      if (res.ok) {
        setShowTemplates(false);
        fetchAutomations();
      }
    } finally {
      setUsingTemplate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAutomation ? `/api/automations/${editingAutomation.id}` : '/api/automations';
      const method = editingAutomation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to save automation');
        return;
      }

      setShowModal(false);
      setEditingAutomation(null);
      resetForm();
      fetchAutomations();
    } catch (err) {
      console.error('Failed to save automation:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    try {
      await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      fetchAutomations();
    } catch (err) {
      console.error('Failed to delete automation:', err);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/automations/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchAutomations();
      }
    } catch (err) {
      console.error('Failed to toggle automation:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description,
      trigger: { ...automation.trigger, config: automation.trigger.config || {} },
      actions: automation.actions.map(a => ({ ...a, config: a.config || {} })),
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: { type: 'new_contact', config: {} },
      actions: [{ type: 'send_email', config: {} }],
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'notify', config: {} }],
    });
  };

  const removeAction = (index: number) => {
    if (formData.actions.length <= 1) return;
    const newActions = formData.actions.filter((_, i) => i !== index);
    setFormData({ ...formData, actions: newActions });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    if (field === 'type') {
      newActions[index] = { type: value, config: {} };
    } else {
      newActions[index] = {
        ...newActions[index],
        config: { ...newActions[index].config, [field]: value },
      };
    }
    setFormData({ ...formData, actions: newActions });
  };

  const getTriggerIcon = (type: string) => {
    const option = TRIGGER_OPTIONS.find((o) => o.value === type);
    return option?.icon || Zap;
  };

  const getTriggerLabel = (type: string) => {
    const option = TRIGGER_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  const getActionIcon = (type: string) => {
    const option = ACTION_OPTIONS.find((o) => o.value === type);
    return option?.icon || Bell;
  };

  const getActionLabel = (type: string) => {
    const option = ACTION_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading automations...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Automations</h1>
            <p className="text-gray-500 text-sm mt-1">
              {automations.length} {automations.length === 1 ? 'automation' : 'automations'}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 min-h-[44px] rounded-lg font-medium transition flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              Templates
            </button>
            <button
              onClick={() => {
                setEditingAutomation(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 min-h-[44px] rounded-lg font-medium transition flex-1 sm:flex-none"
            >
              <Plus size={18} />
              Create
            </button>
          </div>
        </div>

        {/* Automations List */}
        {automations.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#FFF5F2' }}
            >
              <Zap size={32} className="text-[#FF3300]" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Set up automated workflows to save time — send emails, update statuses, notify your team, and more.
            </p>
            <button
              onClick={() => {
                setEditingAutomation(null);
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus size={18} />
              Create Your First Automation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => {
              const TriggerIcon = getTriggerIcon(automation.trigger.type);
              return (
                <div
                  key={automation.id}
                  className={`bg-white rounded-xl border p-5 transition relative group ${
                    automation.enabled ? 'border-gray-200 hover:shadow-md' : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(automation.id)}
                        disabled={togglingId === automation.id}
                        className={`mt-1 w-12 h-6 rounded-full relative transition-colors ${
                          automation.enabled ? 'bg-[#FF3300]' : 'bg-gray-300'
                        }`}
                        title={automation.enabled ? 'Disable automation' : 'Enable automation'}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            automation.enabled ? 'left-6' : 'left-0.5'
                          }`}
                        />
                      </button>

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          automation.enabled ? 'bg-[#FFF5F2]' : 'bg-gray-100'
                        }`}
                      >
                        <TriggerIcon size={20} className={automation.enabled ? 'text-[#FF3300]' : 'text-gray-400'} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                        {automation.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{automation.description}</p>
                        )}

                        {/* Trigger and Actions */}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <Zap size={12} />
                            {getTriggerLabel(automation.trigger.type)}
                          </span>
                          <span className="text-gray-400">→</span>
                          {automation.actions.map((action, idx) => {
                            const ActionIcon = getActionIcon(action.type);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                              >
                                <ActionIcon size={12} />
                                {getActionLabel(action.type)}
                              </span>
                            );
                          })}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Hash size={12} />
                            {automation.runCount} runs
                          </span>
                          {automation.lastRun && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              Last run: {formatDate(automation.lastRun)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            Created: {formatDate(automation.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === automation.id ? null : automation.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>
                      {activeMenu === automation.id && (
                        <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              openEdit(automation);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleToggle(automation.id);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                          >
                            {automation.enabled ? <Pause size={14} /> : <Play size={14} />}
                            {automation.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(automation.id);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTemplates(false)}>
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-500" />
                    Automation Templates
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Pick a template to get started — you can customise it after.</p>
                </div>
                <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 p-4 border-b border-gray-100 overflow-x-auto">
                {['all', 'leads', 'contacts', 'invoices', 'forms', 'bookings'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize transition ${
                      templateCategory === cat
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates
                  .filter(t => templateCategory === 'all' || t.category === templateCategory)
                  .map(t => (
                    <div key={t.id} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50/30 transition group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{t.icon}</span>
                            <span className="font-semibold text-sm text-gray-900">{t.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{t.description}</p>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{t.trigger.type.replace(/_/g, ' ')}</span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">{t.actions.length} action{t.actions.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUseTemplate(t.id)}
                        disabled={usingTemplate === t.id}
                        className="mt-3 w-full py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                      >
                        {usingTemplate === t.id ? (
                          <><Loader2 size={12} className="animate-spin" /> Adding…</>
                        ) : (
                          <>Use Template</>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <div
              className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAutomation ? 'Edit Automation' : 'Create Automation'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                {/* Name and Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    placeholder="e.g., Welcome new contacts"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]"
                    placeholder="What does this automation do?"
                  />
                </div>

                {/* Trigger */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Zap size={16} className="text-[#FF3300]" />
                      When this happens (Trigger)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRIGGER_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.trigger.type === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              trigger: { type: option.value as AutomationTrigger['type'], config: {} },
                            })
                          }
                          className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition ${
                            isSelected
                              ? 'border-[#FF3300] bg-[#FFF5F2]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={20} className={isSelected ? 'text-[#FF3300]' : 'text-gray-400'} />
                          <div>
                            <div className={`font-medium text-sm ${isSelected ? 'text-[#FF3300]' : 'text-gray-900'}`}>
                              {option.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Play size={16} className="text-purple-600" />
                      Do this (Actions)
                    </span>
                  </label>
                  <div className="space-y-4">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-500">Action {index + 1}</span>
                          {formData.actions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAction(index)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Action Type */}
                        <div className="relative mb-3">
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] appearance-none"
                          >
                            {ACTION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>

                        {/* Action Config Fields */}
                        {action.type === 'send_email' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={action.config.to || ''}
                              onChange={(e) => updateAction(index, 'to', e.target.value)}
                              placeholder="To (e.g., {{contact.email}} or email@example.com)"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                            <input
                              type="text"
                              value={action.config.subject || ''}
                              onChange={(e) => updateAction(index, 'subject', e.target.value)}
                              placeholder="Subject"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                            <textarea
                              value={action.config.body || ''}
                              onChange={(e) => updateAction(index, 'body', e.target.value)}
                              placeholder="Email body"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                          </div>
                        )}

                        {action.type === 'create_task' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={action.config.title || ''}
                              onChange={(e) => updateAction(index, 'title', e.target.value)}
                              placeholder="Task title"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                            <input
                              type="text"
                              value={action.config.assignee || ''}
                              onChange={(e) => updateAction(index, 'assignee', e.target.value)}
                              placeholder="Assignee"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                          </div>
                        )}

                        {action.type === 'update_status' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={action.config.field || ''}
                              onChange={(e) => updateAction(index, 'field', e.target.value)}
                              placeholder="Field to update"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                            <input
                              type="text"
                              value={action.config.value || ''}
                              onChange={(e) => updateAction(index, 'value', e.target.value)}
                              placeholder="New value"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                            />
                          </div>
                        )}

                        {action.type === 'notify' && (
                          <textarea
                            value={action.config.message || ''}
                            onChange={(e) => updateAction(index, 'message', e.target.value)}
                            placeholder="Notification message"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                          />
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addAction}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF3300] hover:text-[#FF3300] transition text-sm font-medium"
                    >
                      + Add Another Action
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium transition"
                  >
                    {editingAutomation ? 'Save Changes' : 'Create Automation'}
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
