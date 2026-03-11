'use client';

import { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeStatus: string;
  onStatusChange: (status: string | 'all') => void;
  contactFilter: string;
  onContactFilterChange: (contactId: string) => void;
  contacts: Contact[];
  statusOptions: string[];
  statusConfig: Record<string, StatusConfig>;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function ProjectFilters({
  searchQuery,
  onSearchChange,
  activeStatus,
  onStatusChange,
  contactFilter,
  onContactFilterChange,
  contacts,
  statusOptions,
  statusConfig,
  onClearFilters,
  hasActiveFilters
}: ProjectFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className={`flex-1 ${isMobile ? 'min-w-full' : 'min-w-48'} relative`}>
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search projects by name, description, service..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 border border-gray-200 rounded-lg cursor-pointer flex items-center gap-2 text-gray-700 text-sm transition-colors hover:bg-gray-50 ${
            showFilters ? 'bg-gray-100' : 'bg-white'
          }`}
        >
          <Filter size={18} />
          Filters
          <ChevronDown 
            size={16} 
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} 
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2.5 border-none rounded-lg bg-red-50 text-red-600 cursor-pointer text-sm hover:bg-red-100 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 p-4 bg-white border border-gray-200 rounded-lg mb-4`}>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Contact
            </label>
            <select
              value={contactFilter}
              onChange={(e) => onContactFilterChange(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="all">All Contacts</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName} {contact.company ? `(${contact.company})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={activeStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusConfig[status].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}