// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/case-study-pages
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'React Clarity — Case Study | Yarn Digital Belfast',
  description: 'How Yarn Digital built a clinical-grade brand identity and marketing site for React Clarity, a Belfast health-tech startup. Professional, conversion-focused.',
  alternates: { canonical: 'https://yd-dashboard.vercel.app/work/react-clarity' },
  openGraph: {
    title: 'React Clarity — Case Study | Yarn Digital Belfast',
    description: 'How Yarn Digital built a clinical-grade brand identity and marketing site for React Clarity.',
    type: 'article',
    url: 'https://yd-dashboard.vercel.app/work/react-clarity',
  },
  robots: { index: true, follow: true },
};

export default function ReactClarityCaseStudy() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>

      {/* Hero */}
      <section className="relative min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png"
            alt="React Clarity — brand and marketing site"
            fill
            className="object-cover"
            style={{ opacity: 0.4 }}
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 pt-24 pb-16 flex flex-col justify-end min-h-[60vh]">
          <a href="/work" className="text-xs text-white/40 hover:text-white/60 transition-colors mb-8 inline-flex items-center gap-2" style={{ letterSpacing: '0.02em' }}>
            ← All Work
          </a>
          <span className="text-[11px] font-semibold text-[#555] uppercase mb-4 block" style={{ letterSpacing: '0.08em' }}>
            Case Study · Brand × Development
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-[1.05] mb-4" style={{ letterSpacing: '-0.04em' }}>
            React Clarity
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-xl" style={{ letterSpacing: '-0.01em' }}>
            A clinical-grade brand and marketing site for a health-tech startup that needed to earn trust fast.
          </p>
        </div>
      </section>

      {/* Results strip */}
      <section className="bg-[#111] border-y border-[#1a1a1a] py-10">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl">
            {[
              { stat: '↑', label: 'Investor confidence from launch' },
              { stat: '↑', label: 'Platform daily active users' },
              { stat: '↑', label: 'B2B conversion rate' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white" style={{ letterSpacing: '-0.04em' }}>{s.stat}</div>
                <div className="text-xs text-[#555] mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-20">

            {/* Sidebar */}
            <div>
              <div className="sticky top-24">
                <h2 className="text-[11px] font-semibold text-[#555] uppercase mb-6" style={{ letterSpacing: '0.08em' }}>Project Details</h2>
                <dl className="space-y-4">
                  {[
                    { label: 'Client', value: 'React Clarity' },
                    { label: 'Location', value: 'Belfast, Northern Ireland' },
                    { label: 'Services', value: 'Brand Identity, Web Application, Marketing Site' },
                    { label: 'Sector', value: 'Health Technology' },
                    { label: 'Result', value: 'Platform used daily by the team from day one' },
                  ].map((item, i) => (
                    <div key={i}>
                      <dt className="text-[11px] font-semibold text-[#444] uppercase" style={{ letterSpacing: '0.04em' }}>{item.label}</dt>
                      <dd className="text-sm text-white/70 mt-0.5" style={{ letterSpacing: '-0.01em' }}>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4" style={{ letterSpacing: '-0.03em' }}>The Challenge</h2>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  React Clarity is a health-tech startup working in a space where trust is everything. They needed a brand and digital presence that could hold its own alongside established clinical software providers — professional, precise, and immediately credible. The existing identity wasn&apos;t getting them through the door.
                </p>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4" style={{ letterSpacing: '-0.03em' }}>What We Did</h2>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                  We built a clinical-grade brand identity — clean, precise, and built around the language of health tech. The colour system, typography, and visual language were all designed to signal professionalism and accuracy without feeling cold or inaccessible.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  The marketing site was built to convert B2B leads — clear value proposition above the fold, social proof positioned correctly, and a demo request flow that reduced friction. The web application design followed the same system for consistency across every touchpoint.
                </p>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4" style={{ letterSpacing: '-0.03em' }}>The Result</h2>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  Straightforward, fast, and they delivered exactly what they promised. The platform is used by the React Clarity team every day. The brand now opens doors that the old identity couldn&apos;t — credible, professional, and built to scale with the business.
                </p>
              </div>

              {/* Image */}
              <div className="rounded-[24px] overflow-hidden border border-[#1a1a1a]">
                <Image
                  src="/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png"
                  alt="React Clarity — brand identity and web application"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111] border-t border-[#1a1a1a] py-16 sm:py-20">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-medium text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Ready to build something like this?</h2>
            <p className="text-sm text-[#555]" style={{ letterSpacing: '-0.01em' }}>Free audit. 48-hour turnaround. No pitch.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/free-audit" className="bg-[#e63312] text-white font-semibold text-[15px] px-8 py-3.5 rounded-full hover:bg-[#cc2b0e] transition-all inline-flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
              Book My Free Audit <ArrowRight size={15} />
            </a>
            <a href="/work" className="border border-white/20 text-white/60 font-medium text-[15px] px-8 py-3.5 rounded-full hover:border-white/40 hover:text-white transition-all" style={{ letterSpacing: '-0.02em' }}>
              See All Work
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-6">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-baseline gap-0.5 opacity-60">
            <span className="text-[16px] font-bold text-white tracking-tight">YARN</span>
            <span className="text-[16px] font-bold text-[#e63312]">.</span>
            <span className="text-[10px] font-normal text-white/80 ml-0.5">Digital</span>
          </div>
          <span className="text-[11px] font-semibold text-[#333]" style={{ letterSpacing: '-0.02em' }}>Design, Build, Grow</span>
        </div>
      </footer>
    </main>
  );
}
