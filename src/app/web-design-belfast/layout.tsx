import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Design & SEO Belfast | Yarn Digital',
  description: 'Professional web design and SEO services in Belfast. We build fast, beautiful websites that rank and convert. Get a free consultation today.',
  openGraph: {
    title: 'Web Design & SEO Belfast | Yarn Digital',
    description: 'Professional web design and SEO services in Belfast. Fast, beautiful websites that rank and convert.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/web-design-belfast',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
