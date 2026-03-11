import { useState, useEffect } from 'react';
import { Search, Download, Eye, Filter, FileText, Calendar, User, Upload, Plus, History, Trash } from 'lucide-react';

export default function GitHubDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    fileName: '',
    content: '',
    message: '',
    path: ''
  });

  // Load documents from GitHub
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/github/documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents);
        setFilteredDocs(result.documents);
      } else {
        throw new Error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter documents based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDocs(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDocs(filtered);
    }
  }, [documents, searchTerm]);

  // Handle document upload
  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filePath = uploadForm.path ? 
        `${uploadForm.path}/${uploadForm.fileName}` : 
        uploadForm.fileName;

      const response = await fetch('/api/github/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: uploadForm.content,
          message: uploadForm.message || `Add ${uploadForm.fileName}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setShowUploadModal(false);
        setUploadForm({ fileName: '', content: '', message: '', path: '' });
        await loadDocuments(); // Reload documents
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = (doc) => {
    if (doc.download_url) {
      window.open(doc.download_url, '_blank');
    } else {
      alert('Download URL not available');
    }
  };

  // Handle document preview
  const handlePreview = async (doc) => {
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(doc.path)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const result = await response.json();
      if (result.success) {
        // Create a new window with the document content
        const newWindow = window.open('', '_blank', 'width=800,height=600');
        newWindow.document.write(`
          <html>
            <head>
              <title>${doc.name}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
                pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow: auto; }
                h1, h2, h3 { color: #333; }
              </style>
            </head>
            <body>
              <h1>${doc.name}</h1>
              <p><strong>Path:</strong> ${doc.path}</p>
              <p><strong>Size:</strong> ${doc.size} bytes</p>
              <hr>
              <pre>${result.content}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert(`Failed to preview document: ${error.message}`);
    }
  };

  // Handle document history
  const handleHistory = async (doc) => {
    try {
      const response = await fetch(`/api/github/documents/${encodeURIComponent(doc.path)}?action=history`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const result = await response.json();
      if (result.success) {
        setSelectedDoc({ ...doc, history: result.history });
      }
    } catch (error) {
      console.error('History error:', error);
      alert(`Failed to load history: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents from GitHub...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">GitHub Client Documents</h1>
              <p className="text-gray-600">
                Documents stored in GitHub repository. 
                Total: {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div key={doc.path} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.path}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePreview(doc)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleHistory(doc)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="History"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="text-gray-500 text-sm">
                  {formatSize(doc.size)}
                </div>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredDocs.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">Try adjusting your search or upload a new document.</p>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h2 className="text-xl font-bold mb-4">Upload Document to GitHub</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={uploadForm.fileName}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, fileName: e.target.value }))}
                    placeholder="document.md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Path (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={uploadForm.path}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, path: e.target.value }))}
                    placeholder="clients/project-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    required
                    rows="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Document content..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commit Message
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={uploadForm.message}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Add new client document"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {selectedDoc && selectedDoc.history && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">History: {selectedDoc.name}</h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedDoc.history.map(commit => (
                  <div key={commit.sha} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{commit.message}</p>
                        <p className="text-sm text-gray-600">
                          by {commit.author} on {formatDate(commit.date)}
                        </p>
                      </div>
                      <a 
                        href={commit.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View commit →
                      </a>
                    </div>
                    <p className="text-xs font-mono text-gray-500">{commit.sha}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}