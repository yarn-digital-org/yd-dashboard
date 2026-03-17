'use client';
import { trackGoogleAdsConversion } from '@/components/GoogleAnalytics';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Star, CheckCircle, ArrowRight, Loader2, Search, TrendingUp, BarChart3 } from 'lucide-react';
import { ForceLightTheme } from '@/components/ForceLightTheme';

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

function LeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    website: '',
    email: '',
    phone: '',
    message: '',
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
          source: 'landing-page-grow',
          ...utm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      trackLead(); trackGoogleAdsConversion();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-extrabold text-[#0a0a0a] mb-2">
          We&apos;ve got your details.
        </h3>
        <p className="text-gray-600 text-lg">
          We&apos;ll be in touch within 1 business day with your free SEO audit.
          <br />Belfast-based and easy to talk to.
        </p>
      </div>
    );
  }

  const inputClasses =
    'w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0a0a0a] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff3300] focus:border-transparent text-base';
  const labelClasses = 'block text-sm font-semibold text-[#0a0a0a] mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelClasses}>Your Name *</label>
          <input id="name" type="text" required placeholder="Jonny Davison" className={inputClasses}
            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor="company" className={labelClasses}>Business Name *</label>
          <input id="company" type="text" required placeholder="Your Business Ltd" className={inputClasses}
            value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
        </div>
      </div>

      <div>
        <label htmlFor="website" className={labelClasses}>Website URL *</label>
        <input id="website" type="text" required placeholder="yourwebsite.co.uk" className={inputClasses}
          value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={labelClasses}>Email *</label>
          <input id="email" type="email" required placeholder="you@business.co.uk" className={inputClasses}
            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClasses}>Phone (optional)</label>
          <input id="phone" type="tel" placeholder="028 9000 0000" className={inputClasses}
            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClasses}>What are you trying to rank for? (optional)</label>
        <textarea id="message" rows={3} placeholder="e.g. 'restaurant Belfast', 'plumber near me'..." className={inputClasses + ' resize-none'}
          value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
      </div>

      {status === 'error' && <p className="text-red-600 text-sm">{errorMsg}</p>}

      <button type="submit" disabled={status === 'submitting'}
        className="w-full bg-[#ff3300] hover:bg-[#e62e00] text-white font-extrabold text-lg py-4 px-8 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {status === 'submitting' ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Sending...</>
        ) : (
          <>Get My Free SEO Audit<ArrowRight className="w-5 h-5" /></>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        No sales pitch. No strings. Just the data on where you stand in search.
      </p>
    </form>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="mb-3 text-[#ff3300]">{icon}</div>
      <h3 className="text-xl font-extrabold text-[#0a0a0a] mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function CaseStudy({ name, situation, work, result }: { name: string; situation: string; work: string; result: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-extrabold text-[#0a0a0a] mb-3">{name}</h3>
      <div className="space-y-2 text-gray-600 leading-relaxed">
        <p><span className="font-semibold text-[#0a0a0a]">The situation:</span> {situation}</p>
        <p><span className="font-semibold text-[#0a0a0a]">What we did:</span> {work}</p>
        <p><span className="font-semibold text-[#ff3300]">The result:</span> {result}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-extrabold text-[#ff3300]">{number}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function GrowLandingPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <MetaPixelScript />
      <ForceLightTheme />
      <main className="min-h-screen">
        {/* HERO */}
        <section className="bg-[#0a0a0a] text-white">
          <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Getting Found Online
              <br />
              <span className="text-[#ff3300]">Shouldn&apos;t Be This Hard.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Your competitors are showing up on Google. You&apos;re not.
              We&apos;ll show you exactly why — and what to fix first. For free.
            </p>
            <button onClick={scrollToForm}
              className="bg-[#ff3300] hover:bg-[#e62e00] text-white font-extrabold text-lg py-4 px-10 rounded-lg transition-colors inline-flex items-center gap-2">
              Get My Free SEO Audit<ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-gray-500 text-sm mt-4">
              No sales pitch. No strings. Just the data on where you stand.
            </p>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="bg-[#111] text-white py-6">
          <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
            </div>
            <p className="text-gray-300 text-sm sm:text-base">
              &ldquo;Significant increase in organic traffic. Bookings grew substantially.&rdquo;
              <span className="text-gray-500"> — The Hills Restaurant, Belfast</span>
            </p>
          </div>
        </section>

        {/* STATS */}
        <section className="bg-white py-12">
          <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-6">
            <StatCard number="↑" label="More Traffic" />
            <StatCard number="2×" label="Online Bookings" />
            <StatCard number="−50%" label="Bounce Rate" />
          </div>
        </section>

        {/* PROBLEM */}
        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-6">
              A Great Business Nobody Can Find.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              You&apos;ve got a solid website. You&apos;re good at what you do. But when someone
              searches for your service in Belfast, your competitors show up first. You&apos;re
              relying on word-of-mouth and hope — instead of a strategy.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              SEO isn&apos;t magic. It&apos;s a system. And right now, your competitors are using it
              while you&apos;re not.
            </p>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-10 text-center">
              Measurable Growth. Not Guesswork.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ServiceCard
                icon={<Search className="w-8 h-8" />}
                title="SEO Strategy"
                description="We audit your site, research your keywords, and build a plan to get you ranking for the searches that actually bring in customers."
              />
              <ServiceCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Content & Authority"
                description="Blog content, local citations, backlinks — we build the signals Google needs to trust your site and rank it higher."
              />
              <ServiceCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Tracking & Reporting"
                description="Monthly reports you can actually understand. Traffic, rankings, enquiries — you'll see exactly what's working and what's next."
              />
            </div>
          </div>
        </section>

        {/* PROOF */}
        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-10 text-center">
              Growth You Can Measure.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CaseStudy
                name="The Hills Restaurant"
                situation="Solid food, loyal regulars, but invisible on Google."
                work="Technical SEO fix, local optimisation, content strategy targeting 'restaurant Belfast' keywords."
                result="Significant increase in organic traffic. Bounce rate halved. Online bookings grew substantially."
              />
              <CaseStudy
                name="Krumb Bakery"
                situation="Belfast's best sourdough — but nobody was finding them online."
                work="Google Business Profile optimisation, local SEO, review strategy."
                result="First page for 'bakery Belfast'. New customers walking in saying they found them on Google."
              />
              <CaseStudy
                name="Stonebridge Farm"
                situation="Strong community following, but no organic traffic from search."
                work="Content strategy built around their story — local food, provenance, farm-to-table."
                result="Organic traffic growth and a content engine that keeps bringing in new customers."
              />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-6">
              Belfast-Based. Results-Obsessed.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Yarn Digital is a full-service studio led by Jonny Davison. We help ambitious SMEs
              across Belfast and Northern Ireland get found online — with SEO strategies that
              actually move the needle.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We&apos;re not a faceless agency. We know your market, we speak your language,
              and we report in plain English — not jargon.
            </p>
          </div>
        </section>

        {/* FORM CTA */}
        <section className="bg-white py-16 sm:py-20" ref={formRef}>
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a] mb-4">
                Want to Know Where You Stand on Google?
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Get a free SEO audit. We&apos;ll check your rankings, your competitors, your
                technical setup, and tell you the three things we&apos;d fix first. No obligation.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
              <LeadForm />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#0a0a0a] text-gray-500 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center text-sm">
            <p className="font-semibold text-gray-400 mb-1">
              Yarn Digital LTD &middot; Belfast, Northern Ireland
            </p>
            <p>Design. Build. Grow.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

function MetaPixelScript() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (id) setPixelId(id);
  }, []);
  if (!pixelId) return null;
  return (
    <script dangerouslySetInnerHTML={{
      __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
    }} />
  );
}
