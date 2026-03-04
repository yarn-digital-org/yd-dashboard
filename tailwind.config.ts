import type { Config } from "tailwindcss";

export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode (default)
        background: '#FFFFFF',
        foreground: '#0A0A0A',
        card: '#F5F5F5',
        'card-hover': '#EFEFEF',
        border: '#E0E0E0',
        primary: '#FF3300',
        'primary-hover': '#E62E00',
        secondary: '#7A7A7A',
        accent: '#D4D4D4',
        
        // Dark mode variants
        'dark-bg': '#0A0A0A',
        'dark-fg': '#FFFFFF',
        'dark-card': '#1A1A1A',
        'dark-card-hover': '#252525',
        'dark-border': '#2D2D2D',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
