import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yarn Digital | Belfast Design & Growth Agency',
  description:
    'Yarn Digital — Belfast\'s design, build, and growth agency for ambitious SMEs. Brand & identity, web design, SEO, and paid ads.',
  openGraph: {
    title: 'Yarn Digital | Belfast Design & Growth Agency',
    description:
      'Belfast\'s design, build, and growth agency for ambitious SMEs.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/yarn-digital',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/yarn-digital',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function YarnDigitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
