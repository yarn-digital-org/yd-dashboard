'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  Brain, 
  BarChart3, 
  Settings,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Star,
  Activity
} from 'lucide-react';

interface Learning {
  id: string;
  timestamp: string;
  type: 'task_completion' | 'error_resolution' | 'workflow_optimization' | 'knowledge_gap' | 'tool_usage';
  action: string;
  context: {
    tools?: string[];
    domain?: string;
    knowledge_gaps?: string[];
  };
  outcome: {
    success_factors?: string[];
    failure_points?: string[];
  };
  patterns: {
    tools_used: string[];
    domain: string;
    complexity: number;
    success_factors: string[];
    failure_points: string[];
  };
  confidence: number;
}

interface SkillRecommendation {
  id: string;
  skill: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
  learning_path: {
    step: number;
    title: string;
    duration: string;
    completed?: boolean;
  }[];
  estimated_time: number;
  success_metrics: string[];
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface FeedbackAnalysis {
  effectiveness: {
    overall_score: number;
    individual_metrics: {
      skill_acquisition_rate: number;
      performance_improvement: number;
      knowledge_retention: number;
      application_success: number;
    };
    trends: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    };
  };
  areas_for_improvement: string[];
  success_patterns: string[];
  optimization_opportunities: {
    description: string;
    recommended_action: string;
    expected_impact: string;
    estimated_effort: string;
  }[];
}

export default function LearningSkillFeedbackDashboard() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [feedback, setFeedback] = useState<FeedbackAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddLearning, setShowAddLearning] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [learningsResponse, recommendationsResponse, feedbackResponse] = await Promise.all([
        fetch('/api/learning-skill-feedback/learnings'),
        fetch('/api/learning-skill-feedback/recommendations'), 
        fetch('/api/learning-skill-feedback/feedback')
      ]);

      if (learningsResponse.ok) {
        const learningsData = await learningsResponse.json();
        setLearnings(learningsData);
      }

      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData);
      }

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Toast notification would go here
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const filteredLearnings = learnings.filter(learning => {
    const matchesSearch = learning.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         learning.patterns.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || learning.type === filterType;
    const matchesDomain = filterDomain === 'all' || learning.patterns.domain === filterDomain;
    
    return matchesSearch && matchesType && matchesDomain;
  }).sort((a, b) => {
    const aValue = sortBy === 'timestamp' ? new Date(a.timestamp).getTime() : 
                   sortBy === 'confidence' ? a.confidence : 
                   sortBy === 'complexity' ? a.patterns.complexity : 0;
    const bValue = sortBy === 'timestamp' ? new Date(b.timestamp).getTime() : 
                   sortBy === 'confidence' ? b.confidence : 
                   sortBy === 'complexity' ? b.patterns.complexity : 0;
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getTypeColor = (type: string) => {
    const colors = {
      task_completion: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs',
      error_resolution: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs', 
      workflow_optimization: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs',
      knowledge_gap: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs',
      tool_usage: 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs',
      medium: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs',
      low: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs',
      in_progress: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs',
      completed: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOverallProgress = () => {
    if (recommendations.length === 0) return 0;
    const totalProgress = recommendations.reduce((sum, rec) => sum + rec.progress, 0);
    return Math.round(totalProgress / recommendations.length);
  };

  const getHighPriorityRecommendations = () => {
    return recommendations.filter(rec => rec.priority === 'high').length;
  };

  const getCompletedRecommendations = () => {
    return recommendations.filter(rec => rec.status === 'completed').length;
  };

  const getAverageConfidence = () => {
    if (learnings.length === 0) return 0;
    const totalConfidence = learnings.reduce((sum, learning) => sum + learning.confidence, 0);
    return Math.round(totalConfidence / learnings.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning-to-Skill Feedback Loop</h1>
          <p className="text-gray-600">
            Track learning patterns, skill recommendations, and feedback analysis
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddLearning(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Learning
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Learnings</p>
              <p className="text-2xl font-bold text-gray-900">{learnings.length}</p>
              <p className="text-xs text-gray-500">Captured learning events</p>
            </div>
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Skill Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
              <p className="text-xs text-gray-500">{getHighPriorityRecommendations()} high priority</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{calculateOverallProgress()}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${calculateOverallProgress()}%` }}
                ></div>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{getAverageConfidence()}%</p>
              <p className="text-xs text-gray-500">Learning confidence score</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'learnings', 'recommendations', 'feedback'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Learnings */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Recent Learnings</h3>
              <div className="space-y-3">
                {learnings.slice(0, 5).map(learning => (
                  <div key={learning.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <span className={getTypeColor(learning.type)}>
                      {learning.type.replace('_', ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{learning.action}</p>
                      <p className="text-xs text-gray-500">
                        {learning.patterns.domain} • {formatDate(learning.timestamp)}
                      </p>
                    </div>
                    <span className="text-xs border px-2 py-1 rounded">{learning.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Recommendations */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Active Recommendations</h3>
              <div className="space-y-3">
                {recommendations
                  .filter(rec => rec.status === 'in_progress')
                  .slice(0, 5)
                  .map(recommendation => (
                    <div key={recommendation.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">{recommendation.skill}</h4>
                        <span className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <span>{recommendation.domain}</span>
                        <span>•</span>
                        <span>{recommendation.estimated_time}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${recommendation.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {feedback && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{feedback.effectiveness.overall_score}%</div>
                  <p className="text-xs text-gray-500">Overall Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {feedback.effectiveness.individual_metrics.skill_acquisition_rate}%
                  </div>
                  <p className="text-xs text-gray-500">Acquisition Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {feedback.effectiveness.individual_metrics.performance_improvement}%
                  </div>
                  <p className="text-xs text-gray-500">Performance Improvement</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {feedback.effectiveness.individual_metrics.knowledge_retention}%
                  </div>
                  <p className="text-xs text-gray-500">Knowledge Retention</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'learnings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Filters & Search</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search learnings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="task_completion">Task Completion</option>
                  <option value="error_resolution">Error Resolution</option>
                  <option value="workflow_optimization">Workflow Optimization</option>
                  <option value="knowledge_gap">Knowledge Gap</option>
                  <option value="tool_usage">Tool Usage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Domains</option>
                  <option value="analytics">Analytics</option>
                  <option value="development">Development</option>
                  <option value="research">Research</option>
                  <option value="automation">Automation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="timestamp">Date</option>
                  <option value="confidence">Confidence</option>
                  <option value="complexity">Complexity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Learnings Table */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Learning Events</h3>
              <p className="text-sm text-gray-600">
                {filteredLearnings.length} of {learnings.length} learnings
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLearnings.map((learning) => (
                    <tr key={learning.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {learning.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getTypeColor(learning.type)}>
                          {learning.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{learning.patterns.domain}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs border px-2 py-1 rounded">{learning.confidence}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(learning.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-1">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{recommendation.skill}</h3>
                  <p className="text-sm text-gray-600">{recommendation.domain}</p>
                </div>
                <span className={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{recommendation.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${recommendation.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Estimated Time</span>
                  <span>{recommendation.estimated_time}h</span>
                </div>
                
                <span className={getStatusColor(recommendation.status)}>
                  {recommendation.status.replace('_', ' ')}
                </span>

                <div>
                  <h4 className="text-sm font-medium mb-2">Learning Path</h4>
                  {recommendation.learning_path.map((step) => (
                    <div key={step.step} className="flex items-center space-x-2 text-sm mb-1">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                        step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step.completed ? <CheckCircle className="h-3 w-3" /> : step.step}
                      </div>
                      <span className={step.completed ? 'line-through text-gray-500' : ''}>
                        {step.title}
                      </span>
                      <span className="text-gray-400">({step.duration})</span>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center">
                  {recommendation.status === 'not_started' ? 'Start Learning' : 'Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'feedback' && feedback && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Effectiveness Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {feedback.effectiveness.overall_score}%
                </div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <div className="flex items-center justify-center mt-2">
                  {feedback.effectiveness.trends.direction === 'up' ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : feedback.effectiveness.trends.direction === 'down' ? (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className="text-sm ml-1">
                    {feedback.effectiveness.trends.percentage}%
                  </span>
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {feedback.effectiveness.individual_metrics.skill_acquisition_rate}%
                </div>
                <p className="text-sm text-gray-600">Acquisition Rate</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {feedback.effectiveness.individual_metrics.performance_improvement}%
                </div>
                <p className="text-sm text-gray-600">Performance Improvement</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {feedback.effectiveness.individual_metrics.knowledge_retention}%
                </div>
                <p className="text-sm text-gray-600">Knowledge Retention</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
              <div className="space-y-3">
                {feedback.areas_for_improvement.map((area, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Success Patterns</h3>
              <div className="space-y-3">
                {feedback.success_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Optimization Opportunities</h3>
            <div className="space-y-4">
              {feedback.optimization_opportunities.map((opportunity, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{opportunity.description}</h4>
                    <div className="flex space-x-2">
                      <span className="text-xs border px-2 py-1 rounded">Impact: {opportunity.expected_impact}</span>
                      <span className="text-xs border px-2 py-1 rounded">Effort: {opportunity.estimated_effort}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {opportunity.recommended_action}
                  </p>
                  <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Implement
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Learning Modal */}
      {showAddLearning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Learning</h3>
            <p className="text-sm text-gray-600 mb-4">Manually add a learning event to the system</p>
            {/* Form would go here */}
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowAddLearning(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Add Learning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
