'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Sidebar } from '@/components/Sidebar';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
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

const getStartOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  // Start week on Monday (day=0 is Sunday, so go back 6 days; otherwise go back day-1)
  const diff = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { events, loading, error, connectionStatus, refetch } = useCalendarEvents();

  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
      await refetch();
    } catch (e) {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

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
    const dayNames = isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Day headers
    const headers = dayNames.map((day, idx) => (
      <div key={idx} style={{
        padding: isMobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: isMobile ? '0.7rem' : '0.75rem',
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
          minHeight: isMobile ? '60px' : '100px',
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
          minHeight: isMobile ? '60px' : '100px',
          padding: isMobile ? '0.25rem' : '0.5rem',
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
            {dayEvents.slice(0, isMobile ? 2 : 3).map(event => (
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
            {dayEvents.length > (isMobile ? 2 : 3) && (
              <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>
                +{dayEvents.length - (isMobile ? 2 : 3)} more
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

  // Get events for a specific day within a time range
  const getEventsInRange = (day: Date, startHour: number, endHour: number) => {
    return events.filter(event => {
      if (!isSameDay(event.start, day)) return false;
      const eventHour = event.start.getHours();
      return eventHour >= startHour && eventHour < endHour;
    });
  };

  // Calculate event position within the time grid
  const getEventStyle = (event: CalendarEvent): React.CSSProperties => {
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const duration = Math.max(endMinutes - startMinutes, 30); // min 30 mins display
    const topOffset = ((startMinutes - 8 * 60) / 60) * 60; // 60px per hour, starting from 8am
    const height = (duration / 60) * 60;
    
    return {
      position: 'absolute' as const,
      top: `${topOffset}px`,
      left: '2px',
      right: '2px',
      height: `${Math.max(height, 20)}px`,
      backgroundColor: event.color || '#FF3300',
      color: '#FFFFFF',
      fontSize: '0.7rem',
      padding: '2px 4px',
      borderRadius: '4px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: 'none',
      textAlign: 'left' as const,
      zIndex: 1,
    };
  };

  const renderWeekView = () => {
    const weekStart = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '40px repeat(7, 80px)' : '60px repeat(7, 1fr)', borderBottom: '1px solid #E5E7EB', minWidth: isMobile ? '600px' : 'auto' }}>
          <div style={{ padding: '0.5rem', borderRight: '1px solid #E5E7EB' }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} style={{
                padding: '0.75rem 0.5rem',
                textAlign: 'center',
                borderRight: i < 6 ? '1px solid #E5E7EB' : 'none',
                backgroundColor: isToday ? '#FFF5F2' : 'transparent',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.25rem' }}>
                  {dayNames[i]}
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#FF3300' : '#374151',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  backgroundColor: isToday ? '#FF330015' : 'transparent',
                }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '40px repeat(7, 80px)' : '60px repeat(7, 1fr)', maxHeight: '600px', overflow: 'auto', minWidth: isMobile ? '600px' : 'auto' }}>
          {/* Time labels + grid rows */}
          {HOURS.map((hour) => (
            <div key={hour} style={{ display: 'contents' }}>
              <div style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                color: '#9CA3AF',
                textAlign: 'right',
                borderRight: '1px solid #E5E7EB',
                borderBottom: '1px solid #F3F4F6',
                height: '60px',
                boxSizing: 'border-box',
              }}>
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              {weekDays.map((day, dayIdx) => {
                const hourEvents = getEventsInRange(day, hour, hour + 1);
                return (
                  <div key={dayIdx} style={{
                    position: 'relative',
                    borderRight: dayIdx < 6 ? '1px solid #E5E7EB' : 'none',
                    borderBottom: '1px solid #F3F4F6',
                    height: '60px',
                    backgroundColor: isSameDay(day, today) ? '#FFFBFA' : 'transparent',
                  }}>
                    {hourEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        style={{
                          position: 'absolute',
                          top: `${(event.start.getMinutes() / 60) * 60}px`,
                          left: '2px',
                          right: '2px',
                          height: `${Math.max(((event.end.getTime() - event.start.getTime()) / 3600000) * 60, 20)}px`,
                          backgroundColor: event.color || '#FF3300',
                          color: '#FFFFFF',
                          fontSize: '0.7rem',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: 'none',
                          textAlign: 'left',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
                        </div>
                        <div style={{ opacity: 0.9 }}>{formatDate(event.start, 'HH:mm')}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const today = new Date();
    const isToday = isSameDay(currentDate, today);
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div style={{ display: 'flex', gap: isMobile ? '0' : '1rem' }}>
        {/* Time grid */}
        <div style={{ flex: 1 }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: isToday ? '#FFF5F2' : 'transparent',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>
              {formatDate(currentDate, 'EEEE')}
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: isToday ? 700 : 500,
              color: isToday ? '#FF3300' : '#374151',
            }}>
              {formatDate(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflow: 'auto' }}>
            {HOURS.map((hour) => {
              const hourEvents = getEventsInRange(currentDate, hour, hour + 1);
              return (
                <div key={hour} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  minHeight: '60px',
                  borderBottom: '1px solid #F3F4F6',
                }}>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    color: '#9CA3AF',
                    textAlign: 'right',
                    borderRight: '1px solid #E5E7EB',
                  }}>
                    {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                  </div>
                  <div style={{ position: 'relative', minHeight: '60px' }}>
                    {hourEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          width: 'calc(100% - 8px)',
                          margin: '2px 4px',
                          padding: '0.5rem',
                          backgroundColor: event.color || '#FF3300',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          minHeight: `${Math.max(((event.end.getTime() - event.start.getTime()) / 3600000) * 60, 30)}px`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{event.title}</div>
                          <div style={{ opacity: 0.9, fontSize: '0.75rem', marginTop: '2px' }}>
                            {formatEventTime(event.start, event.end)}
                          </div>
                          {event.description && (
                            <div style={{ opacity: 0.8, fontSize: '0.7rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                              {event.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day event list sidebar - hidden on mobile */}
        <div style={{
          width: '260px',
          borderLeft: '1px solid #E5E7EB',
          padding: '1rem',
          display: isMobile ? 'none' : 'block',
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
            Events for {formatDate(currentDate, 'MMM d')}
          </h3>
          {dayEvents.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
              No events scheduled
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime()).map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.625rem',
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
                    height: '32px',
                    backgroundColor: event.color || '#FF3300',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {event.title}
                      <svg width="10" height="10" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.4 }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </p>
                    <p style={{ fontSize: '0.725rem', color: '#6B7280', margin: '0.125rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={10} />
                      {formatEventTime(event.start, event.end)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
      {!isMobile && <Sidebar />}
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: isMobile ? 0 : '240px' }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '0.75rem' : '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Calendar
            </h1>

            {/* Google sync status badge */}
            {connectionStatus === 'connected' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '999px',
                backgroundColor: '#D1FAE5', color: '#065F46',
                fontSize: '0.7rem', fontWeight: 600,
              }}>
                <CheckCircle2 size={11} /> Google Synced
              </span>
            )}
            {connectionStatus === 'token_expired' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '999px',
                backgroundColor: '#FEF3C7', color: '#92400E',
                fontSize: '0.7rem', fontWeight: 600,
              }}>
                <AlertCircle size={11} /> Token Expired
              </span>
            )}
            
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

            <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 500, color: '#374151' }}>
              {currentView === 'month' && formatDate(currentDate, 'MMMM yyyy')}
              {currentView === 'week' && (() => {
                const weekStart = getStartOfWeek(currentDate);
                const weekEnd = addDays(weekStart, 6);
                if (weekStart.getMonth() === weekEnd.getMonth()) {
                  return `${formatDate(weekStart, 'MMMM d')} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
                }
                return `${formatDate(weekStart, 'MMM d')} – ${formatDate(weekEnd, 'MMM d')}, ${weekEnd.getFullYear()}`;
              })()}
              {currentView === 'day' && formatDate(currentDate, isMobile ? 'MMM d, yyyy' : 'EEEE, MMMM d, yyyy')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  style={{
                    padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.875rem',
                    border: 'none',
                    backgroundColor: currentView === view ? '#FF3300' : '#FFFFFF',
                    color: currentView === view ? '#FFFFFF' : '#6B7280',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.8125rem' : '0.875rem',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {view}
                </button>
              ))}
            </div>

            {connectionStatus === 'connected' && (
              <button
                onClick={handleManualSync}
                disabled={syncing}
                title="Sync with Google Calendar"
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  opacity: syncing ? 0.6 : 1,
                }}
              >
                <RefreshCw size={16} color="#6B7280" style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              style={{
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
              {isMobile ? '' : 'Add Event'}
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '1rem', overflow: 'auto', paddingBottom: isMobile ? '80px' : '1rem' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
                Loading calendar...
              </div>
            ) : connectionStatus === 'not_connected' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem' }}>
                <CalendarIcon style={{ width: '48px', height: '48px', color: '#9CA3AF' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#374151', margin: 0 }}>Google Calendar Not Connected</h3>
                <p style={{ color: '#6B7280', textAlign: 'center', maxWidth: '400px', margin: 0 }}>
                  Connect your Google Calendar to see your events here and sync bookings automatically.
                </p>
                <a
                  href="/settings/integrations"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#FF3300',
                    color: '#FFFFFF',
                    padding: '0.625rem 1.5rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                  Configure in Settings
                </a>
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#DC2626' }}>
                <p>{error}</p>
                {connectionStatus === 'token_expired' && (
                  <a href="/settings/integrations" style={{ color: '#FF3300', textDecoration: 'none', fontWeight: 500 }}>
                    Reconnect in Settings
                  </a>
                )}
              </div>
            ) : (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', border: '1px solid #E5E7EB', padding: '0.5rem' }}>
                {currentView === 'month' && renderMonthView()}
                {currentView === 'week' && renderWeekView()}
                {currentView === 'day' && renderDayView()}
              </div>
            )}
          </div>

          {/* Sidebar - hidden on mobile */}
          <aside style={{
            width: '320px',
            backgroundColor: '#FFFFFF',
            borderLeft: '1px solid #E5E7EB',
            overflow: 'auto',
            padding: '1.25rem',
            display: isMobile ? 'none' : 'block',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
              Upcoming Events
            </h2>

            {upcomingEvents.length === 0 ? (
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
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                            }}>
                              {event.title}
                              <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0, opacity: 0.35 }}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
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
              borderRadius: isMobile ? '0.5rem' : '0.75rem',
              width: isMobile ? '95vw' : '100%',
              maxWidth: isMobile ? '95vw' : '450px',
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

      {/* Add Event Modal (basic placeholder) */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{ backgroundColor: '#FFFFFF', borderRadius: '0.75rem', width: '100%', maxWidth: '440px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>Add Event</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                placeholder="Event title"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="time" defaultValue="09:00" style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }} />
                <input type="time" defaultValue="10:00" style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', outline: 'none' }} />
              </div>
              <textarea
                placeholder="Description (optional)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', background: '#F3F4F6', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', backgroundColor: '#FF3300', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
