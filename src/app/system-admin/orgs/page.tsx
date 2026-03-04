'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, Users, ChevronRight } from 'lucide-react';

interface OrgListItem {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  projectSharingMode: string;
  createdAt: string;
}

export default function SystemAdminOrgsPage() {
  const [orgs, setOrgs] = useState<OrgListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/system-admin/orgs')
      .then(res => res.json())
      .then(data => {
        if (data.success) setOrgs(data.data.organisations || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    org.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Organisations</h1>
          <p className="text-gray-400 mt-1">{orgs.length} total organisations</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Organisation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sharing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((org) => (
                <tr key={org.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300">{org.ownerName}</p>
                    <p className="text-xs text-gray-500">{org.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                      <Users className="h-3.5 w-3.5" />
                      {org.memberCount}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      org.projectSharingMode === 'all'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {org.projectSharingMode === 'all' ? 'All shared' : 'Per project'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/system-admin/orgs/${org.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    {search ? 'No organisations match your search' : 'No organisations yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
