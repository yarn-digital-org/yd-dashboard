'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ForceLightTheme } from '@/components/ForceLightTheme';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  tags: string[];
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  featuredImage?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setPost(d.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#999]">Loading...</div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <ForceLightTheme />
        <main className="min-h-screen bg-white font-sans antialiased landing-page flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-[#0a0a0a] mb-4">Post not found</h1>
            <Link href="/blog" className="text-[#e63312] text-sm font-medium hover:underline">
              ← Back to blog
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ForceLightTheme />
      <main className="min-h-screen bg-white font-sans antialiased landing-page" style={{ letterSpacing: '-0.02em' }}>
        {/* Header */}
        <header className="border-b border-[#e5e5e5]">
          <div className="max-w-[800px] mx-auto px-5 sm:px-10 py-6 flex items-center justify-between">
            <a href="https://www.yarndigital.co.uk" className="flex flex-col">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[22px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
                <span className="text-[22px] font-bold text-[#e63312]">.</span>
                <span className="text-[13px] font-normal text-[#0a0a0a]/60 ml-1">Digital</span>
              </div>
            </a>
            <Link href="/blog" className="text-sm text-[#666] hover:text-[#0a0a0a] transition-colors flex items-center gap-1">
              <ArrowLeft size={14} /> All posts
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-[800px] mx-auto px-5 sm:px-10 pt-12 pb-24">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-6">
            {post.tags?.map(tag => (
              <span key={tag} className="text-[11px] font-semibold text-[#e63312] uppercase" style={{ letterSpacing: '0.04em' }}>
                {tag}
              </span>
            ))}
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium text-[#0a0a0a] leading-[1.15] mb-6"
            style={{ letterSpacing: '-0.03em' }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-[#999] mb-10 pb-10 border-b border-[#e5e5e5]">
            <Clock size={14} />
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{post.author}</span>
          </div>

          {post.featuredImage && (
            <div className="mb-10 rounded-[16px] overflow-hidden">
              <img src={post.featuredImage} alt={post.title} className="w-full h-auto" />
            </div>
          )}

          {/* Content - rendered as HTML */}
          <div
            className="prose prose-lg max-w-none"
            style={{
              color: '#333',
              fontSize: '1.05rem',
              lineHeight: 1.8,
              letterSpacing: '-0.01em',
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-16 pt-10 border-t border-[#e5e5e5]">
            <div className="bg-[#fafafa] rounded-[16px] p-8 sm:p-10 text-center">
              <h3
                className="text-xl sm:text-2xl font-medium text-[#0a0a0a] mb-3"
                style={{ letterSpacing: '-0.03em' }}
              >
                Want to know what&apos;s holding your website back?
              </h3>
              <p className="text-sm text-[#666] mb-6">
                Get a free, no-obligation audit. We&apos;ll tell you what&apos;s working and what to fix first.
              </p>
              <a
                href="/free-audit"
                className="inline-flex items-center gap-2 bg-[#e63312] text-white font-medium text-[15px] px-8 py-3.5 rounded-full hover:bg-[#cc2b0e] transition-all"
                style={{ letterSpacing: '-0.02em' }}
              >
                Get Your Free Audit <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="border-t border-[#e5e5e5] py-6">
          <div className="max-w-[800px] mx-auto px-5 sm:px-10 flex items-center justify-between">
            <div className="flex items-baseline gap-0.5 opacity-60">
              <span className="text-[16px] font-bold text-[#0a0a0a] tracking-tight">YARN</span>
              <span className="text-[16px] font-bold text-[#e63312]">.</span>
              <span className="text-[10px] font-normal text-[#0a0a0a]/60 ml-0.5">Digital</span>
            </div>
            <span className="text-[11px] text-[#999]">© 2026 Belfast, Northern Ireland</span>
          </div>
        </footer>
      </main>

      <style>{`
        .prose h2 { font-size: 1.5rem; font-weight: 600; color: #0a0a0a; margin-top: 2.5rem; margin-bottom: 1rem; letter-spacing: -0.02em; }
        .prose h3 { font-size: 1.25rem; font-weight: 600; color: #0a0a0a; margin-top: 2rem; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .prose p { margin-bottom: 1.25rem; }
        .prose ul, .prose ol { margin-bottom: 1.25rem; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        .prose a { color: #e63312; text-decoration: underline; text-underline-offset: 2px; }
        .prose a:hover { color: #cc2b0e; }
        .prose blockquote { border-left: 3px solid #e63312; padding-left: 1.25rem; margin: 2rem 0; color: #555; font-style: italic; }
        .prose img { border-radius: 12px; margin: 2rem 0; }
        .prose strong { color: #0a0a0a; }
      `}</style>
    </>
  );
}
