import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local SEO Belfast | Yarn Digital — Get Found on Google',
  description:
    'Local SEO Belfast from Yarn Digital. We help Belfast businesses rank higher on Google with proven local SEO strategies. Free SEO audit — no strings attached.',
  openGraph: {
    title: 'Local SEO Belfast | Yarn Digital — Get Found on Google',
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
