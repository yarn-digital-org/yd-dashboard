'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Application Error
            </h2>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Our team has been notified.
            </p>

            {error.message && (
              <div className="bg-gray-50 rounded p-3 mb-6 text-left">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {error.message}
                </p>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full bg-[#FF3300] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#E62E00] transition-colors mb-3"
            >
              Try Again
            </button>

            <a
              href="/"
              className="block text-sm text-gray-600 hover:text-gray-900"
            >
              Return to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
