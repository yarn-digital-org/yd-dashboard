'use client';

import { useIsMobile } from '@/hooks/useIsMobile';

interface ProjectStats {
  byStatus: Record<string, number>;
  totalQuoted: number;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface ProjectStatsProps {
  stats: ProjectStats | null;
  statusOptions: string[];
  statusConfig: Record<string, StatusConfig>;
  activeStatus: string;
  onStatusChange: (status: string | 'all') => void;
  formatCurrency: (amount: number, currency: string) => string;
}

export default function ProjectStats({
  stats,
  statusOptions,
  statusConfig,
  activeStatus,
  onStatusChange,
  formatCurrency
}: ProjectStatsProps) {
  const isMobile = useIsMobile();

  if (!stats) return null;

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-6'} gap-3 mb-6`}>
      {statusOptions.filter(s => s !== 'archived').map((status) => {
        const config = statusConfig[status];
        const count = stats.byStatus[status] || 0;
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            onClick={() => onStatusChange(isActive ? 'all' : status)}
            className={`p-4 rounded-xl text-left transition-all cursor-pointer hover:shadow-sm ${
              isActive 
                ? 'border-2 shadow-sm' 
                : 'border border-gray-200 bg-white'
            }`}
            style={{
              borderColor: isActive ? config.color : undefined,
              backgroundColor: isActive ? config.bgColor : undefined,
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: config.color }}
            >
              {count}
            </div>
            <div className="text-xs text-gray-600">
              {config.label}
            </div>
          </button>
        );
      })}
      
      <div className="p-4 rounded-xl border border-gray-200 bg-white text-left">
        <div className="text-xl font-bold text-emerald-600">
          {formatCurrency(stats.totalQuoted, 'GBP')}
        </div>
        <div className="text-xs text-gray-600">Total Quoted</div>
      </div>
    </div>
  );
}