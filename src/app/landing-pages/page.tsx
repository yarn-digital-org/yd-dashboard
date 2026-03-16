'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import {
  Plus, Globe, Eye, Trash2, Edit, Copy, ToggleLeft, ToggleRight,
  BarChart3, ExternalLink, X, Check, Loader2, TrendingUp, Smartphone, Monitor,
  Layout,
} from 'lucide-react';

/* ─── Built (hardcoded) landing pages ─── */
interface BuiltPage {
  name: string;
  path: string;
  source: string;
  description: string;
}

const BUILT_PAGES: BuiltPage[] = [
  { name: 'Free Audit', path: '/free-audit', source: 'landing-page-free-audit', description: 'BOFU — main lead capture page' },
  { name: 'Web Design Belfast', path: '/web-design-belfast', source: 'landing-page-web-design-belfast', description: 'Core Services — Google Ads' },
  { name: 'Website Not Working', path: '/website-not-working', source: 'landing-page-website-not-working', description: 'Problem/Solution — MOFU ads' },
  { name: 'Yarn Digital', path: '/yarn-digital', source: 'landing-page-yarn-digital', description: 'Brand — warm audience' },
  { name: 'Free Consultation', path: '/free-consultation', source: 'landing-page-free-consultation', description: 'Consultation booking' },
  { name: 'Free Review', path: '/free-review', source: 'landing-page-free-review', description: 'Website review offer' },
  { name: 'SEO Belfast', path: '/seo-belfast', source: 'landing-page-seo-belfast', description: 'SEO services — local' },
  { name: 'SEO Audit', path: '/seo-audit', source: 'landing-page-seo-audit', description: 'SEO audit offer' },
  { name: 'Get Quote', path: '/get-quote', source: 'landing-page-get-quote', description: 'Quote request' },
  { name: 'New Website', path: '/new-website', source: 'landing-page-new-website', description: 'New website enquiry' },
  { name: 'New Brand', path: '/new-brand', source: 'landing-page-new-brand', description: 'Branding enquiry' },
  { name: 'Shopify', path: '/shopify', source: 'landing-page-shopify', description: 'Shopify development' },
  { name: 'Website Not Converting', path: '/website-not-converting', source: 'landing-page-website-not-converting', description: 'Problem/Solution — alternate' },
];

interface PageStats {
  views?: number;
  leads?: number;
}

/* ─── Dynamic (Firestore) landing pages ─── */
interface LandingPageVariant {
  id: string;
  label: string;
  weight: number;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
}

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
  variants?: LandingPageVariant[];
  abTestEnabled?: boolean;
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
  variants: [{ id: 'control', label: 'Control', weight: 100 }],
  abTestEnabled: false,
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
  const [builtPageStats, setBuiltPageStats] = useState<Record<string, PageStats>>({});
  const [copiedBuiltPath, setCopiedBuiltPath] = useState<string | null>(null);
  const [analyticsPageId, setAnalyticsPageId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const fetchBuiltPageStats = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/landing-pages');
      if (res.ok) {
        const data = await res.json();
        if (data?.pages && Array.isArray(data.pages)) {
          const statsMap: Record<string, PageStats> = {};
          for (const p of data.pages) {
            statsMap[p.page] = { views: p.views_30d || 0, leads: p.leads || 0 };
          }
          setBuiltPageStats(statsMap);
        }
      }
    } catch { /* silent */ }
  }, []);

  const copyBuiltUrl = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedBuiltPath(path);
      setTimeout(() => setCopiedBuiltPath(null), 2000);
    });
  };

  const openAnalytics = async (pageId: string) => {
    setAnalyticsPageId(pageId);
    setAnalyticsData(null);
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/landing-pages/${pageId}/analytics`);
      const data = await res.json();
      setAnalyticsData(data.data);
    } catch { /* silent */ } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (user) {
      fetchPages();
      fetchBuiltPageStats();
    }
  }, [user, authLoading, router, fetchBuiltPageStats]);

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
            <p className="text-sm text-gray-500 mt-1">All active landing pages with lead capture forms</p>
          </div>
        </div>

        {/* ─── Built Landing Pages ─── */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF3300]/10 flex items-center justify-center text-[#FF3300]">
                <Layout size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Landing Pages</h2>
                <p className="text-xs text-gray-400">{BUILT_PAGES.length} live pages with lead capture</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Source Tag</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Views</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Leads</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {BUILT_PAGES.map((bp) => {
                  const pageKey = bp.path.replace(/^\//, '');
                  const stats = builtPageStats[pageKey] || builtPageStats[bp.path] || builtPageStats[bp.source] || {};
                  return (
                    <tr key={bp.path} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{bp.name}</td>
                      <td className="px-5 py-3">
                        <a
                          href={bp.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF3300] hover:underline font-mono text-xs"
                        >
                          {bp.path}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{bp.description}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{bp.source}</code>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600 hidden sm:table-cell">
                        {stats.views != null ? stats.views.toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600 hidden sm:table-cell">
                        {stats.leads != null ? stats.leads.toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Live
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={bp.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#FF3300] hover:bg-[#FF3300]/5 rounded-lg transition"
                            title="View page"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => copyBuiltUrl(bp.path)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="Copy URL"
                          >
                            {copiedBuiltPath === bp.path ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Page Builder (dynamic pages) ─── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Page Builder</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create and publish custom landing pages with dynamic forms</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF3300] text-white rounded-lg font-medium hover:bg-[#E62E00] transition text-sm"
          >
            <Plus size={18} />
            New Page
          </button>
        </div>

        {/* Dynamic pages list */}
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
                        onClick={() => openAnalytics(page.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="View analytics"
                      >
                        <TrendingUp size={16} />
                      </button>
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

                {/* A/B Testing */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">A/B Testing</p>
                      <p className="text-xs text-gray-400">Test different headlines and CTAs to optimise conversions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer"
                        checked={!!formData.abTestEnabled}
                        onChange={e => {
                          const enabled = e.target.checked;
                          const variants = enabled && (!formData.variants || formData.variants.length < 2)
                            ? [
                                { id: 'control', label: 'Control', weight: 50 },
                                { id: 'variant_a', label: 'Variant A', weight: 50 },
                              ]
                            : formData.variants || [{ id: 'control', label: 'Control', weight: 100 }];
                          setFormData({ ...formData, abTestEnabled: enabled, variants });
                        }}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF3300]" />
                    </label>
                  </div>

                  {formData.abTestEnabled && (
                    <div className="space-y-3">
                      {(formData.variants || []).map((v, vi) => (
                        <div key={v.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">{v.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Weight:</span>
                              <input type="number" min="1" max="100" value={v.weight}
                                onChange={e => {
                                  const variants = [...(formData.variants || [])];
                                  variants[vi] = { ...variants[vi], weight: Number(e.target.value) };
                                  setFormData({ ...formData, variants });
                                }}
                                className="w-14 px-2 py-1 border border-gray-200 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#FF3300]/30"
                              />
                              {vi > 0 && (
                                <button type="button" onClick={() => {
                                  const variants = (formData.variants || []).filter((_, i) => i !== vi);
                                  setFormData({ ...formData, variants });
                                }} className="text-gray-400 hover:text-red-500 transition text-xs">✕</button>
                              )}
                            </div>
                          </div>
                          <input type="text" placeholder={vi === 0 ? `Headline (default: ${formData.headline || 'main headline'})` : 'Headline override'}
                            value={v.headline || ''}
                            onChange={e => {
                              const variants = [...(formData.variants || [])];
                              variants[vi] = { ...variants[vi], headline: e.target.value };
                              setFormData({ ...formData, variants });
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#FF3300]/30 bg-white"
                          />
                          <input type="text" placeholder="CTA button text override"
                            value={v.ctaText || ''}
                            onChange={e => {
                              const variants = [...(formData.variants || [])];
                              variants[vi] = { ...variants[vi], ctaText: e.target.value };
                              setFormData({ ...formData, variants });
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#FF3300]/30 bg-white"
                          />
                        </div>
                      ))}
                      {(formData.variants || []).length < 4 && (
                        <button type="button"
                          onClick={() => {
                            const idx = (formData.variants || []).length;
                            const labels = ['Variant A', 'Variant B', 'Variant C'];
                            const ids = ['variant_a', 'variant_b', 'variant_c'];
                            setFormData({
                              ...formData,
                              variants: [...(formData.variants || []), { id: ids[idx - 1] || `variant_${idx}`, label: labels[idx - 1] || `Variant ${idx}`, weight: 50 }],
                            });
                          }}
                          className="w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#FF3300] hover:text-[#FF3300] text-xs transition font-medium"
                        >
                          + Add Variant
                        </button>
                      )}
                    </div>
                  )}
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

        {/* Analytics Modal */}
        {analyticsPageId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAnalyticsPageId(null)}>
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Page Analytics</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{pages.find(p => p.id === analyticsPageId)?.title || analyticsPageId}</p>
                </div>
                <button onClick={() => setAnalyticsPageId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {loadingAnalytics ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Views', value: analyticsData.summary?.totalViews ?? 0 },
                        { label: 'Total Leads', value: analyticsData.summary?.totalLeads ?? 0 },
                        { label: 'Conversion Rate', value: `${analyticsData.summary?.conversionRate ?? 0}%` },
                      ].map(stat => (
                        <div key={stat.label} className="bg-gray-50 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* A/B Variant Breakdown */}
                    {analyticsData.abTestEnabled && analyticsData.variants?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">A/B Test Results</h3>
                        <div className="space-y-2">
                          {analyticsData.variants.map((v: any, i: number) => {
                            const maxViews = Math.max(...analyticsData.variants.map((x: any) => x.views), 1);
                            const isWinner = analyticsData.variants.length > 1 && i === 0 &&
                              v.conversionRate >= Math.max(...analyticsData.variants.map((x: any) => x.conversionRate));
                            return (
                              <div key={v.variantId} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{v.label}</span>
                                    {isWinner && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Winner</span>}
                                  </div>
                                  <div className="flex gap-4 text-xs text-gray-500">
                                    <span><span className="font-semibold text-gray-800">{v.views}</span> views</span>
                                    <span><span className="font-semibold text-gray-800">{v.leads}</span> leads</span>
                                    <span className={`font-semibold ${v.conversionRate > 0 ? 'text-green-600' : 'text-gray-500'}`}>{v.conversionRate}%</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-[#FF3300] h-1.5 rounded-full transition-all" style={{ width: `${(v.views / maxViews) * 100}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top Sources */}
                    {analyticsData.topSources?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Traffic Sources</h3>
                        <div className="space-y-2">
                          {analyticsData.topSources.map((s: any) => {
                            const maxCount = analyticsData.topSources[0]?.count || 1;
                            return (
                              <div key={s.source} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-24 truncate">{s.source}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 w-8 text-right">{s.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Device split */}
                    {(analyticsData.devices?.mobile > 0 || analyticsData.devices?.desktop > 0) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Devices</h3>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600">📱 Mobile: <span className="font-semibold">{analyticsData.devices.mobile}</span></span>
                          <span className="text-gray-600">💻 Desktop: <span className="font-semibold">{analyticsData.devices.desktop}</span></span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">No analytics data yet for this page.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
