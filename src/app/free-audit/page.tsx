'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import Image from 'next/image';

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

// ============================================
// Image paths (self-hosted in /public/images/yd/)
// ============================================
const IMG = {
  logo: '/images/yd/AFnpNp2BAEaLd7ZiVoPt8eguUg.png',
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  heroPhone: '/images/yd/logo.png',
  founder: '/images/yd/gt2H9pZhxxqOiw8FCUVWqnG0DTQ.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  stonebridge: '/images/yd/1A7y3aX1XOiC43HofQw8EHV8Ck.png',
  reactClarity: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  krumb: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
  stonebridgeLogo: '/images/yd/xxotlBRDmymJO4gmjejtckSuiKE.png',
  portrait: '/images/yd/SqapF4Gl9mce8qi3Is6oKtl2tU.png',
};

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

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

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

  return (
    <>
      <MetaPixelScript />

      <main className="min-h-screen bg-[#f5f5f5] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>

        {/* ─── Nav ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between px-6 sm:px-10 py-4">
            <a href="https://www.yarndigital.co.uk" className="flex items-center gap-2">
              <Image src={IMG.logo} alt="YARN Digital" width={140} height={32} className="h-7 w-auto" />
            </a>
            <button
              onClick={scrollToForm}
              className="bg-white text-[#0a0a0a] text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ letterSpacing: '-0.02em' }}
            >
              Get Free Audit
            </button>
          </div>
        </nav>

        {/* ─── Hero ─── */}
        <section className="relative min-h-screen flex items-end bg-[#0a0a0a] overflow-hidden">
          {/* B&W cityscape background */}
          <div className="absolute inset-0">
            <Image
              src={IMG.heroBg}
              alt=""
              fill
              className="object-cover opacity-25"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/30" />

          <div className="relative z-10 w-full max-w-[1520px] mx-auto px-6 sm:px-10 pb-16 sm:pb-24 pt-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
              {/* Left — headline */}
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#999] uppercase mb-4 sm:mb-6" style={{ letterSpacing: '0.08em' }}>
                  Free Website Audit
                </p>
                <h1
                  className="text-4xl sm:text-6xl lg:text-[5.5rem] font-semibold text-white leading-[1.02] mb-5 sm:mb-6"
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
                    className="bg-white text-[#0a0a0a] font-semibold text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-all hover:scale-[1.02] inline-flex items-center gap-2"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    Get My Free Audit <ArrowRight size={16} />
                  </button>
                  <a
                    href="https://www.yarndigital.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#333] text-[#999] font-medium text-sm sm:text-base px-6 sm:px-8 py-3.5 rounded-lg hover:border-[#555] hover:text-white transition-colors"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    View Our Work
                  </a>
                </div>
              </div>

              {/* Right — device mockup */}
              <div className="hidden lg:block">
                <div className="relative w-full max-w-md ml-auto">
                  <Image
                    src={IMG.hillsMockup}
                    alt="The Hills Restaurant — Website redesign by Yarn Digital"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-2xl"
                    priority
                  />
                  <div className="absolute -bottom-4 -left-4 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2.5">
                    <span className="text-xs font-semibold text-[#666] block" style={{ letterSpacing: '0.03em' }}>
                      RECENT PROJECT
                    </span>
                    <span className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
                      The Hills Restaurant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-10 hidden sm:block">
            <span className="text-xs font-semibold text-[#444]" style={{ letterSpacing: '-0.02em' }}>
              Strategy × Story
            </span>
          </div>
        </section>

        {/* ─── Social Proof Bar ─── */}
        <section className="bg-[#0a0a0a] border-t border-[#1a1a1a]">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-xs font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.06em' }}>
                Trusted by
              </span>
              <div className="flex items-center gap-6">
                {['Stonebridge Farm', 'Krumb Bakery', 'React Clarity', 'The Hills', 'MyClaimsOffer'].map((name) => (
                  <span key={name} className="text-sm font-medium text-[#555]" style={{ letterSpacing: '-0.02em' }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              <span className="text-xs text-[#555] ml-2 font-medium">5.0</span>
            </div>
          </div>
        </section>

        {/* ─── What You Get ─── */}
        <section className="py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20">
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase" style={{ letterSpacing: '0.06em' }}>
                  What You Get
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0a0a0a] leading-[1.1] mb-10"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  A clear, honest audit of your online presence — in 48 hours.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { title: 'Performance & Speed', desc: 'Page load times, Core Web Vitals, and mobile performance scores.' },
                    { title: 'Mobile Experience', desc: 'How your site looks and works on phones — where most traffic comes from.' },
                    { title: 'SEO Health Check', desc: 'Search visibility, keyword coverage, technical SEO issues.' },
                    { title: 'Conversion Review', desc: 'Are visitors becoming customers? We\'ll find the friction points.' },
                    { title: 'Competitor Snapshot', desc: 'How you stack up against others in your space.' },
                    { title: 'Action Plan', desc: 'Clear, prioritised recommendations you can act on immediately.' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-[24px] p-6 border border-[#e5e5e5]">
                      <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center mb-4">
                        <Check size={14} className="text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-[#0a0a0a] mb-1.5" style={{ letterSpacing: '-0.03em' }}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#666] leading-relaxed" style={{ letterSpacing: '-0.02em' }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Case Studies — Dark ─── */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-xs font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.06em' }}>
                  Our Work
                </span>
              </div>
              <div className="lg:col-span-2">
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-white leading-[1.15] mb-2"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Real work for real businesses.
                </h2>
                <p className="text-base text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Featured projects between ©2022–25
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Stonebridge Farm',
                  desc: 'Brand identity grounded in provenance and place. From strategy to a full visual system.',
                  tags: 'Branding × Strategy',
                  image: IMG.stonebridge,
                },
                {
                  title: 'React Clarity',
                  desc: 'A clinical-grade brand for a health-tech startup breaking into a competitive market.',
                  tags: 'Brand × Development',
                  image: IMG.reactClarity,
                },
                {
                  title: 'Krumb Bakery',
                  desc: 'Handcrafted branding for Belfast\'s best sourdough. Warm, tactile, unforgettable.',
                  tags: 'Brand × E-Commerce',
                  image: IMG.krumb,
                },
              ].map((cs, i) => (
                <div key={i} className="bg-[#111] rounded-[24px] overflow-hidden group border border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={cs.image}
                      alt={cs.title}
                      width={600}
                      height={450}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
                        {cs.title}
                      </h3>
                    </div>
                    <p className="text-sm text-[#666] leading-relaxed mb-3" style={{ letterSpacing: '-0.02em' }}>
                      {cs.desc}
                    </p>
                    <span className="text-xs font-medium text-[#555]" style={{ letterSpacing: '0.02em' }}>
                      {cs.tags}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── The Hills Feature ─── */}
        <section className="py-24 sm:py-32 overflow-hidden">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.06em' }}>
                  Case Study
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] leading-[1.15] mb-4"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  The Hills Restaurant
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-6" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  A quality restaurant with a website that made it look average. We redesigned everything —
                  brand, photography direction, and a fully responsive website.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { stat: '+38%', label: 'organic traffic in 6 weeks' },
                    { stat: '2×', label: 'online reservations' },
                    { stat: '50%', label: 'bounce rate reduction' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-baseline gap-3">
                      <span className="text-2xl font-semibold text-[#0a0a0a]" style={{ letterSpacing: '-0.03em' }}>
                        {s.stat}
                      </span>
                      <span className="text-sm text-[#666]" style={{ letterSpacing: '-0.02em' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={scrollToForm}
                  className="bg-[#0a0a0a] text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[#222] transition-colors inline-flex items-center gap-2"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Get results like this <ArrowRight size={14} />
                </button>
              </div>
              <div className="relative">
                <Image
                  src={IMG.hillsMockup}
                  alt="The Hills Restaurant — responsive website mockup"
                  width={700}
                  height={467}
                  className="w-full h-auto rounded-[24px] shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Services ─── */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-20 mb-14">
              <div>
                <span className="text-xs font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.06em' }}>
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
                <p className="text-base text-[#555]" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Full-service digital — from brand strategy to measurable growth.
                </p>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a]">
              {[
                { title: 'Brand Strategy & Identity', desc: 'Research-driven brand positioning that makes you impossible to ignore. Strategy first, always.' },
                { title: 'Web Design & Development', desc: 'Shopify, WordPress, or custom builds. Fast, responsive, and built to convert — not just look pretty.' },
                { title: 'UX / UI Design', desc: 'Interfaces that feel intuitive and look exceptional. Every detail earns its place.' },
                { title: 'SEO & Content', desc: 'Get found by the right people. Sustainable organic growth, not quick-fix tricks.' },
                { title: 'Digital Marketing', desc: 'Paid media, social strategy, and campaigns that actually move the needle for your business.' },
              ].map((s, i) => (
                <div key={i} className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-20 py-7 border-b border-[#1a1a1a] hover:border-[#333] transition-colors">
                  <div className="text-lg font-semibold text-white" style={{ letterSpacing: '-0.03em' }}>
                    {s.title}
                  </div>
                  <div className="lg:col-span-2 text-sm text-[#555] font-medium leading-relaxed" style={{ letterSpacing: '-0.02em' }}>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── About + Testimonial ─── */}
        <section className="py-24 sm:py-32">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
              {/* About */}
              <div>
                <span className="text-xs font-semibold text-[#999] uppercase mb-6 block" style={{ letterSpacing: '0.06em' }}>
                  About Us
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] leading-[1.1] mb-6"
                  style={{ letterSpacing: '-0.04em' }}
                >
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

              {/* Founder + quote */}
              <div className="flex flex-col items-center lg:items-start gap-6">
                <div className="relative w-48 h-48 rounded-[24px] overflow-hidden">
                  <Image
                    src={IMG.founder}
                    alt="Jonny Davison — Founder, Yarn Digital"
                    fill
                    className="object-cover"
                  />
                </div>
                <blockquote className="text-center lg:text-left">
                  <p className="text-lg text-[#333] font-medium italic leading-relaxed mb-3" style={{ letterSpacing: '-0.02em' }}>
                    &ldquo;We build what we&apos;d want for our own business — fast, beautiful, and built to last.&rdquo;
                  </p>
                  <cite className="text-sm text-[#999] not-italic font-semibold" style={{ letterSpacing: '-0.02em' }}>
                    Jonny Davison, Founder
                  </cite>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Form Section ─── */}
        <section className="bg-[#0a0a0a] py-24 sm:py-32 relative overflow-hidden" ref={formRef}>
          {/* Subtle bg texture */}
          <div className="absolute inset-0 opacity-[0.04]">
            <Image src={IMG.heroBg} alt="" fill className="object-cover" />
          </div>

          <div className="relative z-10 max-w-[1520px] mx-auto px-6 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
              {/* Left — copy */}
              <div>
                <span className="text-xs font-semibold text-[#555] uppercase mb-6 block" style={{ letterSpacing: '0.06em' }}>
                  Get Started
                </span>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-[1.1] mb-6"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Let&apos;s see what&apos;s<br className="hidden sm:block" />
                  holding you back.
                </h2>
                <p className="text-base text-[#666] leading-relaxed mb-10" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  Fill in the form and we&apos;ll send you a free audit of your website —
                  performance, design, SEO, and conversion. No pitch, no strings.
                  Just honest insight from a team that does this every day.
                </p>
                <div className="space-y-4">
                  {[
                    '48-hour turnaround',
                    'No sales pitch — ever',
                    'Actionable recommendations',
                    'By real humans, not bots',
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Check size={13} className="text-white" />
                      </div>
                      <span className="text-sm text-[#888] font-medium" style={{ letterSpacing: '-0.02em' }}>
                        {t}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Logo mark */}
                <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
                  <Image src={IMG.logo} alt="YARN Digital" width={100} height={24} className="opacity-30" />
                </div>
              </div>

              {/* Right — form */}
              <div className="bg-[#111] rounded-[24px] p-8 sm:p-10 border border-[#1a1a1a]">
                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                        Request your free audit
                      </h3>
                      <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.02em' }}>
                        Takes 30 seconds. We&apos;ll do the rest.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-2 uppercase" style={{ letterSpacing: '0.04em' }}>
                          Your Name *
                        </label>
                        <input
                          type="text" required placeholder="Jonny Davison"
                          className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:border-[#555] transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-2 uppercase" style={{ letterSpacing: '0.04em' }}>
                          Business Name *
                        </label>
                        <input
                          type="text" required placeholder="Your Business Ltd"
                          className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:border-[#555] transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#555] mb-2 uppercase" style={{ letterSpacing: '0.04em' }}>
                        Website URL *
                      </label>
                      <input
                        type="text" required placeholder="yourwebsite.co.uk"
                        className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:border-[#555] transition-colors"
                        style={{ letterSpacing: '-0.02em' }}
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-2 uppercase" style={{ letterSpacing: '0.04em' }}>
                          Email *
                        </label>
                        <input
                          type="email" required placeholder="you@business.co.uk"
                          className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:border-[#555] transition-colors"
                          style={{ letterSpacing: '-0.02em' }}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#555] mb-2 uppercase" style={{ letterSpacing: '0.04em' }}>
                          Phone
                        </label>
                        <input
                          type="tel" placeholder="028 9000 0000"
                          className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-[#444] rounded-lg px-4 py-3 text-base font-medium focus:outline-none focus:border-[#555] transition-colors"
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
                      className="w-full bg-white text-[#0a0a0a] font-semibold text-base py-4 rounded-lg hover:bg-gray-100 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {status === 'submitting' ? (
                        <><Loader2 size={18} className="animate-spin" /> Sending...</>
                      ) : (
                        <>Send Me My Free Audit <ArrowRight size={16} /></>
                      )}
                    </button>

                    <p className="text-center text-xs text-[#444] font-medium" style={{ letterSpacing: '-0.01em' }}>
                      No sales pitch. No strings. Just an honest look at what&apos;s holding you back.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-[#f5f5f5] border-t border-[#e5e5e5] py-8">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Image src={IMG.logo} alt="YARN Digital" width={100} height={24} className="opacity-40" />
              <span className="text-xs font-medium text-[#999]" style={{ letterSpacing: '-0.02em' }}>
                © {new Date().getFullYear()} Belfast, Northern Ireland
              </span>
            </div>
            <div className="flex items-center gap-6">
              {['Instagram', 'LinkedIn', 'Facebook'].map((s) => (
                <a key={s} href={`https://www.yarndigital.co.uk`} className="text-xs font-medium text-[#999] hover:text-[#666] transition-colors" style={{ letterSpacing: '-0.02em' }}>
                  {s}
                </a>
              ))}
            </div>
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
