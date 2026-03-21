'use client';

import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';

declare global {
  interface Window { fbq?: (...args: unknown[]) => void; }
}

function trackLead() {
  if (typeof window !== 'undefined' && window.fbq) window.fbq('track', 'Lead');
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utmSource: p.get('utm_source') || '',
    utmMedium: p.get('utm_medium') || '',
    utmCampaign: p.get('utm_campaign') || '',
    utmContent: p.get('utm_content') || '',
  };
}

export default function ReviewForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const utm = getUtmParams();
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'landing-page-free-review', ...utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const inputClass =
    'w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] px-0 py-3 text-[15px] font-medium focus:outline-none focus:border-white transition-colors';

  if (status === 'success') {
    return (
      <div className="py-10 text-center">
        <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-5">
          <Check size={24} className="text-white" />
        </div>
        <h3 className="text-2xl font-medium text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
          We&apos;ve got your details.
        </h3>
        <p className="text-sm text-[#666] font-medium">
          Your free review will land in your inbox within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <input type="text" required placeholder="Your name" className={inputClass}
            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <input type="text" required placeholder="Business name" className={inputClass}
            value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <input type="email" required placeholder="Email address" className={inputClass}
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <input type="tel" placeholder="Phone (optional)" className={inputClass}
            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </div>
      {status === 'error' && <p className="text-red-400 text-sm font-medium">{errorMsg}</p>}
      <div className="pt-2">
        <button type="submit" disabled={status === 'submitting'}
          className="w-full sm:w-auto bg-[#e63312] text-white font-semibold text-[15px] px-10 py-4 rounded-full hover:bg-[#cc2b0e] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          style={{ letterSpacing: '-0.02em' }}>
          {status === 'submitting' ? (
            <><Loader2 size={16} className="animate-spin" /> Sending...</>
          ) : (
            <>Claim Your Free Review <ArrowRight size={15} /></>
          )}
        </button>
        <p className="text-xs text-[#444] mt-3 font-medium">
          No spam. No obligation.
        </p>
      </div>
    </form>
  );
}
