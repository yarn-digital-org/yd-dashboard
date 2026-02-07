'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
      
      const payload = {
        ...formData,
        hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(Boolean),
      };
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
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
    setFormData({
      title: item.title,
      content: item.content,
      platform: item.platform,
      scheduledAt: item.scheduledAt,
      hashtags: item.hashtags?.join(', ') || '',
      status: item.status,
    });
    setShowModal(true);
  };

  const platformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '𝕏',
      linkedin: '🔗',
      instagram: '📷',
      facebook: '📘',
      tiktok: '🎵',
    };
    return icons[platform] || '📱';
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (authLoading || loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📅 Content Scheduler</h1>
        <button
          onClick={() => { setEditingItem(null); setFormData({ title: '', content: '', platform: 'twitter', scheduledAt: '', hashtags: '', status: 'scheduled' }); setShowModal(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Schedule Post
        </button>
      </div>

      <div className="grid gap-4">
        {content.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-md">
            No scheduled content yet. Create your first post!
          </div>
        ) : content.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{platformIcon(item.platform)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-gray-500 text-sm">{formatDate(item.scheduledAt)}</span>
                </div>
                {item.title && <h3 className="font-semibold text-lg mb-1">{item.title}</h3>}
                <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                {item.hashtags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.hashtags.map((tag, i) => (
                      <span key={i} className="text-blue-600 text-sm">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Post' : 'Schedule Post'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Title (optional)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Content *" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={4} required />
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  {PLATFORMS.map(p => <option key={p} value={p}>{platformIcon(p)} {p}</option>)}
                </select>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" placeholder="Hashtags (comma separated)" value={formData.hashtags} onChange={(e) => setFormData({...formData, hashtags: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
