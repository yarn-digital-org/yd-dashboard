'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Users, Shield, FolderKanban, Plus, Edit3, Trash2, Check,
  X, ChevronDown, UserPlus, AlertCircle, Settings2
} from 'lucide-react';

// Types
interface RoleData {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, string>;
  isPreset: boolean;
  isSystemRole: boolean;
}

interface MemberData {
  id: string;
  userId: string;
  roleId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  roleName: string;
  status: string;
  projectIds?: string[];
}

interface OrgData {
  id: string;
  name: string;
  ownerId: string;
  projectSharingMode: 'all' | 'per_project';
}

const PERMISSION_MODULES = [
  { module: 'projects', label: 'Projects', description: 'Manage client projects, tasks, files, and workflow progress' },
  { module: 'contacts', label: 'Contacts', description: 'View and manage client contacts, tags, and custom fields' },
  { module: 'leads', label: 'Leads', description: 'Track and manage incoming leads and proposals' },
  { module: 'invoices', label: 'Invoices', description: 'Create, send, and manage invoices and payments' },
  { module: 'contracts', label: 'Contracts', description: 'Create, send, and manage contracts and signatures' },
  { module: 'messages', label: 'Messages', description: 'View and reply to client messages and conversations' },
  { module: 'calendar', label: 'Calendar', description: 'Manage calendar events, bookings, and availability' },
  { module: 'workflows', label: 'Workflows', description: 'Create and edit workflow templates for projects' },
  { module: 'forms', label: 'Forms', description: 'Build and manage lead capture and feedback forms' },
  { module: 'content', label: 'Content', description: 'Manage content library and marketing materials' },
  { module: 'automations', label: 'Automations', description: 'Set up and manage automated workflows and triggers' },
];

const PERMISSION_LEVELS = [
  { level: 'none', label: 'No Access', color: 'bg-gray-100 text-gray-600' },
  { level: 'view', label: 'View Only', color: 'bg-blue-100 text-blue-700' },
  { level: 'edit', label: 'Edit', color: 'bg-yellow-100 text-yellow-700' },
  { level: 'manage', label: 'Full Control', color: 'bg-green-100 text-green-700' },
];

type Tab = 'members' | 'roles' | 'sharing';

export default function UsersPermissionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, rolesRes, orgRes] = await Promise.all([
        fetch('/api/org/members'),
        fetch('/api/roles'),
        fetch('/api/org/settings'),
      ]);

      const [membersData, rolesData, orgData] = await Promise.all([
        membersRes.json(),
        rolesRes.json(),
        orgRes.json(),
      ]);

      if (membersData.success) setMembers(membersData.data.members || []);
      if (rolesData.success) setRoles(rolesData.data.roles || []);
      if (orgData.success) setOrg(orgData.data.organisation || null);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { id: 'members' as Tab, label: 'Members', icon: Users },
    { id: 'roles' as Tab, label: 'Roles', icon: Shield },
    { id: 'sharing' as Tab, label: 'Project Sharing', icon: FolderKanban },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Users & Permissions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage team members, roles, and project access for your organisation
        </p>
      </div>

      {!org && (
        <SetupOrgCard onCreated={fetchData} />
      )}

      {org && (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {activeTab === 'members' && (
                <MembersTab
                  members={members}
                  roles={roles}
                  org={org}
                  onRefresh={fetchData}
                  onInvite={() => setShowInviteModal(true)}
                />
              )}

              {activeTab === 'roles' && (
                <RolesTab
                  roles={roles}
                  onRefresh={fetchData}
                  onCreateRole={() => { setEditingRole(null); setShowRoleModal(true); }}
                  onEditRole={(role) => { setEditingRole(role); setShowRoleModal(true); }}
                />
              )}

              {activeTab === 'sharing' && (
                <SharingTab org={org} onRefresh={fetchData} />
              )}
            </div>
          </div>

          {/* Modals */}
          {showRoleModal && (
            <RoleModal
              role={editingRole}
              onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
              onSaved={() => { setShowRoleModal(false); setEditingRole(null); fetchData(); }}
            />
          )}

          {showInviteModal && (
            <InviteModal
              roles={roles}
              onClose={() => setShowInviteModal(false)}
              onInvited={() => { setShowInviteModal(false); fetchData(); }}
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================
// Setup Org Card
// ============================================

function SetupOrgCard({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/org/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <Settings2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Set up your organisation</h3>
      <p className="text-sm text-gray-500 mb-6">
        Create an organisation to manage team members, roles, and permissions
      </p>
      <div className="max-w-sm mx-auto flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organisation name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Members Tab
// ============================================

function MembersTab({
  members,
  roles,
  org,
  onRefresh,
  onInvite,
}: {
  members: MemberData[];
  roles: RoleData[];
  org: OrgData;
  onRefresh: () => void;
  onInvite: () => void;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setRemovingId(memberId);
    try {
      await fetch(`/api/org/members/${memberId}`, { method: 'DELETE' });
      onRefresh();
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, roleId: string) => {
    await fetch(`/api/org/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Team Members</h3>
          <p className="text-xs text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onInvite}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => {
              const isOwner = member.userId === org.ownerId;
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                        <p className="text-xs text-gray-500">{member.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isOwner ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Owner
                      </span>
                    ) : (
                      <select
                        value={member.roleId}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                      >
                        {roles.filter(r => !(r.isSystemRole && r.name === 'Owner')).map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active' ? 'bg-green-100 text-green-700' :
                      member.status === 'invited' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isOwner && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No team members yet. Invite someone to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// Roles Tab
// ============================================

function RolesTab({
  roles,
  onRefresh,
  onCreateRole,
  onEditRole,
}: {
  roles: RoleData[];
  onRefresh: () => void;
  onCreateRole: () => void;
  onEditRole: (role: RoleData) => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    setDeletingId(roleId);
    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to delete role');
      } else {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const getPermissionSummary = (permissions: Record<string, string>) => {
    const manage = Object.values(permissions).filter(v => v === 'manage').length;
    const edit = Object.values(permissions).filter(v => v === 'edit').length;
    const view = Object.values(permissions).filter(v => v === 'view').length;
    const none = Object.values(permissions).filter(v => v === 'none').length;
    const parts = [];
    if (manage > 0) parts.push(`${manage} full`);
    if (edit > 0) parts.push(`${edit} edit`);
    if (view > 0) parts.push(`${view} view`);
    if (none > 0) parts.push(`${none} none`);
    return parts.join(', ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Roles</h3>
          <p className="text-xs text-gray-500">Define what each role can do</p>
        </div>
        <button
          onClick={onCreateRole}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{role.name}</h4>
                  {role.isPreset && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Preset</span>
                  )}
                  {role.isSystemRole && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">System</span>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {getPermissionSummary(role.permissions)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!role.isSystemRole && (
                  <>
                    <button
                      onClick={() => onEditRole(role)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title="Edit role"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      disabled={deletingId === role.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                {role.isSystemRole && (
                  <span className="text-xs text-gray-400 italic">Cannot modify</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Sharing Tab
// ============================================

function SharingTab({ org, onRefresh }: { org: OrgData; onRefresh: () => void }) {
  const [mode, setMode] = useState(org.projectSharingMode);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/org/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSharingMode: mode }),
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Project Sharing</h3>
      <p className="text-xs text-gray-500 mb-6">
        Control how team members access projects across your organisation
      </p>

      <div className="space-y-3 max-w-lg">
        <label
          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
            mode === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="sharing"
            value="all"
            checked={mode === 'all'}
            onChange={() => setMode('all')}
            className="mt-1"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Share all projects</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Every team member can see all projects (access is still controlled by their role permissions)
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
            mode === 'per_project' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="sharing"
            value="per_project"
            checked={mode === 'per_project'}
            onChange={() => setMode('per_project')}
            className="mt-1"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Per-project sharing</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose which team members can access each project when creating or editing it
            </p>
          </div>
        </label>
      </div>

      {mode !== org.projectSharingMode && (
        <div className="mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Role Create/Edit Modal
// ============================================

function RoleModal({
  role,
  onClose,
  onSaved,
}: {
  role: RoleData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState<Record<string, string>>(() => {
    if (role) return { ...role.permissions };
    const defaults: Record<string, string> = {};
    PERMISSION_MODULES.forEach(m => { defaults[m.module] = 'none'; });
    return defaults;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Role name is required'); return; }
    setSaving(true);
    setError(null);

    try {
      const url = role ? `/api/roles/${role.id}` : '/api/roles';
      const method = role ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, permissions }),
      });

      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || 'Failed to save role');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {role ? 'Edit Role' : 'Create Role'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Finance Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Permissions</h4>
            <div className="space-y-3">
              {PERMISSION_MODULES.map((mod) => (
                <div
                  key={mod.module}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-gray-900">{mod.label}</p>
                    <p className="text-xs text-gray-500">{mod.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {PERMISSION_LEVELS.map((pl) => (
                      <button
                        key={pl.level}
                        onClick={() => setPermissions(prev => ({ ...prev, [mod.module]: pl.level }))}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          permissions[mod.module] === pl.level
                            ? pl.color
                            : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {pl.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Invite Member Modal
// ============================================

function InviteModal({
  roles,
  onClose,
  onInvited,
}: {
  roles: RoleData[];
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles.find(r => r.name === 'Viewer')?.id || roles[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), roleId }),
      });
      const data = await res.json();
      if (data.success) {
        onInvited();
      } else {
        setError(data.error || 'Failed to invite member');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const availableRoles = roles.filter(r => !(r.isSystemRole && r.name === 'Owner'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}{role.description ? ` — ${role.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
