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
  FolderOpen,
  ArrowLeft,
  BookOpen,
  Hash,
  Clock
} from 'lucide-react';

// Types
interface DocumentFile {
  id: string;
  title: string;
  filename: string;
  agent: 'Scout' | 'Bolt' | 'Aria' | 'Radar';
  path: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  type: 'markdown' | 'text' | 'other';
  contentPreview: string;
  content?: string;
  wordCount?: number;
  lineCount?: number;
  tags?: string[];
}

interface LibraryResponse {
  success: boolean;
  documents?: DocumentFile[];
  total?: number;
  lastScan?: string;
  error?: string;
}

type Agent = 'Scout' | 'Bolt' | 'Aria' | 'Radar';
type SortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'agent' | 'size' | 'modified';

// Constants
const AGENTS: Agent[] = ['Scout', 'Bolt', 'Aria', 'Radar'];

const AGENT_CONFIG: Record<Agent, { label: string; color: string; bgColor: string }> = {
  Scout: { label: 'Scout', color: '#3B82F6', bgColor: '#EFF6FF' },
  Bolt: { label: 'Bolt', color: '#8B5CF6', bgColor: '#F5F3FF' },
  Aria: { label: 'Aria', color: '#EC4899', bgColor: '#FDF2F8' },
  Radar: { label: 'Radar', color: '#F97316', bgColor: '#FFF7ED' },
};

export default function DocumentsLibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<Agent | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Viewer state
  const [viewingDocument, setViewingDocument] = useState<DocumentFile | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }, []);

  // Fetch documents from library API
  const fetchDocuments = useCallback(async (forceRescan = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRescan) {
        setScanning(true);
      }

      const url = `/api/library`;
      const response = await fetch(url);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch documents');
      }

      const data = json.data || json;
      setDocuments(data.documents || []);
      setLastScan(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, []);

  // Get document content (stored in Firestore, returned with document data)
  const fetchDocumentContent = useCallback(async (document: DocumentFile) => {
    // Content is included in the document from Firestore — no separate endpoint needed
    if (document.content) return document.content;
    
    // Fallback: fetch full document by ID from API
    try {
      const response = await fetch(`/api/library?id=${encodeURIComponent(document.id)}`);
      const data = await response.json();
      if (data.success && data.data?.documents?.[0]?.content) {
        return data.data.documents[0].content;
      }
      return document.contentPreview || 'No content available';
    } catch (err) {
      console.error('Error fetching document content:', err);
      return document.contentPreview || 'No content available';
    }
  }, []);

  // Handle document view
  const handleViewDocument = useCallback(async (document: DocumentFile) => {
    const content = await fetchDocumentContent(document);
    setViewingDocument({
      ...document,
      content: content || 'Failed to load content'
    });
  }, [fetchDocumentContent]);

  // Handle download
  const handleDownload = useCallback(async (doc: DocumentFile) => {
    try {
      const content = await fetchDocumentContent(doc);
      if (!content) return;

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  }, [fetchDocumentContent]);

  // Filter and sort documents
  const filteredAndSortedDocuments = useCallback(() => {
    let filtered = [...documents];

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.filename.toLowerCase().includes(query) ||
        doc.contentPreview.toLowerCase().includes(query) ||
        doc.agent.toLowerCase().includes(query)
      );
    }

    if (agentFilter !== 'all') {
      filtered = filtered.filter(doc => doc.agent === agentFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        case 'oldest':
          return new Date(a.created).getTime() - new Date(b.created).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'agent':
          return a.agent.localeCompare(b.agent);
        case 'size':
          return b.size - a.size;
        case 'modified':
          return new Date(b.modified).getTime() - new Date(a.modified).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, agentFilter, sortBy]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, fetchDocuments]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredDocs = filteredAndSortedDocuments();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {!isMobile && (
        <div className="w-64 bg-white shadow-sm">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents Library</h1>
                <p className="text-sm text-gray-600">
                  Auto-indexed documents from agent deliverables
                  {lastScan && (
                    <span className="ml-2">
                      • Last scan: {formatDate(lastScan)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchDocuments(true)}
                disabled={scanning || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Scanning...' : 'Rescan'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer */}
        {viewingDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
              {/* Viewer Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setViewingDocument(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{viewingDocument.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span style={{ color: AGENT_CONFIG[viewingDocument.agent].color }}>
                          {viewingDocument.agent}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(viewingDocument.created)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>{viewingDocument.sizeFormatted}</span>
                      </span>
                      {viewingDocument.wordCount && (
                        <span className="flex items-center space-x-1">
                          <Hash className="h-4 w-4" />
                          <span>{viewingDocument.wordCount} words</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(viewingDocument)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 overflow-auto p-6">
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Customize markdown rendering
                      h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold mb-4 text-gray-800">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium mb-3 text-gray-700">{children}</h3>,
                      code: (props: any) => {
                        const { inline, children, ...rest } = props;
                        return inline ? (
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm" {...rest}>
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code {...rest}>{children}</code>
                          </pre>
                        );
                      },
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {viewingDocument.content || 'No content available'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Agent Filter */}
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value as Agent | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Agents</option>
              {AGENTS.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="agent">By Agent</option>
              <option value="size">By Size</option>
              <option value="modified">Recently Modified</option>
            </select>

            {/* Results count */}
            <div className="text-sm text-gray-600">
              {filteredDocs.length} of {documents.length} documents
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">Error: {error}</p>
              <button
                onClick={() => fetchDocuments()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || agentFilter !== 'all' 
                  ? 'Try adjusting your filters or search query.'
                  : 'No documents have been indexed yet. Try clicking "Rescan" to discover new documents.'}
              </p>
              {(!searchQuery && agentFilter === 'all') && (
                <button
                  onClick={() => fetchDocuments(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Scan for Documents
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredDocs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            color: AGENT_CONFIG[doc.agent].color,
                            backgroundColor: AGENT_CONFIG[doc.agent].bgColor
                          }}
                        >
                          {doc.agent}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="View document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {doc.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-xs text-gray-600 mb-3 line-clamp-3">
                      {doc.contentPreview}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(doc.created)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{doc.sizeFormatted}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}