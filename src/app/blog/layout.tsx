import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Yarn Digital Belfast',
  description: 'Practical advice on web design, SEO, and digital marketing for Belfast businesses.',
  openGraph: {
    title: 'Blog | Yarn Digital Belfast',
    description: 'Practical advice on web design, SEO, and digital marketing for Belfast businesses.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/blog',
  },
  robots: { index: true, follow: true },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
