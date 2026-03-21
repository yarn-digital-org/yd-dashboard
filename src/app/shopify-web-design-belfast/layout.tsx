// PENDING APPROVAL — DO NOT DEPLOY TO MAIN
// Branch: feat/shopify-belfast
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopify Web Design Belfast | Yarn Digital',
  description:
    'Shopify web design for Belfast businesses. We build fast, mobile-ready stores that convert visitors into customers. Book a free call with Yarn Digital today.',
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/shopify-web-design-belfast',
  },
  openGraph: {
    title: 'Shopify Web Design Belfast | Yarn Digital',
    description:
      'Shopify web design for Belfast businesses. We build fast, mobile-ready stores that convert visitors into customers.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/shopify-web-design-belfast',
  },
  robots: { index: true, follow: true },
};

export default function ShopifyWebDesignBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
