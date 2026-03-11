'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalProjects: number;
  projectsPerPage: number;
}

export default function ProjectPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalProjects,
  projectsPerPage
}: ProjectPaginationProps) {
  const startItem = (currentPage - 1) * projectsPerPage + 1;
  const endItem = Math.min(currentPage * projectsPerPage, totalProjects);

  const renderPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Number of page numbers to show
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-2 text-sm border-none cursor-pointer transition-colors ${
            currentPage === i
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          } ${i === startPage && i > 1 ? 'rounded-l-lg' : ''} ${
            i === endPage && i < totalPages ? 'rounded-r-lg' : ''
          }`}
          disabled={currentPage === i}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalProjects} projects
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 text-sm border border-gray-200 rounded-lg cursor-pointer transition-colors ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronLeft size={16} />
        </button>
        
        {/* Show first page if we're not starting from 1 */}
        {startItem > projectsPerPage && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              1
            </button>
            {startItem > projectsPerPage * 2 && (
              <span className="px-2 text-gray-400">...</span>
            )}
          </>
        )}
        
        {renderPageNumbers()}
        
        {/* Show last page if we're not ending at the last page */}
        {endItem < totalProjects && (
          <>
            {endItem < totalProjects - projectsPerPage && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 text-sm border border-gray-200 rounded-lg cursor-pointer transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}