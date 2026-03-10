'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  RefreshCw,
  ChevronDown,
  CheckCircle,
  Clock,
  FileEdit,
  Archive,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';

// Types
interface Document {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar';
  category: string;
  description: string;
  size: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  created: string;
  updated?: string;
  filePath: string;
  contentPreview?: string;
  content?: string;
}

interface DocumentsResponse {
  success: boolean;
  documents?: Document[];
  total?: number;
  error?: string;
}

type DocumentStatus = 'draft' | 'in-progress' | 'completed' | 'archived';
type Agent = 'Scout' | 'Bolt' | 'Aria' | 'Radar';
type DocumentSortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'agent' | 'category' | 'status';

// Constants
const AGENTS: Agent[] = ['Scout', 'Bolt', 'Aria', 'Radar'];
const STATUS_OPTIONS: DocumentStatus[] = ['draft', 'in-progress', 'completed', 'archived'];

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bgColor: string }> = {
  completed: { label: 'Completed', color: '#10B981', bgColor: '#ECFDF5' },
  'in-progress': { label: 'In Progress', color: '#F59E0B', bgColor: '#FFFBEB' },
  draft: { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
  archived: { label: 'Archived', color: '#8B5CF6', bgColor: '#F5F3FF' },
};

const AGENT_CONFIG: Record<Agent, { label: string; color: string; bgColor: string }> = {
  Scout: { label: 'Scout', color: '#3B82F6', bgColor: '#EFF6FF' },
  Bolt: { label: 'Bolt', color: '#8B5CF6', bgColor: '#F5F3FF' },
  Aria: { label: 'Aria', color: '#EC4899', bgColor: '#FDF2F8' },
  Radar: { label: 'Radar', color: '#F97316', bgColor: '#FFF7ED' },
};

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<Agent | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<DocumentSortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Viewer state
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (agentFilter !== 'all') params.set('agent', agentFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        const docs = data.data?.documents || data.documents || [];
        setDocuments(docs);
      } else {
        setError(data.error || 'Failed to load documents');
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user, agentFilter, statusFilter, categoryFilter, searchQuery, sortBy]);

  useEffect(() => {
    if (user) fetchDocuments();
  }, [fetchDocuments, user]);

  const handleDownload = (doc: Document) => {
    console.log(`Downloading ${doc.filename}`);
    // Create blob URL and trigger download
    const element = document.createElement('a');
    element.href = doc.filePath;
    element.download = doc.filename;
    element.click();
  };

  const handlePreview = (doc: Document) => {
    setViewingDocument(doc);
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} />;
      case 'in-progress':
        return <Clock size={14} />;
      case 'draft':
        return <FileEdit size={14} />;
      case 'archived':
        return <Archive size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.status === 'completed').length,
    inProgress: documents.filter(d => d.status === 'in-progress').length,
    draft: documents.filter(d => d.status === 'draft').length,
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(documents.map(d => d.category)));

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  };

  // If viewing a document, show the inline viewer
  if (viewingDocument) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
          {/* Back Button */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setViewingDocument(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#374151'
              }}
            >
              <ArrowLeft size={16} />
              ← Back to Documents
            </button>
          </div>
          
          {/* Document Header */}
          <div style={{ marginBottom: '1.5rem', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={24} style={{ color: '#FF3300' }} />
              {viewingDocument.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.875rem', color: '#6B7280' }}>
              <span><strong>Agent:</strong> {viewingDocument.agent}</span>
              <span><strong>Category:</strong> {viewingDocument.category}</span>
              <span><strong>Size:</strong> {viewingDocument.size}</span>
              <span><strong>Created:</strong> {formatDate(viewingDocument.created)}</span>
            </div>
            <p style={{ margin: '0.75rem 0 0', color: '#4B5563' }}>{viewingDocument.description}</p>
          </div>

          {/* Document Content */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            {viewingDocument.content ? (
              <div style={{ maxWidth: 'none', lineHeight: '1.6' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 style={{ color: '#111827', borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{children}</h1>,
                    h2: ({children}) => <h2 style={{ color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>{children}</h2>,
                    h3: ({children}) => <h3 style={{ color: '#111827', marginTop: '1.5rem', marginBottom: '0.75rem' }}>{children}</h3>,
                    p: ({children}) => <p style={{ marginBottom: '1rem', color: '#374151' }}>{children}</p>,
                    ul: ({children}) => <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem', color: '#374151' }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem', color: '#374151' }}>{children}</ol>,
                    li: ({children}) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                    blockquote: ({children}) => <blockquote style={{ borderLeft: '4px solid #E5E7EB', paddingLeft: '1rem', margin: '1rem 0', fontStyle: 'italic', color: '#6B7280' }}>{children}</blockquote>,
                    code: ({children}) => <code style={{ backgroundColor: '#F3F4F6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875em', fontFamily: 'monospace' }}>{children}</code>,
                    pre: ({children}) => <pre style={{ backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '1rem' }}>{children}</pre>,
                    table: ({children}) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>{children}</table>,
                    th: ({children}) => <th style={{ border: '1px solid #E5E7EB', padding: '0.75rem', backgroundColor: '#F9FAFB', textAlign: 'left', fontWeight: 600 }}>{children}</th>,
                    td: ({children}) => <td style={{ border: '1px solid #E5E7EB', padding: '0.75rem' }}>{children}</td>,
                    strong: ({children}) => <strong style={{ color: '#111827' }}>{children}</strong>,
                    em: ({children}) => <em style={{ color: '#6B7280' }}>{children}</em>
                  }}
                >
                  {viewingDocument.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p style={{ color: '#6B7280', fontStyle: 'italic' }}>No content available for this document.</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FolderOpen size={isMobile ? 24 : 28} style={{ color: '#FF3300' }} />
                Team Documents
              </h1>
              <p style={{ color: '#6B7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                Review all deliverables created by the Yarn Digital AI team
              </p>
            </div>
            <button
              onClick={fetchDocuments}
              style={{
                backgroundColor: '#FF3300',
                color: '#FFFFFF',
                padding: '0.625rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                transition: 'background-color 0.15s',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E62E00')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF3300')}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Documents</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{stats.completed}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Completed</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>In Progress</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6B7280' }}>{stats.draft}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Drafts</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: isMobile ? '100%' : '200px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              type="text"
              placeholder="Search documents by title, agent, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: '2.75rem',
              }}
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.625rem 1rem',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              backgroundColor: showFilters ? '#F3F4F6' : '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            <Filter size={18} />
            Filters
            <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none' }} />
          </button>

          {/* Clear Filters */}
          {(agentFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setAgentFilter('all');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              style={{
                padding: '0.625rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Agent
              </label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value as Agent | 'all')}
                style={selectStyle}
              >
                <option value="all">All Agents</option>
                {AGENTS.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                style={selectStyle}
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DocumentSortOption)}
                style={selectStyle}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="agent">By Agent</option>
                <option value="category">By Category</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>
        )}

        {/* Documents Grid/List */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.75rem',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
              <RefreshCw size={24} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              Loading documents...
            </div>
          ) : error ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#DC2626' }}>
              <FileText size={24} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              {error}
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
              <FolderOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <div style={{ marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>No documents found</div>
              <div style={{ fontSize: '0.875rem' }}>
                {searchQuery || agentFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search criteria'
                  : 'Team documents will appear here once created'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem', padding: '1rem' }}>
              {documents.map((doc) => {
                const statusConfig = STATUS_CONFIG[doc.status];
                const agentConfig = AGENT_CONFIG[doc.agent];

                return (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#FF3300';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 51, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 600, 
                          color: '#111827', 
                          margin: '0 0 0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FileText size={18} style={{ color: '#FF3300', flexShrink: 0 }} />
                          {doc.title}
                        </h3>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#6B7280', 
                          margin: 0,
                          fontFamily: 'monospace'
                        }}>
                          {doc.filename}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc);
                          }}
                          style={{
                            padding: '0.375rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Preview document"
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#EFF6FF';
                            e.currentTarget.style.borderColor = '#3B82F6';
                            e.currentTarget.style.color = '#3B82F6';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          style={{
                            padding: '0.375rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Download document"
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#ECFDF5';
                            e.currentTarget.style.borderColor = '#10B981';
                            e.currentTarget.style.color = '#10B981';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#4B5563', 
                      margin: '0 0 1rem',
                      lineHeight: '1.5'
                    }}>
                      {doc.description}
                    </p>

                    {/* Meta Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span style={{
                        backgroundColor: agentConfig.bgColor,
                        color: agentConfig.color,
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <User size={12} />
                        {doc.agent}
                      </span>
                      <span style={{
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        {doc.category}
                      </span>
                      <span style={{
                        backgroundColor: statusConfig.bgColor,
                        color: statusConfig.color,
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getStatusIcon(doc.status)}
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #F3F4F6',
                      fontSize: '0.75rem',
                      color: '#6B7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={12} />
                        {formatDate(doc.created)}
                      </div>
                      <div>
                        {doc.size}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}