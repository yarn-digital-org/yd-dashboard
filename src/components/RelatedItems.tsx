'use client';

import { Bot, CheckSquare, BookOpen, Building2 } from 'lucide-react';

interface RelatedItemsProps {
  title: string;
  type: 'agents' | 'tasks' | 'skills' | 'clients';
  items: any[];
  onItemClick?: (item: any) => void;
}

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

const statusColors: Record<string, string> = {
  'backlog': '#71717a',
  'in-progress': '#3b82f6',
  'review': '#a855f7',
  'done': '#22c55e',
  'active': '#4ade80',
  'idle': '#facc15',
  'offline': '#71717a',
  'prospect': '#60a5fa',
  'past': '#a1a1aa',
};

const icons: Record<string, React.ReactNode> = {
  agents: <Bot size={14} />,
  tasks: <CheckSquare size={14} />,
  skills: <BookOpen size={14} />,
  clients: <Building2 size={14} />,
};

export function RelatedItems({ title, type, items, onItemClick }: RelatedItemsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: '#a1a1aa', fontSize: 12, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        marginBottom: 8,
      }}>
        {icons[type]} {title} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.slice(0, 8).map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 8,
              background: '#09090b', border: '1px solid #1f1f23',
              cursor: onItemClick ? 'pointer' : 'default',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => onItemClick && (e.currentTarget.style.borderColor = '#3f3f46')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f23')}
          >
            <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 500 }}>
              {type === 'agents' ? item.name :
               type === 'tasks' ? item.title :
               type === 'skills' ? item.name :
               type === 'clients' ? item.clientName : ''}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10,
              fontWeight: 600, textTransform: 'capitalize',
              color: statusColors[item.status || item.category] || '#a1a1aa',
              background: `${statusColors[item.status || item.category] || '#a1a1aa'}15`,
            }}>
              {type === 'agents' ? item.role :
               type === 'tasks' ? item.status :
               type === 'skills' ? item.category :
               type === 'clients' ? item.status : ''}
            </span>
          </div>
        ))}
        {items.length > 8 && (
          <span style={{ color: '#71717a', fontSize: 12, padding: '4px 12px' }}>
            +{items.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}
