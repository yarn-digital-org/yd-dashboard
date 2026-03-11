'use client';

import { useIsMobile } from '@/hooks/useIsMobile';

interface LoadingStateProps {
  viewMode: 'grid' | 'list';
}

export default function LoadingState({ viewMode }: LoadingStateProps) {
  const isMobile = useIsMobile();

  if (viewMode === 'grid') {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
          >
            {/* Header skeleton */}
            <div className="flex justify-between items-start mb-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Meta info skeleton */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
            
            {/* Progress skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List view loading
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {['Project', 'Contact', 'Status', 'Progress', 'Quoted', 'Created', 'Actions'].map((header) => (
                <th key={header} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100 animate-pulse">
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-1.5 bg-gray-200 rounded-full w-full"></div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="h-8 bg-gray-200 rounded w-8 ml-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}