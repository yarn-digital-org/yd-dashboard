import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Web Design Lisburn | Yarn Digital — Websites That Win You Customers',
  description:
    'Yarn Digital builds websites for Lisburn businesses — fast, mobile-first, built to convert. Free audit, 48-hour turnaround, Belfast-based team. No outsourcing.',
  openGraph: {
    title: 'Web Design Lisburn | Yarn Digital — Websites That Win You Customers',
    description:
      'Yarn Digital builds websites for Lisburn businesses — fast, mobile-first, built to convert. Free audit, 48-hour turnaround, Belfast-based team. No outsourcing.',
    type: 'website',
    url: 'https://yd-dashboard.vercel.app/web-design-lisburn',
  },
  alternates: {
    canonical: 'https://yd-dashboard.vercel.app/web-design-lisburn',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WebDesignLisburnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
