'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';

// ============================================
// Meta Pixel helper
// ============================================
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

// ============================================
// UTM extraction
// ============================================
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

// ============================================
// Main Page
// ============================================
export default function FreeAuditPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '', company: '', website: '', email: '', phone: '', message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const auditItems = [
    'Performance & speed analysis',
    'Mobile responsiveness check',
    'SEO health & visibility score',
    'Conversion & UX review',
    'Competitor comparison',
    'Actionable recommendations',
  ];

  return (
    <>
      <MetaPixelScript />

      <main className="min-h-screen bg-[#f5f5f5] font-sans" style={{ letterSpacing: '-0.02em' }}>

        {/* ─── Nav ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 sm:px-10 py-4">
            <a href="https://www.yarndigital.co.uk" className="text-white font-semibold tracking-tight text-base" style={{ letterSpacing: '-0.04em' }}>
              YARN Digital
            </a>
            <button
              onClick={scrollToForm}
              className="bg-white text-[#0a0a0a] text-sm font-semibold px-5 py-2.5 rounded-md hover:bg-gray-100 transition-colors"
              style={{ letterSpacing: '-0.02em' }}
            >
              Get Free Audit
            </button>
          </div>
        </nav>

        {/* ─── Hero ─── */}
        <section className="relative min-h-screen flex items-end bg-[#0a0a0a] overflow-hidden">
          {/* Background image */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url(https://framerusercontent.com/images/H7pmHxrsHkVjHKJY8oD7Oy6ck.png)',
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />

          <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 pb-16 sm:pb-24 pt-32">
            <div className="max-w-2xl">
              <p className="text-xs sm:text-sm font-semibold text-[#999] uppercase mb-4 sm:mb-6" style={{ letterSpacing: '0.05em' }}>
                Free Website Audit
              </p>
              <h1
                className="text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] mb-5 sm:mb-6"
                style={{ letterSpacing: '-0.04em' }}
              >
                Your website<br />
                should be winning<br />
                you customers.
              </h1>
              <p
                className="text-base sm:text-lg text-[#888] leading-relaxed mb-8 max-w-lg"
                style={{ letterSpacing: '-0.03em', fontWeight: 500 }}
              >
                We&apos;ll audit your site, tell you what&apos;s working, what isn&apos;t,
                and what to fix first — with zero obligation.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={scrollToForm}
                  className="bg-white text-[#0a0a0a] font-semibold text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-md hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Get My Free Audit <ArrowRight size={16} />
                </button>
                <a
                  href="https://www.yarndigital.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[#333] text-[#999] font-medium text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-md hover:border-[#666] hover:text-white transition-colors"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  View Our Work
                </a>
              </div>
            </div>
          </div>

          {/* Bottom-right badge */}
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-10 hidden sm:block">
            <span className="text-xs font-semibold text-[#555]" style={{ letterSpacing: '-0.02em' }}>
              Strategy × Story
            </span>
          </div>
        </section>

        {/* ─── What You Get ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16">
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.05em' }}>
                  What You Get
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0a0a0a] leading-[1.1] mb-8"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  A clear, honest audit of your online presence — in 48 hours.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {auditItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-3">
                      <div className="w-5 h-5 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-base text-[#333] font-medium" style={{ letterSpacing: '-0.02em' }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Divider line ─── */}
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
          <div className="border-t border-[#e5e5e5]" />
        </div>

        {/* ─── Case Studies ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16 mb-12">
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.05em' }}>
                  Our Work
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] leading-[1.15]"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Real work for real businesses.
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: 'Stonebridge Farm',
                  desc: 'Brand identity grounded in provenance and place.',
                  tags: 'Branding × Strategy',
                  image: 'https://framerusercontent.com/images/1A7y3aX1XOiC43HofQw8EHV8Ck.png',
                },
                {
                  title: 'React Clarity',
                  desc: 'A clinical-grade brand for a health-tech startup.',
                  tags: 'Brand × Web Development',
                  image: 'https://framerusercontent.com/images/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
                },
                {
                  title: 'Krumb Bakery',
                  desc: 'Handcrafted branding for Belfast\'s best sourdough.',
                  tags: 'Brand × E-Commerce',
                  image: 'https://framerusercontent.com/images/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
                },
              ].map((cs, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={cs.image}
                      alt={cs.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
                        {cs.title}
                      </h3>
                      <span className="text-xs font-medium text-[#999]" style={{ letterSpacing: '-0.01em' }}>
                        {cs.tags}
                      </span>
                    </div>
                    <p className="text-sm text-[#666]" style={{ letterSpacing: '-0.02em' }}>
                      {cs.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Services Strip ─── */}
        <section className="bg-[#0a0a0a] py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16 mb-12">
              <div>
                <span className="text-xs font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.05em' }}>
                  What We Do
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-white leading-[1.15] mb-2"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Design, Build, Grow.
                </h2>
                <p className="text-base text-[#666]" style={{ letterSpacing: '-0.03em', fontWeight: 500 }}>
                  Full-service digital — from brand strategy to measurable growth.
                </p>
              </div>
            </div>

            <div className="border-t border-[#222]">
              {[
                { title: 'Brand Strategy & Identity', desc: 'Research-driven brand positioning that makes you impossible to ignore.' },
                { title: 'Web Design & Development', desc: 'Shopify, WordPress, or custom — built to convert, not just to look pretty.' },
                { title: 'UX / UI Design', desc: 'Interfaces that feel intuitive and look exceptional. Every detail earns its place.' },
                { title: 'SEO & Content Strategy', desc: 'Get found by the right people. Sustainable, organic growth.' },
                { title: 'Digital Marketing', desc: 'Paid media, social strategy, and campaigns that actually move the needle.' },
              ].map((s, i) => (
                <div key={i} className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-16 py-6 border-b border-[#222]">
                  <div className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
                    {s.title}
                  </div>
                  <div className="lg:col-span-2 text-sm text-[#666] font-medium" style={{ letterSpacing: '-0.02em' }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── About / Trust ─── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-16">
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.05em' }}>
                  About Us
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0a0a0a] leading-[1.1] mb-6"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  Belfast-based. Built around your business.
                </h2>
                <p className="text-base sm:text-lg text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.03em', fontWeight: 500 }}>
                  Yarn Digital is a full-service studio led by Jonny Davison. We work with
                  ambitious SMEs across Belfast and Northern Ireland — brands, websites, and
                  digital growth, built properly.
                </p>
                <p className="text-base sm:text-lg text-[#666] leading-relaxed" style={{ letterSpacing: '-0.03em', fontWeight: 500 }}>
                  We&apos;re not a faceless agency. We know your market, we speak your language,
                  and we&apos;ll tell you the truth about what&apos;s working and what isn&apos;t.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Form Section ─── */}
        <section className="bg-[#0a0a0a] py-20 sm:py-28" ref={formRef}>
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              {/* Left — copy */}
              <div>
                <span className="text-xs font-semibold text-[#555] uppercase mb-6 block" style={{ letterSpacing: '0.05em' }}>
                  Get Started
                </span>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.1] mb-6"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Let&apos;s see what&apos;s<br className="hidden sm:block" />
                  holding you back.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-8" style={{ letterSpacing: '-0.03em', fontWeight: 500 }}>
                  Fill in the form and we&apos;ll send you a free audit of your website —
                  performance, design, SEO, and conversion. No pitch, no strings.
                  Just honest insight from a team that does this every day.
                </p>
                <div className="space-y-3">
                  {['48-hour turnaround', 'No sales pitch', 'Actionable recommendations'].map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                      <span className="text-sm text-[#999] font-medium" style={{ letterSpacing: '-0.02em' }}>
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — form */}
              <div>
                {status === 'success' ? (
                  <div className="bg-[#111] rounded-2xl p-10 text-center border border-[#222]">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
                      <Check size={28} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3" style={{ letterSpacing: '-0.03em' }}>
                      We&apos;ve got your details.
                    </h3>
                    <p className="text-[#666] font-medium" style={{ letterSpacing: '-0.02em' }}>
                      We&apos;ll be in touch within 1 business day with your free audit.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#666] mb-2 uppercase" style={{ letterSpacing: '0.03em' }}>
                          Your Name *
                        </label>
                        <input
                          type="text" required placeholder="Jonny Davison"
                          className="w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] py-3 text-base font-medium focus:outline-none focus:border-white transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#666] mb-2 uppercase" style={{ letterSpacing: '0.03em' }}>
                          Business Name *
                        </label>
                        <input
                          type="text" required placeholder="Your Business Ltd"
                          className="w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] py-3 text-base font-medium focus:outline-none focus:border-white transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#666] mb-2 uppercase" style={{ letterSpacing: '0.03em' }}>
                        Website URL *
                      </label>
                      <input
                        type="text" required placeholder="yourwebsite.co.uk"
                        className="w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] py-3 text-base font-medium focus:outline-none focus:border-white transition-colors"
                        style={{ letterSpacing: '-0.02em' }}
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#666] mb-2 uppercase" style={{ letterSpacing: '0.03em' }}>
                          Email *
                        </label>
                        <input
                          type="email" required placeholder="you@business.co.uk"
                          className="w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] py-3 text-base font-medium focus:outline-none focus:border-white transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#666] mb-2 uppercase" style={{ letterSpacing: '0.03em' }}>
                          Phone
                        </label>
                        <input
                          type="tel" placeholder="028 9000 0000"
                          className="w-full bg-transparent border-b border-[#333] text-white placeholder-[#555] py-3 text-base font-medium focus:outline-none focus:border-white transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    {status === 'error' && (
                      <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                    )}

                    <button
                      type="submit" disabled={status === 'submitting'}
                      className="w-full bg-white text-[#0a0a0a] font-semibold text-base py-4 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {status === 'submitting' ? (
                        <><Loader2 size={18} className="animate-spin" /> Sending...</>
                      ) : (
                        <>Send Me My Free Audit <ArrowRight size={16} /></>
                      )}
                    </button>

                    <p className="text-center text-xs text-[#555] font-medium mt-2" style={{ letterSpacing: '-0.01em' }}>
                      No sales pitch. No strings. Just an honest look at what&apos;s holding you back.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-[#f5f5f5] border-t border-[#e5e5e5] py-6">
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#999]" style={{ letterSpacing: '-0.02em' }}>
              © {new Date().getFullYear()} YARN Digital. Belfast, Northern Ireland.
            </span>
            <span className="text-xs font-semibold text-[#999]" style={{ letterSpacing: '-0.02em' }}>
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
