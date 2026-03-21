'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';
import { trackLead } from '@/components/MetaPixel';

import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, Loader2, Check, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import PageViewTracker from '@/components/PageViewTracker';
import { ForceLightTheme } from '@/components/ForceLightTheme';


// ============================================
// Meta Pixel + UTM
// ============================================
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
  logoDark: '/images/yd/logo-dark.png',
  logoWhite: '/images/yd/logo-white.png',
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  founder: '/images/yd/gt2H9pZhxxqOiw8FCUVWqnG0DTQ.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  reactClarity: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
};

// ============================================
// Main Page
// ============================================
export default function ShopifyPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-shopify', ...utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead({ email: formData.email, name: formData.name, phone: formData.phone || undefined }); trackGoogleAdsConversion();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const scrollToForm = () => {
    document.getElementById('shopify-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const inputClass = 'w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] px-0 py-3 text-[15px] font-medium focus:outline-none focus:border-white transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-[#666] mb-1 uppercase';

  return (
    <>

      <ForceLightTheme />
      <main className="min-h-screen bg-[#0a0a0a] font-sans antialiased landing-page" style={{ letterSpacing: '-0.02em' }}>
        <PageViewTracker page="shopify" />

        {/* ─── Nav ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between px-5 sm:px-10 py-5 sm:py-6">
            <a href="https://www.yarndigital.co.uk" className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight">YARN</span>
                <span className="text-[22px] sm:text-[26px] font-bold text-[#e63312]">.</span>
                <span className="text-[13px] sm:text-[15px] font-normal text-white/80 ml-1" style={{ letterSpacing: '-0.01em' }}>Digital</span>
              </div>
              <span className="text-[10px] text-white/40 font-medium mt-0.5" style={{ letterSpacing: '0.02em' }}>
                Design, Build, Grow
              </span>
            </a>
            <button
              onClick={scrollToForm}
              className="bg-white/10 backdrop-blur-md text-white text-sm font-medium px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-all"
              style={{ letterSpacing: '-0.02em' }}
            >
              Free Shopify Consult
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO — Full-bleed B&W image (matches yarndigital.co.uk)
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden">
          {/* Background — full-bleed B&W image */}
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={IMG.heroBg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center grayscale"
              style={{ opacity: 0.55 }}
              priority
            />
          </div>
          {/* Gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-20 pt-32">
            {/* Content pinned to bottom-left like main site */}
            <div className="max-w-2xl">
              <h1
                className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6"
                style={{ letterSpacing: '-0.03em' }}
              >
                Shopify Web Design Belfast<br />
                — Built to Sell From Day One.
              </h1>
              <p
                className="text-base sm:text-lg text-white/60 leading-relaxed mb-6 max-w-lg"
                style={{ letterSpacing: '-0.01em', fontWeight: 400 }}
              >
                Belfast&apos;s Shopify specialists. Fast, beautiful stores — designed to convert browsers into buyers, built to scale with your business.
              </p>

              {/* CTA — white pill like "Start a Project" on main site */}
              <button
                onClick={scrollToForm}
                className="bg-white text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-white/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Free Shopify Consult
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ABOUT — Scrolling text section (matches yarndigital.co.uk style)
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-36 bg-white">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <p
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-medium text-[#0a0a0a] leading-[1.25] max-w-4xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              We help ambitious teams build brands, interfaces, and websites that earn attention. We&apos;ll audit your site and tell you exactly what&apos;s holding it back — for free.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            AUDIT FORM — Clean, editorial (id for scroll)
            ═══════════════════════════════════════════ */}
        <section id="audit-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">

              {/* Left — heading + trust */}
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>
                  Free Shopify Consultation
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Get your free Shopify consultation
                </h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Takes 30 seconds. We&apos;ll do the rest.<br />
                  Your audit is delivered within 48 hours.
                </p>

                {/* Trust signals — monochrome */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs text-[#666] ml-1 font-medium">5.0</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs text-[#444] font-medium">
                  <span>Belfast-based studio</span>
                  <span>48-hour turnaround</span>
                  <span>No sales pitch. Ever.</span>
                </div>
              </div>

              {/* Right — form (underline inputs, editorial feel) */}
              <div className="lg:col-span-2">
                {status === 'success' ? (
                  <div className="py-16 text-center lg:text-left">
                    <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mx-auto lg:mx-0 mb-5">
                      <Check size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-medium text-white mb-2" style={{ letterSpacing: '-0.03em' }}>
                      We&apos;ve got your details.
                    </h3>
                    <p className="text-sm text-[#666] font-medium" style={{ letterSpacing: '-0.02em' }}>
                      We&apos;ll be in touch within 1 business day about your Shopify project.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Name *</label>
                        <input type="text" required placeholder="Your name" className={inputClass}
                          value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business *</label>
                        <input type="text" required placeholder="Business name" className={inputClass}
                          value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Website URL *</label>
                      <input type="text" required placeholder="yourwebsite.co.uk" className={inputClass}
                        value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input type="email" required placeholder="you@company.co.uk" className={inputClass}
                          value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                        <input type="tel" placeholder="Phone (optional) number" className={inputClass}
                          value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>

                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit" disabled={status === 'submitting'}
                        className="bg-white text-[#0a0a0a] font-medium text-[15px] px-10 py-4 rounded-full hover:bg-white/90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {status === 'submitting' ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                          <>Send Me My Free Audit <ArrowRight size={15} /></>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHAT YOU GET — 1/3 + 2/3 grid (matches YD layout)
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  What You Get
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[3.25rem] font-medium text-[#0a0a0a] leading-[1.1] mb-12"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  A clear, honest audit of your online presence — in 48 hours.
                </h2>
                {/* List-style like YD services section */}
                <div className="border-t border-[#e5e5e5]">
                  {[
                    { title: 'Performance & Speed', desc: 'Page load times, Core Web Vitals, and mobile performance scores.' },
                    { title: 'Mobile Experience', desc: 'How your site looks and works on the phones your customers actually use.' },
                    { title: 'SEO Health Check', desc: 'Search visibility, keyword gaps, and technical issues holding you back.' },
                    { title: 'Conversion Review', desc: 'Are visitors becoming customers? We\'ll find where they\'re dropping off.' },
                    { title: 'Competitor Snapshot', desc: 'How you stack up against others in your market.' },
                    { title: 'Action Plan', desc: 'Prioritised recommendations you can act on immediately.' },
                  ].map((item, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-10 py-5 border-b border-[#e5e5e5] hover:border-[#999] transition-colors">
                      <div className="text-[15px] font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.02em' }}>
                        {item.title}
                      </div>
                      <div className="sm:col-span-2 text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CASE STUDIES — Dark section
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Work
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15] mb-2" style={{ letterSpacing: '-0.04em' }}>
                  Case Studies
                </h2>
                <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Featured work between ©2022–25
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'The Hills Restaurant', desc: 'Full rebrand and responsive site built to convert. More traffic, more bookings.', tags: 'Brand × Web Design', image: IMG.hillsMockup },
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
        <section className="py-24 sm:py-32 bg-white overflow-hidden">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                  Case Study
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.15] mb-4" style={{ letterSpacing: '-0.04em' }}>
                  The Hills Restaurant
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-8" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  A quality restaurant with a website that made it look average. We redesigned everything —
                  brand, photography direction, and a fully responsive site built to convert.
                </p>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {[
                    { stat: '↑', label: 'More traffic' },
                    { stat: '↑', label: 'More bookings' },
                    { stat: '−50%', label: 'Bounce rate' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl sm:text-3xl font-medium text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
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
            SERVICES — Border-separated list (matches YD exactly)
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
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15] mb-2" style={{ letterSpacing: '-0.04em' }}>
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
                  <div className="text-base sm:text-lg font-medium text-white" style={{ letterSpacing: '-0.03em' }}>
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
        <section className="py-24 sm:py-32 bg-white">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                  About Us
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
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
            BOTTOM CTA — B&W image bg (same editorial feel)
            ═══════════════════════════════════════════ */}
        <section className="relative py-28 sm:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={IMG.heroBg} alt="" fill className="object-cover grayscale" style={{ opacity: 0.3 }} />
          </div>
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-[1.1] mb-5" style={{ letterSpacing: '-0.04em' }}>
              Ready to find out what&apos;s<br />holding your website back?
            </h2>
            <p className="text-base text-white/50 mb-10" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              It takes 30 seconds. We&apos;ll deliver your audit within 48 hours.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={scrollToForm}
                className="bg-white text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-white/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get Free Shopify Consultation <ArrowRight size={15} />
              </button>
              <a
                href="mailto:hello@yarndigital.co.uk"
                className="border border-white/20 text-white/60 font-medium text-[15px] px-8 py-3.5 rounded-full hover:border-white/40 hover:text-white transition-all"
                style={{ letterSpacing: '-0.02em' }}
              >
                hello@yarndigital.co.uk
              </a>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-white border-t border-[#e5e5e5] py-6">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-0.5 opacity-60">
                <span className="text-[16px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
                <span className="text-[16px] font-bold text-[#e63312]">.</span>
                <span className="text-[10px] font-normal text-[#0a0a0a]/80 ml-0.5">Digital</span>
              </div>
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
