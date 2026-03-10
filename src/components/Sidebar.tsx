'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Contact,
  Receipt,
  FileSignature,
  MessageSquare,
  Calendar,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FormInput,
  Menu,
  X,
  Bot,
  CheckSquare,
  BookOpen,
  Building2,
  FolderOpen,
  Lightbulb,
} from 'lucide-react';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

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
    { name: 'Agents', icon: Bot, href: '/agents' },
    { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Skills', icon: BookOpen, href: '/skills' },
    { name: 'Learnings', icon: Lightbulb, href: '/learnings' },
    { name: 'Clients', icon: Building2, href: '/clients' },
    { name: 'Leads', icon: Users, href: '/leads' },
    { name: 'Projects', icon: FolderKanban, href: '/projects' },
    { name: 'Contacts', icon: Contact, href: '/contacts' },
    { name: 'Forms', icon: FormInput, href: '/forms' },
    { name: 'Invoices', icon: Receipt, href: '/invoices' },
    { name: 'Contracts', icon: FileSignature, href: '/contracts' },
    { name: 'Messages', icon: MessageSquare, href: '/messages' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Documents', icon: FolderOpen, href: '/documents' },
    { name: 'Automations', icon: Zap, href: '/automations' },
  ];

  const showExpanded = isMobile ? true : isExpanded;

  const sidebarStyle: React.CSSProperties = {
    width: isMobile ? '280px' : (isExpanded ? '240px' : '72px'),
    minWidth: isMobile ? '280px' : (isExpanded ? '240px' : '72px'),
    backgroundColor: '#FFFFFF',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    transition: isMobile ? 'transform 0.3s ease' : 'width 0.2s ease, min-width 0.2s ease',
    height: '100vh',
    position: isMobile ? 'fixed' : 'sticky',
    top: 0,
    left: 0,
    zIndex: isMobile ? 50 : 10,
    transform: isMobile ? (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
    display: isMobile && isMobileOpen ? 'block' : 'none',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: isMobile ? '0.875rem 1rem' : '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: isActive ? '#FF3300' : 'transparent',
    color: isActive ? '#FFFFFF' : '#374151',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    fontSize: isMobile ? '1rem' : '0.875rem',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    minHeight: '44px',
  });

  const sidebarContent = (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          {showExpanded && (
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
              Yarn Digital
            </span>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#6B7280' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={navItemStyle(isActive)}>
              <Icon size={20} />
              {showExpanded && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div style={{ padding: '0 0.75rem 0.5rem' }}>
        <Link href="/settings" style={navItemStyle(pathname.startsWith('/settings'))}>
          <Settings size={20} />
          {showExpanded && <span>Settings</span>}
        </Link>
      </div>

      {/* Bottom Controls - desktop only */}
      {!isMobile && (
        <div style={{
          padding: '0.75rem',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ ...navItemStyle(false), color: '#6B7280' }}
          >
            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            {isExpanded && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User info */}
      {user && (
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{
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
          }}>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {showExpanded && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#111827',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.email?.split('@')[0] || 'User'}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: '#6B7280',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.email}
              </p>
            </div>
          )}
          {showExpanded && (
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

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            position: 'fixed',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 30,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '0.625rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay */}
      <div style={overlayStyle} onClick={() => setIsMobileOpen(false)} />

      {/* Sidebar */}
      {sidebarContent}
    </>
  );
}
