'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';

// Import new components
import ProjectsHeader from './components/ProjectsHeader';
import ProjectStats from './components/ProjectStats';
import ProjectFilters from './components/ProjectFilters';
import ProjectGrid from './components/ProjectGrid';
import ProjectList from './components/ProjectList';
import ProjectPagination from './components/ProjectPagination';
import ProjectModal from './components/ProjectModal';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';

// Types
interface WorkflowTask {
  id: string;
  name: string;
  isCompleted: boolean;
  subtasks: { id: string; name: string; isCompleted: boolean }[];
}

interface Project {
  id: string;
  userId: string;
  contactId: string;
  leadId?: string;
  name: string;
  description?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  eventDate?: string;
  location?: string;
  quotedAmount?: number;
  currency: string;
  status: ProjectStatus;
  workflowTasks: WorkflowTask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
    stats: {
      total: number;
      byStatus: Record<ProjectStatus, number>;
      totalQuoted: number;
    };
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

interface ContactsResponse {
  success: boolean;
  data: {
    contacts: Contact[];
  };
}

interface ProjectFormData {
  name: string;
  contactId: string;
  description: string;
  serviceType: string;
  startDate: string;
  endDate: string;
  eventDate: string;
  location: string;
  quotedAmount: string;
  currency: string;
  status: ProjectStatus;
  tags: string[];
}

// Constants
const STATUS_OPTIONS: ProjectStatus[] = ['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived'];

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bgColor: '#F3F4F6' },
  active: { label: 'Active', color: '#10B981', bgColor: '#ECFDF5' },
  on_hold: { label: 'On Hold', color: '#F59E0B', bgColor: '#FFFBEB' },
  completed: { label: 'Completed', color: '#3B82F6', bgColor: '#EFF6FF' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEF2F2' },
  archived: { label: 'Archived', color: '#9CA3AF', bgColor: '#F9FAFB' },
};

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ProjectsResponse['data']['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Filter state
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState<string | 'all'>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    contactId: '',
    description: '',
    serviceType: '',
    startDate: '',
    endDate: '',
    eventDate: '',
    location: '',
    quotedAmount: '',
    currency: 'GBP',
    status: 'draft',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch contacts for dropdown
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data: ContactsResponse = await response.json();
      if (data.success) {
        setContacts(data.data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  }, [user]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      
      if (activeStatus !== 'all') params.append('status', activeStatus);
      if (searchQuery) params.append('search', searchQuery);
      if (contactFilter !== 'all') params.append('contactId', contactFilter);

      const response = await fetch(`/api/projects?${params}`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data: ProjectsResponse = await response.json();
      if (data.success) {
        setProjects(data.data.projects);
        setStats(data.data.stats);
        setTotalPages(Math.ceil(data.data.pagination.total / limit));
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user, page, activeStatus, searchQuery, contactFilter]);

  // Load data
  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchProjects();
    }
  }, [user, fetchContacts, fetchProjects]);

  // Utility functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown Contact';
  };

  const getTaskProgress = (tasks: WorkflowTask[]) => {
    if (!tasks || tasks.length === 0) return null;
    const completed = tasks.filter(task => task.isCompleted).length;
    return { 
      completed, 
      total: tasks.length, 
      percent: Math.round((completed / tasks.length) * 100) 
    };
  };

  // Event handlers
  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        await fetchProjects();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to archive this project?')) return;
    await handleStatusChange(projectId, 'archived');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactId: '',
      description: '',
      serviceType: '',
      startDate: '',
      endDate: '',
      eventDate: '',
      location: '',
      quotedAmount: '',
      currency: 'GBP',
      status: 'draft',
      tags: [],
    });
    setTagInput('');
  };

  const handleNewProject = () => {
    setEditingProject(null);
    resetForm();
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      contactId: project.contactId,
      description: project.description || '',
      serviceType: project.serviceType || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      eventDate: project.eventDate || '',
      location: project.location || '',
      quotedAmount: project.quotedAmount?.toString() || '',
      currency: project.currency,
      status: project.status,
      tags: project.tags,
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (data: ProjectFormData) => {
    setModalLoading(true);
    try {
      const projectData = {
        ...data,
        quotedAmount: data.quotedAmount ? parseFloat(data.quotedAmount) : undefined,
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        await fetchProjects();
      }
    } catch (err) {
      console.error('Error saving project:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleClearFilters = () => {
    setActiveStatus('all');
    setContactFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = activeStatus !== 'all' || contactFilter !== 'all' || searchQuery.length > 0;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6 lg:p-8'}`}>
        <ProjectsHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewProject={handleNewProject}
        />

        <ProjectStats
          stats={stats}
          statusOptions={STATUS_OPTIONS}
          statusConfig={STATUS_CONFIG}
          activeStatus={activeStatus}
          onStatusChange={(status) => setActiveStatus(status as ProjectStatus | 'all')}
          formatCurrency={formatCurrency}
        />

        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStatus={activeStatus}
          onStatusChange={(status) => setActiveStatus(status as ProjectStatus | 'all')}
          contactFilter={contactFilter}
          onContactFilterChange={setContactFilter}
          contacts={contacts}
          statusOptions={STATUS_OPTIONS}
          statusConfig={STATUS_CONFIG}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Projects Display */}
        {loading ? (
          <LoadingState viewMode={viewMode} />
        ) : error ? (
          <div className="text-center py-12 text-red-600 bg-white rounded-xl border border-gray-200">
            {error}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState 
            hasFilters={hasActiveFilters}
            onNewProject={handleNewProject}
          />
        ) : viewMode === 'grid' ? (
          <ProjectGrid
            projects={projects}
            statusConfig={STATUS_CONFIG}
            getContactName={getContactName}
            formatCurrency={formatCurrency}
            getTaskProgress={getTaskProgress}
          />
        ) : (
          <ProjectList
            projects={projects}
            statusConfig={STATUS_CONFIG}
            statusOptions={STATUS_OPTIONS}
            getContactName={getContactName}
            formatCurrency={formatCurrency}
            getTaskProgress={getTaskProgress}
            formatDate={formatDate}
            onStatusChange={handleStatusChange}
            onEditProject={handleEditProject}
            onArchiveProject={handleArchiveProject}
          />
        )}

        <ProjectPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalProjects={stats?.total || 0}
          projectsPerPage={limit}
        />

        {/* Modal */}
        <ProjectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleFormSubmit}
          editingProject={editingProject}
          contacts={contacts}
          statusOptions={STATUS_OPTIONS}
          statusConfig={STATUS_CONFIG}
          formData={formData}
          setFormData={setFormData}
          tagInput={tagInput}
          setTagInput={setTagInput}
          loading={modalLoading}
        />
      </main>
    </div>
  );
}