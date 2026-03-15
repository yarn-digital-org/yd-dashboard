'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Users,
  Receipt,
  Calendar,
  BarChart3,
  Mail,
  FileText,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}>
        <div style={{ color: '#666' }}>Loading...</div>
      </div>
    );
  }

  const features = [
    { icon: Users, title: 'CRM & Contacts', desc: 'Track every lead, client, and conversation. Import from Google, CSV, or capture from landing pages.' },
    { icon: Receipt, title: 'Invoicing & Payments', desc: '3 professional templates, PDF export, email sending. Sync with Xero for accounting.' },
    { icon: Calendar, title: 'Calendar & Scheduling', desc: 'Google Calendar sync with colour-coded events. Never miss a meeting or deadline.' },
    { icon: Mail, title: 'Email Marketing', desc: 'Built-in GDPR-compliant email lists and campaigns. No Mailchimp needed.' },
    { icon: BarChart3, title: 'Analytics & Leads', desc: 'Track lead sources, conversion rates, and campaign performance in one view.' },
    { icon: FileText, title: 'Contracts & Documents', desc: 'Create, send, and track contracts. E-signature ready. Version history built in.' },
  ];

  const benefits = [
    'Replace 5+ SaaS tools with one dashboard',
    'Built for agencies and freelancers',
    'White-label with your brand colours and logo',
    'GDPR compliant out of the box',
    'Self-hosted or cloud — you own your data',
    'Dark mode included',
  ];

  return (
    <div className="landing-page" style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      fontFamily: '"Inter", sans-serif',
      color: '#fafafa',
    }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.04em' }}>
          Agency<span style={{ color: '#FF3300' }}>OS</span>
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/login" style={{
            color: '#a3a3a3', textDecoration: 'none', fontWeight: 500,
            padding: '0.5rem 1rem', fontSize: '0.875rem',
          }}>
            Sign In
          </Link>
          <Link href="/login" style={{
            backgroundColor: '#FF3300', color: '#fff',
            padding: '0.5rem 1.25rem', borderRadius: '6px',
            fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem',
            transition: 'background-color 0.15s',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        textAlign: 'center', padding: '8rem 2rem 6rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid bg */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)',
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,51,0,0.08) 0%, transparent 60%)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <div style={{
            display: 'inline-block', padding: '0.375rem 1rem',
            border: '1px solid #2d2d2d', borderRadius: '100px',
            fontSize: '0.8125rem', color: '#a3a3a3', fontWeight: 500,
            marginBottom: '2rem', letterSpacing: '-0.01em',
          }}>
            Built by <span style={{ color: '#FF3300' }}>Yarn Digital</span> — used by agencies
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 700,
            lineHeight: 1.1, letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
          }}>
            One dashboard to<br />
            <span style={{ color: '#FF3300' }}>run your agency</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', color: '#888',
            lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 2.5rem',
            letterSpacing: '-0.02em',
          }}>
            CRM, invoicing, calendar, email marketing, contracts, and analytics — all in one place. 
            Stop juggling tools and start running your business.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              backgroundColor: '#FF3300', color: '#fff',
              padding: '0.875rem 2rem', borderRadius: '8px',
              fontWeight: 600, textDecoration: 'none', fontSize: '1rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'transform 0.15s, background-color 0.15s',
              letterSpacing: '-0.02em',
            }}>
              Start Free <ArrowRight size={18} />
            </Link>
            <Link href="#features" style={{
              color: '#a3a3a3', padding: '0.875rem 2rem',
              border: '1px solid #333', borderRadius: '8px',
              fontWeight: 500, textDecoration: 'none', fontSize: '1rem',
              letterSpacing: '-0.02em',
              transition: 'border-color 0.15s',
            }}>
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        padding: '3rem 2rem',
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          display: 'flex', justifyContent: 'center', gap: '4rem',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {[
            { value: '6-in-1', label: 'Tools replaced' },
            { value: '< 2 min', label: 'Setup time' },
            { value: '100%', label: 'Your data' },
            { value: '£0', label: 'To start' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.25rem', letterSpacing: '-0.03em' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#666', margin: 0, fontWeight: 500 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section id="features" style={{
        padding: 'clamp(5rem, 10vw, 8rem) 2rem',
        maxWidth: '1200px', margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#FF3300',
            letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem',
          }}>
            Everything you need
          </p>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.15,
          }}>
            Built for how agencies<br />actually work
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map((feature) => (
            <div key={feature.title} style={{
              padding: '2rem',
              backgroundColor: '#111',
              borderRadius: '12px',
              border: '1px solid #1a1a1a',
              transition: 'border-color 0.2s',
            }}>
              <feature.icon size={28} style={{ color: '#FF3300', marginBottom: '1rem' }} />
              <h3 style={{
                fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
              }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#888', lineHeight: 1.5, margin: 0 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why section */}
      <section style={{
        padding: 'clamp(5rem, 10vw, 8rem) 2rem',
        borderTop: '1px solid #1a1a1a',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '4rem', alignItems: 'center',
        }}>
          <div>
            <p style={{
              fontSize: '0.8125rem', fontWeight: 600, color: '#FF3300',
              letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem',
            }}>
              Why Agency OS
            </p>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700,
              letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: '1.5rem',
            }}>
              Stop paying for tools<br />you barely use
            </h2>
            <p style={{
              fontSize: '1rem', color: '#888', lineHeight: 1.6,
              marginBottom: '2rem',
            }}>
              Most agencies cobble together CRMs, invoicing apps, email tools, and spreadsheets. 
              Agency OS brings it all under one roof — branded with your logo, on your domain.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {benefits.map((benefit) => (
                <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} style={{ color: '#FF3300', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.9375rem', color: '#ccc' }}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            backgroundColor: '#111', borderRadius: '16px',
            border: '1px solid #1a1a1a', padding: '2.5rem',
            display: 'flex', flexDirection: 'column', gap: '1.5rem',
          }}>
            {[
              { icon: Zap, title: 'Fast setup', desc: 'Connect your Google account and you\'re live in minutes.' },
              { icon: Shield, title: 'Your data, your rules', desc: 'GDPR compliant. No vendor lock-in. Export everything anytime.' },
              { icon: Globe, title: 'White-label ready', desc: 'Your logo, your colours, your domain. Clients never see our brand.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  backgroundColor: 'rgba(255,51,0,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <item.icon size={20} style={{ color: '#FF3300' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#888', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: 'clamp(5rem, 10vw, 8rem) 2rem',
        textAlign: 'center',
        borderTop: '1px solid #1a1a1a',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700,
            letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1rem',
          }}>
            Ready to simplify<br />your agency?
          </h2>
          <p style={{
            fontSize: '1rem', color: '#888', marginBottom: '2rem',
            lineHeight: 1.6,
          }}>
            Free to start. No credit card required. Set up in under 2 minutes.
          </p>
          <Link href="/login" style={{
            backgroundColor: '#FF3300', color: '#fff',
            padding: '1rem 2.5rem', borderRadius: '8px',
            fontWeight: 600, textDecoration: 'none', fontSize: '1rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            letterSpacing: '-0.02em',
            transition: 'transform 0.15s',
          }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '3rem 2rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.8125rem', color: '#444', margin: 0 }}>
          © 2026 Agency OS by{' '}
          <a href="https://www.yarndigital.co.uk" target="_blank" rel="noopener noreferrer"
            style={{ color: '#666', textDecoration: 'none' }}>
            Yarn Digital
          </a>
          . All rights reserved.
        </p>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
