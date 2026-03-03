'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, FileText, ScrollText, MessageSquare, 
  Loader2, LogOut, CreditCard, Clock, CheckCircle2,
  Circle, AlertCircle, ExternalLink, Send
} from 'lucide-react';

interface PortalContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  workflowTasks: { name: string; status: string }[];
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  dueDate: string;
  currency: string;
}

interface Contract {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  subject: string;
  lastMessageAt: string;
  messages: { id: string; content: string; senderType: string; createdAt: string }[];
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function PortalDashboardPage() {
  const router = useRouter();
  const [contact, setContact] = useState<PortalContact | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Message compose
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('portal_token');
    const storedContact = sessionStorage.getItem('portal_contact');

    if (!storedToken || !storedContact) {
      router.push('/portal');
      return;
    }

    setToken(storedToken);
    setContact(JSON.parse(storedContact));
    loadData(storedToken);
  }, []);

  const loadData = async (t: string) => {
    const headers = { 'x-portal-token': t };
    try {
      const [projRes, invRes, contRes, msgRes] = await Promise.all([
        fetch('/api/portal/projects', { headers }),
        fetch('/api/portal/invoices', { headers }),
        fetch('/api/portal/contracts', { headers }),
        fetch('/api/portal/messages', { headers }),
      ]);

      const [projData, invData, contData, msgData] = await Promise.all([
        projRes.json(), invRes.json(), contRes.json(), msgRes.json(),
      ]);

      if (projData.success) setProjects(projData.data || []);
      if (invData.success) setInvoices(invData.data || []);
      if (contData.success) setContracts(contData.data || []);
      if (msgData.success) setConversations(msgData.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('portal_token');
    sessionStorage.removeItem('portal_contact');
    sessionStorage.removeItem('portal_business');
    router.push('/portal');
  };

  const handleSendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-portal-token': token },
        body: JSON.stringify({ conversationId: selectedConv, content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        loadData(token);
      }
    } catch {} finally {
      setSendingMessage(false);
    }
  };

  const outstandingAmount = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const pendingContracts = contracts.filter((c) => ['sent', 'partially_signed'].includes(c.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'projects', label: 'Projects', icon: FolderOpen, count: projects.length },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
    { id: 'contracts', label: 'Contracts', icon: ScrollText, count: contracts.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: conversations.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Portal</h1>
            {contact && (
              <p className="text-sm text-gray-500">Welcome back, {contact.firstName}</p>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-500">Active Projects</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeProjects.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-gray-500">Outstanding Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${outstandingAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <ScrollText className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-500">Pending Contracts</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{pendingContracts.length}</p>
              </div>
            </div>

            {/* Active Projects Summary */}
            {activeProjects.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Active Projects</h3>
                <div className="space-y-3">
                  {activeProjects.slice(0, 3).map((project) => {
                    const totalTasks = project.workflowTasks.length;
                    const completedTasks = project.workflowTasks.filter((t) => t.status === 'completed').length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">{completedTasks}/{totalTasks} tasks completed</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activeProjects.length > 3 && (
                  <button onClick={() => setActiveTab('projects')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all projects →
                  </button>
                )}
              </div>
            )}

            {/* Outstanding Invoices */}
            {invoices.filter((i) => ['sent', 'overdue', 'partial'].includes(i.status)).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Outstanding Invoices</h3>
                <div className="space-y-3">
                  {invoices.filter((i) => ['sent', 'overdue', 'partial'].includes(i.status)).slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                          {inv.status}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">${inv.balanceDue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Projects</h2>
            </div>
            {projects.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {projects.map((project) => {
                  const totalTasks = project.workflowTasks.length;
                  const completedTasks = project.workflowTasks.filter((t) => t.status === 'completed').length;
                  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  return (
                    <div key={project.id} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-xs text-gray-500">Started {new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      {totalTasks > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-medium text-gray-600">{completedTasks}/{totalTasks} tasks</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="mt-3 space-y-1">
                            {project.workflowTasks.map((task, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-gray-300" />
                                )}
                                <span className={task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-600'}>{task.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Invoices</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Paid</th>
                      <th className="px-6 py-3">Balance</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">${inv.total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">${inv.amountPaid.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">${inv.balanceDue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[inv.status] || 'bg-gray-100 text-gray-700'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Contracts</h2>
            </div>
            {contracts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ScrollText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No contracts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <div key={contract.id} className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{contract.name}</h3>
                      <p className="text-xs text-gray-500">{new Date(contract.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[contract.status] || 'bg-gray-100 text-gray-700'}`}>
                        {contract.status.replace('_', ' ')}
                      </span>
                      {['sent', 'partially_signed'].includes(contract.status) && (
                        <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                          Review & Sign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            {conversations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <div key={conv.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{conv.subject || 'Conversation'}</h3>
                      <span className="text-xs text-gray-400">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString() : ''}
                      </span>
                    </div>
                    {/* Messages */}
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                      {conv.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderType === 'client' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            msg.senderType === 'client'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {msg.content}
                            <div className={`text-xs mt-1 ${msg.senderType === 'client' ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Reply */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedConv === conv.id ? newMessage : ''}
                        onChange={(e) => { setSelectedConv(conv.id); setNewMessage(e.target.value); }}
                        onFocus={() => setSelectedConv(conv.id)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type a message..."
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim() || selectedConv !== conv.id}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200">
        <p className="text-center text-xs text-gray-400">Powered by YD Dashboard</p>
      </footer>
    </div>
  );
}
