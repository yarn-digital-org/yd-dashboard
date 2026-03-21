import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Design Derry | Yarn Digital — Design, Build, Grow',
  description:
    'Professional web design in Derry from Yarn Digital. We build fast, modern websites for Derry SMEs that convert visitors into customers. Free 30-min consultation available.',
  openGraph: {
    title: 'Web Design Derry | Yarn Digital — Design, Build, Grow',
    description:
      'Professional web design in Derry. Fast, modern websites that convert. Free 30-min consultation from Yarn Digital.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/web-design-derry',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/web-design-derry',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebDesignDerryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
