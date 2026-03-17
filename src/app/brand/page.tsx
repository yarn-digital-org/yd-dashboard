'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';
import { ForceLightTheme } from '@/components/ForceLightTheme';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Star, CheckCircle, ArrowRight, Loader2, Palette, Eye, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function trackLead() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead');
  }
}

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmContent: params.get('utm_content') || '',
  };
}

function LeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    website: '',
    email: '',
    phone: '',
    message: '',
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
        body: JSON.stringify({
          ...formData,
          source: 'landing-page-brand',
          ...utm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead(); trackGoogleAdsConversion();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-extrabold text-[#0a0a0a] mb-2">
          We&apos;ve got your details.
        </h3>
        <p className="text-gray-600 text-lg">
          We&apos;ll be in touch within 1 business day with your free brand review.
          <br />Belfast-based and easy to talk to.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0a0a0a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff3300] focus:border-transparent text-base';
  const labelClasses = 'block text-sm font-semibold text-[#0a0a0a] mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClasses}>Your Name *</label>
          <input id="name" type="text" required placeholder="Jonny Davison" className={inputClasses}
            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="company" className={labelClasses}>Business Name *</label>
          <input id="company" type="text" required placeholder="Your Business Ltd" className={inputClasses}
            value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
        </div>
      </div>

      <div>
        <label htmlFor="website" className={labelClasses}>Website URL</label>
        <input id="website" type="text" placeholder="yourwebsite.co.uk" className={inputClasses}
          value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={labelClasses}>Email *</label>
          <input id="email" type="email" required placeholder="you@business.co.uk" className={inputClasses}
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>Phone (optional)</label>
          <input id="phone" type="tel" placeholder="028 9000 0000" className={inputClasses}
            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClasses}>Tell us about your brand (optional)</label>
        <textarea id="message" rows={3} placeholder="What's not working with your current brand?" className={inputClasses + ' resize-none'}
          value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
      </div>

      {status === 'error' && <p className="text-red-600 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === 'submitting'}
        className="w-full bg-[#ff3300] hover:bg-[#e62e00] text-white font-extrabold text-lg py-4 px-8 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {status === 'submitting' ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Sending...</>
        ) : (
          <>Get My Free Brand Review<ArrowRight className="w-5 h-5" /></>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        No sales pitch. No strings. Just an honest look at your brand.
      </p>
    </form>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-3 text-[#ff3300]">{icon}</div>
      <h3 className="text-xl font-extrabold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function CaseStudy({ name, situation, work, result }: { name: string; situation: string; work: string; result: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-extrabold text-[#0a0a0a] mb-3">{name}</h3>
      <div className="space-y-2 text-gray-600 leading-relaxed">
        <p><span className="font-semibold text-[#0a0a0a]">The situation:</span> {situation}</p>
        <p><span className="font-semibold text-[#0a0a0a]">What we did:</span> {work}</p>
        <p><span className="font-semibold text-[#ff3300]">The result:</span> {result}</p>
      </div>
    </div>
  );
}

export default function BrandLandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <ForceLightTheme />
      <main className="min-h-screen landing-page">
        {/* HERO */}
        <section className="bg-[#0a0a0a] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your Brand Should Work
              <br />
              as Hard as <span className="text-[#ff3300]">You Do.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              If your brand doesn&apos;t match the quality of your business, you&apos;re losing customers
              before they even walk through the door. We&apos;ll show you exactly where — for free.
            </p>
            <button onClick={scrollToForm}
              className="bg-[#ff3300] hover:bg-[#e62e00] text-white font-extrabold text-lg py-4 px-10 rounded-lg transition-colors inline-flex items-center gap-2">
              Get My Free Brand Review<ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-gray-500 text-sm mt-4">
              No sales pitch. No strings. Just an honest look at your brand.
            </p>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="bg-[#111] text-white py-6">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              &ldquo;They completely transformed how our business looks online.&rdquo;
              <span className="text-gray-500"> — The Hills Restaurant, Belfast</span>
            </p>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-6">
              Your Business Deserves Better Than a DIY Logo.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              You&apos;ve built something worth being proud of. But your brand tells a different story.
              The logo was a quick fix. The colours don&apos;t match across your website, your van, and your
              social media. Customers can&apos;t tell you apart from the competition.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              A strong brand isn&apos;t a luxury — it&apos;s how people decide whether to trust you
              in the first three seconds.
            </p>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-10 text-center">
              A Brand That Looks the Part — Everywhere.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ServiceCard
                icon={<Palette className="w-8 h-8" />}
                title="Brand Strategy"
                description="We dig into who you are, who your customers are, and what makes you different. Then we build a brand around it."
              />
              <ServiceCard
                icon={<Eye className="w-8 h-8" />}
                title="Visual Identity"
                description="Logo, colour palette, typography, photography style — everything your brand needs to look consistent and professional."
              />
              <ServiceCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Brand Guidelines"
                description="A clear system so your brand stays consistent across your website, social media, signage, and print — without needing us every time."
              />
            </div>
          </div>
        </section>

        {/* PROOF */}
        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-10 text-center">
              Brands We&apos;ve Built.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CaseStudy
                name="Krumb Bakery"
                situation="Belfast's best sourdough — with branding that didn't match the product."
                work="New brand identity. Warm tones, handcrafted typography, a logo that feels like the bakery does."
                result="A brand they're proud to put on everything — packaging, signage, social media."
              />
              <CaseStudy
                name="Stonebridge Farm"
                situation="Local farm with a strong community story but no visual identity to tell it."
                work="Brand strategy and identity grounded in provenance and place."
                result="A brand that reflects exactly what Stonebridge is — honest, local, trusted."
              />
              <CaseStudy
                name="The Hills Restaurant"
                situation="A quality restaurant that looked average online."
                work="Full brand audit, new visual identity, photography direction."
                result="A brand that matches the dining experience. Online reservations doubled."
              />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-6">
              Belfast-Based. Brand-Obsessed.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Yarn Digital is a full-service studio led by Jonny Davison. We work with
              ambitious SMEs across Belfast and Northern Ireland who know their brand
              should be doing more for them.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We&apos;re not a faceless agency. We know your market, we speak your language,
              and we&apos;ll tell you the truth about what&apos;s working and what isn&apos;t.
            </p>
          </div>
        </section>

        {/* FORM CTA */}
        <section className="bg-white py-16 sm:py-20" ref={formRef}>
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-4">
                Not Sure If Your Brand Is Working?
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Get a free brand review. We&apos;ll look at your visual identity, your consistency
                across platforms, and tell you what we&apos;d fix first — no obligation.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
              <LeadForm />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#0a0a0a] text-gray-500 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center text-sm">
            <p className="font-semibold text-gray-400 mb-1">
              Yarn Digital LTD &middot; Belfast, Northern Ireland
            </p>
            <p>Design. Build. Grow.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

