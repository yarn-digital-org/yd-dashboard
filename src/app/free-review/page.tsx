import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';
import Image from 'next/image';
import ReviewForm from './ReviewForm';
import { ForceLightTheme } from '@/components/ForceLightTheme';
import PageViewTracker from '@/components/PageViewTracker';
import MetaPixel from '@/components/MetaPixel';

const IMG = {
  heroBg: '/images/yd/d2waLq2nwXqrYR11yjS6gYIdocM.png',
  hillsMockup: '/images/yd/wtOblvlwQViPkZXQy7otlTIMaMQ.png',
};

export default function FreeReviewPage() {
  return (
    <>
      <ForceLightTheme />
      <PageViewTracker page="free-review" />
      <MetaPixel />

      <main
        className="min-h-screen bg-[#0a0a0a] font-sans antialiased landing-page"
        style={{ letterSpacing: '-0.02em' }}
      >
        {/* ─── HERO + FORM (above the fold) ─── */}
        <section id="top" className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={IMG.heroBg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center grayscale"
              style={{ opacity: 0.35 }}
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/40 to-[#0a0a0a]" />

          <div className="relative z-10 max-w-[1520px] mx-auto px-5 sm:px-10 pt-16 sm:pt-20 pb-16">
            {/* Logo */}
            <div className="mb-12 sm:mb-16">
              <a href="https://www.yarndigital.co.uk" className="inline-flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight">YARN</span>
                  <span className="text-[22px] sm:text-[26px] font-bold text-[#e63312]">.</span>
                  <span className="text-[13px] sm:text-[15px] font-normal text-white/80 ml-1" style={{ letterSpacing: '-0.01em' }}>Digital</span>
                </div>
                <span className="text-[10px] text-white/40 font-medium mt-0.5" style={{ letterSpacing: '0.02em' }}>Design, Build, Grow</span>
              </a>
            </div>

            {/* Hero content + form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div className="pt-4">
                <h1
                  className="text-[2.5rem] sm:text-5xl lg:text-[3.75rem] font-medium text-white leading-[1.05] mb-6"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  Your Customers
                  <br />
                  Are Searching.
                  <br />
                  Are They Finding
                  <br />
                  You?
                </h1>
                <p
                  className="text-base sm:text-lg text-white/50 leading-relaxed max-w-md mb-8"
                  style={{ letterSpacing: '-0.01em', fontWeight: 400 }}
                >
                  70% of clicks go to the top 3 Google results. If you&apos;re not there,
                  your competitors are. We&apos;ll show you exactly where you stand — and how
                  to fix it.
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs text-[#666] ml-1 font-medium">5.0</span>
                  </div>
                  <span className="text-xs text-[#555] font-medium">Local specialists — Belfast &amp; NI</span>
                  <span className="text-xs text-[#555] font-medium">No sales pitch. Ever.</span>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-[24px] p-6 sm:p-8 lg:p-10">
                <h2 className="text-xl sm:text-2xl font-medium text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
                  Claim your free review
                </h2>
                <p className="text-sm text-[#555] font-medium mb-6">
                  Takes 30 seconds. Delivered within 48 hours.
                </p>
                <ReviewForm />
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHAT HAPPENS NEXT ─── */}
        <section className="py-20 sm:py-24 bg-[#0a0a0a]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-white mb-12 text-center" style={{ letterSpacing: '-0.03em' }}>
              What happens next
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-[#1a1a1a]">
              {[
                { num: '01', title: 'Submit your details', desc: '30 seconds — name, email, and your website URL.' },
                { num: '02', title: 'We review everything', desc: 'Rankings, SEO health, page speed, mobile experience, and competitors.' },
                { num: '03', title: 'Get your report', desc: 'Clear findings and a prioritised action plan, in your inbox within 48 hours.' },
              ].map((step, i) => (
                <div key={i} className={`py-8 md:px-8 ${i === 0 ? 'md:pl-0' : ''} ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#1a1a1a]' : ''}`}>
                  <span className="text-[40px] font-medium text-[#222] leading-none block mb-4" style={{ letterSpacing: '-0.04em' }}>{step.num}</span>
                  <h3 className="text-lg font-semibold text-white mb-2" style={{ letterSpacing: '-0.03em' }}>{step.title}</h3>
                  <p className="text-sm text-[#555] leading-relaxed" style={{ letterSpacing: '-0.01em' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SOCIAL PROOF ─── */}
        <section className="py-20 sm:py-24 bg-[#0a0a0a] border-t border-[#1a1a1a]">
          <div className="max-w-3xl mx-auto px-5 sm:px-10 text-center">
            <p className="text-[11px] font-semibold text-[#555] uppercase mb-8" style={{ letterSpacing: '0.08em' }}>
              Join 50+ Belfast businesses who&apos;ve already got their free review
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-14">
              {['The Hills Restaurant', 'Krumb Bakery', 'React Clarity', 'Stonebridge Farm'].map((name) => (
                <span key={name} className="text-sm text-[#444] font-medium" style={{ letterSpacing: '-0.02em' }}>{name}</span>
              ))}
            </div>
            <blockquote>
              <span className="text-4xl text-[#222] leading-none block mb-4">&ldquo;</span>
              <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-4" style={{ letterSpacing: '-0.02em' }}>
                Yarn Digital rebuilt our website from scratch. Within a month we had more enquiries than the whole previous year.
              </p>
              <cite className="text-sm text-[#555] not-italic font-semibold">— Stonebridge Farm</cite>
            </blockquote>
          </div>
        </section>

        {/* ─── CASE STUDY ─── */}
        <section className="py-20 sm:py-24 bg-[#0a0a0a] border-t border-[#1a1a1a]">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[11px] font-semibold text-[#555] uppercase mb-6 block" style={{ letterSpacing: '0.08em' }}>Case Study</span>
                <h2 className="text-2xl sm:text-3xl font-medium text-white leading-[1.15] mb-4" style={{ letterSpacing: '-0.03em' }}>
                  The Hills Restaurant
                </h2>
                <p className="text-base text-[#555] leading-relaxed mb-8" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
                  A quality restaurant with a website that made it look average. We redesigned everything — brand, photography direction, and a fully responsive site built to convert.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { stat: '+38%', label: 'Organic traffic' },
                    { stat: '2×', label: 'Reservations' },
                    { stat: '−50%', label: 'Bounce rate' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl sm:text-3xl font-medium text-white" style={{ letterSpacing: '-0.03em' }}>{s.stat}</div>
                      <div className="text-xs text-[#555] mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Image src={IMG.hillsMockup} alt="The Hills Restaurant — responsive website mockup" width={700} height={467} className="w-full h-auto rounded-[24px]" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="py-20 sm:py-28 bg-[#0a0a0a] border-t border-[#1a1a1a]">
          <div className="max-w-2xl mx-auto px-5 sm:px-10 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white leading-[1.1] mb-4" style={{ letterSpacing: '-0.03em' }}>
              Stop losing customers to your competitors.
            </h2>
            <p className="text-base text-white/40 mb-8" style={{ letterSpacing: '-0.02em', fontWeight: 500 }}>
              Get a clear picture of where you stand — and how to fix it.
            </p>
            <a href="#top"
              className="bg-[#e63312] text-white font-semibold text-[15px] px-10 py-4 rounded-full hover:bg-[#cc2b0e] transition-all inline-flex items-center gap-2"
              style={{ letterSpacing: '-0.02em' }}>
              Claim Your Free Review
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-6">
          <div className="max-w-[1520px] mx-auto px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-0.5 opacity-60">
                <span className="text-[16px] font-bold text-white tracking-tight">YARN</span>
                <span className="text-[16px] font-bold text-[#e63312]">.</span>
                <span className="text-[10px] font-normal text-white/80 ml-0.5">Digital</span>
              </div>
              <span className="text-[11px] font-medium text-[#555]">© 2025 Belfast, Northern Ireland</span>
            </div>
            <span className="text-[11px] font-semibold text-[#333]" style={{ letterSpacing: '-0.02em' }}>Design, Build, Grow</span>
          </div>
        </footer>
      </main>
    </>
  );
}
