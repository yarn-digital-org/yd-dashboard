import { adminDb } from './firebase-admin';
import { 
  PermissionModule, 
  PermissionLevel, 
  Role, 
  Organisation, 
  OrgMember, 
  COLLECTIONS 
} from '@/types';

// ============================================
// Permission Descriptions (shown in UI)
// ============================================

export const PERMISSION_MODULES: { module: PermissionModule; label: string; description: string }[] = [
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

export const PERMISSION_LEVEL_INFO: { level: PermissionLevel; label: string; description: string }[] = [
  { level: 'none', label: 'No Access', description: 'Cannot see this module at all' },
  { level: 'view', label: 'View Only', description: 'Can view but not create or edit' },
  { level: 'edit', label: 'Edit', description: 'Can view, create, and edit' },
  { level: 'manage', label: 'Full Control', description: 'Full access including delete' },
];

// ============================================
// Permission Level Hierarchy
// ============================================

const LEVEL_HIERARCHY: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3,
};

// ============================================
// Default Role Templates
// ============================================

function allModulesAt(level: PermissionLevel): Record<PermissionModule, PermissionLevel> {
  const modules: PermissionModule[] = [
    'projects', 'invoices', 'contacts', 'contracts', 'messages',
    'workflows', 'calendar', 'leads', 'forms', 'content', 'automations',
  ];
  return Object.fromEntries(modules.map(m => [m, level])) as Record<PermissionModule, PermissionLevel>;
}

export const DEFAULT_ROLES: { name: string; description: string; isSystemRole: boolean; permissions: Record<PermissionModule, PermissionLevel> }[] = [
  {
    name: 'Owner',
    description: 'Full access to everything. Cannot be modified or deleted.',
    isSystemRole: true,
    permissions: allModulesAt('manage'),
  },
  {
    name: 'Admin',
    description: 'Full access to all modules. Cannot manage organisation settings.',
    isSystemRole: false,
    permissions: allModulesAt('manage'),
  },
  {
    name: 'Manager',
    description: 'Can manage projects and contacts. View-only for finances.',
    isSystemRole: false,
    permissions: {
      projects: 'manage',
      contacts: 'manage',
      leads: 'manage',
      messages: 'manage',
      calendar: 'manage',
      workflows: 'edit',
      invoices: 'view',
      contracts: 'view',
      forms: 'edit',
      content: 'edit',
      automations: 'view',
    },
  },
  {
    name: 'Viewer',
    description: 'Read-only access to all modules.',
    isSystemRole: false,
    permissions: allModulesAt('view'),
  },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a user has at least the required permission level for a module
 */
export function hasPermission(
  userPermissions: Record<PermissionModule, PermissionLevel>,
  module: PermissionModule,
  requiredLevel: PermissionLevel
): boolean {
  const userLevel = userPermissions[module] || 'none';
  return LEVEL_HIERARCHY[userLevel] >= LEVEL_HIERARCHY[requiredLevel];
}

/**
 * Check if a member can access a specific project
 */
export function canAccessProject(
  member: OrgMember,
  projectId: string,
  org: Organisation
): boolean {
  // If org shares all projects, everyone has access
  if (org.projectSharingMode === 'all') return true;
  
  // If per-project, check if the member has this project in their list
  // undefined/null projectIds means access to all (for owners/admins)
  if (!member.projectIds) return true;
  
  return member.projectIds.includes(projectId);
}

/**
 * Check if a user is a system admin (Yarn Digital internal)
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  if (!adminDb) return false;
  
  const snapshot = await adminDb
    .collection(COLLECTIONS.SYSTEM_ADMINS)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  
  return !snapshot.empty;
}

/**
 * Get a user's org membership and role
 */
export async function getOrgMembership(userId: string, orgId: string): Promise<{ member: OrgMember; role: Role } | null> {
  if (!adminDb) return null;
  
  const memberSnapshot = await adminDb
    .collection(COLLECTIONS.ORG_MEMBERS)
    .where('userId', '==', userId)
    .where('orgId', '==', orgId)
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  if (memberSnapshot.empty) return null;
  
  const member = { id: memberSnapshot.docs[0].id, ...memberSnapshot.docs[0].data() } as OrgMember;
  
  const roleDoc = await adminDb.collection(COLLECTIONS.ROLES).doc(member.roleId).get();
  if (!roleDoc.exists) return null;
  
  const role = { id: roleDoc.id, ...roleDoc.data() } as Role;
  
  return { member, role };
}

/**
 * Create default roles for a new organisation
 */
export async function createDefaultRoles(orgId: string): Promise<string[]> {
  if (!adminDb) throw new Error('Database not configured');
  
  const now = new Date().toISOString();
  const roleIds: string[] = [];
  
  for (const template of DEFAULT_ROLES) {
    const roleData: Omit<Role, 'id'> = {
      orgId,
      name: template.name,
      description: template.description,
      permissions: template.permissions,
      isPreset: true,
      isSystemRole: template.isSystemRole,
      createdAt: now,
      updatedAt: now,
    };
    
    const ref = await adminDb.collection(COLLECTIONS.ROLES).add(roleData);
    roleIds.push(ref.id);
  }
  
  return roleIds;
}

/**
 * Get the Owner role ID for an organisation
 */
export async function getOwnerRoleId(orgId: string): Promise<string | null> {
  if (!adminDb) return null;
  
  const snapshot = await adminDb
    .collection(COLLECTIONS.ROLES)
    .where('orgId', '==', orgId)
    .where('name', '==', 'Owner')
    .where('isSystemRole', '==', true)
    .limit(1)
    .get();
  
  return snapshot.empty ? null : snapshot.docs[0].id;
}
