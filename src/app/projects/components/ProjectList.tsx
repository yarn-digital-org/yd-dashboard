'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';

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

interface ProjectListProps {
  projects: Project[];
  statusConfig: Record<string, StatusConfig>;
  statusOptions: string[];
  getContactName: (contactId: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  getTaskProgress: (tasks: WorkflowTask[]) => { completed: number; total: number; percent: number } | null;
  formatDate: (date: string) => string;
  onStatusChange: (projectId: string, status: any) => void;
  onEditProject: (project: Project) => void;
  onArchiveProject: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  statusConfig,
  statusOptions,
  getContactName,
  formatCurrency,
  getTaskProgress,
  formatDate,
  onStatusChange,
  onEditProject,
  onArchiveProject
}: ProjectListProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Project
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Contact
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Progress
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Quoted
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Created
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => {
              const statusConf = statusConfig[project.status];
              const progress = getTaskProgress(project.workflowTasks);

              return (
                <tr
                  key={project.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-semibold text-gray-900 hover:text-red-600 transition-colors flex items-center gap-1 group w-fit"
                      >
                        {project.name}
                        <ArrowUpRight size={14} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                      </Link>
                      {project.serviceType && (
                        <div className="text-sm text-gray-600 mt-0.5">
                          {project.serviceType}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {getContactName(project.contactId)}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === project.id ? null : project.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: statusConf.bgColor,
                          color: statusConf.color,
                        }}
                      >
                        {statusConf.label}
                        <ChevronDown size={14} />
                      </button>
                      
                      {openDropdown === project.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-36">
                            {statusOptions.map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  onStatusChange(project.id, status);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-3 py-2 text-left border-none text-sm cursor-pointer transition-colors hover:bg-gray-50 ${
                                  project.status === status ? 'bg-gray-100' : ''
                                }`}
                                style={{ color: statusConfig[status].color }}
                              >
                                {statusConfig[status].label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {progress && progress.total > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          {progress.completed}/{progress.total} tasks
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No tasks</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {project.quotedAmount ? (
                      <div className="text-sm font-medium text-emerald-600">
                        {formatCurrency(project.quotedAmount, project.currency)}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">
                      {formatDate(project.createdAt)}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === `${project.id}-actions` ? null : `${project.id}-actions`)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      
                      {openDropdown === `${project.id}-actions` && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-36">
                            <button
                              onClick={() => {
                                onEditProject(project);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left border-none text-sm cursor-pointer transition-colors hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                onArchiveProject(project.id);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-3 py-2 text-left border-none text-sm cursor-pointer transition-colors hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 size={14} />
                              Archive
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}