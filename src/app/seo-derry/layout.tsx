import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Derry | Yarn Digital — Get Found on Google',
  description:
    'Yarn Digital provides expert SEO services in Derry and Londonderry. We help local businesses rank on Google, get found by customers, and grow. Free SEO review included.',
  openGraph: {
    title: 'SEO Derry | Yarn Digital — Get Found on Google',
    description:
      'Your competitors are ranking above you. We fix that. Free SEO review for Derry businesses.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/seo-derry',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/seo-derry',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SEODerryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
