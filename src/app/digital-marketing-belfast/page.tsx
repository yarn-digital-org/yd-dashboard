// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/p1-pages
// Copy source: Scout brief (Slack #all-hands, 2026-03-21 18:04 UTC)
// Awaiting Jonny's greenlight before merging to master.

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
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  reactClarity: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
};

export default function DigitalMarketingBelfastPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-digital-marketing-belfast', ...utm }),
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
      <PageViewTracker page="digital-marketing-belfast" />

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
              Get a Free Audit
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
            <div className="max-w-3xl">
              {/* Trust bar */}
              <p className="text-xs text-white/40 font-medium mb-6" style={{ letterSpacing: '-0.01em' }}>
                Trusted by 50+ Belfast businesses&nbsp;·&nbsp;5.0 ★ on Google&nbsp;·&nbsp;Belfast-based, no outsourcing
              </p>

              <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6" style={{ letterSpacing: '-0.03em' }}>
                Digital Marketing Belfast<br />That Actually Grows<br />Your Business.
              </h1>

              {/* Mobile-only CTA */}
              <div className="lg:hidden mb-6">
                <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Get a Free Audit <ArrowRight size={15} />
                </button>
              </div>

              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-xl" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                SEO, paid search, content, and social — built around your goals, run by a Belfast team that knows the local market.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Get a Free Audit <ArrowRight size={15} />
                </button>
                <a href="#case-studies" className="text-sm text-white/50 font-medium border border-white/20 px-6 py-3.5 rounded-full hover:border-white/40 hover:text-white/70 transition-all" style={{ letterSpacing: '-0.02em' }}>
                  See Our Work →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section className="py-20 sm:py-28 bg-[#0a0a0a] border-b border-[#1a1a1a]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>Services</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Every channel, one team.
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-[#1a1a1a]">
              {[
                { title: 'SEO Belfast', desc: 'Get found on Google by the customers searching for what you do, in the area you serve.', link: '/seo-belfast' },
                { title: 'Google Ads', desc: 'Paid search that complements your organic strategy. More visibility, more qualified clicks.' },
                { title: 'Content Marketing', desc: 'Targeted content that drives traffic and builds domain authority over time.' },
                { title: 'Social Media', desc: 'Platform strategy and content that builds your audience where your customers spend time.' },
                { title: 'Email Marketing', desc: 'Campaigns and automations that turn subscribers into repeat customers.' },
                { title: 'Web Design Belfast', desc: 'Every campaign needs a page that converts. We build both.', link: '/web-design-belfast' },
              ].map((s, i) => (
                <div key={i} className={`py-8 md:px-8 ${i % 3 === 0 ? 'md:pl-0' : ''} ${i < 3 ? 'border-b lg:border-b-0' : ''} ${[0,1,3,4].includes(i) ? 'md:border-r border-[#1a1a1a]' : ''}`}>
                  {s.link ? (
                    <a href={s.link} className="block group">
                      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-white/80" style={{ letterSpacing: '-0.02em' }}>{s.title}</h3>
                      <p className="text-sm text-[#555] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{s.desc}</p>
                    </a>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>{s.title}</h3>
                      <p className="text-sm text-[#555] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{s.desc}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY IT WORKS TOGETHER ─── */}
        <section className="py-20 sm:py-28 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>Why It Works Together</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Joined-up digital marketing compounds over time.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mt-4 max-w-xl" style={{ letterSpacing: '-0.01em' }}>
                  Most agencies do one thing. We run your SEO, ads, content, and social from one team — so every channel reinforces the others. The result is compounding growth instead of isolated results.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                { num: '01', title: 'Audit & Strategy', desc: 'We start with your data. Where are you now, who are your customers, and what\'s the fastest route to more of them.' },
                { num: '02', title: 'Build & Launch', desc: 'SEO foundations, ad campaigns, content calendar, and social — built in parallel, launched together.' },
                { num: '03', title: 'Grow & Optimise', desc: 'Monthly reporting, continuous testing, and improvements based on what\'s actually working — not guesswork.' },
              ].map((s, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>{s.num}</span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>{s.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CASE STUDIES ─── */}
        <section id="case-studies" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>Case Studies</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15]" style={{ letterSpacing: '-0.04em' }}>Results we&apos;ve delivered for Belfast businesses.</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'The Hills Restaurant', desc: 'Full rebrand and responsive site built to convert. More traffic, more bookings.', tags: 'Brand × Web Design', image: IMG.hillsMockup, stat: '+38% organic traffic in 6 weeks' },
                { title: 'React Clarity', desc: 'A clinical-grade brand for a health-tech startup.', tags: 'Brand × Development', image: IMG.reactClarity, stat: 'Full brand + marketing site' },
                { title: 'Krumb Bakery', desc: 'Handcrafted branding for Belfast\'s best sourdough.', tags: 'Brand × E-Commerce', image: IMG.krumb, stat: 'Brand + Shopify store' },
              ].map((cs, i) => (
                <div key={i} className="bg-[#111] rounded-[24px] overflow-hidden group border border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image src={cs.image} alt={cs.title} width={600} height={450} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-[15px] font-semibold text-white mb-1.5" style={{ letterSpacing: '-0.03em' }}>{cs.title}</h3>
                    <p className="text-sm text-[#666] leading-relaxed mb-2" style={{ letterSpacing: '-0.01em' }}>{cs.desc}</p>
                    <p className="text-xs text-[#e63312] font-medium">{cs.stat}</p>
                    <span className="text-[11px] font-medium text-[#444] mt-2 block" style={{ letterSpacing: '0.02em' }}>{cs.tags}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="bg-[#0a0a0a] py-20 sm:py-24">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>What Clients Say</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15]" style={{ letterSpacing: '-0.04em' }}>Don&apos;t take our word for it.</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { quote: 'Yarn Digital redesigned everything. Within a month we had more traffic and more bookings than we\'d seen all year.', name: 'The Hills Restaurant', tag: 'Brand & Web Design' },
                { quote: 'Straightforward, fast, and they delivered exactly what they promised. Our team uses the platform every day.', name: 'React Clarity', tag: 'Web Application' },
              ].map((t, i) => (
                <div key={i} className="p-6 sm:p-8 rounded-[24px] border border-[#1a1a1a] bg-[#111]">
                  <span className="text-4xl text-[#333] leading-none block mb-4">&ldquo;</span>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-6" style={{ letterSpacing: '-0.02em' }}>{t.quote}</p>
                  <div>
                    <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>{t.name}</p>
                    <p className="text-xs text-[#666] mt-0.5">{t.tag}</p>
                  </div>
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
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>Free Digital Marketing Audit</span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>Get your free audit</h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Tell us about your business. We&apos;ll map out exactly where your digital marketing is leaking leads — and what to fix first.
                </p>
                <div className="flex flex-col gap-2 text-xs text-[#444] font-medium">
                  <span>Belfast-based · No outsourcing · Fast turnaround</span>
                  <span>Free 30-minute audit + written summary</span>
                  <span>No obligation. No hidden fees.</span>
                </div>
              </div>
              <div className="lg:col-span-2">
                {status === 'success' ? (
                  <div className="py-16 text-center lg:text-left">
                    <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mx-auto lg:mx-0 mb-5">
                      <Check size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-medium text-white mb-2" style={{ letterSpacing: '-0.03em' }}>We&apos;ve got your details.</h3>
                    <p className="text-sm text-[#666] font-medium">We&apos;ll be in touch shortly to arrange your free consultation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Name *</label>
                        <input type="text" required placeholder="Your name" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input type="email" required placeholder="you@company.co.uk" className={inputClass} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                        <input type="tel" required placeholder="Your phone number" className={inputClass} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business Name *</label>
                        <input type="text" required placeholder="Your business name" className={inputClass} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                      </div>
                    </div>
                    {status === 'error' && <p className="text-red-400 text-sm font-medium">{errorMsg}</p>}
                    <div className="pt-4">
                      <button type="submit" disabled={status === 'submitting'} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-10 py-4 rounded-full hover:bg-[#ffffff]/90 transition-all disabled:opacity-50 inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                        {status === 'submitting' ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Get My Free Marketing Audit <ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </form>
                )}
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
              Ready to grow your business<br />with digital marketing that works?
            </h2>
            <p className="text-base text-white/50 mb-10" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Free digital marketing audit. 48-hour turnaround. No pitch.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                Get My Free Audit <ArrowRight size={15} />
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
