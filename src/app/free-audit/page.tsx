'use client';

import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, Loader2, Check, ArrowDown } from 'lucide-react';
import Image from 'next/image';

// ============================================
// Meta Pixel + UTM
// ============================================
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

// Self-hosted images
const IMG = {
  logoDark: '/images/yd/logo-dark.png',   // Black text — for light backgrounds
  logoWhite: '/images/yd/logo-white.png',  // White text — for dark backgrounds
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  founder: '/images/yd/gt2H9pZhxxqOiw8FCUVWqnG0DTQ.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  stonebridge: '/images/yd/1A7y3aX1XOiC43HofQw8EHV8Ck.png',
  reactClarity: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
};

// ============================================
// Main Page
// ============================================
export default function FreeAuditPage() {
  const [formData, setFormData] = useState({
    name: '', company: '', website: '', email: '', phone: '',
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
      trackLead();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const inputClass = 'w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-[15px] font-medium focus:outline-none focus:border-[#555] transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-[#555] mb-1.5 uppercase';

  return (
    <>
      <MetaPixelScript />

      <main className="min-h-screen bg-[#f5f5f5] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>

        {/* ─── Nav ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between px-5 sm:px-10 py-5 sm:py-6">
            <a href="https://www.yarndigital.co.uk" className="flex items-center">
              <Image src={IMG.logoWhite} alt="YARN Digital" width={130} height={30} className="h-6 sm:h-7 w-auto" priority />
            </a>
            <button
              onClick={scrollToForm}
              className="bg-white/10 backdrop-blur-md text-white text-sm font-medium px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-all"
              style={{ letterSpacing: '-0.02em' }}
            >
              Get Audit
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO — Headline left, Form right (ABOVE THE FOLD)
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <Image src={IMG.heroBg} alt="" fill className="object-cover opacity-20" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]/70" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 pt-24 sm:pt-28 pb-12 sm:pb-16 min-h-screen flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 w-full">

              {/* LEFT — Headline + trust signals */}
              <div className="flex flex-col justify-center">
                <p className="text-[11px] sm:text-xs font-semibold text-[#888] uppercase mb-5" style={{ letterSpacing: '0.1em' }}>
                  Free Website Audit — No Strings Attached
                </p>
                <h1
                  className="text-[2.5rem] sm:text-5xl lg:text-[3.75rem] font-semibold text-white leading-[1.05] mb-5"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Your website<br />
                  should be winning<br />
                  you customers.
                </h1>
                <p
                  className="text-base sm:text-lg text-[#777] leading-relaxed mb-8 max-w-md"
                  style={{ letterSpacing: '-0.02em', fontWeight: 500 }}
                >
                  We&apos;ll audit your site and tell you exactly what&apos;s holding it back — performance, SEO, design, and conversion. Free. No pitch.
                </p>

                {/* Trust signals */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs text-[#555] ml-1 font-medium">5.0</span>
                  </div>
                  <span className="text-xs text-[#444] font-medium">|</span>
                  <span className="text-xs text-[#555] font-medium">Belfast-based studio</span>
                  <span className="text-xs text-[#444] font-medium">|</span>
                  <span className="text-xs text-[#555] font-medium">48-hour turnaround</span>
                </div>

                {/* Client names */}
                <div className="hidden sm:flex items-center gap-4 pt-6 border-t border-[#1a1a1a]">
                  <span className="text-[10px] font-semibold text-[#444] uppercase" style={{ letterSpacing: '0.08em' }}>
                    Trusted by
                  </span>
                  {['Stonebridge Farm', 'Krumb Bakery', 'The Hills', 'React Clarity'].map((name) => (
                    <span key={name} className="text-xs text-[#444] font-medium" style={{ letterSpacing: '-0.01em' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT — Form (ABOVE THE FOLD) */}
              <div className="flex items-center">
                <div className="w-full bg-[#111] rounded-[24px] p-6 sm:p-8 border border-[#1a1a1a]">
                  {status === 'success' ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
                        <Check size={24} className="text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
                        We&apos;ve got your details.
                      </h3>
                      <p className="text-sm text-[#666] font-medium" style={{ letterSpacing: '-0.02em' }}>
                        We&apos;ll be in touch within 1 business day<br />with your free audit.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="mb-2">
                        <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
                          Get your free audit
                        </h2>
                        <p className="text-xs text-[#555] mt-0.5" style={{ letterSpacing: '-0.01em' }}>
                          Takes 30 seconds. We&apos;ll do the rest.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Name *</label>
                          <input type="text" required placeholder="Name" className={inputClass}
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business *</label>
                          <input type="text" required placeholder="Business Name" className={inputClass}
                            value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Website URL *</label>
                        <input type="text" required placeholder="yourwebsite.co.uk" className={inputClass}
                          value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                          <input type="email" required placeholder="Email Address" className={inputClass}
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                          <input type="tel" required placeholder="Phone Number" className={inputClass}
                            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>

                      {status === 'error' && (
                        <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                      )}

                      <button
                        type="submit" disabled={status === 'submitting'}
                        className="w-full bg-white text-[#0a0a0a] font-semibold text-[15px] py-3.5 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {status === 'submitting' ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                          <>Send Me My Free Audit <ArrowRight size={15} /></>
                        )}
                      </button>

                      <p className="text-center text-[11px] text-[#444] font-medium">
                        No sales pitch. No strings. Just honest insight.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:block animate-bounce">
            <ArrowDown size={16} className="text-[#333]" />
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHAT YOU GET
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  What You Get
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[3.25rem] font-semibold text-[#0a0a0a] leading-[1.1] mb-10"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  A clear, honest audit of your online presence — in 48 hours.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Performance & Speed', desc: 'Page load times, Core Web Vitals, and mobile performance scores.' },
                    { title: 'Mobile Experience', desc: 'How your site looks and works on the phones your customers actually use.' },
                    { title: 'SEO Health Check', desc: 'Search visibility, keyword gaps, and technical issues holding you back.' },
                    { title: 'Conversion Review', desc: 'Are visitors becoming customers? We\'ll find where they\'re dropping off.' },
                    { title: 'Competitor Snapshot', desc: 'How you stack up against others in your market.' },
                    { title: 'Action Plan', desc: 'Prioritised recommendations you can act on immediately.' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-[24px] p-6 border border-[#e5e5e5]">
                      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center mb-4">
                        <Check size={14} className="text-white" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.03em' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CASE STUDIES — Dark
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Our Work
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-[1.15] mb-2" style={{ letterSpacing: '-0.04em' }}>
                  Real work for real businesses.
                </h2>
                <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Featured projects ©2022–25
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Stonebridge Farm', desc: 'Brand identity grounded in provenance and place.', tags: 'Branding × Strategy', image: IMG.stonebridge },
                { title: 'React Clarity', desc: 'A clinical-grade brand for a health-tech startup.', tags: 'Brand × Development', image: IMG.reactClarity },
                { title: 'Krumb Bakery', desc: 'Handcrafted branding for Belfast\'s best sourdough.', tags: 'Brand × E-Commerce', image: IMG.krumb },
              ].map((cs, i) => (
                <div key={i} className="bg-[#111] rounded-[24px] overflow-hidden group border border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image src={cs.image} alt={cs.title} width={600} height={450}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5" style={{ letterSpacing: '-0.03em' }}>
                      {cs.title}
                    </h3>
                    <p className="text-sm text-[#666] leading-relaxed mb-3" style={{ letterSpacing: '-0.01em' }}>
                      {cs.desc}
                    </p>
                    <span className="text-[11px] font-medium text-[#444]" style={{ letterSpacing: '0.02em' }}>
                      {cs.tags}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            THE HILLS — Featured Case Study
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 overflow-hidden">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                  Case Study
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] leading-[1.15] mb-4" style={{ letterSpacing: '-0.04em' }}>
                  The Hills Restaurant
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-8" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  A quality restaurant with a website that made it look average. We redesigned everything —
                  brand, photography direction, and a fully responsive site built to convert.
                </p>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { stat: '+38%', label: 'Organic traffic' },
                    { stat: '2×', label: 'Reservations' },
                    { stat: '−50%', label: 'Bounce rate' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
                        {s.stat}
                      </div>
                      <div className="text-xs text-[#999] mt-1" style={{ letterSpacing: '-0.01em' }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Image src={IMG.hillsMockup} alt="The Hills Restaurant — responsive website mockup"
                  width={700} height={467} className="w-full h-auto rounded-[24px] shadow-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SERVICES
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  What We Do
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-[1.15] mb-2" style={{ letterSpacing: '-0.04em' }}>
                  Design, Build, Grow.
                </h2>
                <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Full-service digital — from brand strategy to measurable growth.
                </p>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]">
              {[
                { title: 'Brand Strategy & Identity', desc: 'Research-driven brand positioning that makes you impossible to ignore.' },
                { title: 'Web Design & Development', desc: 'Shopify, WordPress, or custom — fast, responsive, built to convert.' },
                { title: 'UX / UI Design', desc: 'Interfaces that feel intuitive and look exceptional.' },
                { title: 'SEO & Content', desc: 'Get found by the right people. Sustainable organic growth.' },
                { title: 'Digital Marketing', desc: 'Paid media and campaigns that actually move the needle.' },
              ].map((s, i) => (
                <div key={i} className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-20 py-6 border-b border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="text-base sm:text-lg font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
                    {s.title}
                  </div>
                  <div className="lg:col-span-2 text-sm text-[#555] font-medium leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ABOUT + FOUNDER
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                  About Us
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Belfast-based. Built around your business.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Yarn Digital is a full-service studio led by Jonny Davison. We work with
                  ambitious SMEs across Belfast and Northern Ireland — brands, websites, and
                  digital growth, built properly.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We&apos;re not a faceless agency. We know your market, we speak your language,
                  and we&apos;ll tell you the truth about what&apos;s working and what isn&apos;t.
                </p>
              </div>

              <div className="flex flex-col items-center lg:items-start gap-6">
                <div className="relative w-44 h-44 rounded-[24px] overflow-hidden">
                  <Image src={IMG.founder} alt="Jonny Davison — Founder" fill className="object-cover" />
                </div>
                <blockquote className="text-center lg:text-left">
                  <p className="text-lg text-[#333] font-medium italic leading-relaxed mb-2" style={{ letterSpacing: '-0.02em' }}>
                    &ldquo;We build what we&apos;d want for our own business — fast, beautiful, and built to last.&rdquo;
                  </p>
                  <cite className="text-sm text-[#999] not-italic font-semibold">
                    Jonny Davison, Founder
                  </cite>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM CTA
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]">
            <Image src={IMG.heroBg} alt="" fill className="object-cover" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-semibold text-white leading-[1.1] mb-4" style={{ letterSpacing: '-0.04em' }}>
              Ready to find out what&apos;s<br />holding your website back?
            </h2>
            <p className="text-base text-[#666] mb-8" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Scroll back up and fill in the form — it takes 30 seconds.
              Or get in touch directly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-white/10 text-white font-semibold text-sm px-8 py-3.5 rounded-full border border-white/20 backdrop-blur-md hover:bg-gray-100 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get My Free Audit <ArrowRight size={15} />
              </button>
              <a
                href="mailto:hello@yarndigital.co.uk"
                className="border border-[#333] text-[#888] font-medium text-sm px-8 py-3.5 rounded-full backdrop-blur-md hover:border-[#555] hover:text-white transition-colors"
                style={{ letterSpacing: '-0.02em' }}
              >
                hello@yarndigital.co.uk
              </a>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-[#f5f5f5] border-t border-[#e5e5e5] py-6">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Image src={IMG.logoDark} alt="YARN Digital" width={90} height={20} className="opacity-60" />
              <span className="text-[11px] font-medium text-[#999]">
                © {new Date().getFullYear()} Belfast, Northern Ireland
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#bbb]" style={{ letterSpacing: '-0.02em' }}>
              Design, Build, Grow
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}

// ============================================
// Meta Pixel Script
// ============================================
function MetaPixelScript() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (id) setPixelId(id);
  }, []);
  if (!pixelId) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
// Build: 20260315063128
