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

export default function SEOLisburnPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-seo-lisburn', ...utm }),
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
      <PageViewTracker page="seo-lisburn" />

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
              <span className="text-[10px] text-white/40 font-medium mt-0.5" style={{ letterSpacing: '0.02em' }}>Design, Build, Grow</span>
            </a>
            <button onClick={scrollToForm} className="bg-[#ffffff]/10 backdrop-blur-md text-white text-sm font-medium px-6 py-2.5 rounded-full border border-white/20 hover:bg-[#ffffff]/20 transition-all" style={{ letterSpacing: '-0.02em' }}>
              Get a Free SEO Audit
            </button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <Image src={IMG.heroBg} alt="" fill sizes="100vw" className="object-cover object-center grayscale" style={{ opacity: 0.55 }} priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-20 pt-32">
            <div className="max-w-2xl">
              <p className="text-xs text-white/40 font-medium mb-6" style={{ letterSpacing: '-0.01em' }}>
                Trusted by 50+ businesses across Northern Ireland&nbsp;·&nbsp;5.0 ★ on Google&nbsp;·&nbsp;Belfast-based, no outsourcing
              </p>
              <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6" style={{ letterSpacing: '-0.03em' }}>
                Local SEO Lisburn — Rank Higher, Get More Customers.
              </h1>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-lg" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                We help Lisburn businesses get found on Google by local customers who are already searching for what you offer. Free SEO audit, delivered in 48 hours.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Get Your Free SEO Audit <ArrowRight size={15} />
                </button>
                <a href="/seo-belfast" className="border border-white/20 text-white/50 font-medium text-[15px] px-6 py-3.5 rounded-full hover:border-white/40 hover:text-white/70 transition-all" style={{ letterSpacing: '-0.02em' }}>
                  See Our SEO Services →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTRO ─── */}
        <section className="py-24 sm:py-36 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <p className="text-2xl sm:text-3xl lg:text-[2.5rem] font-medium text-[#0a0a0a] leading-[1.25] max-w-4xl" style={{ letterSpacing: '-0.03em' }}>
              Lisburn is one of Northern Ireland&apos;s busiest business corridors — with strong retail, trades, and professional services. But being a good business isn&apos;t enough if customers can&apos;t find you online. Most buying decisions now start with a Google search, and if you&apos;re not on the first page for searches in Lisburn and the surrounding area, you&apos;re losing customers to competitors who are.
            </p>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section className="py-24 sm:py-32 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>Our Services</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-medium text-[#0a0a0a] leading-[1.1] mb-12" style={{ letterSpacing: '-0.04em' }}>
                  Everything you need to rank higher in Lisburn.
                </h2>
                <div className="border-t border-[#e5e5e5]">
                  {[
                    { title: 'Local SEO Strategy', desc: 'Keyword research built around Lisburn search terms and buyer intent — not generic templates.' },
                    { title: 'Technical SEO Audit', desc: 'We find and fix the technical issues stopping Google from properly ranking your site.' },
                    { title: 'On-Page Optimisation', desc: 'Every page optimised for the terms your Lisburn customers are actually searching.' },
                    { title: 'Google Business Profile', desc: 'Optimised for Lisburn map pack results — the most visible position in local search.' },
                    { title: 'Monthly Reporting', desc: "Clear monthly reports showing rankings, traffic, and leads. No vanity metrics." },
                  ].map((item, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-10 py-5 border-b border-[#e5e5e5] hover:border-[#999] transition-colors">
                      <div className="text-[15px] font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.02em' }}>{item.title}</div>
                      <div className="sm:col-span-2 text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHY LISBURN NEEDS LOCAL SEO ─── */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>Local Market</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-8" style={{ letterSpacing: '-0.04em' }}>
                  Lisburn searches are growing. Is your business showing up?
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We&apos;re a Belfast-based team working with businesses across NI. We build local SEO strategies that target the specific searches your Lisburn customers use — and we do it with one goal: more leads, not more jargon.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Most Lisburn businesses don&apos;t have local SEO set up properly. No Google Business Profile optimisation. No local citations. No content targeting Lisburn-specific searches. That&apos;s your opportunity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-24 sm:py-32 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>How It Works</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>Three steps to ranking higher in Lisburn.</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                { num: '01', title: 'Free SEO Audit', desc: "We review your site, your current Google rankings, and your nearest Lisburn competitors. You'll get a clear picture of where you're losing visibility." },
                { num: '02', title: 'We build your SEO plan', desc: 'Keyword strategy, technical fixes, content plan, and Google Business Profile optimisation — a full roadmap built for the Lisburn market.' },
                { num: '03', title: 'You rank. You grow.', desc: 'Measurable ranking improvements, more organic traffic, more enquiries. We report on it monthly and adjust the strategy as you grow.' },
              ].map((step, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>{step.num}</span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>{step.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── AUDIT FORM ─── */}
        <section id="audit-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>Free SEO Audit</span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>Find out what&apos;s stopping your Lisburn business from ranking.</h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Free SEO audit. We&apos;ll review your site, identify the issues, and prioritise the fixes with the biggest impact. Delivered within 48 hours.
                </p>
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
                    <h3 className="text-2xl font-medium text-white mb-2" style={{ letterSpacing: '-0.03em' }}>We&apos;ve got your details.</h3>
                    <p className="text-sm text-[#666] font-medium">We&apos;ll be in touch within 1 business day with your free SEO audit.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Name *</label>
                        <input type="text" required placeholder="Your name" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business *</label>
                        <input type="text" required placeholder="Business name" className={inputClass} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Website URL *</label>
                      <input type="text" required placeholder="yourwebsite.co.uk" className={inputClass} value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input type="email" required placeholder="you@company.co.uk" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone (optional)</label>
                        <input type="tel" placeholder="Phone number" className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                    </div>
                    {status === 'error' && <p className="text-red-400 text-sm font-medium">{errorMsg}</p>}
                    <div className="pt-4">
                      <button type="submit" disabled={status === 'submitting'} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-10 py-4 rounded-full hover:bg-[#ffffff]/90 transition-all disabled:opacity-50 inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                        {status === 'submitting' ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Book My Free Audit <ArrowRight size={15} /></>}
                      </button>
                      <p className="text-xs text-[#444] mt-3 font-medium">Takes 30 seconds · No sales pitch. Ever.</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-24 sm:py-32 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>Common Questions</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1] mb-12" style={{ letterSpacing: '-0.04em' }}>Everything you need to know.</h2>
                <div className="border-t border-[#e5e5e5]">
                  {[
                    { q: 'Do you work with businesses in Lisburn or only Belfast?', a: 'We work with businesses across all of Northern Ireland. Lisburn is one of our key markets — local SEO for Lisburn businesses is a core part of what we do.' },
                    { q: 'How long does it take to see SEO results in Lisburn?', a: "Typical timeline is 3–6 months for meaningful ranking improvements. Some quick wins (technical fixes, Google Business Profile) can show results faster. We're honest about timelines — no one can guarantee page 1 in 30 days." },
                    { q: 'How long does SEO take to work?', a: 'Most businesses see meaningful movement in 3–6 months, with stronger results from month 6 onwards. SEO compounds over time. If anyone promises page one rankings in a few weeks, walk away.' },
                    { q: "Why isn't my website ranking on Google?", a: 'Usually one of three reasons: technical issues blocking Google, content not targeting the right terms, or not enough quality sites linking to you. Often all three. Our free audit tells you which and what to fix first.' },
                    { q: "What's the difference between local SEO and regular SEO?", a: 'Local SEO targets searches with location intent — "SEO Lisburn", "accountant near me." For most Lisburn SMEs, this is where the highest-value customers come from. We build local SEO as the foundation before expanding to broader terms.' },
                  ].map((faq, i) => (
                    <details key={i} className="group border-b border-[#e5e5e5]">
                      <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
                        <span className="text-[15px] font-semibold text-[#0a0a0a] pr-4" style={{ letterSpacing: '-0.02em' }}>{faq.q}</span>
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

        {/* ─── BOTTOM CTA ─── */}
        <section className="relative py-28 sm:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={IMG.heroBg} alt="" fill className="object-cover grayscale" style={{ opacity: 0.3 }} />
          </div>
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-[1.1] mb-5" style={{ letterSpacing: '-0.04em' }}>
              Ready to find out what&apos;s stopping<br />your Lisburn business from ranking?
            </h2>
            <p className="text-base text-white/50 mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Free SEO audit — we&apos;ll review your site, identify the issues, and prioritise the fixes with the biggest impact.
            </p>
            <p className="text-xs text-white/30 mb-10 font-medium">Takes 30 seconds · Delivered within 48 hours · No sales pitch. Ever.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                Book My Free Audit <ArrowRight size={15} />
              </button>
              <a href="mailto:hello@yarndigital.co.uk" className="border border-white/20 text-white/60 font-medium text-[15px] px-8 py-3.5 rounded-full hover:border-white/40 hover:text-white transition-all" style={{ letterSpacing: '-0.02em' }}>
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
              <span className="text-[11px] font-medium text-[#999]">© {new Date().getFullYear()} Belfast, Northern Ireland</span>
            </div>
            <span className="text-[11px] font-semibold text-[#bbb]" style={{ letterSpacing: '-0.02em' }}>Design, Build, Grow</span>
          </div>
        </footer>
      </main>
    </>
  );
}
