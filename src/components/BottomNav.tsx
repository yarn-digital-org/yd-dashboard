'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  MessageSquare,
  Calendar,
  Mail,
} from 'lucide-react';

const navItems = [
  { name: 'Home', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Leads', icon: Users, href: '/leads' },
  { name: 'Projects', icon: FolderKanban, href: '/projects' },
  { name: 'Email', icon: Mail, href: '/gmail' },
  { name: 'Messages', icon: MessageSquare, href: '/messages' },
  { name: 'Calendar', icon: Calendar, href: '/calendar' },
];

export function BottomNav() {
  const { isMobile } = useResponsive();
  const pathname = usePathname();
  const { user } = useAuth();

  // Only show for authenticated users on mobile
  if (!isMobile || !user) return null;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '8px 12px',
              minWidth: '56px',
              minHeight: '44px',
              textDecoration: 'none',
              color: isActive ? '#FF3300' : '#6B7280',
              borderRadius: '8px',
              transition: 'color 0.15s',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: '0.625rem',
              fontWeight: isActive ? 600 : 400,
              lineHeight: 1,
            }}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
