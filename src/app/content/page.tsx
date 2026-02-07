'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledAt: string;
  status: string;
  hashtags: string[];
  createdAt: string;
}

const PLATFORMS = ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok'];
const STATUS_OPTIONS = ['scheduled', 'published', 'draft', 'failed'];

export default function ContentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    title: '', content: '', platform: 'twitter', scheduledAt: '', hashtags: '', status: 'scheduled'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchContent();
  }, [user, authLoading, router]);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setContent(data.content || []);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/content/${editingItem.id}` : '/api/content';
      const method = editingItem ? 'PUT' : 'POST';
      const payload = { ...formData, hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(Boolean) };
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', platform: 'twitter', scheduledAt: '', hashtags: '', status: 'scheduled' });
      fetchContent();
    } catch (err) {
      console.error('Failed to save content:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled post?')) return;
    await fetch(`/api/content/${id}`, { method: 'DELETE' });
    fetchContent();
  };

  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({ title: item.title, content: item.content, platform: item.platform, scheduledAt: item.scheduledAt, hashtags: item.hashtags?.join(', ') || '', status: item.status });
    setShowModal(true);
  };

  const platformIcons: Record<string, string> = { twitter: '𝕏', linkedin: '🔗', instagram: '📷', facebook: '📘', tiktok: '🎵' };
  const statusColors: Record<string, string> = { scheduled: '#3B82F6', published: '#10B981', draft: '#7A7A7A', failed: '#EF4444' };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleString(); } catch { return dateStr; }
  };

  if (authLoading || loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box', marginBottom: '0.75rem' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <div style={{ borderBottom: '1px solid #E0E0E0', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>Content Scheduler</h1>
            <p style={{ color: '#7A7A7A', margin: '0.25rem 0 0' }}>{content.length} scheduled posts</p>
          </div>
          <button onClick={() => { setEditingItem(null); setFormData({ title: '', content: '', platform: 'twitter', scheduledAt: '', hashtags: '', status: 'scheduled' }); setShowModal(true); }} style={{ backgroundColor: '#FF3300', color: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
            + Schedule Post
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {content.length === 0 ? (
            <div style={{ backgroundColor: '#F5F5F5', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', color: '#7A7A7A', border: '1px solid #E0E0E0' }}>
              No scheduled content yet. Create your first post!
            </div>
          ) : content.map((item) => (
            <div key={item.id} style={{ backgroundColor: '#F5F5F5', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #E0E0E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{platformIcons[item.platform] || '📱'}</span>
                    <span style={{ backgroundColor: statusColors[item.status] + '20', color: statusColors[item.status], padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500 }}>{item.status}</span>
                    <span style={{ color: '#7A7A7A', fontSize: '0.875rem' }}>{formatDate(item.scheduledAt)}</span>
                  </div>
                  {item.title && <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0A0A0A', margin: '0 0 0.25rem' }}>{item.title}</h3>}
                  <p style={{ color: '#0A0A0A', margin: 0, whiteSpace: 'pre-wrap' }}>{item.content}</p>
                  {item.hashtags?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {item.hashtags.map((tag, i) => <span key={i} style={{ color: '#FF3300', fontSize: '0.875rem' }}>#{tag}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button onClick={() => openEdit(item)} style={{ color: '#FF3300', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', padding: '1.5rem', width: '100%', maxWidth: '500px', border: '1px solid #E0E0E0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0A0A0A', margin: 0 }}>{editingItem ? 'Edit Post' : 'Schedule Post'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#7A7A7A' }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Title (optional)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} style={inputStyle} />
                <textarea placeholder="Content *" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} style={{...inputStyle, minHeight: '100px', resize: 'vertical'}} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} style={inputStyle}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{platformIcons[p]} {p}</option>)}
                  </select>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})} style={inputStyle} required />
                <input type="text" placeholder="Hashtags (comma separated)" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} style={inputStyle} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#FF3300', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
