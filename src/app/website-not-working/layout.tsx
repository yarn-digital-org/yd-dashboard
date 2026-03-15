import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Website Not Converting? We Can Fix That | Yarn Digital Belfast',
  description: 'Is your website slow, outdated, or not bringing in customers? We fix underperforming websites. Free audit from Belfast\'s top digital studio.',
  openGraph: {
    title: 'Website Not Converting? We Can Fix That | Yarn Digital Belfast',
    description: 'Is your website slow, outdated, or not bringing in customers? Free audit from Belfast\'s top digital studio.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/website-not-working',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
