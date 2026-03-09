'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, X, Filter,
  BookOpen, Tag, Edit3, Trash2, Save,
  Code, Palette, TrendingUp, FileText, BarChart3, Settings2,
  Bot,
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  agentIds: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['All', 'Content', 'SEO', 'Development', 'Marketing', 'Design', 'Analytics', 'Operations'];

const categoryIcons: Record<string, React.ReactNode> = {
  Content: <FileText size={16} />,
  SEO: <TrendingUp size={16} />,
  Development: <Code size={16} />,
  Marketing: <BarChart3 size={16} />,
  Design: <Palette size={16} />,
  Analytics: <BarChart3 size={16} />,
  Operations: <Settings2 size={16} />,
};

const categoryColors: Record<string, string> = {
  Content: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SEO: 'bg-green-500/20 text-green-400 border-green-500/30',
  Development: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Marketing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Design: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Analytics: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Operations: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function SkillsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Content');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/skills?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSkills(data.data.skills);
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    if (user) fetchSkills();
  }, [user, fetchSkills]);

  const openSkill = (skill: Skill) => {
    setSelectedSkill(skill);
    setEditContent(skill.content);
    setEditName(skill.name);
    setEditDescription(skill.description);
    setEditCategory(skill.category);
    setEditTags(skill.tags.join(', '));
    setIsEditing(false);
  };

  const saveSkill = async () => {
    if (!selectedSkill) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/skills/${selectedSkill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          category: editCategory,
          content: editContent,
          tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchSkills();
        setSelectedSkill(null);
      }
    } catch (err) {
      console.error('Failed to save skill:', err);
    } finally {
      setSaving(false);
    }
  };

  const createSkill = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          category: editCategory,
          content: editContent,
          tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchSkills();
      }
    } catch (err) {
      console.error('Failed to create skill:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (id: string) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      setSelectedSkill(null);
      fetchSkills();
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const resetForm = () => {
    setEditName('');
    setEditDescription('');
    setEditCategory('Content');
    setEditContent('');
    setEditTags('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  if (authLoading || !user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fafafa', margin: 0 }}>Skills Library</h1>
            <p style={{ color: '#a1a1aa', margin: '4px 0 0', fontSize: 14 }}>
              {skills.length} skill{skills.length !== 1 ? 's' : ''} documented
            </p>
          </div>
          <button
            onClick={openCreateModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8,
              background: '#3b82f6', color: '#fff', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            <Plus size={18} /> Add Skill
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16, maxWidth: 400 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: '#71717a' }} />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px',
              background: '#18181b', border: '1px solid #27272a',
              borderRadius: 8, color: '#fafafa', fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1px solid',
                borderColor: activeCategory === cat ? '#3b82f6' : '#27272a',
                background: activeCategory === cat ? '#3b82f6' : 'transparent',
                color: activeCategory === cat ? '#fff' : '#a1a1aa',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div style={{ color: '#71717a', textAlign: 'center', padding: 60 }}>Loading skills...</div>
        ) : skills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#71717a' }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 16, margin: '0 0 8px' }}>No skills found</p>
            <p style={{ fontSize: 13 }}>Create your first skill to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {skills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => openSkill(skill)}
                style={{
                  background: '#18181b', border: '1px solid #27272a',
                  borderRadius: 12, padding: 20, cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f3f46')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: 0 }}>{skill.name}</h3>
                  <span
                    className={categoryColors[skill.category] || ''}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 12, fontSize: 11,
                      fontWeight: 600, border: '1px solid',
                      background: skill.category === 'Content' ? 'rgba(59,130,246,0.15)' :
                        skill.category === 'SEO' ? 'rgba(34,197,94,0.15)' :
                        skill.category === 'Development' ? 'rgba(168,85,247,0.15)' :
                        skill.category === 'Marketing' ? 'rgba(249,115,22,0.15)' :
                        skill.category === 'Design' ? 'rgba(236,72,153,0.15)' :
                        skill.category === 'Analytics' ? 'rgba(6,182,212,0.15)' :
                        'rgba(234,179,8,0.15)',
                      color: skill.category === 'Content' ? '#60a5fa' :
                        skill.category === 'SEO' ? '#4ade80' :
                        skill.category === 'Development' ? '#c084fc' :
                        skill.category === 'Marketing' ? '#fb923c' :
                        skill.category === 'Design' ? '#f472b6' :
                        skill.category === 'Analytics' ? '#22d3ee' :
                        '#facc15',
                      borderColor: skill.category === 'Content' ? 'rgba(59,130,246,0.3)' :
                        skill.category === 'SEO' ? 'rgba(34,197,94,0.3)' :
                        skill.category === 'Development' ? 'rgba(168,85,247,0.3)' :
                        skill.category === 'Marketing' ? 'rgba(249,115,22,0.3)' :
                        skill.category === 'Design' ? 'rgba(236,72,153,0.3)' :
                        skill.category === 'Analytics' ? 'rgba(6,182,212,0.3)' :
                        'rgba(234,179,8,0.3)',
                    }}
                  >
                    {categoryIcons[skill.category]}
                    {skill.category}
                  </span>
                </div>
                <p style={{ color: '#a1a1aa', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                  {skill.description.length > 120 ? skill.description.slice(0, 120) + '...' : skill.description}
                </p>
                {skill.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {skill.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: 11,
                          background: '#27272a', color: '#a1a1aa',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {skill.tags.length > 4 && (
                      <span style={{ fontSize: 11, color: '#71717a' }}>+{skill.tags.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Skill Detail Modal */}
        {selectedSkill && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, padding: 16,
            }}
            onClick={() => setSelectedSkill(null)}
          >
            <div
              style={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 16, width: '100%', maxWidth: 700,
                maxHeight: '85vh', overflow: 'auto', padding: 28,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {isEditing ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      fontSize: 22, fontWeight: 700, color: '#fafafa',
                      background: '#09090b', border: '1px solid #3f3f46',
                      borderRadius: 8, padding: '6px 12px', flex: 1, marginRight: 12,
                    }}
                  />
                ) : (
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', margin: 0 }}>
                    {selectedSkill.name}
                  </h2>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {isEditing ? (
                    <button
                      onClick={saveSkill}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: '#22c55e', color: '#fff', border: 'none',
                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: '#27272a', color: '#fafafa', border: 'none',
                        cursor: 'pointer', fontWeight: 500, fontSize: 13,
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteSkill(selectedSkill.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 12px', borderRadius: 8,
                      background: '#27272a', color: '#ef4444', border: 'none',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedSkill(null)}
                    style={{
                      padding: '8px', borderRadius: 8,
                      background: '#27272a', color: '#a1a1aa', border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {isEditing && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 13,
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 13, minWidth: 200,
                    }}
                  />
                </div>
              )}

              {isEditing ? (
                <>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description..."
                    rows={2}
                    style={{
                      width: '100%', padding: 12, borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 13, resize: 'vertical',
                      marginBottom: 12, fontFamily: 'inherit',
                    }}
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Skill content (markdown)..."
                    rows={16}
                    style={{
                      width: '100%', padding: 12, borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 13, resize: 'vertical',
                      fontFamily: 'monospace', lineHeight: 1.6,
                    }}
                  />
                </>
              ) : (
                <>
                  <p style={{ color: '#a1a1aa', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>
                    {selectedSkill.description}
                  </p>
                  <div
                    style={{
                      background: '#09090b', border: '1px solid #27272a',
                      borderRadius: 8, padding: 20,
                      color: '#d4d4d8', fontSize: 14, lineHeight: 1.7,
                      whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                    }}
                  >
                    {selectedSkill.content || 'No content yet.'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 50, padding: 16,
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                background: '#18181b', border: '1px solid #27272a',
                borderRadius: 16, width: '100%', maxWidth: 600,
                maxHeight: '85vh', overflow: 'auto', padding: 28,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fafafa', margin: 0 }}>New Skill</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: 8, borderRadius: 8, background: '#27272a', color: '#a1a1aa', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Skill name"
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: '#09090b', border: '1px solid #3f3f46',
                    color: '#fafafa', fontSize: 14,
                  }}
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Short description"
                  rows={2}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: '#09090b', border: '1px solid #3f3f46',
                    color: '#fafafa', fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', gap: 12 }}>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 14,
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8,
                      background: '#09090b', border: '1px solid #3f3f46',
                      color: '#fafafa', fontSize: 14,
                    }}
                  />
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Skill content (markdown)..."
                  rows={10}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: '#09090b', border: '1px solid #3f3f46',
                    color: '#fafafa', fontSize: 13, fontFamily: 'monospace',
                    resize: 'vertical', lineHeight: 1.6,
                  }}
                />
                <button
                  onClick={createSkill}
                  disabled={saving || !editName || !editDescription}
                  style={{
                    padding: '12px 20px', borderRadius: 8,
                    background: '#3b82f6', color: '#fff', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontSize: 14,
                    opacity: saving || !editName || !editDescription ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Creating...' : 'Create Skill'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
