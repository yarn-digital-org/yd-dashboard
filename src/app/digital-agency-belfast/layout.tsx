import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Agency Belfast | Yarn Digital — Design, Build, Grow',
  description:
    "Yarn Digital is Belfast's full-service digital agency. Brand, web design, SEO, and digital marketing — all from one local team. Free audit available.",
  openGraph: {
    title: 'Digital Agency Belfast | Yarn Digital — Design, Build, Grow',
    description:
      "Yarn Digital is Belfast's full-service digital agency. Brand, web design, SEO, and digital marketing — all from one local team. Free audit available.",
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/digital-agency-belfast',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DigitalAgencyBelfastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
