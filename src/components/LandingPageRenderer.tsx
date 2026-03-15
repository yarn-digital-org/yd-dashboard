'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { LandingPageData } from '@/app/lp/[slug]/page';

const FIELD_LABELS: Record<string, string> = {
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone',
  company: 'Company',
  website: 'Website URL',
  message: 'Message',
  budget: 'Budget Range',
  service: 'What are you looking for?',
};

const FIELD_TYPES: Record<string, string> = {
  email: 'email',
  phone: 'tel',
  website: 'url',
};

export default function LandingPageRenderer({ page }: { page: LandingPageData }) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const fields = page.formFields || ['name', 'email', 'phone', 'company'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || '',
          email: formData.email || '',
          phone: formData.phone || '',
          company: formData.company || '',
          website: formData.website || '',
          message: formData.message || formData.service || '',
          source: page.slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page" style={{
      minHeight: '100vh',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#0a0a0a',
      color: '#fafafa',
    }}>
      {/* Hero */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2.5rem',
      }}>
        {/* Background image */}
        {page.heroImage && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${page.heroImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.2,
          }} />
        )}
        {/* Default background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #1a1a1a 1px, transparent 0)',
          backgroundSize: '40px 40px',
          opacity: 0.6,
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent 0%, rgba(10,10,10,0.5) 50%, #0a0a0a 80%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: '1200px', width: '100%', margin: '0 auto',
          paddingBottom: '4rem',
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: '4rem',
          alignItems: 'end',
        }}>
          {/* Left: headline */}
          <div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 700,
              color: '#fafafa', lineHeight: 1.1,
              letterSpacing: '-0.04em', marginBottom: '1.5rem',
            }}>
              {page.headline}
            </h1>
            {page.subheadline && (
              <p style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', fontWeight: 500,
                color: '#888', lineHeight: 1.5,
                letterSpacing: '-0.02em', maxWidth: '560px',
              }}>
                {page.subheadline}
              </p>
            )}
          </div>

          {/* Right: form */}
          <div style={{
            backgroundColor: '#111',
            border: '1px solid #2d2d2d',
            borderRadius: '16px',
            padding: '2rem',
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <CheckCircle2 size={48} style={{ color: '#FF3300', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Got it!
                </h3>
                <p style={{ color: '#888', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                  Thanks for getting in touch. We&apos;ll be in contact within 1 business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 style={{
                  fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem',
                  letterSpacing: '-0.02em',
                }}>
                  {page.ctaText || 'Get Started'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {fields.map((field) => (
                    <div key={field}>
                      <label style={{
                        display: 'block', fontSize: '0.8125rem',
                        fontWeight: 500, color: '#a3a3a3', marginBottom: '0.375rem',
                      }}>
                        {FIELD_LABELS[field] || field}
                        {['name', 'email'].includes(field) && (
                          <span style={{ color: '#FF3300' }}> *</span>
                        )}
                      </label>
                      {field === 'message' ? (
                        <textarea
                          value={formData[field] || ''}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          rows={3}
                          style={{
                            width: '100%', padding: '0.625rem 0.875rem',
                            backgroundColor: '#1a1a1a', border: '1px solid #2d2d2d',
                            borderRadius: '8px', color: '#fafafa', fontSize: '0.9375rem',
                            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                          }}
                        />
                      ) : field === 'service' ? (
                        <select
                          value={formData[field] || ''}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          style={{
                            width: '100%', padding: '0.625rem 0.875rem',
                            backgroundColor: '#1a1a1a', border: '1px solid #2d2d2d',
                            borderRadius: '8px', color: '#fafafa', fontSize: '0.9375rem',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select an option</option>
                          <option>New website</option>
                          <option>Rebrand</option>
                          <option>SEO</option>
                          <option>Paid ads</option>
                          <option>Not sure yet</option>
                        </select>
                      ) : field === 'budget' ? (
                        <select
                          value={formData[field] || ''}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          style={{
                            width: '100%', padding: '0.625rem 0.875rem',
                            backgroundColor: '#1a1a1a', border: '1px solid #2d2d2d',
                            borderRadius: '8px', color: '#fafafa', fontSize: '0.9375rem',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select budget</option>
                          <option>Under £2k</option>
                          <option>£2k–£5k</option>
                          <option>£5k–£10k</option>
                          <option>£10k+</option>
                        </select>
                      ) : (
                        <input
                          type={FIELD_TYPES[field] || 'text'}
                          value={formData[field] || ''}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          required={['name', 'email'].includes(field)}
                          style={{
                            width: '100%', padding: '0.625rem 0.875rem',
                            backgroundColor: '#1a1a1a', border: '1px solid #2d2d2d',
                            borderRadius: '8px', color: '#fafafa', fontSize: '0.9375rem',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>
                  ))}

                  {error && (
                    <p style={{ color: '#FF3300', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      backgroundColor: '#FF3300', color: '#fff',
                      padding: '0.875rem', borderRadius: '8px',
                      fontWeight: 700, fontSize: '1rem', border: 'none',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', width: '100%',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {submitting ? 'Sending...' : (page.ctaText || 'Get Started')}
                    {!submitting && <ArrowRight size={18} />}
                  </button>

                  <p style={{
                    fontSize: '0.75rem', color: '#555', textAlign: 'center', margin: 0,
                  }}>
                    No spam. Unsubscribe anytime.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1a1a1a', padding: '2rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: '#444', margin: 0 }}>
          © 2026 Yarn Digital. All rights reserved.
        </p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
