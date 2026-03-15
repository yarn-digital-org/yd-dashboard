'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

// Color tokens for components using inline styles
export const themeColors = {
  light: {
    bg: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgCard: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    sidebarBg: '#FFFFFF',
    sidebarText: '#374151',
    sidebarHover: '#F3F4F6',
    inputBg: '#FFFFFF',
    inputBorder: '#D1D5DB',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    accent: '#FF3300',
    accentHover: '#E62E00',
    badgeBg: '#F3F4F6',
    badgeText: '#374151',
  },
  dark: {
    bg: '#0A0A0A',
    bgSecondary: '#141414',
    bgCard: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    border: '#2D2D2D',
    borderLight: '#1A1A1A',
    sidebarBg: '#0A0A0A',
    sidebarText: '#D0D0D0',
    sidebarHover: '#1A1A1A',
    inputBg: '#141414',
    inputBorder: '#2D2D2D',
    cardBg: '#1A1A1A',
    cardBorder: '#2D2D2D',
    accent: '#FF3300',
    accentHover: '#E62E00',
    badgeBg: '#2D2D2D',
    badgeText: '#D0D0D0',
  },
};

export function getColors(theme: Theme) {
  return themeColors[theme];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved preference
    const saved = localStorage.getItem('yd-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Apply to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yd-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Prevent flash: render with light theme colors on SSR
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
