'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, Check, AlertCircle, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';

interface PortalConfig {
  enabled: boolean;
  subdomain: string;
  customDomain: string;
  welcomeMessage: string;
  footerText: string;
  primaryColor: string;
  backgroundColor: string;
  logoUrl: string;
  showProjects: boolean;
  showInvoices: boolean;
  showContracts: boolean;
  showFiles: boolean;
  showMessages: boolean;
  showWorkflowProgress: boolean;
  hidePoweredBy: boolean;
}

const defaultConfig: PortalConfig = {
  enabled: false,
  subdomain: '',
  customDomain: '',
  welcomeMessage: 'Welcome to your client portal. Here you can view your projects, invoices, and more.',
  footerText: '',
  primaryColor: '#2563eb',
  backgroundColor: '#ffffff',
  logoUrl: '',
  showProjects: true,
  showInvoices: true,
  showContracts: true,
  showFiles: true,
  showMessages: true,
  showWorkflowProgress: true,
  hidePoweredBy: false,
};

export default function PortalSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<PortalConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadConfig();
  }, [user]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/portal/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setConfig({ ...defaultConfig, ...data.data });
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/portal/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Portal settings saved' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const portalUrl = config.customDomain
    ? `https://${config.customDomain}`
    : config.subdomain
    ? `https://${config.subdomain}.yd-portal.com`
    : null;

  const update = (key: keyof PortalConfig, value: unknown) => setConfig((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Client Portal</h2>
              <p className="text-sm text-gray-500">Configure your branded client portal</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {message.text}
            </div>
          )}

          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Portal Status</h3>
              <p className="text-xs text-gray-500">Allow clients to access their portal</p>
            </div>
            <button
              onClick={() => update('enabled', !config.enabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Portal URL */}
          {portalUrl && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 mb-6">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-blue-700 font-medium">{portalUrl}</span>
              <button onClick={() => navigator.clipboard.writeText(portalUrl)} className="ml-auto text-blue-500 hover:text-blue-700">
                <Copy className="h-4 w-4" />
              </button>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Domain Settings */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-900">Domain</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <div className="flex">
                  <input type="text" value={config.subdomain} onChange={(e) => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your-business" />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">.yd-portal.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain <span className="text-xs text-gray-400">(Pro+)</span></label>
                <input type="text" value={config.customDomain} onChange={(e) => update('customDomain', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="portal.yourdomain.com" />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-900">Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" value={config.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={config.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={config.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-900">Content</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <textarea value={config.welcomeMessage} onChange={(e) => update('welcomeMessage', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input type="text" value={config.footerText} onChange={(e) => update('footerText', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="© 2026 Your Business" />
            </div>
          </div>

          {/* Visible Sections */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-semibold text-gray-900">Visible Sections</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'showProjects' as const, label: 'Projects' },
                { key: 'showInvoices' as const, label: 'Invoices' },
                { key: 'showContracts' as const, label: 'Contracts' },
                { key: 'showFiles' as const, label: 'Files' },
                { key: 'showMessages' as const, label: 'Messages' },
                { key: 'showWorkflowProgress' as const, label: 'Workflow Progress' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" checked={config[key]} onChange={(e) => update(key, e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={config.hidePoweredBy} onChange={(e) => update('hidePoweredBy', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Hide &quot;Powered by YD&quot; badge <span className="text-xs text-gray-400">(Business plan)</span></span>
            </label>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
