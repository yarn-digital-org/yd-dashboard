import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Derry | Yarn Digital — Get Found on Google',
  description:
    'Local SEO in Derry and Londonderry from Yarn Digital. We help Derry businesses rank higher on Google with proven local SEO strategies. Free SEO review — no strings attached.',
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
