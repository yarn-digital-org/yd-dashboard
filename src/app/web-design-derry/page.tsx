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

export default function WebDesignDerryPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-web-design-derry', ...utm }),
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
      <PageViewTracker page="web-design-derry" />

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
              Book a Free Consultation
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <Image src={IMG.heroBg} alt="" fill sizes="100vw" className="object-cover object-center grayscale" style={{ opacity: 0.55 }} priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-20 pt-32">
            <div className="max-w-2xl">
              <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6" style={{ letterSpacing: '-0.03em' }}>
                Web Design in Derry Built to Win You Customers — Not Just Compliments.
              </h1>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-6 max-w-lg" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                Fast, modern, mobile-first. Built by a team that knows the NI market.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Book My Free Consultation <ArrowRight size={15} />
                </button>
                <a href="#case-studies" className="text-sm text-white/50 font-medium border border-white/20 px-6 py-3.5 rounded-full hover:border-white/40 hover:text-white/70 transition-all" style={{ letterSpacing: '-0.02em' }}>
                  See Our Work →
                </a>
              </div>
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
              A good-looking website that doesn&apos;t bring in business is just an expensive brochure.
              We design and build Derry websites that load fast, rank on Google, and turn visitors into enquiries.
              One team handles design, build, and SEO — no juggling three different suppliers who never talk to each other.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SERVICES
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Our Services
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Everything you need to grow online.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                {
                  title: 'Brand & Identity',
                  desc: 'Logo, visual identity, and brand guidelines. Every web design project we do starts with a brand that earns trust before a word is read.',
                },
                {
                  title: 'Web Design Derry',
                  desc: "Fast, modern websites built to convert visitors into customers. Every site we build is mobile-first, SEO-ready, and tested across devices. We don't do brochure sites — we build things that work.",
                },
                {
                  title: 'SEO Derry',
                  desc: 'Web design and SEO working together from day one. Most web designers hand you a site and walk away. We build it to rank.',
                },
              ].map((service, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>{service.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            PLATFORM SECTION
            ═══════════════════════════════════════════ */}
        <section className="py-12 sm:py-16 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-medium text-[#0a0a0a] mb-4" style={{ letterSpacing: '-0.03em' }}>
                WordPress and Shopify specialists. No lock-in.
              </h2>
              <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                Most Derry businesses need a website they can actually manage after launch. We build on WordPress and{' '}
                <a href="/shopify-web-design-belfast" className="text-[#0a0a0a] underline underline-offset-2 hover:text-[#e63312] transition-colors">Shopify</a>
                {' '}— the two platforms that give you full control without needing a developer every time something changes.
                Every site is mobile-first, SEO-ready, and fast. Whether you&apos;re a restaurant on Waterloo Street, a tradesperson
                covering the wider council area, or a professional services firm near the Guildhall — we&apos;ll build it on the
                right platform for your business.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            HOW IT WORKS
            ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-24 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  How It Works
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Three steps to a site that works.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                {
                  num: '01',
                  title: 'Free 30-min Consultation',
                  desc: "We look at your current site (or brief), understand your goals, and tell you honestly what it would take to get results.",
                },
                {
                  num: '02',
                  title: 'We design and build',
                  desc: 'Design, development, and SEO — handled by one team, without the back-and-forth between suppliers. You get a single point of contact.',
                },
                {
                  num: '03',
                  title: 'You get a site that works',
                  desc: 'Fast-loading, mobile-first, ranking locally. Not just something that looks good in a presentation.',
                },
              ].map((step, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>
                    {step.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>{step.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CASE STUDIES
            ═══════════════════════════════════════════ */}
        <section id="case-studies" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Work
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15] mb-2" style={{ letterSpacing: '-0.04em' }}>
                  Built for NI businesses. Designed to convert.
                </h2>
                <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Featured work between ©2022–25
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'The Hills Restaurant', desc: 'Full rebrand and responsive site. More traffic, more bookings.', tags: 'Brand × Web Design', image: IMG.hillsMockup },
                { title: 'React Clarity', desc: 'A clinical-grade brand for a health-tech startup.', tags: 'Brand × Development', image: IMG.reactClarity },
                { title: 'Krumb Bakery', desc: 'Handcrafted branding and e-commerce build on Shopify.', tags: 'Brand × E-Commerce', image: IMG.krumb },
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
            TESTIMONIALS
            ═══════════════════════════════════════════ */}
        <section className="bg-[#0a0a0a] py-20 sm:py-24">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  What NI Businesses Say
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.15]" style={{ letterSpacing: '-0.04em' }}>
                  Don&apos;t take our word for it.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { quote: "Yarn Digital redesigned everything. Within a month we had more traffic and more bookings than we'd seen all year.", name: 'The Hills Restaurant', tag: 'Brand & Web Design' },
                { quote: 'Straightforward, fast, and they delivered exactly what they promised. Our team uses the platform every day.', name: 'React Clarity', tag: 'Web Application' },
                { quote: 'The new site looks exactly like us. Our customers keep commenting on it.', name: 'Krumb Bakery', tag: 'Brand & E-Commerce' },
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

        {/* ═══════════════════════════════════════════
            FORM
            ═══════════════════════════════════════════ */}
        <section id="audit-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>
                  Free Consultation
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Want more from your website?
                </h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Book a free 30-minute consultation. We&apos;ll look at your current site<br />
                  and tell you what&apos;s costing you customers.
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
                  <span>Belfast-based · Serving all of Northern Ireland · 5.0 ★ on Google</span>
                  <span>Free 30-minute consultation</span>
                  <span>No obligation. No hidden fees.</span>
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
                      We&apos;ll be in touch shortly to arrange your free consultation.
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
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input type="email" required placeholder="you@company.co.uk" className={inputClass}
                          value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                        <input type="tel" required placeholder="Your phone number" className={inputClass}
                          value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business Name *</label>
                        <input type="text" required placeholder="Your business name" className={inputClass}
                          value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
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
                          <>Book My Free Consultation <ArrowRight size={15} /></>
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
                      q: 'Do you do web design for businesses in Derry/Londonderry?',
                      a: 'Yes — we work with businesses across Northern Ireland. Derry/Londonderry is one of our core markets. Whether you\'re based in the city or surrounding areas, we can help.',
                    },
                    {
                      q: 'How long does a website take to build?',
                      a: "Most projects take 2–4 weeks. We move fast without cutting corners — you'll get a site that's ready to launch and built to last.",
                    },
                    {
                      q: 'Do you build Shopify and WordPress sites?',
                      a: "Yes. We specialise in both. We'll recommend the right platform for your business based on what you need — not what's easiest for us to build.",
                    },
                    {
                      q: 'What if I already have a website? Can you improve it?',
                      a: "Yes — redesigns are a large part of what we do. We'll audit what you have, tell you what's costing you customers, and fix it.",
                    },
                    {
                      q: 'Do you handle the SEO as well as the design?',
                      a: 'Yes. Web design and SEO are done by the same team, not handed off separately. That\'s one of the main reasons to work with us over a pure design agency.',
                    },
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
                  Yarn Digital is a full-service studio led by Jonny Davison. We work with ambitious SMEs across
                  Northern Ireland — including Derry/Londonderry — on web design, SEO, and digital growth, built properly.
                </p>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We&apos;re not a faceless agency. We know your market, we speak your language, and we&apos;ll tell
                  you the truth about what&apos;s working and what isn&apos;t.
                </p>
                <p className="text-sm text-[#999] font-medium">
                  Need SEO for your Derry business?{' '}
                  <a href="/seo-derry" className="text-[#0a0a0a] underline underline-offset-2 hover:text-[#e63312] transition-colors">
                    See our SEO services in Derry →
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
              Ready to grow your<br />Derry business online?
            </h2>
            <p className="text-base text-white/50 mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Book a free 30-minute consultation. We&apos;ll look at what you have and tell you exactly what&apos;s holding you back.
            </p>
            <p className="text-xs text-white/30 mb-10 font-medium">
              5.0 ★ · Belfast-based · Serving all of Northern Ireland · No obligation. No sales pitch.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={scrollToForm}
                className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}>
                Book My Free Consultation <ArrowRight size={15} />
              </button>
              <a href="mailto:hello@yarndigital.co.uk"
                className="border border-white/20 text-white/60 font-medium text-[15px] px-8 py-3.5 rounded-full hover:border-white/40 hover:text-white transition-all"
                style={{ letterSpacing: '-0.02em' }}>
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
