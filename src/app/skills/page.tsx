'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, X, FolderOpen, FileText, Edit3, Save, Trash2,
  ChevronRight, ChevronDown, GitBranch, History, Code,
  BookOpen, ArrowLeft, RefreshCw,
} from 'lucide-react';

interface TreeItem {
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
}

interface FileContent {
  content: string;
  sha: string;
  name: string;
}

interface CommitHistory {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export default function SkillsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [tree, setTree] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [fileHistory, setFileHistory] = useState<CommitHistory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/github?type=skills&action=tree');
      if (!res.ok) throw new Error('Failed to fetch skills');
      const data = await res.json();
      setTree(data.data?.tree || []);
      // Auto-expand all directories
      const dirSet = new Set<string>((data.data?.tree || []).filter((f: TreeItem) => f.type === 'dir').map((f: TreeItem) => f.path));
      setExpandedDirs(dirSet);
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('Failed to load skills from GitHub');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchTree();
  }, [user, fetchTree]);

  const fetchFileContent = async (path: string) => {
    try {
      setSelectedFile(path);
      setIsEditing(false);
      setShowHistory(false);
      const res = await fetch(`/api/github?type=skills&action=content&path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to fetch file');
      const data = await res.json();
      setFileContent(data.data);
    } catch (err) {
      console.error('Error fetching file:', err);
    }
  };

  const fetchHistory = async (path: string) => {
    try {
      const res = await fetch(`/api/github?type=skills&action=history&path=${encodeURIComponent(path)}`);
      if (!res.ok) return;
      const data = await res.json();
      setFileHistory(data.data?.history || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleSave = async () => {
    if (!fileContent || !selectedFile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/github', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skills',
          path: selectedFile,
          content: editContent,
          sha: fileContent.sha,
          message: commitMessage || `Update ${selectedFile}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = await res.json();
      setFileContent({ ...fileContent, content: editContent, sha: data.data.sha });
      setIsEditing(false);
      setCommitMessage('');
      await fetchTree();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFilePath) return;
    setSaving(true);
    try {
      const path = newFilePath.endsWith('.md') ? newFilePath : `${newFilePath}.md`;
      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skills',
          path,
          content: newFileContent || `# ${path.split('/').pop()?.replace('.md', '')}\n\nNew skill document.\n`,
          message: `Create ${path}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to create file');
      setShowNewFile(false);
      setNewFilePath('');
      setNewFileContent('');
      await fetchTree();
      await fetchFileContent(path);
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create file');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile || !fileContent) return;
    if (!confirm(`Delete ${selectedFile}?`)) return;
    try {
      const res = await fetch(
        `/api/github?type=skills&path=${encodeURIComponent(selectedFile)}&sha=${fileContent.sha}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete');
      setSelectedFile(null);
      setFileContent(null);
      await fetchTree();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Build folder structure from flat tree
  const buildFileTree = () => {
    const files = tree.filter(f =>
      f.path !== 'README.md' &&
      (!searchQuery || f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const dirs = new Set<string>();
    files.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) dirs.add(parts[0]);
    });

    return { files, dirs: Array.from(dirs).sort() };
  };

  const { files, dirs } = buildFileTree();

  // Render markdown as simple HTML
  const renderMarkdown = (md: string) => {
    let html = md
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:600;color:#111827;margin:1.25rem 0 0.5rem">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.125rem;font-weight:600;color:#111827;margin:1.5rem 0 0.5rem">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:1.25rem;font-weight:700;color:#111827;margin:0 0 0.75rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#F3F4F6;padding:0.125rem 0.25rem;border-radius:0.25rem;font-size:0.8125rem">$1</code>')
      .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0"><span>☑️</span><span>$1</span></div>')
      .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0"><span>⬜</span><span>$1</span></div>')
      .replace(/^- (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0 0.25rem 0.5rem"><span style="color:#9CA3AF">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div style="margin:0.25rem 0 0.25rem 0.5rem">$1</div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  if (!user) return null;

  // Styles
  const panelStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '0.75rem',
    border: '1px solid #E5E7EB',
    overflow: 'hidden' as const,
  };

  const fileItemStyle = (isSelected: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
    borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
    fontSize: '0.8125rem',
    color: isSelected ? '#1D4ED8' : '#374151',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        paddingTop: isMobile ? '4rem' : '2rem',
        maxWidth: '100%',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} /> Skills Library
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
              <GitBranch size={14} /> yarn-digital/yd-skills
              <span style={{ color: '#D1D5DB' }}>•</span>
              {files.filter(f => f.type === 'file').length} files
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => fetchTree()} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 0.75rem', backgroundColor: '#FFFFFF', color: '#374151',
              border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer',
            }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => setShowNewFile(true)} style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 0.75rem', backgroundColor: '#FF3300', color: '#FFFFFF',
              border: 'none', borderRadius: '0.375rem', fontWeight: 500, fontSize: '0.8125rem', cursor: 'pointer',
            }}>
              <Plus size={14} /> New Skill
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              border: '1px solid #E5E7EB', borderRadius: '0.375rem', fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error} <button onClick={() => setError('')} style={{ marginLeft: '0.5rem', cursor: 'pointer', background: 'none', border: 'none', color: '#DC2626' }}>×</button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Loading skills from GitHub...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: '1rem' }}>
            {/* File Tree */}
            <div style={panelStyle}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <FolderOpen size={14} /> Files
              </div>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {dirs.map(dir => (
                  <div key={dir}>
                    <div
                      onClick={() => toggleDir(dir)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.5rem 0.75rem', cursor: 'pointer',
                        fontSize: '0.8125rem', fontWeight: 600, color: '#374151',
                        backgroundColor: '#F9FAFB',
                      }}
                    >
                      {expandedDirs.has(dir) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <FolderOpen size={14} style={{ color: '#F59E0B' }} />
                      {dir}
                    </div>
                    {expandedDirs.has(dir) && files
                      .filter(f => f.type === 'file' && f.path.startsWith(dir + '/') && f.path.split('/').length === 2)
                      .map(f => (
                        <div
                          key={f.path}
                          onClick={() => fetchFileContent(f.path)}
                          style={{ ...fileItemStyle(selectedFile === f.path), paddingLeft: '2rem' }}
                        >
                          <FileText size={14} style={{ color: '#6B7280', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.path.split('/').pop()?.replace('.md', '')}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                ))}
                {/* Root-level files */}
                {files
                  .filter(f => f.type === 'file' && !f.path.includes('/'))
                  .map(f => (
                    <div
                      key={f.path}
                      onClick={() => fetchFileContent(f.path)}
                      style={fileItemStyle(selectedFile === f.path)}
                    >
                      <FileText size={14} style={{ color: '#6B7280' }} />
                      {f.path.replace('.md', '')}
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Content Panel */}
            <div style={panelStyle}>
              {!selectedFile ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
                  <BookOpen size={40} style={{ marginBottom: '0.75rem', color: '#D1D5DB' }} />
                  <p style={{ fontSize: '0.875rem' }}>Select a skill file to view</p>
                </div>
              ) : fileContent ? (
                <div>
                  {/* File header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={16} style={{ color: '#3B82F6' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{selectedFile}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => fetchHistory(selectedFile)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.25rem 0.5rem', background: 'none', border: '1px solid #E5E7EB',
                        borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: '#6B7280',
                      }}>
                        <History size={12} /> History
                      </button>
                      {!isEditing ? (
                        <button onClick={() => { setIsEditing(true); setEditContent(fileContent.content); setShowHistory(false); }} style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', background: 'none', border: '1px solid #E5E7EB',
                          borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: '#6B7280',
                        }}>
                          <Edit3 size={12} /> Edit
                        </button>
                      ) : (
                        <>
                          <button onClick={() => setIsEditing(false)} style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.25rem 0.5rem', background: 'none', border: '1px solid #E5E7EB',
                            borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: '#6B7280',
                          }}>
                            <X size={12} /> Cancel
                          </button>
                          <button onClick={handleSave} disabled={saving} style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.25rem 0.5rem', backgroundColor: '#059669', color: '#FFFFFF',
                            border: 'none', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer',
                            opacity: saving ? 0.6 : 1,
                          }}>
                            <Save size={12} /> {saving ? 'Saving...' : 'Save & Commit'}
                          </button>
                        </>
                      )}
                      <button onClick={handleDelete} style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.25rem 0.5rem', background: 'none', border: '1px solid #FCA5A5',
                        borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', color: '#DC2626',
                      }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Commit message input when editing */}
                  {isEditing && (
                    <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                      <input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder={`Commit message (default: Update ${selectedFile})`}
                        style={{
                          width: '100%', padding: '0.375rem 0.5rem',
                          border: '1px solid #E5E7EB', borderRadius: '0.25rem', fontSize: '0.8125rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {/* History panel */}
                  {showHistory && fileHistory.length > 0 && (
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FEFCE8', maxHeight: '200px', overflowY: 'auto' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <History size={12} /> Commit History
                      </div>
                      {fileHistory.map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.75rem', borderBottom: i < fileHistory.length - 1 ? '1px solid #FDE68A' : 'none' }}>
                          <span style={{ color: '#374151', fontWeight: 500 }}>{h.message}</span>
                          <span style={{ color: '#9CA3AF', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                            {new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '1.25rem', minHeight: '400px' }}>
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                          width: '100%', minHeight: '500px', padding: '0.75rem',
                          border: '1px solid #E5E7EB', borderRadius: '0.375rem',
                          fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: '1.6',
                          outline: 'none', resize: 'vertical',
                        }}
                      />
                    ) : (
                      <div
                        style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent.content) }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Loading...</div>
              )}
            </div>
          </div>
        )}

        {/* New File Modal */}
        {showNewFile && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '0.75rem', width: '100%',
              maxWidth: '520px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={20} /> New Skill File
                </h2>
                <button onClick={() => setShowNewFile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                    File Path *
                  </label>
                  <input
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder="e.g. content/email-marketing.md or seo/local-seo.md"
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem',
                      border: '1px solid #E5E7EB', borderRadius: '0.375rem', fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                    Use folder/filename.md format. Folders: content, seo, development, marketing
                  </p>
                </div>

                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '0.25rem' }}>
                    Initial Content
                  </label>
                  <textarea
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    placeholder="# Skill Title&#10;&#10;Write your skill content in Markdown..."
                    rows={8}
                    style={{
                      width: '100%', padding: '0.75rem',
                      border: '1px solid #E5E7EB', borderRadius: '0.375rem',
                      fontFamily: 'monospace', fontSize: '0.8125rem',
                      outline: 'none', resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => setShowNewFile(false)} style={{
                  padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', color: '#374151',
                  border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={handleCreateFile} disabled={!newFilePath || saving} style={{
                  padding: '0.5rem 1rem', backgroundColor: '#FF3300', color: '#FFFFFF',
                  border: 'none', borderRadius: '0.375rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
                  opacity: !newFilePath || saving ? 0.6 : 1,
                }}>
                  {saving ? 'Creating...' : 'Create & Commit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
