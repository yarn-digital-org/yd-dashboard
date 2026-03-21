'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';
import { trackLead } from '@/components/MetaPixel';

import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { ForceLightTheme } from '@/components/ForceLightTheme';
import PageViewTracker from '@/components/PageViewTracker';


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

const IMG = {
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  founder: '/images/yd/gt2H9pZhxxqOiw8FCUVWqnG0DTQ.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  reactClarity: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
};

export default function SEODerryPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-seo-derry', ...utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead({ email: formData.email, name: formData.name, phone: formData.phone || undefined });
      trackGoogleAdsConversion();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const scrollToForm = () => {
    document.getElementById('audit-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const inputClass = 'w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] px-0 py-3 text-[15px] font-medium focus:outline-none focus:border-white transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-[#666] mb-1 uppercase';

  return (
    <>
      <ForceLightTheme />
      <PageViewTracker page="seo-derry" />

      <main className="min-h-screen bg-[#0a0a0a] font-sans antialiased landing-page" style={{ letterSpacing: '-0.02em' }}>

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
              className="bg-[#ffffff]/10 backdrop-blur-md text-white text-sm font-medium px-6 py-2.5 rounded-full border border-white/20 hover:bg-[#ffffff]/20 transition-all"
              style={{ letterSpacing: '-0.02em' }}
            >
              Get a Free SEO Review
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-20 pt-32">
            <div className="max-w-2xl">
              <h1
                className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6"
                style={{ letterSpacing: '-0.03em' }}
              >
                SEO in Derry That Gets You Found By Local Customers.
              </h1>
              <p
                className="text-base sm:text-lg text-white/60 leading-relaxed mb-6 max-w-lg"
                style={{ letterSpacing: '-0.01em', fontWeight: 400 }}
              >
                More visibility. More enquiries. No technical jargon.
              </p>
              <button
                onClick={scrollToForm}
                className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get My Free SEO Review <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            INTRO
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-36 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <p
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-medium text-[#0a0a0a] leading-[1.25] max-w-4xl"
              style={{ letterSpacing: '-0.03em' }}
            >
              If your business is in Derry or Londonderry and you&apos;re not showing up on the first page of Google,
              you&apos;re losing customers to competitors who are. We help Derry businesses rank for the searches that
              matter — local terms, buying-intent queries, the phrases your customers actually type. No guesswork.
              Just the work that moves the needle.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SERVICES
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Our Services
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-[3.25rem] font-medium text-[#0a0a0a] leading-[1.1] mb-12"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Everything you need to rank higher on Google — from one NI studio.
                </h2>
                <div className="border-t border-[#e5e5e5]">
                  {[
                    {
                      title: 'Local SEO Strategy',
                      desc: 'Data-driven SEO strategy built around the Derry and Londonderry market — your competitors, your customers, your search terms. Not a template lifted from a generic playbook.',
                    },
                    {
                      title: 'Technical SEO Audit',
                      desc: "We dig into your site structure, page speed, crawlability, and Core Web Vitals. Fix the technical issues that are quietly tanking your Google rankings.",
                    },
                    {
                      title: 'On-Page Optimisation',
                      desc: 'Every page title, heading, meta tag, and internal link — optimised for the keywords your Derry customers are actually searching.',
                    },
                    {
                      title: 'Content Strategy',
                      desc: "We identify the content gaps your competitors haven't filled and build a content plan that earns you rankings in Derry and beyond.",
                    },
                    {
                      title: 'Link Building',
                      desc: 'High-quality backlinks from relevant NI and UK sources. The kind that actually move rankings, not the kind that get you penalised.',
                    },
                    {
                      title: 'Monthly Reporting',
                      desc: "Clear, jargon-free reporting every month. Rankings, traffic, leads — all in one place. You'll always know what's working.",
                    },
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
            WHY DERRY NEEDS LOCAL SEO
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Local Market
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-8"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Derry searches are growing. Is your business showing up?
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Derry and Londonderry&apos;s business community has expanded significantly — retail on Shipquay Street,
                  hospitality around the Walled City, tradespeople and professional services across the wider council area.
                  The customers are searching Google every day.
                </p>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  But most Derry businesses don&apos;t have local SEO set up properly. No Google Business Profile optimisation.
                  No local citations. No content targeting Derry-specific searches. That&apos;s your opportunity.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We work with Derry SMEs to close the gap — quickly, without the jargon, and with monthly reporting so
                  you always know where you stand.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  How It Works
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Three steps to ranking higher in Derry.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                {
                  num: '01',
                  title: 'Free SEO Review',
                  desc: "We review your site, your current Google rankings, and your three nearest Derry competitors. You'll get a clear picture of where you're losing visibility.",
                },
                {
                  num: '02',
                  title: 'We build your SEO plan',
                  desc: 'Keyword strategy, technical fixes, content plan, and Google Business Profile optimisation — a full roadmap built for the Derry market.',
                },
                {
                  num: '03',
                  title: 'You rank. You grow.',
                  desc: 'Measurable ranking improvements, more organic traffic, more enquiries. We report on it monthly and adjust the strategy as you grow.',
                },
              ].map((step, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>
                    {step.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CASE STUDIES
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
                { title: 'Krumb Bakery', desc: "Handcrafted branding for Belfast's best sourdough.", tags: 'Brand × E-Commerce', image: IMG.krumb },
              ].map((cs, i) => (
                <div key={i} className="bg-[#111] rounded-[24px] overflow-hidden group border border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image src={cs.image} alt={cs.title} width={600} height={450}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5" style={{ letterSpacing: '-0.03em' }}>{cs.title}</h3>
                    <p className="text-sm text-[#666] leading-relaxed mb-3" style={{ letterSpacing: '-0.01em' }}>{cs.desc}</p>
                    <span className="text-[11px] font-medium text-[#444]" style={{ letterSpacing: '0.02em' }}>{cs.tags}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            AUDIT FORM
            ═══════════════════════════════════════════ */}
        <section id="audit-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>
                  Free SEO Review
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  See where you&apos;re losing visibility.
                </h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Free 30-minute SEO review — we&apos;ll show you exactly where you stand<br />
                  and what to fix first.
                </p>
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
                  <span>Belfast-based · Serving all of Northern Ireland</span>
                  <span>Audit delivered within 48 hours</span>
                  <span>No sales pitch. Ever.</span>
                </div>
              </div>

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
                      We&apos;ll be in touch within 1 business day with your free SEO review.
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
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone (optional)</label>
                        <input type="tel" placeholder="Phone number" className={inputClass}
                          value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>
                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                    )}
                    <div className="pt-4">
                      <button type="submit" disabled={status === 'submitting'}
                        className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-10 py-4 rounded-full hover:bg-[#ffffff]/90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                        style={{ letterSpacing: '-0.02em' }}>
                        {status === 'submitting' ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending...</>
                        ) : (
                          <>Get My Free SEO Review <ArrowRight size={15} /></>
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
            FAQ
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Common Questions
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1] mb-12" style={{ letterSpacing: '-0.04em' }}>
                  Everything you need to know.
                </h2>
                <div className="border-t border-[#e5e5e5]">
                  {[
                    {
                      q: 'Do you work with businesses in Derry/Londonderry or only Belfast?',
                      a: "We work with businesses across all of Northern Ireland. Derry/Londonderry is one of our key markets — local SEO for Derry businesses is a core part of what we do.",
                    },
                    {
                      q: 'How long does it take to see SEO results in Derry?',
                      a: "Typical timeline is 3–6 months for meaningful ranking improvements. Some quick wins (technical fixes, Google Business Profile) can show results faster. We're honest about timelines — no one can guarantee page 1 in 30 days.",
                    },
                    {
                      q: 'What makes your SEO different from other agencies?',
                      a: "We're a small, focused team — no account managers passing work down a chain. You deal directly with the people doing the work. Our approach is built on data, not guesswork, and every recommendation is backed by what's actually happening in your market.",
                    },
                    {
                      q: 'Do I need to be a big business to afford SEO?',
                      a: 'No. We work with SMEs — restaurants, tradespeople, retailers, professional services. Our SEO engagements are sized for businesses at different growth stages.',
                    },
                  ].map((faq, i) => (
                    <details key={i} className="group border-b border-[#e5e5e5]">
                      <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
                        <span className="text-[15px] font-semibold text-[#0a0a0a] pr-4" style={{ letterSpacing: '-0.02em' }}>
                          {faq.q}
                        </span>
                        <span className="text-[#999] text-xl flex-shrink-0 transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <div className="pb-5 pr-8">
                        <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            ABOUT + FOUNDER
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                  About Us
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Belfast-based. Serving all of Northern Ireland.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Yarn Digital is a full-service studio led by Jonny Davison. We work with
                  ambitious SMEs across Northern Ireland — from Belfast to Derry, Newry to Antrim. SEO, content strategy,
                  and digital growth, built properly.
                </p>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We&apos;re not a faceless agency that outsources your work to a junior in another city. We know the NI
                  market, we speak your language, and we&apos;ll tell you the truth about what&apos;s working and what isn&apos;t.
                </p>
                <p className="text-sm text-[#999] font-medium">
                  Also need a new website?{' '}
                  <a href="/web-design-derry" className="text-[#0a0a0a] underline underline-offset-2 hover:text-[#e63312] transition-colors">
                    See our web design services in Derry →
                  </a>
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
                  <cite className="text-sm text-[#999] not-italic font-semibold">Jonny Davison, Founder</cite>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM CTA
            ═══════════════════════════════════════════ */}
        <section className="relative py-28 sm:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={IMG.heroBg} alt="" fill className="object-cover grayscale" style={{ opacity: 0.3 }} />
          </div>
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-[1.1] mb-5" style={{ letterSpacing: '-0.04em' }}>
              Ready to find out what&apos;s stopping you<br />ranking on Google in Derry?
            </h2>
            <p className="text-base text-white/50 mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Free SEO review — we&apos;ll tell you exactly where you stand and what to fix first.
            </p>
            <p className="text-xs text-white/30 mb-10 font-medium">
              5.0 ★ · Audit delivered within 48 hours · No sales pitch. Ever.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={scrollToForm}
                className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get My Free SEO Review <ArrowRight size={15} />
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
        <footer className="bg-[#ffffff] border-t border-[#e5e5e5] py-6">
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
