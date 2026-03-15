'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Plus, Globe, Eye, Trash2, Edit, Copy, ToggleLeft, ToggleRight,
  BarChart3, ExternalLink, X, Check, Loader2,
} from 'lucide-react';

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline?: string;
  ctaText?: string;
  formFields?: string[];
  heroImage?: string;
  template?: string;
  published?: boolean;
  views?: number;
  leads?: number;
  createdAt?: string;
}

const AVAILABLE_FIELDS = ['name', 'email', 'phone', 'company', 'website', 'message', 'budget', 'service'];
const FIELD_LABELS: Record<string, string> = {
  name: 'Full Name', email: 'Email', phone: 'Phone', company: 'Company',
  website: 'Website URL', message: 'Message', budget: 'Budget Range', service: 'What are you looking for?',
};

const DEFAULT_FORM: Omit<LandingPage, 'id'> = {
  slug: '',
  title: '',
  headline: '',
  subheadline: '',
  ctaText: 'Get Started',
  formFields: ['name', 'email', 'phone', 'company'],
  heroImage: '',
  template: 'standard',
  published: false,
};

export default function LandingPagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) fetchPages();
  }, [user, authLoading, router]);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/landing-pages');
      const data = await res.json();
      if (data.data) setPages(data.data);
    } catch { /* empty */ }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(DEFAULT_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (page: LandingPage) => {
    setEditing(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      headline: page.headline,
      subheadline: page.subheadline || '',
      ctaText: page.ctaText || 'Get Started',
      formFields: page.formFields || ['name', 'email', 'phone', 'company'],
      heroImage: page.heroImage || '',
      template: page.template || 'standard',
      published: page.published || false,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let res;
      if (editing) {
        res = await fetch(`/api/landing-pages/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch('/api/landing-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }

      setShowModal(false);
      fetchPages();
    } catch {
      setError('Failed to save landing page');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this landing page?')) return;
    await fetch(`/api/landing-pages/${id}`, { method: 'DELETE' });
    fetchPages();
  };

  const handleTogglePublish = async (page: LandingPage) => {
    await fetch(`/api/landing-pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !page.published }),
    });
    fetchPages();
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/lp/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const toggleField = (field: string) => {
    const current = formData.formFields || [];
    const updated = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    setFormData({ ...formData, formFields: updated });
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', marginLeft: '0', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
              Landing Pages
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create and publish landing pages with custom forms</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium hover:bg-[#E62E00] transition text-sm"
          >
            <Plus size={18} />
            New Page
          </button>
        </div>

        {/* Pages list */}
        {pages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Globe size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No landing pages yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first page to start capturing leads</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium text-sm hover:bg-[#E62E00]"
            >
              Create Landing Page
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {pages.map((page) => (
              <div key={page.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#FF3300]/10 flex items-center justify-center text-[#FF3300] flex-shrink-0">
                      <Globe size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{page.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {page.published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">/lp/{page.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />{page.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 size={14} />{page.leads || 0} leads
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {page.published && (
                        <a
                          href={`/lp/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                          title="View live page"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => copyUrl(page.slug)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                        title="Copy URL"
                      >
                        {copiedSlug === page.slug ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={() => handleTogglePublish(page)}
                        className="p-2 hover:bg-gray-50 rounded-lg transition"
                        title={page.published ? 'Unpublish' : 'Publish'}
                      >
                        {page.published
                          ? <ToggleRight size={18} className="text-green-500" />
                          : <ToggleLeft size={18} className="text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(page)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Headline preview */}
                <p className="mt-2 ml-13 text-sm text-gray-500 pl-[52px] truncate">{page.headline}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {editing ? 'Edit Landing Page' : 'Create Landing Page'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Title <span className="text-red-500">*</span></label>
                  <input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Free SEO Audit"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug <span className="text-red-500">*</span></label>
                  <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-[#FF3300]/20 focus-within:border-[#FF3300] overflow-hidden">
                    <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">/lp/</span>
                    <input
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      required
                      disabled={!!editing}
                      placeholder="seo-audit"
                      className="flex-1 px-3 py-2 text-sm outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  {editing && <p className="text-xs text-gray-400 mt-1">Slug cannot be changed after creation</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline <span className="text-red-500">*</span></label>
                  <input
                    value={formData.headline}
                    onChange={e => setFormData({ ...formData, headline: e.target.value })}
                    required
                    placeholder="Your Customers Are Searching. Are They Finding You?"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                  <textarea
                    value={formData.subheadline}
                    onChange={e => setFormData({ ...formData, subheadline: e.target.value })}
                    placeholder="Supporting text below the headline…"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                  <input
                    value={formData.ctaText}
                    onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Get Started"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Form Fields</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_FIELDS.map(field => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.formFields || []).includes(field)}
                          onChange={() => toggleField(field)}
                          className="rounded border-gray-300 text-[#FF3300] focus:ring-[#FF3300]"
                        />
                        <span className="text-sm text-gray-700">{FIELD_LABELS[field]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
                  <input
                    value={formData.heroImage}
                    onChange={e => setFormData({ ...formData, heroImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300] text-sm"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 bg-[#FF3300] hover:bg-[#E62E00] text-white rounded-lg font-medium text-sm transition flex items-center gap-2 disabled:opacity-50">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (editing ? 'Save Changes' : 'Create Page')}
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
