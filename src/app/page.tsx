'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

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

  const caseStudies = [
    {
      title: 'Stonebridge Farm',
      category: 'Branding × Web Design',
      image: 'https://framerusercontent.com/images/1A7y3aX1XOiC43HofQw8EHV8Ck.png',
    },
    {
      title: 'React Clarity',
      category: 'Brand Identity × Development',
      image: 'https://framerusercontent.com/images/NEudPHtTPkhwnF9EnfisOCj7YU0.png',
    },
    {
      title: 'Krumb Bakery',
      category: 'Brand Strategy × E-Commerce',
      image: 'https://framerusercontent.com/images/c2ByT5WhAv4Ac8xz0FBRqtJ0DPE.png',
    },
  ];

  const services = [
    { title: 'Brand Strategy', desc: 'Research-driven brand positioning that makes your business impossible to ignore.' },
    { title: 'Web Design & Development', desc: 'Fast, responsive websites built on modern stacks — Shopify, WordPress, or custom.' },
    { title: 'UX / UI Design', desc: 'Interfaces that feel intuitive and look exceptional. Every pixel earns its place.' },
    { title: 'Digital Marketing', desc: 'SEO, content strategy, and paid media that actually moves the needle.' },
    { title: 'Creative Direction', desc: 'From concept to execution — cohesive creative that tells your story.' },
  ];

  const stats = [
    { value: '50+', label: 'Projects Delivered' },
    { value: '98%', label: 'Client Retention' },
    { value: '3x', label: 'Average ROI' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: '"Inter", "Inter Placeholder", sans-serif',
      color: '#0a0a0a',
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '1.25rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '1.125rem', fontWeight: 600, color: '#fafafa',
            letterSpacing: '-0.04em',
          }}>
            YARN Digital
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/login" style={{
            color: '#a3a3a3', textDecoration: 'none', fontWeight: 500,
            padding: '0.625rem 1.25rem', fontSize: '0.875rem',
            letterSpacing: '-0.02em', transition: 'color 0.2s',
          }}>
            Sign In
          </Link>
          <Link href="/login" style={{
            backgroundColor: '#fafafa', color: '#0a0a0a',
            padding: '0.625rem 1.5rem', borderRadius: '8px',
            fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem',
            letterSpacing: '-0.02em', transition: 'all 0.2s',
          }}>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section — Full viewport, dark background */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        backgroundColor: '#0a0a0a', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', padding: '2.5rem',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://framerusercontent.com/images/H7pmHxrsHkVjHKJY8oD7Oy6ck.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.15,
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(transparent 0%, rgba(10,10,10,0.5) 50%, #0a0a0a 75%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: '1520px', width: '100%', margin: '0 auto',
          paddingBottom: '4rem',
        }}>
          <p style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#a3a3a3',
            letterSpacing: '-0.02em', marginBottom: '1.5rem',
            textTransform: 'uppercase',
          }}>
            Websites, Marketing & Media
          </p>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 7.5rem)', fontWeight: 600,
            color: '#fafafa', lineHeight: 1.05,
            letterSpacing: '-0.04em', marginBottom: '1.5rem',
            maxWidth: '900px',
          }}>
            Design →<br />Build →<br />Grow
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', fontWeight: 500,
            color: '#666', lineHeight: 1.4,
            letterSpacing: '-0.04em', maxWidth: '600px',
            marginBottom: '2rem',
          }}>
            A full‑service studio for brands & websites that perform.
            Pushing brands beyond boundaries — through design, storytelling, and strategy.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              backgroundColor: '#fafafa', color: '#0a0a0a',
              padding: '0.875rem 2rem', borderRadius: '8px',
              fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem',
              letterSpacing: '-0.02em', display: 'inline-flex',
              alignItems: 'center', gap: '0.5rem',
              transition: 'transform 0.15s, background-color 0.15s',
            }}>
              Open Dashboard <ArrowRight size={18} />
            </Link>
            <a href="https://www.yarndigital.co.uk" target="_blank" rel="noopener noreferrer" style={{
              color: '#a3a3a3', padding: '0.875rem 2rem',
              border: '1px solid #333', borderRadius: '8px',
              fontWeight: 500, textDecoration: 'none', fontSize: '0.9375rem',
              letterSpacing: '-0.02em', display: 'inline-flex',
              alignItems: 'center', gap: '0.5rem',
              transition: 'border-color 0.15s, color 0.15s',
            }}>
              View Our Work <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        {/* Strategy × Story badge */}
        <div style={{
          position: 'absolute', bottom: '2.5rem', right: '2.5rem', zIndex: 2,
        }}>
          <span style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#666',
            letterSpacing: '-0.02em',
          }}>
            Strategy × Story
          </span>
        </div>
      </section>

      {/* About Section */}
      <section style={{
        padding: 'clamp(5rem, 12vw, 12.5rem) 2.5rem',
        maxWidth: '1520px', margin: '0 auto',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr',
          gap: '2rem', alignItems: 'start',
        }}>
          <div>
            <span style={{
              fontSize: '0.8125rem', fontWeight: 600, color: '#999',
              letterSpacing: '-0.02em', textTransform: 'uppercase',
            }}>
              About Us
            </span>
          </div>
          <div>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 4rem)', fontWeight: 600,
              color: '#0a0a0a', lineHeight: 1.1,
              letterSpacing: '-0.06em', marginBottom: '2rem',
            }}>
              We help ambitious teams build brands, interfaces, and websites that earn attention.
            </h2>
            <p style={{
              fontSize: '1.125rem', fontWeight: 500, color: '#666',
              lineHeight: 1.6, letterSpacing: '-0.04em',
              maxWidth: '640px',
            }}>
              From identity to launch, every detail is crafted to make your business
              look confident and perform better. Based in Belfast, working with
              ambitious brands across the UK and Ireland.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        padding: '0 2.5rem 5rem',
        maxWidth: '1520px', margin: '0 auto',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0', borderTop: '1px solid #e5e5e5',
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              padding: '2.5rem 0',
              borderRight: i < stats.length - 1 ? '1px solid #e5e5e5' : 'none',
              paddingLeft: i > 0 ? '2.5rem' : '0',
            }}>
              <div style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 600,
                color: '#0a0a0a', letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.875rem', fontWeight: 500, color: '#999',
                letterSpacing: '-0.02em', marginTop: '0.5rem',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Case Studies Section — Dark */}
      <section style={{
        backgroundColor: '#0a0a0a', padding: 'clamp(5rem, 12vw, 12.5rem) 2.5rem',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '1520px', margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 2fr',
            gap: '2rem', marginBottom: '5rem',
          }}>
            <span style={{
              fontSize: '0.8125rem', fontWeight: 600, color: '#666',
              letterSpacing: '-0.02em', textTransform: 'uppercase',
            }}>
              Work
            </span>
            <div>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3vw, 3rem)', fontWeight: 600,
                color: '#fafafa', lineHeight: 1.3,
                letterSpacing: '-0.05em', marginBottom: '0.75rem',
              }}>
                Case Studies
              </h2>
              <p style={{
                fontSize: '1rem', fontWeight: 500, color: '#666',
                letterSpacing: '-0.04em',
              }}>
                Featured work between ©2022–25
              </p>
            </div>
          </div>

          {/* Case study cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            {caseStudies.map((cs, i) => (
              <div key={i} style={{
                backgroundColor: '#fafafa', borderRadius: '24px',
                overflow: 'hidden', transition: 'transform 0.3s',
              }}>
                <div style={{
                  aspectRatio: '4/3', overflow: 'hidden',
                }}>
                  <img src={cs.image} alt={cs.title} style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    transition: 'transform 0.4s',
                  }} />
                </div>
                <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
                  <div style={{
                    fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a',
                    letterSpacing: '-0.04em', marginBottom: '0.25rem',
                  }}>
                    {cs.title}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem', fontWeight: 500, color: '#999',
                    letterSpacing: '-0.02em',
                  }}>
                    {cs.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services / Methodology */}
      <section style={{
        padding: 'clamp(5rem, 12vw, 12.5rem) 2.5rem',
        maxWidth: '1520px', margin: '0 auto',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 2fr',
          gap: '2rem', marginBottom: '4rem',
        }}>
          <span style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#999',
            letterSpacing: '-0.02em', textTransform: 'uppercase',
          }}>
            Services
          </span>
          <div>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 3rem)', fontWeight: 600,
              color: '#0a0a0a', lineHeight: 1.3,
              letterSpacing: '-0.05em', maxWidth: '640px',
            }}>
              The best results don't come from guesswork. They come from a proven process.
            </h2>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          borderTop: '1px solid #e5e5e5',
        }}>
          {services.map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr',
              gap: '2rem', padding: '2rem 0',
              borderBottom: '1px solid #e5e5e5',
            }}>
              <div style={{
                fontSize: '1.375rem', fontWeight: 600, color: '#0a0a0a',
                letterSpacing: '-0.04em',
              }}>
                {s.title}
              </div>
              <div style={{
                fontSize: '1rem', fontWeight: 500, color: '#666',
                letterSpacing: '-0.04em', lineHeight: 1.6,
              }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section — Dark */}
      <section style={{
        backgroundColor: '#0a0a0a',
        padding: 'clamp(5rem, 10vw, 10rem) 2.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'url(https://framerusercontent.com/images/H7pmHxrsHkVjHKJY8oD7Oy6ck.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          maxWidth: '1520px', margin: '0 auto', position: 'relative', zIndex: 1,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '4rem', alignItems: 'end',
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(2rem, 4vw, 4rem)', fontWeight: 600,
                color: '#fafafa', lineHeight: 1.1,
                letterSpacing: '-0.05em', marginBottom: '1.5rem',
              }}>
                Let's build<br />something brilliant.
              </h2>
              <p style={{
                fontSize: '1.125rem', fontWeight: 500, color: '#666',
                letterSpacing: '-0.04em', lineHeight: 1.4,
                marginBottom: '2.5rem', maxWidth: '480px',
              }}>
                We start with research and strategy, shape it into a strong
                creative direction, and deliver results that align with your goals.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/login" style={{
                  backgroundColor: '#fafafa', color: '#0a0a0a',
                  padding: '0.875rem 2rem', borderRadius: '8px',
                  fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem',
                  letterSpacing: '-0.02em', display: 'inline-flex',
                  alignItems: 'center', gap: '0.5rem',
                }}>
                  Open Dashboard <ArrowRight size={18} />
                </Link>
                <a href="mailto:hello@yarndigital.co.uk" style={{
                  color: '#a3a3a3', padding: '0.875rem 2rem',
                  border: '1px solid #333', borderRadius: '8px',
                  fontWeight: 500, textDecoration: 'none', fontSize: '0.9375rem',
                  letterSpacing: '-0.02em',
                }}>
                  hello@yarndigital.co.uk
                </a>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '0.8125rem', fontWeight: 600, color: '#666',
                letterSpacing: '-0.02em', marginBottom: '1rem',
              }}>
                Belfast, Northern Ireland
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                {['Instagram', 'LinkedIn', 'Facebook'].map((s) => (
                  <span key={s} style={{
                    fontSize: '0.8125rem', fontWeight: 500, color: '#666',
                    letterSpacing: '-0.02em',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem 2.5rem',
        backgroundColor: '#f5f5f5',
        borderTop: '1px solid #e5e5e5',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontSize: '0.8125rem', fontWeight: 500, color: '#999',
          letterSpacing: '-0.02em',
        }}>
          © {new Date().getFullYear()} YARN Digital. All rights reserved.
        </span>
        <span style={{
          fontSize: '0.8125rem', fontWeight: 600, color: '#999',
          letterSpacing: '-0.02em',
        }}>
          Design, Build, Grow
        </span>
      </footer>

      {/* CSS for responsive + hover states */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 900px) {
          section [style*="grid-template-columns: 1fr 2fr"],
          section [style*="grid-template-columns: repeat(3"],
          section [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
