export default function LeadsLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Kanban board skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['New', 'Contacted', 'Qualified', 'Converted'].map((status) => (
          <div key={status} className="bg-gray-50 rounded-lg p-4">
            <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
