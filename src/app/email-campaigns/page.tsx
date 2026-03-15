'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  BarChart2,
  Loader2,
  X,
  Eye,
} from 'lucide-react';

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  recipientList: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: CampaignStats;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  sending: { label: 'Sending…', color: 'bg-yellow-100 text-yellow-700' },
  sent: { label: 'Sent', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', color: 'bg-orange-100 text-orange-700' },
};

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'All Contacts' },
  { value: 'leads', label: 'Leads Only' },
  { value: 'get-quote', label: 'Get Quote leads' },
  { value: 'free-review', label: 'Free Review leads' },
  { value: 'free-consultation', label: 'Free Consultation leads' },
];

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0A0A0A;padding:24px 32px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">YARN<span style="color:#FF3300;">.</span> Digital</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:16px;color:#0A0A0A;margin:0 0 16px;">Hi {{firstName}},</p>
          <p style="font-size:16px;color:#4A4A4A;line-height:1.6;margin:0 0 24px;">Your email body goes here. Edit this template to write your campaign message.</p>
          <a href="#" style="display:inline-block;background:#FF3300;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">Call to Action</a>
        </td></tr>
        <tr><td style="background:#F5F5F5;padding:20px 32px;border-top:1px solid #E5E5E5;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">© 2026 Yarn Digital · Belfast, Northern Ireland</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export default function EmailCampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [emailLists, setEmailLists] = useState<{ id: string; name: string; memberCount: number; type: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    previewText: '',
    htmlBody: DEFAULT_TEMPLATE,
    recipientList: 'all',
    scheduledAt: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchCampaigns();
      fetch('/api/email-lists').then(r => r.json()).then(d => setEmailLists(d.data || [])).catch(() => {});
    }
  }, [user, authLoading, router]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/email-campaigns');
      const data = await res.json();
      if (data.data) setCampaigns(data.data);
    } catch (e) {
      console.error('Failed to fetch campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', subject: '', previewText: '', htmlBody: DEFAULT_TEMPLATE, recipientList: 'all', scheduledAt: '' });
    setShowModal(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      subject: c.subject,
      previewText: c.previewText || '',
      htmlBody: c.htmlBody,
      recipientList: c.recipientList,
      scheduledAt: c.scheduledAt || '',
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch(`/api/email-campaigns/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/email-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchCampaigns();
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    await fetch(`/api/email-campaigns/${id}`, { method: 'DELETE' });
    fetchCampaigns();
    setActiveMenu(null);
  };

  const handleSend = async (id: string, name: string) => {
    if (!confirm(`Send "${name}" to all recipients now?`)) return;
    setSendingId(id);
    setActiveMenu(null);
    try {
      const res = await fetch(`/api/email-campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Send failed');
        return;
      }
      alert(`Sent to ${data.sent} recipients${data.failed ? ` (${data.failed} failed)` : ''}`);
      fetchCampaigns();
    } catch {
      alert('Failed to send campaign');
    } finally {
      setSendingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
              <p className="text-sm text-gray-500 mt-1">Create and send email campaigns to your contacts</p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium hover:bg-[#E62E00] transition"
            >
              <Plus size={18} />
              New Campaign
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Campaigns', value: stats.total, icon: Mail },
              { label: 'Sent', value: stats.sent, icon: CheckCircle },
              { label: 'Drafts', value: stats.draft, icon: Edit },
              { label: 'Emails Sent', value: stats.totalSent.toLocaleString(), icon: Send },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF3300]/10 flex items-center justify-center">
                    <Icon size={18} className="text-[#FF3300]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Campaign list */}
          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Mail size={40} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first email campaign to get started.</p>
              <button onClick={openNew} className="px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium hover:bg-[#E62E00]">
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => {
                const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
                return (
                  <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#FF3300]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Mail size={18} className="text-[#FF3300]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">{campaign.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-0.5">{campaign.subject}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {RECIPIENT_OPTIONS.find(r => r.value === campaign.recipientList)?.label || campaign.recipientList}
                            </span>
                            {campaign.sentAt && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Sent {new Date(campaign.sentAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats (sent only) */}
                      {campaign.status === 'sent' && (
                        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{campaign.stats?.sent || 0}</p>
                            <p>Sent</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{campaign.stats?.opened || 0}</p>
                            <p>Opened</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{campaign.stats?.clicked || 0}</p>
                            <p>Clicked</p>
                          </div>
                        </div>
                      )}

                      {/* Actions menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === campaign.id ? null : campaign.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <MoreVertical size={18} className="text-gray-400" />
                        </button>
                        {activeMenu === campaign.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => handleSend(campaign.id, campaign.name)}
                                disabled={sendingId === campaign.id}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full disabled:opacity-50"
                              >
                                {sendingId === campaign.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Send Now
                              </button>
                            )}
                            <button
                              onClick={() => setPreviewHtml(campaign.htmlBody)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                            >
                              <Eye size={14} />
                              Preview
                            </button>
                            <button
                              onClick={() => openEdit(campaign)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            {campaign.status === 'sent' && (
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                              >
                                <BarChart2 size={14} />
                                Stats
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(campaign.id)}
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
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                  <input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. March Newsletter"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                  <select
                    value={formData.recipientList}
                    onChange={e => setFormData({ ...formData, recipientList: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  >
                    <optgroup label="Default segments">
                      {RECIPIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                    {emailLists.length > 0 && (
                      <optgroup label="Email Lists">
                        {emailLists.map(l => (
                          <option key={l.id} value={`list:${l.id}`}>
                            {l.name} ({l.memberCount} members · {l.type})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line *</label>
                <input
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Your email subject"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview Text</label>
                <input
                  value={formData.previewText}
                  onChange={e => setFormData({ ...formData, previewText: e.target.value })}
                  placeholder="Short preview shown in inbox (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">HTML Body *</label>
                  <span className="text-xs text-gray-400">Use {`{{firstName}}`}, {`{{name}}`}, {`{{email}}`} for personalisation</span>
                </div>
                <textarea
                  value={formData.htmlBody}
                  onChange={e => setFormData({ ...formData, htmlBody: e.target.value })}
                  required
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm">
                  {editingId ? 'Save Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Email Preview</h3>
              <button onClick={() => setPreviewHtml(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe
                srcDoc={previewHtml}
                className="w-full border-0 rounded"
                style={{ height: '600px' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
