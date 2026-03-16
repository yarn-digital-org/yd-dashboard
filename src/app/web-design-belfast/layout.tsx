import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Design Belfast | Yarn Digital',
  description:
    'Belfast\'s web design & SEO agency. We design, build, and grow websites that look great and actually bring in leads. Fast turnaround, local team, real results.',
  openGraph: {
    title: 'Web Design Belfast | Yarn Digital',
    description:
      'Belfast\'s web design & SEO agency. Fast turnaround, local team, real results.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/web-design-belfast',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebDesignBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
