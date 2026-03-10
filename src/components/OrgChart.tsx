'use client';

import { useIsMobile } from '@/hooks/useIsMobile';

interface OrgNode {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'idle' | 'offline';
  isSpecial?: boolean;
}

const JONNY: OrgNode = {
  id: 'jonny',
  name: 'Jonny',
  role: 'CEO',
  avatar: '👨‍💼',
  status: 'active',
  isSpecial: true,
};

const JARVIS: OrgNode = {
  id: 'jarvis',
  name: 'Jarvis',
  role: 'COO / Team Lead',
  avatar: '🚀',
  status: 'active',
};

const TEAM: OrgNode[] = [
  { id: 'aria', name: 'Aria', role: 'Creative Director', avatar: '✍️', status: 'active' },
  { id: 'bolt', name: 'Bolt', role: 'Dev & Engineering', avatar: '⚡', status: 'active' },
  { id: 'scout', name: 'Scout', role: 'SEO & Research', avatar: '🔍', status: 'active' },
  { id: 'radar', name: 'Radar', role: 'Analytics', avatar: '📊', status: 'active' },
  { id: 'blaze', name: 'Blaze', role: 'Ads & Paid Media', avatar: '🔥', status: 'active' },
];

function NodeCard({ node, onClick }: { node: OrgNode; onClick?: () => void }) {
  const statusColor = node.status === 'active' ? 'bg-emerald-400' : node.status === 'idle' ? 'bg-amber-400' : 'bg-gray-400';

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-xl
        border transition-all duration-200 cursor-pointer text-left w-full
        ${node.isSpecial
          ? 'bg-gradient-to-br from-[#1a1a1a] to-[#111] border-primary/30 hover:border-primary/60 shadow-lg shadow-primary/5 hover:shadow-primary/10'
          : 'bg-[#1a1a1a] border-[#2d2d2d] hover:border-[#444] hover:bg-[#222]'
        }
      `}
    >
      {/* Status dot */}
      <span className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ${statusColor} ring-2 ring-[#1a1a1a]`} />

      {/* Avatar */}
      <div className={`
        flex-shrink-0 flex items-center justify-center rounded-lg text-xl
        ${node.isSpecial ? 'w-11 h-11 bg-primary/10' : 'w-10 h-10 bg-[#252525]'}
      `}>
        {node.avatar}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className={`font-semibold truncate ${node.isSpecial ? 'text-white text-sm' : 'text-[#e5e5e5] text-sm'}`}>
          {node.name}
        </div>
        <div className={`truncate ${node.isSpecial ? 'text-primary/80 text-xs font-medium' : 'text-[#888] text-xs'}`}>
          {node.role}
        </div>
      </div>
    </button>
  );
}

function Connector({ direction }: { direction: 'vertical' | 'down-branch' }) {
  if (direction === 'vertical') {
    return (
      <div className="flex justify-center">
        <div className="w-px h-8 bg-[#333]" />
      </div>
    );
  }
  return null;
}

export function OrgChart({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileOrgChart onNodeClick={onNodeClick} />;
  }

  return <DesktopOrgChart onNodeClick={onNodeClick} />;
}

function DesktopOrgChart({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center py-8 select-none">
      {/* CEO */}
      <div className="w-56">
        <NodeCard node={JONNY} onClick={() => onNodeClick?.('jonny')} />
      </div>

      {/* Vertical connector */}
      <Connector direction="vertical" />

      {/* COO */}
      <div className="w-56">
        <NodeCard node={JARVIS} onClick={() => onNodeClick?.('jarvis')} />
      </div>

      {/* Connector from COO down to horizontal bar */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-[#333]" />
      </div>

      {/* Horizontal bar + vertical drops to each team member */}
      <div className="relative w-full max-w-4xl">
        {/* Horizontal line */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-[#333]" />

        {/* Team nodes */}
        <div className="grid grid-cols-5 gap-3 px-4">
          {TEAM.map((member) => (
            <div key={member.id} className="flex flex-col items-center">
              {/* Vertical drop from horizontal bar */}
              <div className="w-px h-8 bg-[#333]" />
              <NodeCard node={member} onClick={() => onNodeClick?.(member.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileOrgChart({ onNodeClick }: { onNodeClick?: (id: string) => void }) {
  return (
    <div className="flex flex-col items-stretch gap-0 py-4 select-none">
      {/* CEO */}
      <div className="px-2">
        <NodeCard node={JONNY} onClick={() => onNodeClick?.('jonny')} />
      </div>

      {/* Vertical connector with left indent line */}
      <div className="flex">
        <div className="ml-7 w-px h-6 bg-[#333]" />
      </div>

      {/* COO */}
      <div className="px-2 ml-4">
        <NodeCard node={JARVIS} onClick={() => onNodeClick?.('jarvis')} />
      </div>

      {/* Team members with indent */}
      {TEAM.map((member, i) => (
        <div key={member.id}>
          {/* Connector */}
          <div className="flex items-stretch ml-4">
            <div className="ml-7 w-px h-6 bg-[#333]" />
          </div>
          {/* Node */}
          <div className="px-2 ml-8">
            <NodeCard node={member} onClick={() => onNodeClick?.(member.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
