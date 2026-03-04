'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Contact,
  FileText,
  Receipt,
  FileSignature,
  MessageSquare,
  Calendar,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FormInput
} from 'lucide-react';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Leads', icon: Users, href: '/leads' },
    { name: 'Projects', icon: FolderKanban, href: '/projects' },
    { name: 'Contacts', icon: Contact, href: '/contacts' },
    { name: 'Forms', icon: FormInput, href: '/forms' },
    { name: 'Invoices', icon: Receipt, href: '/invoices' },
    { name: 'Contracts', icon: FileSignature, href: '/contracts' },
    { name: 'Messages', icon: MessageSquare, href: '/messages' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Automations', icon: Zap, href: '/automations' },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: isExpanded ? '240px' : '72px',
    minWidth: isExpanded ? '240px' : '72px',
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease, min-width 0.2s ease',
    height: '100vh',
    position: 'sticky',
    top: 0,
  };

  const logoStyle: React.CSSProperties = {
    padding: '1.25rem 1rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: '1rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflowY: 'auto',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: isActive ? '#FF3300' : 'transparent',
    color: isActive ? '#FFFFFF' : '#374151',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  });

  const bottomStyle: React.CSSProperties = {
    padding: '0.75rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  const userStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  };

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#FF3300',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.875rem',
    flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={logoStyle}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#FF3300',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '1rem',
        }}>
          Y
        </div>
        {isExpanded && (
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
            Yarn Digital
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={navItemStyle(isActive)}>
              <Icon size={20} />
              {isExpanded && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div style={{ padding: '0 0.75rem 0.5rem' }}>
        <Link href="/settings" style={navItemStyle(pathname.startsWith('/settings'))}>
          <Settings size={20} />
          {isExpanded && <span>Settings</span>}
        </Link>
      </div>

      {/* Bottom Controls */}
      <div style={bottomStyle}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ ...navItemStyle(false), color: '#6B7280' }}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {isExpanded && <span>Collapse</span>}
        </button>
      </div>

      {/* User info */}
      {user && (
        <div style={userStyle}>
          <div style={avatarStyle}>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {isExpanded && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#111827', 
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email?.split('@')[0] || 'User'}
              </p>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6B7280', 
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email}
              </p>
            </div>
          )}
          {isExpanded && (
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                cursor: 'pointer',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '0.375rem',
                transition: 'color 0.15s',
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
