'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';

import { useState, useEffect, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { ForceLightTheme } from '@/components/ForceLightTheme';
import PageViewTracker from '@/components/PageViewTracker';

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

const IMG = {
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
};

export default function YarnDigitalPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
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
        body: JSON.stringify({ ...formData, source: 'landing-page-yarn-digital', ...utm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead(); trackGoogleAdsConversion();
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
      <PageViewTracker page="yarn-digital" />

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
              Book a Call
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════
            HERO — Short, warm
            ═══════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <Image src={IMG.heroBg} alt="" fill sizes="100vw" className="object-cover object-center grayscale" style={{ opacity: 0.55 }} priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col justify-end min-h-screen pb-16 sm:pb-20 pt-32">
            <div className="max-w-2xl">
              <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-medium text-white leading-[1.02] mb-6" style={{ letterSpacing: '-0.03em' }}>
                You Found Us.<br />Let&apos;s Talk.
              </h1>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-6 max-w-lg" style={{ letterSpacing: '-0.01em', fontWeight: 400 }}>
                Yarn Digital — Belfast&apos;s design, build, and growth agency for ambitious SMEs.
              </p>
              <button onClick={scrollToForm} className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                Book a Call <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            TRUST SIGNALS — Clean, minimal
            ═══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 bg-[#ffffff]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center md:text-left">
                <p className="text-[11px] font-semibold text-[#999] uppercase mb-3" style={{ letterSpacing: '0.08em' }}>
                  Trusted By
                </p>
                <p className="text-base font-medium text-[#0a0a0a]" style={{ letterSpacing: '-0.02em' }}>
                  The Hills Restaurant, Krumb Bakery, React Clarity
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[11px] font-semibold text-[#999] uppercase mb-3" style={{ letterSpacing: '0.08em' }}>
                  Based In
                </p>
                <p className="text-base font-medium text-[#0a0a0a]" style={{ letterSpacing: '-0.02em' }}>
                  Belfast-based. UK-wide results.
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[11px] font-semibold text-[#999] uppercase mb-3" style={{ letterSpacing: '0.08em' }}>
                  What Clients Say
                </p>
                <p className="text-base text-[#666] italic leading-relaxed" style={{ letterSpacing: '-0.02em' }}>
                  &ldquo;Straightforward, fast, and they delivered exactly what they promised.&rdquo;
                </p>
                <p className="text-sm font-semibold text-[#0a0a0a] mt-2" style={{ letterSpacing: '-0.02em' }}>
                  — React Clarity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            QUICK SERVICES LIST — Horizontal
            ═══════════════════════════════════════════ */}
        <section className="py-14 sm:py-16 bg-[#0a0a0a] border-y border-[#1a1a1a]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10 text-center">
            <p className="text-[11px] font-semibold text-[#555] uppercase mb-6" style={{ letterSpacing: '0.08em' }}>
              What We Do
            </p>
            <p className="text-lg sm:text-xl font-medium text-white/70" style={{ letterSpacing: '-0.02em' }}>
              Brand &amp; identity{' '}
              <span className="text-white/30 mx-2">·</span>{' '}
              Web design &amp; development{' '}
              <span className="text-white/30 mx-2">·</span>{' '}
              SEO &amp; content{' '}
              <span className="text-white/30 mx-2">·</span>{' '}
              Paid ads
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            FORM — 3 fields only (lower friction)
            ═══════════════════════════════════════════ */}
        <section id="audit-form" className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">

              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase block mb-6" style={{ letterSpacing: '0.08em' }}>
                  Get In Touch
                </span>
                <h2 className="text-3xl sm:text-4xl font-medium text-white leading-[1.1] mb-6" style={{ letterSpacing: '-0.04em' }}>
                  Let&apos;s talk.
                </h2>
                <p className="text-sm text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.01em', fontWeight: 500 }}>
                  Drop us your details and we&apos;ll be<br />
                  in touch to arrange a call.
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
                  <span>Belfast-based studio</span>
                  <span>No obligation. No pitch.</span>
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
                      We&apos;ll be in touch shortly to arrange a call.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8 pt-2">
                    <div>
                      <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Name *</label>
                      <input type="text" required placeholder="Your name" className={inputClass}
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Email *</label>
                        <input type="email" required placeholder="you@company.co.uk" className={inputClass}
                          value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ letterSpacing: '0.04em' }}>Phone *</label>
                        <input type="tel" required placeholder="Your phone number" className={inputClass}
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
                          <>Let&apos;s Talk <ArrowRight size={15} /></>
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
            BOTTOM CTA — Short
            ═══════════════════════════════════════════ */}
        <section className="relative py-28 sm:py-36 overflow-hidden">
          <div className="absolute inset-0">
            <Image src={IMG.heroBg} alt="" fill className="object-cover grayscale" style={{ opacity: 0.3 }} />
          </div>
          <div className="absolute inset-0 bg-[#0a0a0a]/80" />
          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-[1.1] mb-5" style={{ letterSpacing: '-0.04em' }}>
              Let&apos;s build something<br />worth talking about.
            </h2>
            <p className="text-base text-white/50 mb-10" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Design, build, grow — all under one roof.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={scrollToForm}
                className="bg-[#ffffff] text-[#0a0a0a] font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#ffffff]/90 transition-all inline-flex items-center gap-2"
                style={{ letterSpacing: '-0.02em' }}>
                Let&apos;s Talk <ArrowRight size={15} />
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

// ============================================
// Meta Pixel Script
// ============================================
