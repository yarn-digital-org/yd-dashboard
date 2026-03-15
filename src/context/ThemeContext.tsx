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
    bg: '#0F0F23',
    bgSecondary: '#1A1A2E',
    bgCard: '#1E1E3A',
    text: '#E0E0E0',
    textSecondary: '#A0A0B0',
    textMuted: '#6B6B80',
    border: '#2A2A4A',
    borderLight: '#1E1E3A',
    sidebarBg: '#0A0A1A',
    sidebarText: '#C0C0D0',
    sidebarHover: '#1A1A2E',
    inputBg: '#1A1A2E',
    inputBorder: '#2A2A4A',
    cardBg: '#1E1E3A',
    cardBorder: '#2A2A4A',
    accent: '#FF4422',
    accentHover: '#FF5533',
    badgeBg: '#2A2A4A',
    badgeText: '#C0C0D0',
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
