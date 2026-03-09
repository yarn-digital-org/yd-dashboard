'use client';

import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;   // < 640px
  isTablet: boolean;   // 640-1023px
  isDesktop: boolean;  // >= 1024px
  width: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setState({
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
        isDesktop: w >= 1024,
        width: w,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return state;
}
