import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase-admin';
import LandingPageRenderer from '@/components/LandingPageRenderer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicLandingPage({ params }: Props) {
  const { slug } = await params;

  if (!adminDb) return notFound();

  const snapshot = await adminDb.collection('landingPages')
    .where('slug', '==', slug)
    .where('published', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) return notFound();

  const doc = snapshot.docs[0];
  const page = { id: doc.id, ...doc.data() } as LandingPageData;

  // Track view: increment counter + log analytics event (fire-and-forget)
  const now = new Date().toISOString();
  Promise.all([
    adminDb.collection('landingPages').doc(doc.id).update({
      views: (page.views || 0) + 1,
    }),
    adminDb.collection('lp_analytics').add({
      pageId: doc.id,
      slug,
      userId: page.userId,
      type: 'view',
      timestamp: now,
      // UTM / referrer would be captured client-side; server has no access to query params here
    }),
  ]).catch(() => {});

  return <LandingPageRenderer page={page} />;
}

export interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  formFields?: string[];
  heroImage?: string;
  template?: string;
  published?: boolean;
  views?: number;
  leads?: number;
  userId?: string;
}
