import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Website Audit | Yarn Digital Belfast',
  description:
    'Get a free, no-obligation website audit from Belfast\'s full-service digital agency. We\'ll tell you what\'s working, what isn\'t, and what to fix first.',
  openGraph: {
    title: 'Free Website Audit | Yarn Digital Belfast',
    description:
      'Your website should be winning you customers. Is it? Get a free audit — no sales pitch, no strings.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/free-audit',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/free-audit',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FreeAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
