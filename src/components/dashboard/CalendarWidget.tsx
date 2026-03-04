'use client';

import Link from 'next/link';
import { Calendar, Clock, Plus, ArrowUpRight, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';

interface CalendarWidgetProps {
  maxEvents?: number;
}

export function CalendarWidget({ maxEvents = 5 }: CalendarWidgetProps) {
  const { events, loading, error, connectionStatus } = useCalendarEvents();

  // Get upcoming events (sorted by start date, future only)
  const upcomingEvents = events
    .filter(event => event.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, maxEvents);

  const formatEventTime = (start: Date, end: Date) => {
    const now = new Date();
    
    // Check if it's today
    const isToday = start.toDateString() === now.toDateString();
    
    // Check if it's tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = start.toDateString() === tomorrow.toDateString();
    
    // Format time
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    
    const time = timeFormatter.format(start);
    
    if (isToday) {
      return `Today, ${time}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${time}`;
    } else {
      return `${dateFormatter.format(start)}, ${time}`;
    }
  };

  const getTimeUntil = (start: Date) => {
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) return 'In progress';
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    return `in ${diffDays}d`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Not connected state
  if (connectionStatus === 'not_connected') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <Calendar className="text-blue-500" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Connect Google Calendar</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sync your calendar to see upcoming events
          </p>
          <Link
            href="/settings/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Connect Now
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Token expired state
  if (connectionStatus === 'token_expired') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="text-amber-500" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Calendar Reconnection Needed</h3>
          <p className="text-sm text-gray-500 mb-4">
            Your Google Calendar connection has expired
          </p>
          <Link
            href="/settings/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
          >
            Reconnect
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error && connectionStatus === 'error') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="text-red-500" size={24} />
          </div>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar size={18} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/calendar?action=create"
            className="p-2 text-gray-500 hover:text-[#FF3300] hover:bg-gray-100 rounded-lg transition"
            title="Add event"
          >
            <Plus size={18} />
          </Link>
          <Link 
            href="/calendar"
            className="text-sm text-[#FF3300] hover:text-[#E62E00] font-medium flex items-center gap-1"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Events List */}
      <div className="divide-y divide-gray-100">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <Link 
              key={event.id}
              href={`/calendar?event=${event.id}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition group"
            >
              {/* Color Indicator */}
              <div 
                className="w-1 h-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color || '#6B7280' }}
              />
              
              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#FF3300] transition">
                  {event.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 truncate">
                    {formatEventTime(event.start, event.end)}
                  </span>
                </div>
              </div>
              
              {/* Time Until */}
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                {getTimeUntil(event.start)}
              </span>
            </Link>
          ))
        ) : (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Calendar className="text-gray-400" size={24} />
            </div>
            <p className="text-sm text-gray-500 mb-3">No upcoming events</p>
            <Link
              href="/calendar?action=create"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF3300] hover:bg-[#E62E00] rounded-lg transition"
            >
              <Plus size={16} />
              Add Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarWidget;
