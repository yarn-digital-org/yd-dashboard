'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, FolderKanban, FileText, BarChart3, 
  Zap, Shield, CheckCircle2, ArrowRight 
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <div style={{ color: '#6B7280' }}>Loading...</div>
      </div>
    );
  }

  const features = [
    {
      icon: Users,
      title: 'Contact Management',
      description: 'Keep all your clients and leads organized in one place. Track interactions, notes, and history.',
    },
    {
      icon: FolderKanban,
      title: 'Project Tracking',
      description: 'Manage projects from start to finish. Track status, deadlines, budgets, and deliverables.',
    },
    {
      icon: FileText,
      title: 'Invoicing & Payments',
      description: 'Create professional invoices, track payments, and manage your cash flow effortlessly.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Get real-time insights into your business. Revenue, projects, leads, and more at a glance.',
    },
    {
      icon: Zap,
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks. Set up custom workflows to save time and reduce errors.',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your data is encrypted and backed up. Access your business from anywhere, anytime.',
    },
  ];

  const benefits = [
    'Unlimited contacts and projects',
    'Professional invoice templates',
    'Real-time analytics dashboard',
    'Client portal access',
    'Email integration',
    'Mobile-friendly design',
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Navigation */}
      <nav style={{ 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        backgroundColor: '#FFFFFF',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#FF3300',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '1.25rem',
          }}>
            Y
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
            Yarn Digital
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{ 
              color: '#374151', 
              textDecoration: 'none', 
              fontWeight: 500,
              padding: '0.5rem 1rem',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            style={{ 
              backgroundColor: '#FF3300', 
              color: '#FFFFFF', 
              padding: '0.625rem 1.25rem', 
              borderRadius: '0.5rem', 
              fontWeight: 500, 
              textDecoration: 'none',
              transition: 'background-color 0.15s',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '5rem 2rem', 
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 800, 
          color: '#111827', 
          marginBottom: '1.5rem',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}>
          Manage Your Agency<br />
          <span style={{ color: '#FF3300' }}>Like a Pro</span>
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#6B7280', 
          marginBottom: '2.5rem',
          maxWidth: '600px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6,
        }}>
          The all-in-one platform for creative agencies and freelancers. 
          Manage clients, track projects, send invoices, and grow your business.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/register"
            style={{ 
              backgroundColor: '#FF3300', 
              color: '#FFFFFF', 
              padding: '1rem 2rem', 
              borderRadius: '0.5rem', 
              fontWeight: 600, 
              textDecoration: 'none',
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.15s',
            }}
          >
            Start Free Trial <ArrowRight size={20} />
          </Link>
          <Link
            href="#features"
            style={{ 
              backgroundColor: '#F3F4F6', 
              color: '#374151', 
              padding: '1rem 2rem', 
              borderRadius: '0.5rem', 
              fontWeight: 600, 
              textDecoration: 'none',
              fontSize: '1.125rem',
            }}
          >
            See Features
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ 
        padding: '5rem 2rem', 
        backgroundColor: '#F9FAFB',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              color: '#111827', 
              marginBottom: '1rem' 
            }}>
              Everything You Need to Run Your Business
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6B7280', maxWidth: '600px', margin: '0 auto' }}>
              Powerful tools designed specifically for creative agencies and freelancers.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    padding: '2rem', 
                    borderRadius: '1rem',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#FFF5F2',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>
                    <Icon size={24} style={{ color: '#FF3300' }} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 600, 
                    color: '#111827', 
                    marginBottom: '0.5rem' 
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: '#111827', 
            marginBottom: '1rem' 
          }}>
            Why Choose Yarn Dashboard?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6B7280', marginBottom: '3rem' }}>
            Built by agency owners, for agency owners.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            textAlign: 'left',
          }}>
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.5rem',
                }}
              >
                <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                <span style={{ color: '#374151', fontWeight: 500 }}>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        padding: '5rem 2rem', 
        backgroundColor: '#111827',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: '#FFFFFF', 
            marginBottom: '1rem' 
          }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#9CA3AF', marginBottom: '2rem' }}>
            Join hundreds of agencies already using Yarn Dashboard to grow their business.
          </p>
          <Link
            href="/register"
            style={{ 
              backgroundColor: '#FF3300', 
              color: '#FFFFFF', 
              padding: '1rem 2.5rem', 
              borderRadius: '0.5rem', 
              fontWeight: 600, 
              textDecoration: 'none',
              fontSize: '1.125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Start Your Free Trial <ArrowRight size={20} />
          </Link>
          <p style={{ marginTop: '1rem', color: '#6B7280', fontSize: '0.875rem' }}>
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem', 
        borderTop: '1px solid #E5E7EB',
        textAlign: 'center',
      }}>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          © {new Date().getFullYear()} Yarn Digital. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
