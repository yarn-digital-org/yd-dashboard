import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Design Belfast | Yarn Digital — Design, Build, Grow',
  description:
    'Professional web design in Belfast from Yarn Digital. We build fast, modern websites for Belfast SMEs that convert visitors into customers. Free 30-min audit available.',
  openGraph: {
    title: 'Web Design Belfast | Yarn Digital — Design, Build, Grow',
    description:
      'Professional web design in Belfast. Fast, modern websites that convert. Free 30-min audit from Yarn Digital.',
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
