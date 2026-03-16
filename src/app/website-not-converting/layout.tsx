import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Website Not Converting? | Free Review | Yarn Digital Belfast',
  description:
    'Your website is getting visitors but not leads? We find the exact problem and fix it. Free 30-minute website review from Belfast\'s digital agency.',
  openGraph: {
    title: 'Website Not Converting? | Free Review | Yarn Digital Belfast',
    description:
      'Most Belfast business websites leak leads. We find the exact problem and fix it. Free website review.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/website-not-converting',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebsiteNotConvertingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
