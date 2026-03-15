import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import LandingPageRenderer from '@/components/LandingPageRenderer';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Weighted random variant selection.
 * Falls back to control (index 0) if no variants or weights don't sum > 0.
 */
function pickVariant(variants: LandingPageVariant[]): LandingPageVariant {
  if (!variants || variants.length === 0) return { id: 'control', label: 'Control', weight: 100 };
  const totalWeight = variants.reduce((s, v) => s + (v.weight ?? 1), 0);
  let rand = Math.random() * totalWeight;
  for (const v of variants) {
    rand -= v.weight ?? 1;
    if (rand <= 0) return v;
  }
  return variants[0];
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

  // A/B variant selection — persist via cookie so same visitor gets same variant
  let variantId = 'control';
  let activeVariant: LandingPageVariant | null = null;

  if (page.variants && page.variants.length > 1) {
    const cookieStore = await cookies();
    const cookieKey = `ab_${doc.id}`;
    const existingVariant = cookieStore.get(cookieKey)?.value;

    if (existingVariant) {
      variantId = existingVariant;
      activeVariant = page.variants.find(v => v.id === existingVariant) || null;
    } else {
      const picked = pickVariant(page.variants);
      variantId = picked.id;
      activeVariant = picked;
      // Cookie will be set client-side (we can't set cookies in RSC response here without headers)
    }
  } else if (page.variants && page.variants.length === 1) {
    activeVariant = page.variants[0];
    variantId = activeVariant.id;
  }

  // Merge variant overrides into page data
  const renderedPage: LandingPageData = activeVariant ? {
    ...page,
    headline: activeVariant.headline || page.headline,
    subheadline: activeVariant.subheadline ?? page.subheadline,
    ctaText: activeVariant.ctaText || page.ctaText,
    activeVariantId: variantId,
  } : { ...page, activeVariantId: 'control' };

  // Track view (fire-and-forget)
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
      variantId,
      timestamp: now,
    }),
  ]).catch(() => {});

  return <LandingPageRenderer page={renderedPage} />;
}

export interface LandingPageVariant {
  id: string;          // e.g. 'control', 'variant_a', 'variant_b'
  label: string;       // Human name e.g. 'Control', 'Variant A'
  weight: number;      // 0–100 relative weight for traffic split
  headline?: string;   // Override main headline
  subheadline?: string;
  ctaText?: string;
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
  variants?: LandingPageVariant[];
  activeVariantId?: string;   // Set at render time
  abTestEnabled?: boolean;
}
