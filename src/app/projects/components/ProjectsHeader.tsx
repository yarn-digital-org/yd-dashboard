'use client';

import { Plus, Grid3X3, List } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ProjectsHeaderProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onNewProject: () => void;
}

export default function ProjectsHeader({ 
  viewMode, 
  onViewModeChange, 
  onNewProject 
}: ProjectsHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className="mb-6">
      <div className={`flex justify-between items-${isMobile ? 'start' : 'center'} mb-2 flex-wrap gap-3`}>
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 m-0`}>
            Projects
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Manage your client projects and workflows
          </p>
        </div>
        
        <div className={`flex gap-3 ${isMobile ? 'w-full' : 'w-auto'}`}>
          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 border-none transition-colors ${
                viewMode === 'list'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2 border-none border-l border-gray-200 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 size={18} />
            </button>
          </div>
          
          <button
            onClick={onNewProject}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium border-none cursor-pointer flex items-center gap-2 text-sm transition-colors"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>
    </div>
  );
}