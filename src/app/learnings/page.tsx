'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import { 
  Lightbulb,
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit,
  Archive,
  Calendar, 
  User, 
  RefreshCw,
  ChevronDown,
  CheckCircle,
  Clock,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Tag,
  Building,
  Folder,
  X,
  Save,
  Trash2
} from 'lucide-react';

// Types
interface Learning {
  id: string;
  title: string;
  description: string;
  category: 'seo' | 'development' | 'design' | 'marketing' | 'client-management';
  tags: string[];
  client?: string;
  project?: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  dateCreated: string;
  createdBy: string;
  lastUpdated: string;
  updatedBy: string;
  status: 'draft' | 'published' | 'archived';
  orgId: string;
}

interface LearningsResponse {
  success: boolean;
  data?: {
    learnings?: Learning[];
    total?: number;
  };
  error?: string;
}

type LearningCategory = 'seo' | 'development' | 'design' | 'marketing' | 'client-management';
type LearningImpact = 'high' | 'medium' | 'low';
type LearningStatus = 'draft' | 'published' | 'archived';
type LearningSortOption = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'category' | 'impact' | 'client';

// Constants
const CATEGORIES: LearningCategory[] = ['seo', 'development', 'design', 'marketing', 'client-management'];
const IMPACTS: LearningImpact[] = ['high', 'medium', 'low'];
const STATUS_OPTIONS: LearningStatus[] = ['published', 'draft', 'archived'];

const CATEGORY_CONFIG: Record<LearningCategory, { label: string; color: string; bgColor: string }> = {
  seo: { label: 'SEO', color: '#10B981', bgColor: '#ECFDF5' },
  development: { label: 'Development', color: '#3B82F6', bgColor: '#EFF6FF' },
  design: { label: 'Design', color: '#EC4899', bgColor: '#FDF2F8' },
  marketing: { label: 'Marketing', color: '#F97316', bgColor: '#FFF7ED' },
  'client-management': { label: 'Client Management', color: '#8B5CF6', bgColor: '#F5F3FF' },
};

const IMPACT_CONFIG: Record<LearningImpact, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  high: { label: 'High', color: '#EF4444', bgColor: '#FEF2F2', icon: ArrowUpCircle },
  medium: { label: 'Medium', color: '#F59E0B', bgColor: '#FFFBEB', icon: ArrowRightCircle },
  low: { label: 'Low', color: '#6B7280', bgColor: '#F3F4F6', icon: ArrowDownCircle },
};

const STATUS_CONFIG: Record<LearningStatus, { label: string; color: string; bgColor: string }> = {
  published: { label: 'Published', color: '#10B981', bgColor: '#ECFDF5' },
  draft: { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
  archived: { label: 'Archived', color: '#8B5CF6', bgColor: '#F5F3FF' },
};

export default function LearningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LearningCategory | 'all'>('all');
  const [impactFilter, setImpactFilter] = useState<LearningImpact | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LearningStatus | 'all'>('published');
  const [clientFilter, setClientFilter] = useState<string | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [actionableFilter, setActionableFilter] = useState<'all' | 'actionable' | 'non-actionable'>('all');
  const [sortBy, setSortBy] = useState<LearningSortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [viewingLearning, setViewingLearning] = useState<Learning | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'seo' as LearningCategory,
    tags: [] as string[],
    client: '',
    project: '',
    impact: 'medium' as LearningImpact,
    actionable: true,
    status: 'published' as LearningStatus,
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch learnings
  const fetchLearnings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (impactFilter !== 'all') params.append('impact', impactFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (clientFilter !== 'all') params.append('client', clientFilter);
      if (tagFilter.trim()) params.append('tags', tagFilter.trim());
      params.append('limit', '100'); // Get more results for client-side filtering

      const response = await fetch(`/api/learnings?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch learnings: ${response.statusText}`);
      }

      const result: LearningsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch learnings');
      }

      setLearnings(result.data?.learnings || []);
    } catch (err) {
      console.error('Error fetching learnings:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, impactFilter, statusFilter, clientFilter, tagFilter]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchLearnings();
    }
  }, [user, fetchLearnings]);

  // Filter and sort learnings
  const filteredAndSortedLearnings = learnings
    .filter(learning => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          learning.title.toLowerCase().includes(query) ||
          learning.description.toLowerCase().includes(query) ||
          learning.tags.some(tag => tag.toLowerCase().includes(query)) ||
          (learning.client && learning.client.toLowerCase().includes(query)) ||
          (learning.project && learning.project.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(learning => {
      // Actionable filter
      if (actionableFilter === 'actionable') return learning.actionable;
      if (actionableFilter === 'non-actionable') return !learning.actionable;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        case 'oldest':
          return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'client':
          return (a.client || '').localeCompare(b.client || '');
        default:
          return 0;
      }
    });

  // Get unique clients for filter
  const uniqueClients = Array.from(new Set(
    learnings.map(l => l.client).filter(Boolean)
  )).sort();

  // Create learning
  const handleCreateLearning = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/learnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create learning');
      }

      await fetchLearnings(); // Refresh the list
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'seo',
        tags: [],
        client: '',
        project: '',
        impact: 'medium',
        actionable: true,
        status: 'published',
      });
    } catch (err) {
      console.error('Error creating learning:', err);
      alert('Failed to create learning');
    }
  };

  // Update learning
  const handleUpdateLearning = async () => {
    if (!user || !editingLearning) return;

    try {
      const response = await fetch(`/api/learnings/${editingLearning.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update learning');
      }

      await fetchLearnings(); // Refresh the list
      setEditingLearning(null);
    } catch (err) {
      console.error('Error updating learning:', err);
      alert('Failed to update learning');
    }
  };

  // Archive learning
  const handleArchiveLearning = async (learning: Learning) => {
    if (!user || !confirm('Are you sure you want to archive this learning?')) return;

    try {
      const response = await fetch(`/api/learnings/${learning.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to archive learning');
      }

      await fetchLearnings(); // Refresh the list
    } catch (err) {
      console.error('Error archiving learning:', err);
      alert('Failed to archive learning');
    }
  };

  // Open edit modal
  const handleEditLearning = (learning: Learning) => {
    setEditingLearning(learning);
    setFormData({
      title: learning.title,
      description: learning.description,
      category: learning.category,
      tags: learning.tags,
      client: learning.client || '',
      project: learning.project || '',
      impact: learning.impact,
      actionable: learning.actionable,
      status: learning.status,
    });
  };

  // Handle tag input
  const handleTagInput = (value: string) => {
    if (value.includes(',')) {
      const newTags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      const allTags = Array.from(new Set([...formData.tags, ...newTags]));
      setFormData(prev => ({ ...prev, tags: allTags }));
      return '';
    }
    return value;
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Learnings</h1>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                {filteredAndSortedLearnings.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLearnings()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Learning
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search learnings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quick filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as LearningStatus | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as LearningCategory | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{CATEGORY_CONFIG[category].label}</option>
                ))}
              </select>

              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value as LearningImpact | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Impact</option>
                {IMPACTS.map(impact => (
                  <option key={impact} value={impact}>{IMPACT_CONFIG[impact].label}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                More
                <ChevronDown className={`h-3 w-3 transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4">
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Filter by tag..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <select
                value={actionableFilter}
                onChange={(e) => setActionableFilter(e.target.value as typeof actionableFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="actionable">Actionable Only</option>
                <option value="non-actionable">Non-Actionable Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as LearningSortOption)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="category">Category</option>
                <option value="impact">Impact (High to Low)</option>
                <option value="client">Client</option>
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">Error loading learnings</div>
              <div className="text-gray-600 text-sm">{error}</div>
              <button
                onClick={() => fetchLearnings()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredAndSortedLearnings.length === 0 ? (
            <div className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No learnings found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'published' 
                  ? 'Try adjusting your filters or search query.'
                  : 'Start building your knowledge base by adding your first learning.'
                }
              </p>
              {(!searchQuery && categoryFilter === 'all' && statusFilter === 'published') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add First Learning
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid gap-6">
                {filteredAndSortedLearnings.map((learning) => (
                  <div
                    key={learning.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title and meta */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {learning.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-2">
                              {learning.description}
                            </p>
                          </div>
                          
                          {/* Impact indicator */}
                          <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium shrink-0" style={{
                            color: IMPACT_CONFIG[learning.impact].color,
                            backgroundColor: IMPACT_CONFIG[learning.impact].bgColor,
                          }}>
                            {React.createElement(IMPACT_CONFIG[learning.impact].icon, { className: 'h-3 w-3' })}
                            {IMPACT_CONFIG[learning.impact].label} Impact
                          </div>
                        </div>

                        {/* Tags and metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                          {/* Category */}
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              color: CATEGORY_CONFIG[learning.category].color,
                              backgroundColor: CATEGORY_CONFIG[learning.category].bgColor,
                            }}
                          >
                            {CATEGORY_CONFIG[learning.category].label}
                          </span>

                          {/* Client */}
                          {learning.client && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {learning.client}
                            </div>
                          )}

                          {/* Project */}
                          {learning.project && (
                            <div className="flex items-center gap-1">
                              <Folder className="h-3 w-3" />
                              {learning.project}
                            </div>
                          )}

                          {/* Actionable indicator */}
                          {learning.actionable && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Actionable
                            </div>
                          )}

                          {/* Date */}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(learning.dateCreated).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Tags */}
                        {learning.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {learning.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setViewingLearning(learning)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEditLearning(learning)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleArchiveLearning(learning)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Learning Modal */}
      {viewingLearning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Learning Details</h2>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      color: IMPACT_CONFIG[viewingLearning.impact].color,
                      backgroundColor: IMPACT_CONFIG[viewingLearning.impact].bgColor,
                    }}
                  >
                    {IMPACT_CONFIG[viewingLearning.impact].label} Impact
                  </span>
                </div>
                <button
                  onClick={() => setViewingLearning(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{viewingLearning.title}</h3>
                  <p className="text-gray-600">{viewingLearning.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700">Category</label>
                    <div className="mt-1">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          color: CATEGORY_CONFIG[viewingLearning.category].color,
                          backgroundColor: CATEGORY_CONFIG[viewingLearning.category].bgColor,
                        }}
                      >
                        {CATEGORY_CONFIG[viewingLearning.category].label}
                      </span>
                    </div>
                  </div>

                  {viewingLearning.client && (
                    <div>
                      <label className="font-medium text-gray-700">Client</label>
                      <div className="mt-1 text-gray-600">{viewingLearning.client}</div>
                    </div>
                  )}

                  {viewingLearning.project && (
                    <div>
                      <label className="font-medium text-gray-700">Project</label>
                      <div className="mt-1 text-gray-600">{viewingLearning.project}</div>
                    </div>
                  )}

                  <div>
                    <label className="font-medium text-gray-700">Actionable</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        viewingLearning.actionable 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {viewingLearning.actionable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-gray-700">Created</label>
                    <div className="mt-1 text-gray-600">
                      {new Date(viewingLearning.dateCreated).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          color: STATUS_CONFIG[viewingLearning.status].color,
                          backgroundColor: STATUS_CONFIG[viewingLearning.status].bgColor,
                        }}
                      >
                        {STATUS_CONFIG[viewingLearning.status].label}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingLearning.tags.length > 0 && (
                  <div>
                    <label className="font-medium text-gray-700">Tags</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {viewingLearning.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Learning Modal */}
      {(showCreateModal || editingLearning) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingLearning ? 'Edit Learning' : 'Create Learning'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingLearning(null);
                    setFormData({
                      title: '',
                      description: '',
                      category: 'seo',
                      tags: [],
                      client: '',
                      project: '',
                      impact: 'medium',
                      actionable: true,
                      status: 'published',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingLearning) {
                    handleUpdateLearning();
                  } else {
                    handleCreateLearning();
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={100}
                    placeholder="Brief title describing the learning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    required
                    maxLength={2000}
                    placeholder="Detailed description of what was learned and its impact"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as LearningCategory }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {CATEGORY_CONFIG[category].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact
                    </label>
                    <select
                      value={formData.impact}
                      onChange={(e) => setFormData(prev => ({ ...prev, impact: e.target.value as LearningImpact }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {IMPACTS.map(impact => (
                        <option key={impact} value={impact}>
                          {IMPACT_CONFIG[impact].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client
                    </label>
                    <input
                      type="text"
                      value={formData.client}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Client name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project
                    </label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Project name (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !formData.tags.includes(value)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add tags (press Enter or comma to add)"
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-blue-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.actionable}
                      onChange={(e) => setFormData(prev => ({ ...prev, actionable: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Actionable learning</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LearningStatus }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {STATUS_CONFIG[status].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingLearning(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {editingLearning ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}