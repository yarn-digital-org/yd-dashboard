import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BrandProvider } from "@/context/BrandContext";
import { CookieConsent } from "@/components/CookieConsent";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yarn Digital - Dashboard",
  description: "Yarn Digital Dashboard - CRM & Content Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('yd-theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0, minHeight: '100vh' }}>
        <ThemeProvider>
          <AuthProvider>
            <BrandProvider>
            {children}
            <BottomNav />
            <CookieConsent />
            </BrandProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
