import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopify Web Design Belfast | Yarn Digital',
  description:
    'Shopify web design in Belfast from Yarn Digital. Fast, mobile-ready stores built to convert. Free 30-minute consultation — no obligation.',
  openGraph: {
    title: 'Shopify Web Design Belfast | Yarn Digital',
    description:
      'Shopify web design in Belfast from Yarn Digital. Fast, mobile-ready stores built to convert. Free 30-minute consultation — no obligation.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/shopify-web-design-belfast',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/shopify-web-design-belfast',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShopifyBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
