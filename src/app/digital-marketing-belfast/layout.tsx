import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Marketing Belfast | Yarn Digital — Strategy, SEO & Paid Media',
  description:
    'Yarn Digital delivers digital marketing for Belfast SMEs — SEO, Google Ads, content, and social media from one local team. Free audit, no pitch.',
  openGraph: {
    title: 'Digital Marketing Belfast | Yarn Digital — Strategy, SEO & Paid Media',
    description:
      'Yarn Digital delivers digital marketing for Belfast SMEs — SEO, Google Ads, content, and social media from one local team. Free audit, no pitch.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/digital-marketing-belfast',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DigitalMarketingBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
