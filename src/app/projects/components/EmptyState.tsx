'use client';

import { FolderKanban, Plus } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  onNewProject: () => void;
}

export default function EmptyState({ hasFilters, onNewProject }: EmptyStateProps) {
  return (
    <div className="py-12 text-center bg-white rounded-xl border border-gray-200">
      <FolderKanban size={64} className="text-gray-300 mx-auto mb-4" />
      
      <div className="mb-2">
        <h3 className="text-lg font-medium text-gray-900">
          {hasFilters ? 'No projects match your filters' : 'No projects found'}
        </h3>
      </div>
      
      <div className="text-sm text-gray-500 mb-6">
        {hasFilters
          ? 'Try adjusting your search criteria or filters'
          : 'Create your first project to get started'}
      </div>
      
      {!hasFilters && (
        <button
          onClick={onNewProject}
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Create Project
        </button>
      )}
    </div>
  );
}