import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopify Web Design Belfast | Yarn Digital — E-Commerce That Sells',
  description:
    "Belfast's Shopify specialists. Fast, beautiful stores — designed to convert browsers into buyers, built to scale with your business.",
  openGraph: {
    title: 'Shopify Web Design Belfast | Yarn Digital — E-Commerce That Sells',
    description:
      "Belfast's Shopify specialists. Fast, beautiful stores — designed to convert browsers into buyers, built to scale with your business.",
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/shopify',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/shopify',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShopifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
