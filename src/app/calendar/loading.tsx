export default function CalendarLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-40"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>

      {/* Calendar view skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Calendar toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="h-8 bg-gray-100 rounded"></div>
          ))}
          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded border border-gray-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
