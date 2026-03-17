'use client';

import Link from 'next/link';
import { ArrowUpRight, User, Tag, DollarSign, Clock, CheckSquare, StickyNote, FileText } from 'lucide-react';

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

const DONE_STATUSES: ProjectStatus[] = ['completed', 'cancelled', 'archived'];

function getProgressColor(percent: number): { bar: string; badge: string; text: string } {
  if (percent >= 75) return { bar: 'bg-emerald-500', badge: 'bg-emerald-100', text: 'text-emerald-700' };
  if (percent >= 25) return { bar: 'bg-amber-400', badge: 'bg-amber-100', text: 'text-amber-700' };
  return { bar: 'bg-red-400', badge: 'bg-red-100', text: 'text-red-700' };
}

function isOverdue(project: Project): boolean {
  if (!project.endDate) return false;
  if (DONE_STATUSES.includes(project.status)) return false;
  return new Date(project.endDate) < new Date();
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
  const overdue = isOverdue(project);

  const progressColors = progress ? getProgressColor(progress.percent) : null;

  const visibleTags = project.tags?.slice(0, 3) ?? [];
  const extraTags = (project.tags?.length ?? 0) - 3;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
          <Link
            href={`/projects/${project.id}`}
            className="text-base font-semibold text-gray-900 hover:text-red-600 transition-colors flex items-center gap-1 group"
          >
            {project.name}
            <ArrowUpRight size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap">
            {project.serviceType && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                {project.serviceType}
              </span>
            )}
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
        </div>

        {/* Overdue warning */}
        {overdue && (
          <div className="flex items-center gap-1.5 text-orange-500 text-xs mb-2">
            <Clock size={12} />
            <span>Overdue</span>
          </div>
        )}

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
        {progress && progress.total > 0 && progressColors && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">{progress.completed}/{progress.total} tasks</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${progressColors.badge} ${progressColors.text}`}>
                {progress.percent}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColors.bar} rounded-full transition-all duration-300`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick-link chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {progress && progress.total > 0 && (
            <Link
              href={`/projects/${project.id}?tab=tasks`}
              className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 hover:bg-gray-200 transition-colors no-underline"
            >
              <CheckSquare size={10} />
              {progress.total} tasks
            </Link>
          )}
          <Link
            href={`/projects/${project.id}?tab=notes`}
            className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 hover:bg-gray-200 transition-colors no-underline"
          >
            <StickyNote size={10} />
            Notes
          </Link>
          <Link
            href={`/projects/${project.id}?tab=files`}
            className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 hover:bg-gray-200 transition-colors no-underline"
          >
            <FileText size={10} />
            Files
          </Link>
        </div>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="text-xs text-gray-400 px-1 py-0.5">+{extraTags} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
