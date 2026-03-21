// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/case-study-pages
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: "Krumb Bakery — Case Study | Yarn Digital Belfast",
  description: "How Yarn Digital built Krumb Bakery's brand identity and Shopify e-commerce store. Handcrafted branding for Belfast's best sourdough.",
  alternates: { canonical: 'https://yd-dashboard.vercel.app/work/krumb-bakery' },
  openGraph: {
    title: "Krumb Bakery — Case Study | Yarn Digital Belfast",
    description: "How Yarn Digital built Krumb Bakery's brand identity and Shopify e-commerce store.",
    type: 'article',
    url: 'https://yd-dashboard.vercel.app/work/krumb-bakery',
  },
  robots: { index: true, follow: true },
};

export default function KrumbBakeryCaseStudy() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>

      {/* Hero */}
      <section className="relative min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png"
            alt="Krumb Bakery — brand and website"
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
            Case Study · Brand × E-Commerce
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-white leading-[1.05] mb-4" style={{ letterSpacing: '-0.04em' }}>
            Krumb Bakery
          </h1>
          <p className="text-base sm:text-lg text-white/60 max-w-xl" style={{ letterSpacing: '-0.01em' }}>
            Handcrafted branding and a Shopify store for Belfast&apos;s best sourdough.
          </p>
        </div>
      </section>

      {/* Results strip */}
      <section className="bg-[#111] border-y border-[#1a1a1a] py-10">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl">
            {[
              { stat: '↑', label: 'Online orders from day one' },
              { stat: '↑', label: 'Brand recognition in Belfast' },
              { stat: '↑', label: 'Repeat customer rate' },
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
                    { label: 'Client', value: 'Krumb Bakery' },
                    { label: 'Location', value: 'Belfast, Northern Ireland' },
                    { label: 'Services', value: 'Brand Identity, Shopify E-Commerce, Packaging Direction' },
                    { label: 'Platform', value: 'Shopify' },
                    { label: 'Result', value: 'Full brand + online store live from day one' },
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
                  Krumb Bakery had the product — Belfast&apos;s best sourdough — and a loyal word-of-mouth following. What they didn&apos;t have was a brand that matched the quality of what they were making, or an online presence that could grow the business beyond foot traffic and social media.
                </p>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4" style={{ letterSpacing: '-0.03em' }}>What We Did</h2>
                <p className="text-base text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                  We built Krumb&apos;s brand identity from the ground up — logo, colour palette, typography, and packaging direction. Everything was built around craft and warmth: the feeling of handmade, honest food made by people who care about what they do.
                </p>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  The Shopify store was built clean and fast — easy to manage, easy to order from, and designed to reflect the brand at every touchpoint. Product photography direction, collections architecture, and a checkout flow built to convert.
                </p>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4" style={{ letterSpacing: '-0.03em' }}>The Result</h2>
                <p className="text-base text-[#666] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>
                  The new site looks exactly like Krumb feels — handcrafted, honest, and loved by customers. Online orders came in from day one. The brand now works as hard as the bakers do, bringing in new customers every week and converting visitors who&apos;d never heard of Krumb before.
                </p>
              </div>

              {/* Image */}
              <div className="rounded-[24px] overflow-hidden border border-[#1a1a1a]">
                <Image
                  src="/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png"
                  alt="Krumb Bakery — brand identity and Shopify store"
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
            <h2 className="text-xl sm:text-2xl font-medium text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Ready to build a brand like this?</h2>
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
