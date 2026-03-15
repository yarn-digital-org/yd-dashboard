'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import {
  Search, Plus, X, FolderOpen, FileText, Edit3, Save, Trash2,
  ChevronRight, ChevronDown, GitBranch, History,
  Building2, ArrowLeft, RefreshCw, Users,
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

export default function ClientsPage() {
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
      setError('');
      const res = await fetch('/api/github?type=clients&action=tree');
      if (!res.ok) throw new Error('Failed to fetch client docs');
      const data = await res.json();
      setTree(data.data?.tree || []);
      // Auto-expand top-level directories (client folders)
      const dirSet = new Set<string>(
        (data.data?.tree || [])
          .filter((f: TreeItem) => f.type === 'dir' && !f.path.includes('/'))
          .map((f: TreeItem) => f.path)
      );
      setExpandedDirs(dirSet);
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('Failed to load client docs from GitHub');
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
      setFileContent(null);
      const res = await fetch(`/api/github?type=clients&action=content&path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Failed to fetch file');
      const data = await res.json();
      setFileContent(data.data);
    } catch (err) {
      console.error('Error fetching file:', err);
      setError('Failed to load file');
    }
  };

  const fetchHistory = async (path: string) => {
    try {
      const res = await fetch(`/api/github?type=clients&action=history&path=${encodeURIComponent(path)}`);
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
          type: 'clients',
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
          type: 'clients',
          path,
          content: newFileContent || `# ${path.split('/').pop()?.replace('.md', '')}\n\nNew client document.\n`,
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
        `/api/github?type=clients&path=${encodeURIComponent(selectedFile)}&sha=${fileContent.sha}`,
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
    const filtered = tree.filter(f =>
      f.path !== 'README.md' &&
      !f.path.startsWith('_template') &&
      (!searchQuery || f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get unique top-level dirs (client folders)
    const topDirs = new Set<string>();
    filtered.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) topDirs.add(parts[0]);
    });

    return { files: filtered, dirs: Array.from(topDirs).sort() };
  };

  const { files, dirs } = buildFileTree();

  // Count docs per client folder
  const getClientDocCount = (dir: string) =>
    files.filter(f => f.type === 'file' && f.path.startsWith(dir + '/')).length;

  // Get all subdirectories under a path
  const getSubDirs = (parentPath: string) => {
    const subDirs = new Set<string>();
    files.forEach(f => {
      if (f.path.startsWith(parentPath + '/')) {
        const rest = f.path.slice(parentPath.length + 1);
        const parts = rest.split('/');
        if (parts.length > 1) subDirs.add(parentPath + '/' + parts[0]);
      }
    });
    return Array.from(subDirs).sort();
  };

  // Get files directly in a directory (not in subdirs)
  const getDirectFiles = (dirPath: string) =>
    files.filter(f => {
      if (f.type !== 'file') return false;
      const rest = f.path.slice(dirPath.length + 1);
      return f.path.startsWith(dirPath + '/') && !rest.includes('/');
    });

  // Render markdown as simple HTML
  const renderMarkdown = (md: string) => {
    let html = md
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:600;color:#fafafa;margin:1.25rem 0 0.5rem">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.125rem;font-weight:600;color:#fafafa;margin:1.5rem 0 0.5rem">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:1.25rem;font-weight:700;color:#fafafa;margin:0 0 0.75rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#27272a;padding:0.125rem 0.25rem;border-radius:0.25rem;font-size:0.8125rem;color:#a78bfa">$1</code>')
      .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0"><span>☑️</span><span>$1</span></div>')
      .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0"><span>⬜</span><span>$1</span></div>')
      .replace(/^- (.+)$/gm, '<div style="display:flex;gap:0.375rem;margin:0.25rem 0 0.25rem 0.5rem"><span style="color:#71717a">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div style="margin:0.25rem 0 0.25rem 0.5rem">$1</div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  // Format client folder name for display
  const formatClientName = (dir: string) =>
    dir.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (!user) return null;

  const panelStyle: React.CSSProperties = {
    backgroundColor: '#18181b',
    borderRadius: '0.75rem',
    border: '1px solid #27272a',
    overflow: 'hidden',
  };

  const fileItemStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
    fontSize: '0.8125rem',
    color: isSelected ? '#60a5fa' : '#d4d4d8',
    transition: 'all 0.15s',
  });

  // Recursive directory renderer
  const renderDirectory = (dirPath: string, depth: number) => {
    const subDirs = getSubDirs(dirPath);
    const directFiles = getDirectFiles(dirPath);
    const isExpanded = expandedDirs.has(dirPath);
    const dirName = dirPath.includes('/') ? dirPath.split('/').pop()! : dirPath;
    const isTopLevel = !dirPath.includes('/');

    return (
      <div key={dirPath}>
        <div
          onClick={() => toggleDir(dirPath)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: `0.5rem 0.75rem 0.5rem ${0.75 + depth * 1}rem`,
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: isTopLevel ? 600 : 500,
            color: isTopLevel ? '#fafafa' : '#d4d4d8',
            backgroundColor: isTopLevel ? '#09090b' : 'transparent',
          }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isTopLevel ? (
            <Building2 size={14} style={{ color: '#3b82f6' }} />
          ) : (
            <FolderOpen size={14} style={{ color: '#f59e0b' }} />
          )}
          <span style={{ flex: 1 }}>{isTopLevel ? formatClientName(dirName) : dirName}</span>
          {isTopLevel && (
            <span style={{ fontSize: '0.6875rem', color: '#71717a', fontWeight: 400 }}>
              {getClientDocCount(dirPath)} docs
            </span>
          )}
        </div>
        {isExpanded && (
          <>
            {subDirs.map(sd => renderDirectory(sd, depth + 1))}
            {directFiles.map(f => (
              <div
                key={f.path}
                onClick={() => fetchFileContent(f.path)}
                style={{
                  ...fileItemStyle(selectedFile === f.path),
                  paddingLeft: `${1.75 + depth * 1}rem`,
                }}
              >
                <FileText size={14} style={{ color: '#71717a', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.path.split('/').pop()?.replace('.md', '')}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#09090b' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: isMobile ? '1rem' : '2rem',
        paddingTop: isMobile ? '4rem' : '2rem',
        maxWidth: '100%',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem', fontWeight: 700, color: '#fafafa',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Building2 size={24} /> Client Knowledge Base
            </h1>
            <p style={{
              fontSize: '0.875rem', color: '#71717a',
              display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem',
            }}>
              <GitBranch size={14} /> yarn-digital/yd-clients
              <span style={{ color: '#3f3f46' }}>•</span>
              {dirs.length} client{dirs.length !== 1 ? 's' : ''}
              <span style={{ color: '#3f3f46' }}>•</span>
              {files.filter(f => f.type === 'file').length} docs
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchTree()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.75rem', backgroundColor: '#18181b', color: '#d4d4d8',
                border: '1px solid #27272a', borderRadius: '0.375rem',
                fontSize: '0.8125rem', cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowNewFile(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.75rem', backgroundColor: '#3b82f6', color: '#ffffff',
                border: 'none', borderRadius: '0.375rem', fontWeight: 500,
                fontSize: '0.8125rem', cursor: 'pointer',
              }}
            >
              <Plus size={14} /> New Document
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: '400px' }}>
          <Search size={16} style={{
            position: 'absolute', left: '0.75rem', top: '50%',
            transform: 'translateY(-50%)', color: '#71717a',
          }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client docs..."
            style={{
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              border: '1px solid #27272a', borderRadius: '0.375rem',
              fontSize: '0.875rem', outline: 'none',
              backgroundColor: '#18181b', color: '#fafafa',
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.1)',
            color: '#ef4444', borderRadius: '0.375rem', marginBottom: '1rem',
            fontSize: '0.875rem', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: '0.5rem', cursor: 'pointer', background: 'none',
                border: 'none', color: '#ef4444', fontSize: '1rem',
              }}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#71717a' }}>
            Loading client docs from GitHub...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
            gap: '1rem',
          }}>
            {/* File Tree */}
            <div style={panelStyle}>
              <div style={{
                padding: '0.75rem 1rem', borderBottom: '1px solid #27272a',
                fontSize: '0.8125rem', fontWeight: 600, color: '#d4d4d8',
                display: 'flex', alignItems: 'center', gap: '0.375rem',
              }}>
                <Users size={14} /> Clients
              </div>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {dirs.length === 0 && (
                  <div style={{
                    padding: '2rem', textAlign: 'center', color: '#71717a', fontSize: '0.8125rem',
                  }}>
                    No client folders found. Create a new document to get started.
                  </div>
                )}
                {dirs.map(dir => renderDirectory(dir, 0))}
                {/* Root-level files */}
                {files
                  .filter(f => f.type === 'file' && !f.path.includes('/'))
                  .map(f => (
                    <div
                      key={f.path}
                      onClick={() => fetchFileContent(f.path)}
                      style={fileItemStyle(selectedFile === f.path)}
                    >
                      <FileText size={14} style={{ color: '#71717a' }} />
                      {f.path.replace('.md', '')}
                    </div>
                  ))}
              </div>
            </div>

            {/* Content Panel */}
            <div style={panelStyle}>
              {!selectedFile ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#71717a' }}>
                  <Building2 size={40} style={{ marginBottom: '0.75rem', color: '#3f3f46' }} />
                  <p style={{ fontSize: '0.875rem' }}>Select a client document to view</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#52525b' }}>
                    Browse client folders on the left, or create a new document
                  </p>
                </div>
              ) : fileContent ? (
                <div>
                  {/* File header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderBottom: '1px solid #27272a',
                    flexWrap: 'wrap', gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setSelectedFile(null); setFileContent(null); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#71717a', display: 'flex', alignItems: 'center',
                          padding: 0,
                        }}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <FileText size={16} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fafafa' }}>
                        {selectedFile}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => fetchHistory(selectedFile)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', background: 'none',
                          border: '1px solid #27272a', borderRadius: '0.25rem',
                          fontSize: '0.75rem', cursor: 'pointer', color: '#a1a1aa',
                        }}
                      >
                        <History size={12} /> History
                      </button>
                      {!isEditing ? (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setEditContent(fileContent.content);
                            setShowHistory(false);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.25rem 0.5rem', background: 'none',
                            border: '1px solid #27272a', borderRadius: '0.25rem',
                            fontSize: '0.75rem', cursor: 'pointer', color: '#a1a1aa',
                          }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setIsEditing(false)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.25rem 0.5rem', background: 'none',
                              border: '1px solid #27272a', borderRadius: '0.25rem',
                              fontSize: '0.75rem', cursor: 'pointer', color: '#a1a1aa',
                            }}
                          >
                            <X size={12} /> Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.25rem 0.5rem', backgroundColor: '#22c55e',
                              color: '#ffffff', border: 'none', borderRadius: '0.25rem',
                              fontSize: '0.75rem', cursor: 'pointer',
                              opacity: saving ? 0.6 : 1,
                            }}
                          >
                            <Save size={12} /> {saving ? 'Saving...' : 'Save & Commit'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleDelete}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', background: 'none',
                          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.25rem',
                          fontSize: '0.75rem', cursor: 'pointer', color: '#ef4444',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Commit message input when editing */}
                  {isEditing && (
                    <div style={{
                      padding: '0.5rem 1rem', borderBottom: '1px solid #27272a',
                      backgroundColor: '#09090b',
                    }}>
                      <input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder={`Commit message (default: Update ${selectedFile})`}
                        style={{
                          width: '100%', padding: '0.375rem 0.5rem',
                          border: '1px solid #27272a', borderRadius: '0.25rem',
                          fontSize: '0.8125rem', outline: 'none',
                          backgroundColor: '#18181b', color: '#fafafa',
                        }}
                      />
                    </div>
                  )}

                  {/* History panel */}
                  {showHistory && fileHistory.length > 0 && (
                    <div style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid #27272a',
                      backgroundColor: 'rgba(59,130,246,0.05)', maxHeight: '200px', overflowY: 'auto',
                    }}>
                      <div style={{
                        fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa',
                        marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                      }}>
                        <History size={12} /> Commit History
                      </div>
                      {fileHistory.map((h, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '0.25rem 0', fontSize: '0.75rem',
                            borderBottom: i < fileHistory.length - 1 ? '1px solid #27272a' : 'none',
                          }}
                        >
                          <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{h.message}</span>
                          <span style={{ color: '#71717a', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
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
                          border: '1px solid #27272a', borderRadius: '0.375rem',
                          fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: '1.6',
                          outline: 'none', resize: 'vertical',
                          backgroundColor: '#09090b', color: '#fafafa',
                        }}
                      />
                    ) : (
                      <div
                        style={{ fontSize: '0.875rem', color: '#d4d4d8', lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent.content) }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#71717a' }}>
                  Loading...
                </div>
              )}
            </div>
          </div>
        )}

        {/* New File Modal */}
        {showNewFile && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '1rem',
          }}>
            <div style={{
              backgroundColor: '#18181b', borderRadius: '0.75rem', width: '100%',
              maxWidth: '520px', padding: '1.5rem', border: '1px solid #27272a',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.25rem',
              }}>
                <h2 style={{
                  fontSize: '1.125rem', fontWeight: 600, color: '#fafafa',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <Plus size={20} /> New Client Document
                </h2>
                <button
                  onClick={() => setShowNewFile(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#71717a',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{
                    fontSize: '0.8125rem', fontWeight: 500, color: '#d4d4d8',
                    display: 'block', marginBottom: '0.25rem',
                  }}>
                    File Path *
                  </label>
                  <input
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder="e.g. stonebridge-farm/overview.md or krumb-bakery/contacts.md"
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem',
                      border: '1px solid #27272a', borderRadius: '0.375rem',
                      fontSize: '0.875rem', outline: 'none',
                      backgroundColor: '#09090b', color: '#fafafa',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                    Use client-folder/filename.md format. The folder name is the client name.
                  </p>
                </div>

                <div>
                  <label style={{
                    fontSize: '0.8125rem', fontWeight: 500, color: '#d4d4d8',
                    display: 'block', marginBottom: '0.25rem',
                  }}>
                    Initial Content
                  </label>
                  <textarea
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    placeholder="# Document Title&#10;&#10;Write your content in Markdown..."
                    rows={8}
                    style={{
                      width: '100%', padding: '0.75rem',
                      border: '1px solid #27272a', borderRadius: '0.375rem',
                      fontFamily: 'monospace', fontSize: '0.8125rem',
                      outline: 'none', resize: 'vertical',
                      backgroundColor: '#09090b', color: '#fafafa',
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem',
              }}>
                <button
                  onClick={() => setShowNewFile(false)}
                  style={{
                    padding: '0.5rem 1rem', backgroundColor: '#27272a', color: '#d4d4d8',
                    border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  disabled={!newFilePath || saving}
                  style={{
                    padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: '#ffffff',
                    border: 'none', borderRadius: '0.375rem', fontWeight: 500,
                    fontSize: '0.875rem', cursor: 'pointer',
                    opacity: !newFilePath || saving ? 0.6 : 1,
                  }}
                >
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
