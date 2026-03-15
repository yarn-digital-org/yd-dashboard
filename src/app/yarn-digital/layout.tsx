import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Yarn Digital | Belfast\'s Full-Service Digital Agency',
  description: 'Yarn Digital — branding, web design, SEO, and digital marketing from Belfast. We help ambitious businesses design, build, and grow online.',
  openGraph: {
    title: 'Yarn Digital | Belfast\'s Full-Service Digital Agency',
    description: 'Branding, web design, SEO, and digital marketing from Belfast. Design, Build, Grow.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/yarn-digital',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
