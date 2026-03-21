// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/case-study-pages
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Work | Yarn Digital Belfast — Case Studies',
  description: 'See how Yarn Digital has helped Belfast businesses grow online. Brand, web design, SEO, and digital marketing case studies.',
  alternates: { canonical: 'https://yd-dashboard.vercel.app/work' },
  openGraph: {
    title: 'Our Work | Yarn Digital Belfast — Case Studies',
    description: 'See how Yarn Digital has helped Belfast businesses grow online.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/work',
  },
  robots: { index: true, follow: true },
};

const cases = [
  {
    slug: 'hills-restaurant',
    name: 'The Hills Restaurant',
    tags: 'Brand × Web Design',
    desc: 'Full rebrand and responsive site built to convert. More traffic, more bookings.',
    stat: '+38% organic traffic in 6 weeks · Reservations doubled · Bounce rate cut by half',
    image: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
  },
  {
    slug: 'krumb-bakery',
    name: 'Krumb Bakery',
    tags: 'Brand × E-Commerce',
    desc: "Handcrafted branding for Belfast's best sourdough. Shopify store built to sell.",
    stat: 'Full brand identity + Shopify e-commerce build',
    image: '/images/yd/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
  },
  {
    slug: 'react-clarity',
    name: 'React Clarity',
    tags: 'Brand × Development',
    desc: 'A clinical-grade brand for a health-tech startup. Professional, conversion-focused.',
    stat: 'Full brand identity + marketing site',
    image: '/images/yd/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
  },
];

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] font-sans antialiased" style={{ letterSpacing: '-0.02em' }}>
      <div className="max-w-[1520px] mx-auto px-5 sm:px-10 pt-24 sm:pt-32 pb-20">
        <div className="mb-14">
          <span className="text-[11px] font-semibold text-[#555] uppercase" style={{ letterSpacing: '0.08em' }}>Work</span>
          <h1 className="text-4xl sm:text-5xl font-medium text-white mt-4 mb-4" style={{ letterSpacing: '-0.04em' }}>
            Belfast businesses we&apos;ve helped grow.
          </h1>
          <p className="text-base text-[#555] max-w-xl" style={{ letterSpacing: '-0.01em' }}>
            Every project starts with understanding your business. Here&apos;s what we&apos;ve built for clients across Belfast.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((cs) => (
            <a key={cs.slug} href={`/work/${cs.slug}`} className="group bg-[#111] rounded-[24px] overflow-hidden border border-[#1a1a1a] hover:border-[#333] transition-colors block">
              <div className="aspect-[4/3] overflow-hidden">
                <Image src={cs.image} alt={cs.name} width={600} height={450} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5 sm:p-6">
                <h2 className="text-[15px] font-semibold text-white mb-1.5" style={{ letterSpacing: '-0.03em' }}>{cs.name}</h2>
                <p className="text-sm text-[#666] leading-relaxed mb-2" style={{ letterSpacing: '-0.01em' }}>{cs.desc}</p>
                <span className="text-[11px] font-medium text-[#444]" style={{ letterSpacing: '0.02em' }}>{cs.tags}</span>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-16 pt-10 border-t border-[#1a1a1a]">
          <a href="https://www.yarndigital.co.uk" className="text-sm text-white/40 hover:text-white/60 transition-colors" style={{ letterSpacing: '-0.01em' }}>
            ← Back to Yarn Digital
          </a>
        </div>
      </div>
    </main>
  );
}
