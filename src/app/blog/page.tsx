'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ForceLightTheme } from '@/components/ForceLightTheme';
import { ArrowRight, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  tags: string[];
  publishedAt: string;
  featuredImage?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog?status=published')
      .then(r => r.json())
      .then(d => { if (d.success) setPosts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <ForceLightTheme />
      <main className="min-h-screen bg-white font-sans antialiased landing-page" style={{ letterSpacing: '-0.02em' }}>
        {/* Header */}
        <header className="border-b border-[#e5e5e5]">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-10 py-6 flex items-center justify-between">
            <a href="https://www.yarndigital.co.uk" className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[22px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
                <span className="text-[22px] font-bold text-[#e63312]">.</span>
                <span className="text-[13px] font-normal text-[#0a0a0a]/60 ml-1">Digital</span>
              </div>
            </a>
            <a
              href="/free-audit"
              className="text-sm font-medium text-[#e63312] hover:underline"
              style={{ letterSpacing: '-0.01em' }}
            >
              Free Audit →
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 sm:px-10 pt-16 pb-12">
          <h1
            className="text-4xl sm:text-5xl font-medium text-[#0a0a0a] leading-[1.1] mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Insights
          </h1>
          <p className="text-lg text-[#666] max-w-xl" style={{ letterSpacing: '-0.01em' }}>
            Practical advice on web design, SEO, and digital marketing for Belfast businesses.
          </p>
        </section>

        {/* Posts */}
        <section className="max-w-[1100px] mx-auto px-5 sm:px-10 pb-24">
          {loading ? (
            <div className="py-20 text-center text-[#999]">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center text-[#999]">No posts yet. Check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group block border border-[#e5e5e5] rounded-[16px] overflow-hidden hover:border-[#ccc] transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  {post.featuredImage && (
                    <div className="aspect-[16/9] overflow-hidden bg-[#f5f5f5]">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {post.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[11px] font-semibold text-[#e63312] uppercase" style={{ letterSpacing: '0.04em' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2
                      className="text-xl font-semibold text-[#0a0a0a] leading-[1.25] mb-3 group-hover:text-[#e63312] transition-colors"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {post.title}
                    </h2>
                    <p className="text-sm text-[#666] leading-relaxed mb-4" style={{ letterSpacing: '-0.01em' }}>
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#999]">
                      <Clock size={12} />
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>·</span>
                      <span>{post.author}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-[#e5e5e5] py-6">
          <div className="max-w-[1100px] mx-auto px-5 sm:px-10 flex items-center justify-between">
            <div className="flex items-baseline gap-0.5 opacity-60">
              <span className="text-[16px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
              <span className="text-[16px] font-bold text-[#e63312]">.</span>
              <span className="text-[10px] font-normal text-[#0a0a0a]/60 ml-0.5">Digital</span>
            </div>
            <span className="text-[11px] text-[#999]">© 2026 Belfast, Northern Ireland</span>
          </div>
        </footer>
      </main>
    </>
  );
}
