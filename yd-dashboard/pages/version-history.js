import { useState, useEffect } from 'react';
import { GitCommit, Calendar, User, FileText, Eye, Download, GitBranch, Clock, Filter } from 'lucide-react';

export default function VersionHistory() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    author: 'all',
    timeframe: 'all',
    search: ''
  });

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/github/documents');
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents);
        if (result.documents.length > 0 && !selectedDoc) {
          setSelectedDoc(result.documents[0]);
        }
      }
    } catch (error) {
      setError('Failed to load documents: ' + error.message);
    }
  };

  // Load history for selected document
  const loadHistory = async (doc) => {
    if (!doc) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(doc.path)}?action=history`);
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.history);
      } else {
        throw new Error('Failed to load history');
      }
    } catch (error) {
      setError('Failed to load history: ' + error.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Get document content at specific commit
  const viewCommitContent = async (commit) => {
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(selectedDoc.path)}`);
      const result = await response.json();
      
      if (result.success) {
        // Create a new window with the document content
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        newWindow.document.write(`
          <html>
            <head>
              <title>${selectedDoc.name} - ${commit.sha.substring(0, 7)}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
                pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto; }
                h1, h2, h3 { color: #333; }
                .commit-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="commit-info">
                <h1>${selectedDoc.name}</h1>
                <p><strong>Commit:</strong> ${commit.sha.substring(0, 7)} - ${commit.message}</p>
                <p><strong>Author:</strong> ${commit.author} on ${formatDate(commit.date)}</p>
                <p><strong>Path:</strong> ${selectedDoc.path}</p>
              </div>
              <hr>
              <pre>${result.content}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      alert(`Failed to load content: ${error.message}`);
    }
  };

  // Filter history based on criteria
  const getFilteredHistory = () => {
    let filtered = history;

    if (filter.author !== 'all') {
      filtered = filtered.filter(commit => commit.author === filter.author);
    }

    if (filter.search) {
      filtered = filtered.filter(commit => 
        commit.message.toLowerCase().includes(filter.search.toLowerCase()) ||
        commit.author.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    if (filter.timeframe !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filter.timeframe) {
        case 'day':
          cutoff.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(commit => new Date(commit.date) >= cutoff);
    }

    return filtered;
  };

  // Get unique authors for filter
  const getAuthors = () => {
    const authors = [...new Set(history.map(commit => commit.author))];
    return authors.sort();
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedDoc) {
      loadHistory(selectedDoc);
    }
  }, [selectedDoc]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const filteredHistory = getFilteredHistory();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - Document List */}
        <div className="w-1/4 bg-white border-r border-gray-200 overflow-auto">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Version History</h1>
            
            <div className="space-y-2">
              {documents.map(doc => (
                <button
                  key={doc.path}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDoc?.path === doc.path
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-sm text-gray-500 truncate">{doc.path}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents found</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {selectedDoc ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedDoc.name}</h2>
                    <p className="text-sm text-gray-500">{selectedDoc.path}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{filteredHistory.length} commits</span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filter.author}
                      onChange={(e) => setFilter(prev => ({ ...prev, author: e.target.value }))}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="all">All Authors</option>
                      {getAuthors().map(author => (
                        <option key={author} value={author}>{author}</option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={filter.timeframe}
                    onChange={(e) => setFilter(prev => ({ ...prev, timeframe: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Time</option>
                    <option value="day">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>

                  <input
                    type="text"
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search commits..."
                    className="text-sm border border-gray-300 rounded px-2 py-1 flex-1 max-w-xs"
                  />
                </div>
              </div>

              {/* History Timeline */}
              <div className="flex-1 overflow-auto p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading history...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <GitCommit className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No commits found</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHistory.map((commit, index) => (
                      <div key={commit.sha} className="relative">
                        {/* Timeline line */}
                        {index < filteredHistory.length - 1 && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 ml-12 relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-8 top-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow"></div>
                          
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <GitCommit className="w-4 h-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-900">{commit.message}</h3>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>{commit.author}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{getRelativeTime(commit.date)}</span>
                                </div>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {commit.sha.substring(0, 7)}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-500">{formatDate(commit.date)}</p>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewCommitContent(commit)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Content"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View on GitHub"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <GitCommit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">Select a Document</h2>
                <p className="text-gray-500">Choose a document to view its version history</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}