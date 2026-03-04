'use client';

import { useEffect } from 'react';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Projects error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load projects
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          {error.message || 'An unexpected error occurred while loading your projects.'}
        </p>
        <button
          onClick={reset}
          className="w-full bg-[#FF3300] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#E62E00] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
