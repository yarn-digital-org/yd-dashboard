import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Belfast | Yarn Digital — Get Found on Google',
  description:
    'Belfast SEO services from Yarn Digital. We help local businesses rank higher on Google with proven SEO strategies. Free SEO audit — no strings attached.',
  openGraph: {
    title: 'SEO Belfast | Yarn Digital — Get Found on Google',
    description:
      'Your competitors are ranking above you. We fix that. Free SEO audit for Belfast businesses.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/seo-belfast',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SEOBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
