'use client';

import Link from 'next/link';
import { ArrowUpRight, User, Tag, DollarSign } from 'lucide-react';

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

interface ProjectCardProps {
  project: Project;
  statusConfig: Record<string, StatusConfig>;
  getContactName: (contactId: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  getTaskProgress: (tasks: WorkflowTask[]) => { completed: number; total: number; percent: number } | null;
}

export default function ProjectCard({
  project,
  statusConfig,
  getContactName,
  formatCurrency,
  getTaskProgress
}: ProjectCardProps) {
  const statusConf = statusConfig[project.status];
  const progress = getTaskProgress(project.workflowTasks);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Link
            href={`/projects/${project.id}`}
            className="text-base font-semibold text-gray-900 hover:text-red-600 transition-colors flex items-center gap-1 group"
          >
            {project.name}
            <ArrowUpRight size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          </Link>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: statusConf.bgColor,
              color: statusConf.color,
            }}
          >
            {statusConf.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {project.description.length > 100 
              ? `${project.description.slice(0, 100)}...` 
              : project.description}
          </p>
        )}

        {/* Meta Information */}
        <div className="space-y-1.5 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-gray-400" />
            <span>{getContactName(project.contactId)}</span>
          </div>
          
          {project.serviceType && (
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-gray-400" />
              <span>{project.serviceType}</span>
            </div>
          )}
          
          {project.quotedAmount && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <DollarSign size={14} />
              <span className="font-medium">
                {formatCurrency(project.quotedAmount, project.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        {progress && progress.total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Progress</span>
              <span>{progress.completed}/{progress.total} tasks</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {progress.percent}% complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}