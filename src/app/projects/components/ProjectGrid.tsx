'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import ProjectCard from './ProjectCard';

type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';

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

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface ProjectGridProps {
  projects: Project[];
  statusConfig: Record<string, StatusConfig>;
  getContactName: (contactId: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  getTaskProgress: (tasks: WorkflowTask[]) => { completed: number; total: number; percent: number } | null;
}

export default function ProjectGrid({
  projects,
  statusConfig,
  getContactName,
  formatCurrency,
  getTaskProgress
}: ProjectGridProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`grid gap-4 ${
      isMobile 
        ? 'grid-cols-1' 
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }`}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          statusConfig={statusConfig}
          getContactName={getContactName}
          formatCurrency={formatCurrency}
          getTaskProgress={getTaskProgress}
        />
      ))}
    </div>
  );
}