import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Lisburn | Yarn Digital — Local SEO for Lisburn Businesses',
  description:
    'Yarn Digital provides local SEO for Lisburn businesses. Rank higher on Google, get more local leads. Free audit, 48-hour turnaround, no sales pitch.',
  openGraph: {
    title: 'SEO Lisburn | Yarn Digital — Local SEO for Lisburn Businesses',
    description:
      'Yarn Digital provides local SEO for Lisburn businesses. Rank higher on Google, get more local leads. Free audit, 48-hour turnaround, no sales pitch.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/seo-lisburn',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/seo-lisburn',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SEOLisburnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
