'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, FolderKanban, FileText, DollarSign, Contact } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalOrganisations: number;
  totalProjects: number;
  totalInvoices: number;
  totalContacts: number;
  totalRevenue: number;
}

export default function SystemAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/system-admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Organisations', value: stats.totalOrganisations, icon: Building2, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-green-500 bg-green-500/10' },
    { label: 'Invoices', value: stats.totalInvoices, icon: FileText, color: 'text-yellow-500 bg-yellow-500/10' },
    { label: 'Contacts', value: stats.totalContacts, icon: Contact, color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">System Dashboard</h1>
        <p className="text-gray-400 mt-1">Platform-wide overview and management</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
