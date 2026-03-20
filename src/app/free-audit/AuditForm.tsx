'use client';
import { trackGoogleAdsConversion } from "@/components/GoogleAnalytics";
import { trackLead } from "@/components/MetaPixel";

import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';

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

export default function AuditForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', website: '', challenge: '',
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
        body: JSON.stringify({ ...formData, source: 'landing-page-free-audit', ...utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      // Fire pixel + CAPI with hashed PII for deduplication
      trackLead({ email: formData.email, name: formData.name, phone: formData.phone || undefined });
      trackGoogleAdsConversion();
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
        <h3
          className="text-2xl font-medium text-white mb-2"
          style={{ letterSpacing: '-0.03em' }}
        >
          We&apos;ve got your details.
        </h3>
        <p className="text-sm text-[#666] font-medium">
          Your free audit will land in your inbox within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <input
            type="text"
            required
            placeholder="Your name"
            className={inputClass}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <input
            type="text"
            required
            placeholder="Business name"
            className={inputClass}
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>
      </div>

      <div>
        <input
          type="url"
          required
          placeholder="Your website URL"
          className={inputClass}
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <input
            type="email"
            required
            placeholder="Email address"
            className={inputClass}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            className={inputClass}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <select
          className={`${inputClass} appearance-none cursor-pointer`}
          value={formData.challenge}
          onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
        >
          <option value="" disabled className="text-[#555] bg-[#111]">What&apos;s your biggest challenge?</option>
          <option value="Website not converting" className="bg-[#111]">Website not converting</option>
          <option value="Not ranking on Google" className="bg-[#111]">Not ranking on Google</option>
          <option value="Need a new website" className="bg-[#111]">Need a new website</option>
          <option value="Running ads but no leads" className="bg-[#111]">Running ads but no leads</option>
          <option value="Other" className="bg-[#111]">Other</option>
        </select>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full sm:w-auto bg-[#e63312] text-white font-semibold text-[15px] px-10 py-4 rounded-full hover:bg-[#cc2b0e] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
          style={{ letterSpacing: '-0.02em' }}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              Book My Free Audit <ArrowRight size={15} />
            </>
          )}
        </button>
        <p className="text-xs text-[#444] mt-3 font-medium">
          We audit a limited number of sites each week. No spam. No obligation.
        </p>
      </div>
    </form>
  );
}
