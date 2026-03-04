'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
} from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

// Helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date, formatStr: string) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return formatStr
    .replace('MMMM', months[date.getMonth()])
    .replace('MMM', shortMonths[date.getMonth()])
    .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
    .replace('yyyy', String(date.getFullYear()))
    .replace('EEEE', days[date.getDay()])
    .replace('EEE', shortDays[date.getDay()])
    .replace('dd', String(date.getDate()).padStart(2, '0'))
    .replace('d', String(date.getDate()))
    .replace('HH', String(date.getHours()).padStart(2, '0'))
    .replace('mm', String(date.getMinutes()).padStart(2, '0'));
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { events, loading, error, connectionStatus } = useCalendarEvents();

  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const weekFromNow = addDays(today, 7);
    
    return events
      .filter(event => {
        const eventDate = startOfDay(event.start);
        return eventDate >= addDays(today, -1) && eventDate <= weekFromNow;
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    upcomingEvents.forEach(event => {
      const dateKey = formatDate(event.start, 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [upcomingEvents]);

  // Navigation
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const modifier = direction === 'prev' ? -1 : 1;
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + modifier);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + (modifier * 7));
    } else {
      newDate.setDate(newDate.getDate() + modifier);
    }
    setCurrentDate(newDate);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const formatEventTime = (start: Date, end: Date) => {
    return `${formatDate(start, 'HH:mm')} - ${formatDate(end, 'HH:mm')}`;
  };

  const getDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, tomorrow)) return 'Tomorrow';
    return formatDate(date, 'EEEE, MMM d');
  };

  // Generate calendar grid
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Day headers
    const headers = dayNames.map(day => (
      <div key={day} style={{
        padding: '0.75rem 0.5rem',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '0.75rem',
        color: '#6B7280',
        borderBottom: '1px solid #E5E7EB',
      }}>
        {day}
      </div>
    ));
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} style={{
          minHeight: '100px',
          backgroundColor: '#F9FAFB',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
        }} />
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);
      const dayEvents = getEventsForDay(date);
      
      days.push(
        <div key={day} style={{
          minHeight: '100px',
          padding: '0.5rem',
          backgroundColor: isToday ? '#FFF5F2' : '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{
            fontWeight: isToday ? 700 : 400,
            fontSize: '0.875rem',
            color: isToday ? '#FF3300' : '#374151',
            marginBottom: '0.25rem',
          }}>
            {day}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {dayEvents.slice(0, 3).map(event => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                style={{
                  backgroundColor: event.color,
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.title}
              </button>
            ))}
            {dayEvents.length > 3 && (
              <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>
                +{dayEvents.length - 3} more
              </span>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        border: '1px solid #E5E7EB',
        borderRadius: '0.5rem',
        overflow: 'hidden',
      }}>
        {headers}
        {days}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    fontWeight: 500,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Sidebar />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Calendar
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => handleNavigate('prev')} style={{ ...buttonStyle, padding: '0.5rem' }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => handleNavigate('today')} style={buttonStyle}>
                Today
              </button>
              <button onClick={() => handleNavigate('next')} style={{ ...buttonStyle, padding: '0.5rem' }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <span style={{ fontSize: '1rem', fontWeight: 500, color: '#374151' }}>
              {formatDate(currentDate, 'MMMM yyyy')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    border: 'none',
                    backgroundColor: currentView === view ? '#FF3300' : '#FFFFFF',
                    color: currentView === view ? '#FFFFFF' : '#6B7280',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {view}
                </button>
              ))}
            </div>

            <button style={{
              backgroundColor: '#FF3300',
              color: '#FFFFFF',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.875rem',
            }}>
              <Plus size={16} />
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                Loading calendar...
              </div>
            ) : connectionStatus === 'not_connected' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <CalendarIcon size={80} style={{ color: '#D1D5DB', marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                  Connect Your Google Calendar
                </h3>
                <p style={{ fontSize: '1rem', color: '#6B7280', margin: '0 0 1.5rem', maxWidth: '400px' }}>
                  Connect your Google Calendar to view, create, and manage your events directly from your dashboard.
                </p>
                <button
                  onClick={() => window.location.href = '/settings/integrations'}
                  style={{
                    backgroundColor: '#FF3300',
                    color: '#FFFFFF',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Connect Google Calendar
                </button>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#DC2626' }}>
                {error}
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', padding: '0.5rem' }}>
                {currentView === 'month' && renderMonthView()}
                {currentView === 'week' && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                    Week view coming soon
                  </div>
                )}
                {currentView === 'day' && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                    Day view coming soon
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{
            width: '320px',
            backgroundColor: '#FFFFFF',
            borderLeft: '1px solid #E5E7EB',
            overflow: 'auto',
            padding: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
              Upcoming Events
            </h2>

            {connectionStatus === 'not_connected' ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <CalendarIcon size={32} style={{ marginBottom: '0.5rem', color: '#D1D5DB' }} />
                <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#9CA3AF' }}>
                  Connect your Google Calendar to see upcoming events
                </p>
                <button
                  onClick={() => window.location.href = '/settings/integrations'}
                  style={{
                    backgroundColor: '#FF3300',
                    color: '#FFFFFF',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Connect
                </button>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9CA3AF' }}>
                <CalendarIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.875rem' }}>No upcoming events</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
                  <div key={dateKey}>
                    <h3 style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      marginBottom: '0.75rem',
                    }}>
                      {getDateLabel(dateKey)}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dateEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleSelectEvent(event)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#F9FAFB',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: '4px',
                            height: '40px',
                            backgroundColor: event.color,
                            borderRadius: '2px',
                            flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: '#111827',
                              margin: '0 0 0.25rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {event.title}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6B7280',
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}>
                              <Clock size={12} />
                              {formatEventTime(event.start, event.end)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              width: '100%',
              maxWidth: '450px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: selectedEvent.color,
                  borderRadius: '50%',
                  marginTop: '0.25rem',
                }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <CalendarIcon size={18} style={{ color: '#6B7280' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0 }}>
                    {formatDate(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.125rem 0 0' }}>
                    {formatEventTime(selectedEvent.start, selectedEvent.end)}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, lineHeight: 1.6 }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}>
              <button onClick={() => setShowEventModal(false)} style={{ ...buttonStyle, backgroundColor: '#F3F4F6' }}>
                Close
              </button>
              <button style={{ ...buttonStyle, backgroundColor: '#FF3300', color: '#FFFFFF', border: 'none' }}>
                Edit Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
