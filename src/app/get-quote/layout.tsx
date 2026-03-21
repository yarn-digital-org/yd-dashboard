import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get a Free Quote | Yarn Digital Belfast',
  description:
    'A well-designed website isn\'t a cost — it\'s your best salesperson. Get a free, no-obligation quote from Belfast\'s full-service digital agency.',
  openGraph: {
    title: 'Get a Free Quote | Yarn Digital Belfast',
    description:
      'Your website should be working harder. Fixed-price quotes, delivered in 4–6 weeks. Get started today.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/get-quote',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/get-quote',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GetQuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
