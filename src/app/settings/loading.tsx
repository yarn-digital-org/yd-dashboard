export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 bg-gray-200 rounded w-40 mb-8"></div>

      {/* Settings sections */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded w-32 mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
