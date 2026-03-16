import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Website Not Working? | Free Review | Yarn Digital Belfast',
  description: 'Your website is getting visitors but the phone isn\'t ringing. We find exactly where you\'re losing leads and fix it. Free 30-minute review from Belfast\'s top digital studio.',
  openGraph: {
    title: 'Website Not Working? | Free Review | Yarn Digital Belfast',
    description: 'Your website is getting visitors but the phone isn\'t ringing. Free 30-minute review from Belfast\'s top digital studio.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/website-not-working',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
