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

export default function WebDesignLisburnPage() {
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
        body: JSON.stringify({ ...formData, source: 'landing-page-web-design-lisburn', ...utm }),
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
      <PageViewTracker page="web-design-lisburn" />

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
              Get a Free Website Audit
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
                Web Design Lisburn — Built to Win You Customers.
              </h1>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-lg" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                We build fast, mobile-first websites for Lisburn businesses. Designed to convert visitors into enquiries, built to rank on Google, delivered on time.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  Get Your Free Website Audit <ArrowRight size={15} />
                </button>
                <a href="/web-design-belfast" className="border border-white/20 text-white/50 font-medium text-[15px] px-6 py-3.5 rounded-full hover:border-white/40 hover:text-white/70 transition-all" style={{ letterSpacing: '-0.02em' }}>
                  See Our Web Design Services →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTRO ─── */}
        <section className="py-24 sm:py-36 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <p className="text-2xl sm:text-3xl lg:text-[2.5rem] font-medium text-[#0a0a0a] leading-[1.25] max-w-4xl" style={{ letterSpacing: '-0.03em' }}>
              Lisburn is one of Northern Ireland&apos;s most commercially active cities — just 8 miles from Belfast, with a strong retail core, a growing professional services sector, and thousands of SMEs competing for local and regional customers. If your website is slow, difficult to use, or buried on page 3 of Google, it&apos;s costing you customers every single day.
            </p>
          </div>
        </section>

        {/* ─── SERVICES ─── */}
        <section className="py-24 sm:py-32 bg-[#ffffff] border-t border-[#e5e5e5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.08em' }}>What We Build</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-medium text-[#0a0a0a] leading-[1.1] mb-12" style={{ letterSpacing: '-0.04em' }}>
                  Everything your Lisburn business needs online.
                </h2>
                <div className="border-t border-[#e5e5e5]">
                  {[
                    { title: 'Business Websites', desc: 'Professional, conversion-focused websites for trades, professional services, retail, and hospitality businesses across Lisburn and Lagan Valley.' },
                    { title: 'E-Commerce Stores', desc: 'Shopify and WooCommerce builds for Lisburn retailers — fast checkout, mobile-optimised, and set up to rank locally and nationally.' },
                    { title: 'Brand + Website Together', desc: 'Need your brand sorted alongside the site? We do both — logo, identity, and a website that brings it to life consistently.' },
                    { title: 'SEO-Ready from Day One', desc: 'Every site we build is technically optimised for Google before launch — correct structure, fast load times, local schema, and the right metadata in place.' },
                    { title: 'Website Redesigns', desc: "Already have a site but it's not performing? We audit, redesign, and rebuild on a foundation that actually converts." },
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

        {/* ─── WHY LOCAL ─── */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>Why Choose Us</span>
              </div>
              <div className="lg:col-span-2">
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-8" style={{ letterSpacing: '-0.04em' }}>
                  A website that works as hard as your Lisburn business does.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  We&apos;re based in Belfast — not London, not India. We know the Lisburn and Lagan Valley market because we work in it. Whether you&apos;re trading from Lisburn city centre, operating near Sprucefield, or running a service business across Lagan Valley, we understand your customers and your competition.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  No account managers, no handoffs, no outsourced developers. You deal with the people building your site from day one to launch. And unlike a lot of agencies, we&apos;ll tell you honestly what you need — not what makes us the most money.
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
                <h2 className="text-3xl sm:text-4xl font-medium text-[#0a0a0a] leading-[1.1]" style={{ letterSpacing: '-0.04em' }}>Three steps to a website your Lisburn business can be proud of.</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#e5e5e5]">
              {[
                { num: '01', title: 'Free Audit', desc: "We review your current website and brief, and give you an honest assessment of what it needs. Free, no sales pitch." },
                { num: '02', title: 'Design & Build', desc: 'We design, write (if needed), and build your new site to brief — with regular check-ins so there are no surprises.' },
                { num: '03', title: 'Launch & Support', desc: 'We launch your site, hand over full control, and stay available for questions and updates.' },
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
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>Free Website Audit</span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>Ready for a website your Lisburn business can be proud of?</h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Start with a free website audit. We&apos;ll review what you have, tell you what it needs, and show you what a better site could look like for your business. Free, honest, no pitch.
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
                    <p className="text-sm text-[#666] font-medium">We&apos;ll be in touch within 1 business day with your free website audit.</p>
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
                    { q: 'How much does a website cost for a Lisburn business?', a: "Every project is different — a 5-page service site has very different requirements from a 200-product e-commerce store. The best way to get an honest figure is to start with a free audit. We'll tell you what your site needs and what that looks like." },
                    { q: 'How long will it take to build my website?', a: "Most small business websites are complete within 3–5 weeks from sign-off. Larger or more complex builds take longer. We'll give you a realistic timeline upfront — and we stick to it." },
                    { q: 'Will my Lisburn website rank on Google?', a: "SEO is built into every site we deliver — not bolted on as an upsell. We handle technical SEO, page structure, local signals, and load speed as standard. Rankings take time to build, but your site will be set up correctly from day one." },
                    { q: 'Do I need to be in Belfast to work with you?', a: "Not at all. We work with businesses across Northern Ireland, and most of our process runs remotely. A short call is usually enough to get started — no need for in-person meetings unless you prefer them." },
                    { q: 'What if I already have a website — can you improve it instead of rebuilding?', a: "Yes. We do redesigns and audits for existing sites. Sometimes a targeted rebuild of key pages does more than a full new build. Start with the free audit and we'll tell you what makes sense." },
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
              Ready for a website your<br />Lisburn business can be proud of?
            </h2>
            <p className="text-base text-white/50 mb-4" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Start with a free website audit. We&apos;ll review what you have, tell you what it needs, and show you what a better site looks like.
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

        {/* ─── Internal links ─── */}
        <section className="py-16 bg-[#f5f5f5]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="flex flex-wrap gap-4 text-sm font-medium text-[#666]">
              <span className="text-[#999] text-xs uppercase font-semibold" style={{ letterSpacing: '0.06em' }}>Related:</span>
              <a href="/web-design-belfast" className="hover:text-[#0a0a0a] transition-colors">Web Design Belfast</a>
              <a href="/seo-lisburn" className="hover:text-[#0a0a0a] transition-colors">SEO Lisburn</a>
              <a href="/free-audit" className="hover:text-[#0a0a0a] transition-colors">Free Website Audit</a>
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
