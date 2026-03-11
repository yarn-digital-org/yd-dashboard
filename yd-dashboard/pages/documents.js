import { useState, useEffect } from 'react';
import { Search, Download, Eye, Filter, FileText, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // UI states
  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load documents from API
  const loadDocuments = async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterAgent !== 'all') params.append('agent', filterAgent);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/documents?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents);
        setPagination(result.pagination);
        
        // Extract unique agents and categories for filter dropdowns
        const allAgents = [...new Set(result.documents.map(doc => doc.agent))];
        const allCategories = [...new Set(result.documents.map(doc => doc.category))];
        setAgents(allAgents);
        setCategories(allCategories);
      } else {
        throw new Error(result.error || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadDocuments(1, pagination.limit); // Reset to page 1 when filters change
  }, [searchTerm, filterAgent, filterCategory, filterStatus]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadDocuments(newPage, pagination.limit);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit) => {
    loadDocuments(1, newLimit); // Reset to page 1 when page size changes
  };

  // Handle download
  const handleDownload = (doc) => {
    console.log(`Downloading ${doc.filename}`);
    alert(`Download started: ${doc.filename}`);
  };

  // Handle preview
  const handlePreview = (doc) => {
    console.log(`Previewing ${doc.filename}`);
    alert(`Preview: ${doc.title}\\n\\n${doc.description}\\n\\nSize: ${doc.size}\\nAgent: ${doc.agent}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentColor = (agent) => {
    const colors = {
      'Scout': 'bg-blue-100 text-blue-800',
      'Bolt': 'bg-purple-100 text-purple-800',
      'Aria': 'bg-pink-100 text-pink-800',
      'Radar': 'bg-orange-100 text-orange-800'
    };
    return colors[agent] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Documents</h1>
          <p className="text-gray-600">
            Review all deliverables created by the Yarn Digital AI team. 
            {pagination.total > 0 && (
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
            <button 
              onClick={() => loadDocuments(pagination.page, pagination.limit)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Agent Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>

            {/* Page Size Selector */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={pagination.limit}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-500">{doc.filename}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(doc)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
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

              {/* Description */}
              <p className="text-gray-700 mb-4">{doc.description}</p>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${getAgentColor(doc.agent)}`}>
                  <User className="w-3 h-3 inline mr-1" />
                  {doc.agent}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {doc.category}
                </span>
                <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(doc.created)}
                </div>
                <div className="text-gray-500 text-sm">
                  {doc.size}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className={`p-2 rounded-lg flex items-center space-x-1 ${
                    pagination.hasPrev
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex space-x-1">
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className={`p-2 rounded-lg flex items-center space-x-1 ${
                    pagination.hasNext
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}