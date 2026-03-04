'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Users, Shield, FolderKanban } from 'lucide-react';

interface OrgDetail {
  organisation: {
    id: string;
    name: string;
    ownerId: string;
    projectSharingMode: string;
    createdAt: string;
  };
  members: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    roleName: string;
    status: string;
  }[];
  roles: {
    id: string;
    name: string;
    isPreset: boolean;
    isSystemRole: boolean;
    permissions: Record<string, string>;
  }[];
  projectCount: number;
}

export default function SystemAdminOrgDetailPage() {
  const params = useParams();
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/system-admin/orgs/${params.id}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) setData(res.data);
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Loading...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-400 text-center py-12">Organisation not found</div>
    );
  }

  const { organisation: org, members, roles, projectCount } = data;

  return (
    <div>
      <Link href="/system-admin/orgs" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Organisations
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="h-6 w-6 text-gray-400" />
          {org.name}
        </h1>
        <p className="text-gray-400 mt-1">Created {new Date(org.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users className="h-4 w-4" />
            Members
          </div>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Shield className="h-4 w-4" />
            Roles
          </div>
          <p className="text-2xl font-bold text-white">{roles.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <FolderKanban className="h-4 w-4" />
            Projects
          </div>
          <p className="text-2xl font-bold text-white">{projectCount}</p>
        </div>
      </div>

      {/* Members */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Members</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 text-sm text-white">{member.userName}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{member.userEmail}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {member.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      member.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      member.status === 'invited' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Roles</h2>
        <div className="space-y-3">
          {roles.map((role) => (
            <div key={role.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white">{role.name}</h3>
                {role.isPreset && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">Preset</span>
                )}
                {role.isSystemRole && (
                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded">System</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(role.permissions || {}).map(([mod, level]) => (
                  <span
                    key={mod}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      level === 'manage' ? 'bg-green-500/10 text-green-400' :
                      level === 'edit' ? 'bg-yellow-500/10 text-yellow-400' :
                      level === 'view' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-gray-700 text-gray-500'
                    }`}
                  >
                    {mod}: {level}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
