import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gmail | Yarn Digital Dashboard',
  description: 'Email inbox',
};

export default function GmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
