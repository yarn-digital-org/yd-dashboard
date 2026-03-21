// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/shopify-belfast
// Copy source: aria/deliverables/shopify-belfast-copy-mar21.md
// Awaiting Jonny's greenlight before merging to master.
// Note: Aria spec — white background, Yarn Digital standard brand

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
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
};

const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      name: 'Yarn Digital',
      description: 'Belfast\'s full-service digital agency. Shopify web design, SEO, brand, and digital marketing.',
      url: 'https://www.yarndigital.co.uk',
      address: { '@type': 'PostalAddress', addressLocality: 'Belfast', addressRegion: 'Northern Ireland', addressCountry: 'GB' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '5.0', bestRating: '5', worstRating: '1', reviewCount: '50' },
    },
    {
      '@type': 'Service',
      name: 'Shopify Web Design Belfast',
      provider: { '@type': 'LocalBusiness', name: 'Yarn Digital' },
      areaServed: { '@type': 'City', name: 'Belfast' },
      description: 'Shopify web design and e-commerce development for Belfast businesses. Mobile-first, conversion-focused Shopify stores.',
      url: 'https://yd-dashboard.vercel.app/shopify-web-design-belfast',
    },
  ],
};

export default function ShopifyWebDesignBelfastPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '' });
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
        body: JSON.stringify({ ...formData, source: 'landing-page-shopify-web-design-belfast', ...utm }),
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

  const scrollToForm = () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });

  const inputClass = 'w-full bg-transparent border-b border-[#ddd] text-[#0a0a0a] placeholder-[#999] px-0 py-3 text-[15px] font-medium focus:outline-none focus:border-[#0a0a0a] transition-colors';
  const labelClass = 'block text-[11px] font-semibold text-[#999] mb-1 uppercase';

  return (
    <>
      <ForceLightTheme />
      <PageViewTracker page="shopify-web-design-belfast" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <main className="min-h-screen bg-[#ffffff] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>

        {/* ─── Nav ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#f0f0f0]">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between px-5 sm:px-10 py-5">
            <a href="https://www.yarndigital.co.uk" className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[22px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
                <span className="text-[22px] font-bold text-[#e63312]">.</span>
                <span className="text-[13px] font-normal text-[#0a0a0a]/60 ml-1">Digital</span>
              </div>
            </a>
            <button onClick={scrollToForm} className="bg-[#e63312] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#cc2b0e] transition-all" style={{ letterSpacing: '-0.01em' }}>
              Book a Free Call
            </button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="max-w-3xl">
              <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>
                Shopify Web Design · Belfast
              </span>
              <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4rem] font-medium text-[#0a0a0a] leading-[1.05] mb-6" style={{ letterSpacing: '-0.04em' }}>
                Shopify Web Design Belfast<br />— Built to Sell From Day One.
              </h1>
              <p className="text-base sm:text-lg text-[#666] leading-relaxed mb-8 max-w-xl" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                We build Shopify stores for Belfast businesses that want to sell online without the technical headache. Fast setup, clean design, built to convert — not just to look good.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToForm} className="bg-[#e63312] text-white font-semibold text-[15px] px-8 py-4 rounded-full hover:bg-[#cc2b0e] transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Book a Free 30-Minute Call <ArrowRight size={15} />
                </button>
                <a href="/shopify" className="border border-[#ddd] text-[#555] font-medium text-[15px] px-8 py-4 rounded-full hover:border-[#999] hover:text-[#0a0a0a] transition-all" style={{ letterSpacing: '-0.02em' }}>
                  Our Shopify Services →
                </a>
              </div>
              <p className="text-xs text-[#aaa] mt-5 font-medium" style={{ letterSpacing: '-0.01em' }}>
                Trusted by 50+ Belfast businesses&nbsp;·&nbsp;5.0 ★ on Google&nbsp;·&nbsp;Belfast-based, no outsourcing
              </p>
            </div>
          </div>
        </section>

        {/* ─── WHY SHOPIFY — 3 columns ─── */}
        <section className="py-20 sm:py-28 bg-[#f8f8f8] border-y border-[#efefef]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="mb-12">
              <span className="text-[11px] font-semibold text-[#999] uppercase mb-3 block" style={{ letterSpacing: '0.08em' }}>Why Shopify</span>
              <h2 className="text-2xl sm:text-3xl font-medium text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
                Shopify is the world&apos;s leading e-commerce platform — and for good reason.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                {
                  num: '01',
                  title: "It's Built for Selling",
                  desc: "Payments, inventory, shipping, discount codes — Shopify handles the complex stuff so you can focus on your products and customers.",
                },
                {
                  num: '02',
                  title: 'Fast and Mobile-Ready',
                  desc: "Every Shopify store we build is mobile-first from the ground up. Fast load times, clean layouts, built for the way people actually shop.",
                },
                {
                  num: '03',
                  title: "You're in Control",
                  desc: "Update products, manage orders, run promotions — all without touching code or calling a developer. You own your store.",
                },
              ].map((p, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#e63312] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>{p.num}</span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>{p.title}</h3>
                  <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHO IT'S FOR ─── */}
        <section className="py-20 sm:py-28 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-4 block" style={{ letterSpacing: '0.08em' }}>Who It&apos;s For</span>
                <h2 className="text-2xl sm:text-3xl font-medium text-[#0a0a0a] mb-6" style={{ letterSpacing: '-0.03em' }}>
                  Built for Belfast Retailers, Food Brands &amp; Product Businesses
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                  Whether you&apos;re a Belfast retailer moving online for the first time, a food brand ready to ship direct to customers, or an existing store that&apos;s not converting — we build Shopify stores that work.
                </p>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                  We keep it straightforward: clean design, fast setup, and everything configured so you&apos;re ready to sell from launch day.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  No bloated templates. No unnecessary complexity. Just a store that does its job.
                </p>
              </div>

              {/* Krumb case study callout */}
              <div className="bg-[#f8f8f8] rounded-[24px] overflow-hidden border border-[#efefef]">
                <div className="aspect-[4/3] overflow-hidden">
                  <Image src={IMG.krumb} alt="Krumb Bakery — Shopify store" width={600} height={450} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <span className="text-[11px] font-semibold text-[#999] uppercase mb-2 block" style={{ letterSpacing: '0.08em' }}>Case Study</span>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.02em' }}>Krumb Bakery</h3>
                  <p className="text-sm text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                    We built Krumb Bakery&apos;s Shopify store from scratch — clean, food-forward design with online ordering built in.
                  </p>
                  <a href="/work/krumb-bakery" className="text-sm font-semibold text-[#e63312] hover:text-[#cc2b0e] transition-colors inline-flex items-center gap-1" style={{ letterSpacing: '-0.01em' }}>
                    Read the case study <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW WE WORK ─── */}
        <section className="py-20 sm:py-28 bg-[#f8f8f8] border-y border-[#efefef]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>How We Work</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-medium text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
                  From brief to live store — a straightforward process.
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 border-t border-[#e5e5e5]">
              {[
                { num: '01', title: 'Discovery call', desc: 'We learn your products, goals, and timeline.' },
                { num: '02', title: 'Design', desc: 'Custom Shopify theme, built to your brand.' },
                { num: '03', title: 'Build & configure', desc: 'Payments, shipping, products — all set up.' },
                { num: '04', title: 'Launch', desc: 'We go live and hand you the keys.' },
                { num: '05', title: 'Support', desc: 'Optional ongoing support if you need it.' },
              ].map((s, i) => (
                <div key={i} className={`py-8 md:px-6 ${i === 0 ? 'md:pl-0' : ''} ${i < 4 ? 'border-b sm:border-b-0 sm:border-r border-[#e5e5e5]' : ''}`}>
                  <span className="text-[32px] font-medium text-[#e63312] leading-none block mb-3" style={{ letterSpacing: '-0.04em' }}>{s.num}</span>
                  <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1" style={{ letterSpacing: '-0.02em' }}>{s.title}</h3>
                  <p className="text-xs text-[#888] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CONTACT FORM ─── */}
        <section id="contact-form" className="py-20 sm:py-28 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>Start the Conversation</span>
                <h2 className="text-2xl sm:text-3xl font-medium text-[#0a0a0a] mb-4" style={{ letterSpacing: '-0.03em' }}>
                  Ready to Start Selling Online?
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em' }}>
                  Book a free 30-minute call. We&apos;ll tell you exactly what your Shopify store needs and what it&apos;ll cost — no obligation.
                </p>
                <div className="flex flex-col gap-2 text-sm text-[#aaa] font-medium">
                  <span>Belfast-based · Shopify specialists</span>
                  <span>Free 30-minute consultation</span>
                  <span>No obligation. No hidden fees.</span>
                </div>
                <div className="mt-8 pt-8 border-t border-[#f0f0f0] flex flex-wrap gap-4 text-sm">
                  <a href="/shopify" className="text-[#0a0a0a] hover:text-[#e63312] transition-colors font-medium" style={{ letterSpacing: '-0.01em' }}>
                    Shopify Services →
                  </a>
                  <a href="/web-design-belfast" className="text-[#0a0a0a] hover:text-[#e63312] transition-colors font-medium" style={{ letterSpacing: '-0.01em' }}>
                    Web Design Belfast →
                  </a>
                  <a href="/work/krumb-bakery" className="text-[#0a0a0a] hover:text-[#e63312] transition-colors font-medium" style={{ letterSpacing: '-0.01em' }}>
                    Krumb Bakery Case Study →
                  </a>
                </div>
              </div>

              <div>
                {status === 'success' ? (
                  <div className="py-16 text-center">
                    <div className="w-14 h-14 rounded-full border border-[#0a0a0a]/20 flex items-center justify-center mx-auto mb-5">
                      <Check size={24} className="text-[#0a0a0a]" />
                    </div>
                    <h3 className="text-2xl font-medium text-[#0a0a0a] mb-2" style={{ letterSpacing: '-0.03em' }}>We&apos;ve got your details.</h3>
                    <p className="text-sm text-[#999] font-medium">We&apos;ll be in touch shortly to arrange your free call.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
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
                    {status === 'error' && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}
                    <div className="pt-2">
                      <button type="submit" disabled={status === 'submitting'} className="bg-[#e63312] text-white font-semibold text-[15px] px-10 py-4 rounded-full hover:bg-[#cc2b0e] transition-all disabled:opacity-50 inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                        {status === 'submitting' ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Book Your Free Call <ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-[#ffffff] border-t border-[#efefef] py-6">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-0.5 opacity-60">
                <span className="text-[16px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
                <span className="text-[16px] font-bold text-[#e63312]">.</span>
                <span className="text-[10px] font-normal text-[#0a0a0a]/80 ml-0.5">Digital</span>
              </div>
              <span className="text-[11px] font-medium text-[#bbb]">© {new Date().getFullYear()} Belfast, Northern Ireland</span>
            </div>
            <span className="text-[11px] font-semibold text-[#bbb]" style={{ letterSpacing: '-0.02em' }}>Design, Build, Grow</span>
          </div>
        </footer>
      </main>
    </>
  );
}
