'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  fontFamily: string;
  borderRadius: string;
}

const DEFAULT_BRAND: BrandSettings = {
  primaryColor: '#FF3300',
  secondaryColor: '#111827',
  accentColor: '#FF6633',
  logoUrl: '',
  fontFamily: 'Inter',
  borderRadius: 'medium',
};

const BrandContext = createContext<{
  brand: BrandSettings;
  loading: boolean;
  refresh: () => void;
}>({
  brand: DEFAULT_BRAND,
  loading: true,
  refresh: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const fetchBrand = async () => {
    try {
      const res = await fetch('/api/settings/branding');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setBrand({
            primaryColor: data.data.primaryColor || DEFAULT_BRAND.primaryColor,
            secondaryColor: data.data.secondaryColor || DEFAULT_BRAND.secondaryColor,
            accentColor: data.data.accentColor || DEFAULT_BRAND.accentColor,
            logoUrl: data.data.logoUrl || DEFAULT_BRAND.logoUrl,
            fontFamily: data.data.fontFamily || DEFAULT_BRAND.fontFamily,
            borderRadius: data.data.borderRadius || DEFAULT_BRAND.borderRadius,
          });
        }
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  return (
    <BrandContext.Provider value={{ brand, loading, refresh: fetchBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

/**
 * Get CSS border-radius value from setting
 */
export function getBorderRadius(setting: string): string {
  switch (setting) {
    case 'none': return '0px';
    case 'small': return '4px';
    case 'medium': return '8px';
    case 'large': return '12px';
    default: return '8px';
  }
}
