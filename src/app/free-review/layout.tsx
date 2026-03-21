import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Website Review | Yarn Digital Belfast',
  description:
    '70% of clicks go to the top 3 Google results. If you\'re not there, your competitors are. Get a free review from Belfast\'s digital specialists.',
  openGraph: {
    title: 'Free Website Review | Yarn Digital Belfast',
    description:
      'Your customers are searching. Are they finding you? Get a free review — see where you rank vs competitors.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/free-review',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/free-review',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FreeReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
