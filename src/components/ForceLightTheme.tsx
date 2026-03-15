'use client';

import { useEffect } from 'react';

/**
 * Forces light theme on landing pages by removing the dark data-theme attribute.
 * Restores the user's original theme preference on unmount.
 */
export function ForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const originalTheme = html.getAttribute('data-theme');

    // Force light
    html.removeAttribute('data-theme');

    return () => {
      // Restore on navigation away
      if (originalTheme) {
        html.setAttribute('data-theme', originalTheme);
      }
    };
  }, []);

  return null;
}
