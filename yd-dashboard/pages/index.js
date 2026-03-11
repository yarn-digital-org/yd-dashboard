import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, BarChart, Users, Settings, Calendar, Search, Bell } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 4,
    completedTasks: 6,
    activeProjects: 3,
    teamMembers: 4
  });

  const quickActions = [
    {
      title: 'Agent Team',
      description: 'View AI team members and org chart',
      icon: Users,
      href: '/team',
      color: 'bg-blue-500 hover:bg-blue-600',
      priority: true
    },
    {
      title: 'GitHub Documents',
      description: 'Review and manage client documents in GitHub',
      icon: FileText,
      href: '/documents-github',
      color: 'bg-green-500 hover:bg-green-600',
      priority: true
    },
    {
      title: 'Skill Editor',
      description: 'Edit skills with Git commits',
      icon: Settings,
      href: '/skill-editor',
      color: 'bg-purple-500 hover:bg-purple-600',
      priority: true
    },
    {
      title: 'Skill Import',
      description: 'Import skills from external repositories',
      icon: Settings,
      href: '/skill-import',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Version History',
      description: 'Track changes across all documents',
      icon: BarChart,
      href: '/version-history',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Legacy Documents',
      description: 'Original document management system',
      icon: FileText,
      href: '/documents',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Scout completed SEO Audit',
      file: 'yarn-digital-seo-audit.md',
      time: '5 minutes ago',
      type: 'document'
    },
    {
      id: 2,
      action: 'Scout delivered Competitor Analysis',
      file: 'belfast-competitor-seo-analysis.md',
      time: '8 minutes ago',
      type: 'document'
    },
    {
      id: 3,
      action: 'Aria created Client Template',
      file: 'client-overview-template.md',
      time: '25 minutes ago',
      type: 'template'
    },
    {
      id: 4,
      action: 'Radar completed Analytics Setup',
      file: 'yd-clients-repo',
      time: '30 minutes ago',
      type: 'system'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'template':
        return FileText;
      case 'system':
        return Settings;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'document':
        return 'text-blue-600';
      case 'template':
        return 'text-green-600';
      case 'system':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yarn Digital Dashboard</h1>
              <p className="text-gray-600">AI Team Operations Hub</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
              </div>
              <BarChart className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Projects</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-gray-900">{stats.teamMembers}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <div className={`card-hover bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer ${action.priority ? 'ring-2 ring-blue-200' : ''}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg text-white ${action.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                          <p className="text-gray-600 text-sm">{action.description}</p>
                          {action.priority && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <IconComponent className={`w-5 h-5 mt-1 ${getActivityColor(activity.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500 truncate">{activity.file}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/documents" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all documents →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}