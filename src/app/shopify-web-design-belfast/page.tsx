'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';
import { trackLead } from '@/components/MetaPixel';

import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
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

const IMG = {
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
};

export default function ShopifyWebDesignBelfastPage() {
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
        body: JSON.stringify({
          ...formData,
          source: 'landing-page-shopify-web-design-belfast',
          ...utm,
        }),
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
    document.getElementById('consultation-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const inputClass =
    'w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] px-0 py-3 text-[15px] font-medium focus:outline-none focus:border-white transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-[#666] mb-1 uppercase';

  return (
    <>
      <ForceLightTheme />
      <PageViewTracker page="shopify-web-design-belfast" />

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
              Book a Free Call
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
              style={{ opacity: 0.45 }}
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-24 pt-32">
            <div className="max-w-2xl">
              <span className="text-[11px] font-semibold text-[#e63312] uppercase mb-4 block" style={{ letterSpacing: '0.08em' }}>
                Shopify Web Design Belfast
              </span>
              <h1
                className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6"
                style={{ letterSpacing: '-0.03em' }}
              >
                Shopify Web Design Belfast — Built to Sell From Day One.
              </h1>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-xl" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                We build Shopify stores for Belfast businesses that want to sell online without the technical headache. Fast setup, clean design, built to convert — not just to look good.
              </p>

              <p className="text-xs text-white/40 font-medium mb-8" style={{ letterSpacing: '-0.01em' }}>
                Belfast-based · No outsourcing · 5.0 ★ on Google
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={scrollToForm}
                  className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Book a Free 30-Min Call <ArrowRight size={15} />
                </button>
                <a
                  href="#case-study"
                  className="text-sm text-white/50 font-medium border border-white/20 px-6 py-3.5 rounded-full hover:border-white/40 hover:text-white/70 transition-all"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  See Our Work →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHY SHOPIFY — 3 points
            ═══════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Why Shopify
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Why Belfast businesses choose Shopify.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                {
                  num: '01',
                  title: "It's built for selling.",
                  desc: "Shopify handles payments, inventory, shipping, and tax so you can focus on running your business — not your website. It works out of the box and scales as you grow.",
                },
                {
                  num: '02',
                  title: "It's fast and mobile-ready.",
                  desc: "Every store we build is optimised for mobile from the start. That matters — most of your customers are shopping on their phones.",
                },
                {
                  num: '03',
                  title: "You're in control.",
                  desc: "Once it's live, you can update products, run discounts, and manage orders yourself. No developer needed for day-to-day changes.",
                },
              ].map((point, i) => (
                <div
                  key={i}
                  className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}
                >
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>
                    {point.num}
                  </span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>
                    {point.title}
                  </h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                    {point.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WHO IT'S FOR
            ═══════════════════════════════════════════ */}
        <section className="py-20 sm:py-24 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Is This Right For You?
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-medium text-[#0a0a0a] leading-[1.2] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Built for Belfast businesses ready to sell online.
                </h2>
                <p className="text-base text-[#555] leading-relaxed max-w-2xl" style={{ letterSpacing: '-0.01em' }}>
                  If you&apos;re a Belfast retailer, food brand, or product business ready to start selling online — or you&apos;ve got an existing store that isn&apos;t converting — we can help. We&apos;ve built Shopify stores for local businesses from scratch and rebuilt underperforming ones that weren&apos;t making sales. If you know what you&apos;re selling and who you&apos;re selling to, we&apos;ll handle the rest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CASE STUDY — Krumb Bakery
            ═══════════════════════════════════════════ */}
        <section id="case-study" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>
                  Case Study
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>
                  Krumb Bakery — E-commerce built to sell.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="rounded-[24px] overflow-hidden bg-[#111] border border-[#1a1a1a] aspect-[4/3]">
                <Image
                  src={IMG.krumb}
                  alt="Krumb Bakery Shopify store"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-base text-white/60 leading-relaxed mb-8" style={{ letterSpacing: '-0.01em' }}>
                  Krumb Bakery came to us with great products and no online presence. We built them a clean, fast Shopify store — handcrafted branding, product photography integration, and a checkout flow built to convert. The result: a store that looks as good as their sourdough tastes.
                </p>
                <div className="space-y-3">
                  {[
                    'Full Shopify build from scratch',
                    'Custom brand integration',
                    'Mobile-first, conversion-optimised',
                    'Self-manageable — no dev needed for updates',
                  ].map((point, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white/60" />
                      </div>
                      <span className="text-sm text-white/60 font-medium" style={{ letterSpacing: '-0.01em' }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CONSULTATION FORM — CTA
            ═══════════════════════════════════════════ */}
        <section id="consultation-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">

              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>
                  Free Consultation
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Ready to start selling online?
                </h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Book a free 30-minute call. We&apos;ll look at your business and tell you exactly what a Shopify store would cost and how long it would take.
                </p>
                <div className="flex flex-col gap-2 text-xs text-[#444] font-medium">
                  <span>Belfast-based · No outsourcing</span>
                  <span>5.0 ★ on Google</span>
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
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="you@company.co.uk"
                          className={inputClass}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                        <input
                          type="tel"
                          required
                          placeholder="Your phone number"
                          className={inputClass}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Business Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Your business name"
                          className={inputClass}
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                    </div>

                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                    )}

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-10 py-4 rounded-full hover:bg-[#ffffff]/90 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                        style={{ letterSpacing: '-0.02em' }}
                      >
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
            FAQs
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
                      q: 'How long does a Shopify build take?',
                      a: "Most Shopify projects take 2–4 weeks. We set up the store, configure everything, and hand it over ready to sell. You don't wait months.",
                    },
                    {
                      q: 'Do I need to know anything technical?',
                      a: "No. We build everything, train you on how to use it, and you manage it yourself from day one. Adding products, running sales, processing orders — all straightforward.",
                    },
                    {
                      q: 'What does it cost?',
                      a: "Every project is scoped on the call. We give you a clear fixed quote — no hourly billing, no surprise invoices. You know exactly what you're paying before we start.",
                    },
                    {
                      q: 'Can you migrate my existing store?',
                      a: "Yes. If you're on WooCommerce, Wix, or another platform and it's not performing, we can rebuild it on Shopify. We migrate products, collections, and customer data.",
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
                        <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                          {faq.a}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
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
              Ready to start selling online?
            </h2>
            <p className="text-base text-white/50 mb-10" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Book a free 30-minute call. We&apos;ll tell you exactly what a Shopify store would cost and how long it would take.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={scrollToForm}
                className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                Book My Free Consultation <ArrowRight size={15} />
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
