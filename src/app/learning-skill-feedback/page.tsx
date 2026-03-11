'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Target, 
  Zap,
  Plus,
  Eye,
  RefreshCw,
  BarChart3,
  X
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Learning {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  impact: string;
  actionable: boolean;
  status: string;
}

interface SkillSuggestion {
  id: string;
  learningId: string;
  learningTitle: string;
  learningDescription: string;
  learningTags: string[];
  learningImpact: string;
  suggestedSkillName: string;
  suggestedSkillDescription: string;
  suggestedSkillCategory: string;
  suggestedSkillContent: string;
  suggestedTags: string[];
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  generatedBy: string;
  generationReason: string;
  createdAt: string;
  reviewNotes?: string;
  resultingSkillId?: string;
}

interface FeedbackLoopStats {
  metrics: {
    totalLearnings: number;
    actionableLearnings: number;
    suggestionsGenerated: number;
    suggestionsImplemented: number;
    learningsToSkillsRatio: number;
    averageConfidenceScore: number;
    averageImplementationTime: number;
  };
  recentSuggestions: SkillSuggestion[];
  topPerformingCategories: Array<{
    category: string;
    conversionRate: number;
    averageConfidence: number;
  }>;
  recommendations: string[];
}

// ============================================
// Modal Component (replaces shadcn Dialog)
// ============================================

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl mx-4 p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function LearningSkillFeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [stats, setStats] = useState<FeedbackLoopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'suggestions' | 'analytics'>('suggestions');
  
  // Modal states
  const [selectedSuggestion, setSelectedSuggestion] = useState<SkillSuggestion | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImplementModal, setShowImplementModal] = useState(false);
  
  // Form states
  const [selectedLearning, setSelectedLearning] = useState<string>('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [implementLoading, setImplementLoading] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Implementation form
  const [implementForm, setImplementForm] = useState({
    name: '',
    description: '',
    category: '',
    content: '',
    tags: '',
  });

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load data
  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const suggestionsRes = await fetch('/api/learning-skill-feedback');
      if (!suggestionsRes.ok) throw new Error('Failed to load suggestions');
      const suggestionsData = await suggestionsRes.json();
      setSuggestions(suggestionsData.data?.suggestions || []);
      
      const learningsRes = await fetch('/api/learnings?limit=100');
      if (!learningsRes.ok) throw new Error('Failed to load learnings');
      const learningsData = await learningsRes.json();
      setLearnings(learningsData.data?.learnings || []);
      
      const statsRes = await fetch('/api/learning-skill-feedback/stats');
      if (!statsRes.ok) throw new Error('Failed to load stats');
      const statsData = await statsRes.json();
      setStats(statsData.data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestion = async () => {
    if (!selectedLearning) return;
    try {
      setGenerateLoading(true);
      const res = await fetch('/api/learning-skill-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningId: selectedLearning }),
      });
      if (!res.ok) throw new Error('Failed to generate suggestion');
      const data = await res.json();
      if (data.data?.suggestions?.length > 0) {
        setSuggestions(prev => [...data.data.suggestions, ...prev]);
        setShowGenerateModal(false);
        setSelectedLearning('');
      } else {
        alert('No suggestions generated. The learning may not meet criteria.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestion');
    } finally {
      setGenerateLoading(false);
    }
  };

  const updateSuggestionStatus = async (suggestionId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/learning-skill-feedback/${suggestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      if (!res.ok) throw new Error('Failed to update suggestion');
      const data = await res.json();
      setSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, ...data.data } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suggestion');
    }
  };

  const implementSuggestion = async () => {
    if (!selectedSuggestion) return;
    try {
      setImplementLoading(true);
      const customizations = {
        name: implementForm.name || undefined,
        description: implementForm.description || undefined,
        category: implementForm.category || undefined,
        content: implementForm.content || undefined,
        tags: implementForm.tags ? implementForm.tags.split(',').map(t => t.trim()) : undefined,
      };
      const res = await fetch(`/api/learning-skill-feedback/${selectedSuggestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customizations }),
      });
      if (!res.ok) throw new Error('Failed to implement suggestion');
      const data = await res.json();
      setSuggestions(prev =>
        prev.map(s => s.id === selectedSuggestion.id ? 
          { ...s, status: 'implemented', resultingSkillId: data.data?.skillId } : s)
      );
      setShowImplementModal(false);
      setSelectedSuggestion(null);
      setImplementForm({ name: '', description: '', category: '', content: '', tags: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to implement suggestion');
    } finally {
      setImplementLoading(false);
    }
  };

  const openImplementModal = (suggestion: SkillSuggestion) => {
    setSelectedSuggestion(suggestion);
    setImplementForm({
      name: suggestion.suggestedSkillName,
      description: suggestion.suggestedSkillDescription,
      category: suggestion.suggestedSkillCategory,
      content: suggestion.suggestedSkillContent,
      tags: suggestion.suggestedTags.join(', '),
    });
    setShowImplementModal(true);
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && s.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'implemented': return <Zap className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const getPriorityClasses = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Learning-to-Skill Feedback Loop</h1>
                <p className="text-gray-600 mt-1">Transform learnings into actionable skills automatically</p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Generate Suggestion
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button onClick={() => setError(null)} className="text-red-600 text-sm underline mt-1">Dismiss</button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('suggestions')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'suggestions'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Skill Suggestions
                    </button>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`py-3 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'analytics'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Analytics
                    </button>
                  </nav>
                </div>

                {/* Suggestions Tab */}
                {activeTab === 'suggestions' && (
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="implemented">Implemented</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Priorities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions List */}
                    <div className="grid gap-4">
                      {filteredSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="p-4 pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getStatusIcon(suggestion.status)}
                                  <h3 className="text-lg font-semibold text-gray-900">{suggestion.suggestedSkillName}</h3>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityClasses(suggestion.priority)}`}>
                                    {suggestion.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500">Generated from: {suggestion.learningTitle}</p>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <p className="text-sm text-gray-600 mb-3">{suggestion.suggestedSkillDescription}</p>
                            
                            <div className="flex flex-wrap gap-1 mb-3">
                              {suggestion.suggestedTags.slice(0, 5).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-600">
                                  {tag}
                                </span>
                              ))}
                              {suggestion.suggestedTags.length > 5 && (
                                <span className="px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-600">
                                  +{suggestion.suggestedTags.length - 5} more
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{suggestion.suggestedSkillCategory}</span>
                                <span>•</span>
                                <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setSelectedSuggestion(suggestion); setShowViewModal(true); }}
                                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </button>
                                
                                {suggestion.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateSuggestionStatus(suggestion.id, 'approved')}
                                      className="p-1.5 rounded border border-gray-200 hover:bg-green-50 transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => updateSuggestionStatus(suggestion.id, 'rejected')}
                                      className="p-1.5 rounded border border-gray-200 hover:bg-red-50 transition-colors"
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    </button>
                                  </>
                                )}
                                
                                {suggestion.status === 'approved' && (
                                  <button
                                    onClick={() => openImplementModal(suggestion)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                    Implement
                                  </button>
                                )}
                                
                                {suggestion.status === 'implemented' && suggestion.resultingSkillId && (
                                  <span className="px-2 py-1 rounded-full text-xs border border-green-200 text-green-700 bg-green-50">
                                    Skill Created
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredSuggestions.length === 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No skill suggestions found</p>
                        <p className="text-sm text-gray-400 mt-1">Generate suggestions from your learnings to get started</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && stats && (
                  <div className="space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-2xl font-bold">{Math.round(stats.metrics.learningsToSkillsRatio * 100)}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Learnings to skills</p>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Avg Confidence</p>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="text-2xl font-bold">{Math.round(stats.metrics.averageConfidenceScore * 100)}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Suggestion quality</p>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Avg Implementation</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-500" />
                          <span className="text-2xl font-bold">{Math.round(stats.metrics.averageImplementationTime)}d</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Time to deploy</p>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Generated</p>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-purple-500" />
                          <span className="text-2xl font-bold">{stats.metrics.suggestionsGenerated}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Skill suggestions</p>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Recommendations</h3>
                      <p className="text-sm text-gray-500 mb-4">AI-generated insights to improve your feedback loop</p>
                      <ul className="space-y-2">
                        {stats.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Top Categories */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Top Performing Categories</h3>
                      <p className="text-sm text-gray-500 mb-4">Categories with highest learning-to-skill conversion rates</p>
                      <div className="space-y-3">
                        {stats.topPerformingCategories.map((cat, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="font-medium capitalize">{cat.category}</span>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{Math.round(cat.conversionRate * 100)}% conversion</span>
                              <span>{Math.round(cat.averageConfidence * 100)}% confidence</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Generate Suggestion Modal */}
      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)}>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Generate Skill Suggestion</h2>
        <p className="text-sm text-gray-500 mb-4">Select a learning to generate skill suggestions from</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Learning</label>
          <select
            value={selectedLearning}
            onChange={(e) => setSelectedLearning(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a learning</option>
            {learnings
              .filter(l => l.actionable && l.status === 'published')
              .map((learning) => (
                <option key={learning.id} value={learning.id}>
                  {learning.title} ({learning.category} • {learning.impact} impact)
                </option>
              ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowGenerateModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateSuggestion}
            disabled={!selectedLearning || generateLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generateLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Generate'}
          </button>
        </div>
      </Modal>

      {/* View Suggestion Modal */}
      <Modal open={showViewModal} onClose={() => setShowViewModal(false)}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Skill Suggestion Details</h2>
        
        {selectedSuggestion && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Suggested Skill Name</h4>
              <p className="text-sm text-gray-600">{selectedSuggestion.suggestedSkillName}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="text-sm text-gray-600">{selectedSuggestion.suggestedSkillDescription}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Content Preview</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-xs">{selectedSuggestion.suggestedSkillContent}</pre>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Generation Reason</h4>
              <p className="text-sm text-gray-600">{selectedSuggestion.generationReason}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Category:</strong> {selectedSuggestion.suggestedSkillCategory}</div>
              <div><strong>Priority:</strong> {selectedSuggestion.priority}</div>
              <div><strong>Confidence:</strong> {Math.round(selectedSuggestion.confidence * 100)}%</div>
              <div><strong>Status:</strong> {selectedSuggestion.status}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowViewModal(false)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Implement Suggestion Modal */}
      <Modal open={showImplementModal} onClose={() => setShowImplementModal(false)}>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Implement Skill</h2>
        <p className="text-sm text-gray-500 mb-4">Customize the skill before creating it (optional)</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
            <input
              type="text"
              value={implementForm.name}
              onChange={(e) => setImplementForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={implementForm.description}
              onChange={(e) => setImplementForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={implementForm.category}
              onChange={(e) => setImplementForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Content">Content</option>
              <option value="SEO">SEO</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Analytics">Analytics</option>
              <option value="Operations">Operations</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={implementForm.tags}
              onChange={(e) => setImplementForm(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown)</label>
            <textarea
              value={implementForm.content}
              onChange={(e) => setImplementForm(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => setShowImplementModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={implementSuggestion}
            disabled={implementLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {implementLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Create Skill'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
