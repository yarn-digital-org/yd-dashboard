'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Palette, Save, RotateCcw } from 'lucide-react';

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontFamily: string;
  borderRadius: string;
  emailHeaderHtml: string;
  emailFooterHtml: string;
  portalWelcomeMessage: string;
}

const DEFAULT_SETTINGS: BrandingSettings = {
  primaryColor: '#FF3300',
  secondaryColor: '#111827',
  accentColor: '#FF6633',
  logoUrl: '',
  faviconUrl: '',
  fontFamily: 'Inter',
  borderRadius: 'medium',
  emailHeaderHtml: '',
  emailFooterHtml: '',
  portalWelcomeMessage: '',
};

const FONT_OPTIONS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Nunito'];
const RADIUS_OPTIONS = [
  { value: 'none', label: 'None (0px)' },
  { value: 'small', label: 'Small (4px)' },
  { value: 'medium', label: 'Medium (8px)' },
  { value: 'large', label: 'Large (12px)' },
];

export default function BrandingSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchSettings();
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/branding');
      const data = await res.json();
      if (data.data) setSettings(data.data);
    } catch {
      console.error('Failed to fetch branding settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const updateField = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Branding Settings</h2>
                <p className="text-sm text-gray-500">Customize your brand colors, fonts, and appearance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#FF3300' }}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Branding settings saved successfully!
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="p-6 space-y-8">
          {/* Brand Colors */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Brand Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { key: 'primaryColor' as const, label: 'Primary Color', desc: 'Main brand color used for buttons and links' },
                { key: 'secondaryColor' as const, label: 'Secondary Color', desc: 'Used for text and headings' },
                { key: 'accentColor' as const, label: 'Accent Color', desc: 'Used for highlights and hover states' },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <p className="text-xs text-gray-500 mb-3">{desc}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings[key]}
                      onChange={e => updateField(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      style={{ padding: 0 }}
                    />
                    <input
                      type="text"
                      value={settings[key]}
                      onChange={e => updateField(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#FF3300"
                    />
                  </div>
                  <div
                    className="mt-3 h-8 rounded-md"
                    style={{ backgroundColor: settings[key] }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Typography & Shape */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Typography & Shape</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={settings.fontFamily}
                  onChange={e => updateField('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: settings.fontFamily }}>
                  Preview: The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                <select
                  value={settings.borderRadius}
                  onChange={e => updateField('borderRadius', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {RADIUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="mt-3 flex gap-2">
                  {RADIUS_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      className="w-12 h-12 border-2 border-gray-300"
                      style={{
                        backgroundColor: settings.borderRadius === opt.value ? settings.primaryColor : '#F3F4F6',
                        borderColor: settings.borderRadius === opt.value ? settings.primaryColor : '#D1D5DB',
                        borderRadius: opt.value === 'none' ? 0 : opt.value === 'small' ? 4 : opt.value === 'medium' ? 8 : 12,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo URLs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Logo & Favicon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={e => updateField('logoUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://example.com/logo.png"
                />
                {settings.logoUrl && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <img src={settings.logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                <input
                  type="text"
                  value={settings.faviconUrl}
                  onChange={e => updateField('faviconUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Email Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Header HTML</label>
                <textarea
                  value={settings.emailHeaderHtml}
                  onChange={e => updateField('emailHeaderHtml', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="<div style='text-align: center;'><img src='logo.png' height='40' /></div>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Footer HTML</label>
                <textarea
                  value={settings.emailFooterHtml}
                  onChange={e => updateField('emailFooterHtml', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="<p style='text-align: center; color: #999;'>© 2026 Your Business</p>"
                />
              </div>
            </div>
          </div>

          {/* Portal Welcome */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Client Portal</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portal Welcome Message</label>
              <textarea
                value={settings.portalWelcomeMessage}
                onChange={e => updateField('portalWelcomeMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Welcome to your client portal! Here you can view your projects, invoices, and contracts."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
