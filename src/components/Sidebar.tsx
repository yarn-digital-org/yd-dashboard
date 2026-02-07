'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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
    { name: 'Dashboard', icon: '🏠', href: '/' },
    { name: 'Contacts', icon: '📇', href: '/contacts' },
    { name: 'Leads CRM', icon: '👥', href: '/leads' },
    { name: 'Content', icon: '📅', href: '/content' },
    { name: 'Settings', icon: '⚙️', href: '/settings' },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: isExpanded ? '220px' : '64px',
    minWidth: isExpanded ? '220px' : '64px',
    backgroundColor: '#F5F5F5',
    borderRight: '1px solid #E0E0E0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s ease, min-width 0.2s ease',
    height: '100vh',
    position: 'sticky',
    top: 0,
  };

  const logoStyle: React.CSSProperties = {
    padding: '1rem',
    borderBottom: '1px solid #E0E0E0',
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: '1rem 0.5rem',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.5rem',
    marginBottom: '0.25rem',
    backgroundColor: isActive ? '#FF3300' : 'transparent',
    color: isActive ? '#FFFFFF' : '#0A0A0A',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  });

  const bottomStyle: React.CSSProperties = {
    padding: '1rem',
    borderTop: '1px solid #E0E0E0',
  };

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={logoStyle}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isExpanded ? (
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0A0A0A' }}>
              YARN<span style={{ color: '#FF3300' }}>.</span> Dashboard
            </span>
          ) : (
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A' }}>
              Y<span style={{ color: '#FF3300' }}>.</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav style={navStyle}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={navItemStyle(isActive)}>
              <span>{item.icon}</span>
              {isExpanded && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && isExpanded && (
        <div style={{ padding: '0 1rem 0.5rem', borderTop: '1px solid #E0E0E0', paddingTop: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#7A7A7A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
          <p style={{ fontSize: '0.75rem', color: '#FF3300', fontWeight: 500, margin: '0.125rem 0 0', textTransform: 'capitalize' }}>{user.role}</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div style={bottomStyle}>
        <button
          onClick={() => window.location.reload()}
          style={{ ...navItemStyle(false), marginBottom: '0.25rem' }}
        >
          <span>🔄</span>
          {isExpanded && <span>Refresh</span>}
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ ...navItemStyle(false), marginBottom: '0.25rem' }}
        >
          <span>{isExpanded ? '◀' : '▶'}</span>
          {isExpanded && <span>Collapse</span>}
        </button>
        {user && (
          <button
            onClick={handleLogout}
            style={{ ...navItemStyle(false), color: '#DC2626' }}
          >
            <span>🚪</span>
            {isExpanded && <span>Logout</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
