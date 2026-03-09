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
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6">
        <div className="border-b border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Content Scheduler</h1>
            <p className="text-gray-500 text-sm mt-1">{content.length} scheduled posts</p>
          </div>
          <button onClick={() => { setEditingItem(null); setFormData({ title: '', content: '', platform: 'twitter', scheduledAt: '', hashtags: '', status: 'scheduled' }); setShowModal(true); }} className="w-full sm:w-auto bg-[#FF3300] hover:bg-[#E62E00] text-white px-4 py-2 min-h-[44px] rounded-lg font-medium transition border-none cursor-pointer flex items-center justify-center gap-2">
            + Schedule Post
          </button>
        </div>

        <div className="grid gap-4">
          {content.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
              No scheduled content yet. Create your first post!
            </div>
          ) : content.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-xl">{platformIcons[item.platform] || '📱'}</span>
                    <span style={{ backgroundColor: statusColors[item.status] + '20', color: statusColors[item.status] }} className="px-2 py-0.5 rounded-full text-xs font-medium">{item.status}</span>
                    <span className="text-gray-500 text-sm">{formatDate(item.scheduledAt)}</span>
                  </div>
                  {item.title && <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>}
                  <p className="text-gray-900 whitespace-pre-wrap break-words">{item.content}</p>
                  {item.hashtags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.hashtags.map((tag, i) => <span key={i} className="text-[#FF3300] text-sm">#{tag}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 sm:ml-4 sm:flex-col">
                  <button onClick={() => openEdit(item)} className="text-[#FF3300] bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] rounded-lg hover:bg-[#FF3300]/10 transition text-sm font-medium px-3">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-50 transition text-sm font-medium px-3">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-none sm:rounded-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 border border-gray-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{editingItem ? 'Edit Post' : 'Schedule Post'}</h2>
                <button onClick={() => setShowModal(false)} className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">×</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Title (optional)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]" />
                <textarea placeholder="Content *" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2.5 min-h-[100px] border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#FF3300]/20 focus:border-[#FF3300]" required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg text-sm bg-white">
                    {PLATFORMS.map(p => <option key={p} value={p}>{platformIcons[p]} {p}</option>)}
                  </select>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg text-sm bg-white">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})} className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg text-sm" required />
                <input type="text" placeholder="Hashtags (comma separated)" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg text-sm" />
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 min-h-[44px] border border-gray-200 rounded-lg bg-white cursor-pointer font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" className="px-4 py-2.5 min-h-[44px] bg-[#FF3300] hover:bg-[#E62E00] text-white border-none rounded-lg cursor-pointer font-medium transition">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
