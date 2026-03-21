import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Consultation | Yarn Digital Belfast',
  description:
    'Web design, branding, SEO, and marketing that drives real business results. Book a free 30-minute consultation with Belfast\'s strategy-first digital agency.',
  openGraph: {
    title: 'Free Consultation | Yarn Digital Belfast',
    description:
      'Belfast\'s strategy-first digital agency. Trusted by SMEs across NI. Book a free consultation — no obligation.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/free-consultation',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/free-consultation',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FreeConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
