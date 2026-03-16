'use client';
import Script from 'next/script';

const GOOGLE_ADS_ID = 'AW-11545423816';

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  if (!measurementId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}

/** Fire Google Ads conversion event on lead form submission */
export function trackGoogleAdsConversion() {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/1yq4CNr-3okcEMjfpIEr`,
    });
  }
}
