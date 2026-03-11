import { useState, useEffect } from 'react';
import { Users, Activity, Calendar, MapPin, ChevronDown, ChevronRight } from 'lucide-react';

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [agents, setAgents] = useState([]);

  // Mock agent data - this would come from API in real implementation
  const agentData = [
    {
      id: 'jarvis',
      name: 'Jarvis',
      role: 'Chief of Staff / CMO',
      description: 'Strategic oversight, team coordination, and workflow management',
      skills: ['Strategy', 'Coordination', 'Planning', 'Analytics'],
      status: 'active',
      lastActivity: '2 min ago',
      tasksCompleted: 156,
      tasksInProgress: 3,
      avatar: 'J',
      bgColor: 'bg-blue-600',
      level: 'executive',
      reportsTo: 'jonny'
    },
    {
      id: 'bolt',
      name: 'Bolt',
      role: 'Dev & Engineering',
      description: 'Full-stack development, deployment, and technical architecture',
      skills: ['React', 'Node.js', 'APIs', 'DevOps'],
      status: 'active',
      lastActivity: '5 min ago',
      tasksCompleted: 98,
      tasksInProgress: 2,
      avatar: 'B',
      bgColor: 'bg-purple-600',
      level: 'team',
      reportsTo: 'jarvis'
    },
    {
      id: 'aria',
      name: 'Aria',
      role: 'Creative Director',
      description: 'Brand design, content creation, and visual strategy',
      skills: ['Design', 'Branding', 'Content', 'Creative'],
      status: 'active',
      lastActivity: '1 min ago',
      tasksCompleted: 87,
      tasksInProgress: 4,
      avatar: 'A',
      bgColor: 'bg-pink-600',
      level: 'team',
      reportsTo: 'jarvis'
    },
    {
      id: 'scout',
      name: 'Scout',
      role: 'Research & Strategy',
      description: 'Market research, competitive analysis, and strategic insights',
      skills: ['Research', 'SEO', 'Analytics', 'Strategy'],
      status: 'active',
      lastActivity: '3 min ago',
      tasksCompleted: 76,
      tasksInProgress: 2,
      avatar: 'S',
      bgColor: 'bg-green-600',
      level: 'team',
      reportsTo: 'jarvis'
    },
    {
      id: 'radar',
      name: 'Radar',
      role: 'Analytics & Monitoring',
      description: 'Performance tracking, reporting, and data analysis',
      skills: ['Analytics', 'Monitoring', 'Reporting', 'Data'],
      status: 'active',
      lastActivity: '7 min ago',
      tasksCompleted: 65,
      tasksInProgress: 1,
      avatar: 'R',
      bgColor: 'bg-orange-600',
      level: 'team',
      reportsTo: 'jarvis'
    },
    {
      id: 'blaze',
      name: 'Blaze',
      role: 'Ads & Paid Media',
      description: 'Digital advertising, campaign management, and paid media strategy',
      skills: ['Meta Ads', 'Google Ads', 'Campaigns', 'ROI'],
      status: 'active',
      lastActivity: '4 min ago',
      tasksCompleted: 54,
      tasksInProgress: 3,
      avatar: 'B',
      bgColor: 'bg-red-600',
      level: 'team',
      reportsTo: 'jarvis'
    }
  ];

  // CEO node (not an AI agent but part of org structure)
  const jonnyData = {
    id: 'jonny',
    name: 'Jonny',
    role: 'CEO & Founder',
    description: 'Overall strategy, client relationships, and business leadership',
    skills: ['Leadership', 'Strategy', 'Business', 'Clients'],
    status: 'active',
    lastActivity: '10 min ago',
    avatar: 'J',
    bgColor: 'bg-gray-800',
    level: 'ceo'
  };

  useEffect(() => {
    setAgents(agentData);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAgentCard = (agent) => (
    <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Agent Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${agent.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
            {agent.avatar}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.role}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agent.status)}`}>
          {agent.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4">{agent.description}</p>

      {/* Skills */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {agent.skills.map((skill, index) => (
            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Tasks Completed</p>
          <p className="text-2xl font-bold text-gray-900">{agent.tasksCompleted}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-gray-900">{agent.tasksInProgress}</p>
        </div>
      </div>

      {/* Last Activity */}
      <div className="flex items-center text-sm text-gray-500">
        <Activity className="w-4 h-4 mr-1" />
        Last activity: {agent.lastActivity}
      </div>
    </div>
  );

  const renderOrgChart = () => {
    const executiveAgents = [jonnyData];
    const managementAgents = agents.filter(agent => agent.level === 'executive');
    const teamAgents = agents.filter(agent => agent.level === 'team');

    const renderNode = (agent, level = 0, isLast = false) => (
      <div key={agent.id} className="flex flex-col items-center">
        {/* Node */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow min-w-[200px] text-center">
          <div className={`w-12 h-12 ${agent.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
            {agent.avatar}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
          <p className="text-xs text-gray-600">{agent.role}</p>
          {agent.tasksCompleted && (
            <div className="mt-2 text-xs text-gray-500">
              {agent.tasksCompleted} tasks completed
            </div>
          )}
        </div>
        
        {/* Connection line down (if not the bottom level) */}
        {(agent.id === 'jonny' || agent.id === 'jarvis') && (
          <div className="w-0.5 h-8 bg-gray-300"></div>
        )}
      </div>
    );

    return (
      <div className="bg-gray-50 p-8 rounded-lg">
        <div className="flex flex-col items-center space-y-8">
          {/* CEO Level */}
          <div className="flex justify-center">
            {renderNode(jonnyData)}
          </div>

          {/* Management Level */}
          {managementAgents.length > 0 && (
            <>
              <div className="flex justify-center">
                {managementAgents.map((agent) => renderNode(agent))}
              </div>
              <div className="w-0.5 h-8 bg-gray-300"></div>
            </>
          )}

          {/* Team Level - Show Jarvis since he's the manager */}
          <div className="flex justify-center">
            {renderNode(agents.find(a => a.id === 'jarvis') || managementAgents[0])}
          </div>

          {/* Horizontal line to team members */}
          <div className="relative w-full max-w-4xl">
            {/* Horizontal line */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-gray-300"></div>
            
            {/* Vertical connectors */}
            <div className="flex justify-center space-x-8 pt-4">
              {teamAgents.map((agent, index) => (
                <div key={agent.id} className="flex flex-col items-center">
                  <div className="w-0.5 h-8 bg-gray-300"></div>
                  {renderNode(agent, 2, index === teamAgents.length - 1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Team</h1>
              <p className="text-gray-600 mt-1">
                AI team members and organizational structure
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {agents.length} Active Agents
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${ 
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Overview
            </button>
            <button
              onClick={() => setActiveTab('orgchart')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orgchart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Org Chart
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          /* Team Overview Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {agents.map(agent => renderAgentCard(agent))}
          </div>
        ) : (
          /* Org Chart */
          <div className="w-full overflow-x-auto">
            {renderOrgChart()}
          </div>
        )}
      </div>
    </div>
  );
}