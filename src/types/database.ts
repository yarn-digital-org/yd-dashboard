/**
 * YD Dashboard - Database Types
 * Complete TypeScript definitions for all Firestore collections
 * 
 * Generated from DETAILED-SCOPE.md
 * Last updated: 2026-02-07
 */

// ============================================
// Common Types
// ============================================

export type Timestamp = string; // ISO 8601 format

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

// ============================================
// MODULE: Auth / Users
// ============================================

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  
  name: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  
  role: 'user' | 'admin';
  orgId?: string; // organisation this user belongs to
  
  timezone?: string;
  language?: string;
  
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  emailVerified: boolean;
  
  // Password reset
  passwordResetToken?: string;
  passwordResetExpires?: Timestamp;
  
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MODULE: RBAC (Role-Based Access Control)
// ============================================

export type PermissionModule = 
  | 'projects' | 'invoices' | 'contacts' | 'contracts' 
  | 'messages' | 'workflows' | 'calendar' | 'leads' 
  | 'forms' | 'content' | 'automations';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'manage';

export interface Role {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  permissions: Record<PermissionModule, PermissionLevel>;
  isPreset: boolean;
  isSystemRole: boolean; // true for Owner role — cannot be deleted
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Organisation {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  projectSharingMode: 'all' | 'per_project';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type OrgMemberStatus = 'invited' | 'active' | 'suspended';

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  roleId: string;
  projectIds?: string[]; // when projectSharingMode is "per_project"
  invitedBy: string;
  invitedAt: Timestamp;
  joinedAt?: Timestamp;
  status: OrgMemberStatus;
}

export interface SystemAdmin {
  id: string;
  userId: string;
  email: string;
  superAdmin: boolean;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Contacts (CRM)
// ============================================

export type ContactType = 'lead' | 'client' | 'past_client' | 'vendor' | 'other';

export interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

export interface Contact {
  id: string;
  userId: string;
  
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  
  address?: Address;
  
  website?: string;
  socialLinks?: SocialLinks;
  
  avatarUrl?: string;
  type: ContactType;
  tags: string[];
  
  customFields: Record<string, unknown>;
  
  // Computed (denormalized)
  lifetimeValue: number;
  projectCount: number;
  outstandingAmount: number;
  lastContactedAt?: Timestamp;
  
  leadId?: string;
  
  // Portal access
  portalPasswordHash?: string;
  portalLastLoginAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  contactCount: number;
  createdAt: Timestamp;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'url';

export interface CustomFieldDefinition {
  id: string;
  userId: string;
  name: string;
  label: string;
  type: CustomFieldType;
  options?: string[]; // for dropdown
  isRequired: boolean;
  order: number;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Leads
// ============================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'won' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  userId: string;
  
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  
  budgetMin?: number;
  budgetMax?: number;
  source?: string;
  
  status: LeadStatus;
  priority: LeadPriority;
  tags: string[];
  notes: Note[];
  
  formId?: string;
  convertedToProjectId?: string;
  convertedToContactId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LeadFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: string[];
}

export interface LeadFormSettings {
  successMessage: string;
  redirectUrl?: string;
  notifyEmail: boolean;
  autoResponseEnabled: boolean;
  autoResponseTemplate?: string;
}

export interface LeadForm {
  id: string;
  userId: string;
  name: string;
  slug: string;
  fields: LeadFormField[];
  settings: LeadFormSettings;
  isActive: boolean;
  submissionCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

export interface LineItem {
  id: string;
  description: string;
  details?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Proposal {
  id: string;
  leadId: string;
  userId: string;
  
  coverLetter: string;
  lineItems: LineItem[];
  
  subtotal: number;
  tax: number;
  total: number;
  
  status: ProposalStatus;
  viewCount: number;
  
  expiresAt?: Timestamp;
  sentAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================
// MODULE: Projects
// ============================================

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';

export interface WorkflowTask {
  id: string;
  name: string;
  description?: string;
  order: number;
  isCompleted: boolean;
  completedAt?: Timestamp;
  dueDate?: Timestamp;
  subtasks: { id: string; name: string; isCompleted: boolean }[];
  labels: string[];
}

export interface Project {
  id: string;
  userId: string;
  contactId: string;
  leadId?: string;
  
  name: string;
  description?: string;
  serviceType?: string;
  
  startDate?: Timestamp;
  endDate?: Timestamp;
  eventDate?: Timestamp;
  
  location?: string;
  
  quotedAmount?: number;
  currency: string;
  
  status: ProjectStatus;
  
  workflowId?: string;
  workflowTasks: WorkflowTask[];
  
  tags: string[];
  customFields: Record<string, unknown>;
  
  invoiceIds: string[];
  contractIds: string[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  userId: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  folder?: string;
  isShared: boolean; // visible in client portal
  uploadedAt: Timestamp;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  isShared: boolean; // visible in client portal
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================
// MODULE: Messages
// ============================================

export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'email' | 'live_chat';
export type MessageStatus = 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Conversation {
  id: string;
  userId: string;
  contactId: string;
  lastMessageAt: Timestamp;
  lastMessagePreview: string;
  unreadCount: number;
  isMuted: boolean;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  contactId: string;
  
  direction: MessageDirection;
  channel: MessageChannel;
  
  subject?: string;
  body: string;
  bodyHtml?: string;
  attachments: Attachment[];
  
  status: MessageStatus;
  sentAt?: Timestamp;
  readAt?: Timestamp;
  
  externalMessageId?: string; // for email sync
  
  createdAt: Timestamp;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  subject?: string;
  body: string;
  category?: string;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type ChatWidgetPosition = 'bottom-left' | 'bottom-right';

export interface ChatWidgetSettings {
  id: string;
  userId: string;
  position: ChatWidgetPosition;
  primaryColor: string;
  welcomeMessage: string;
  offlineMessage: string;
  avatarUrl?: string;
  collectEmailFirst: boolean;
  isActive: boolean;
  updatedAt?: Timestamp;
}

// ============================================
// MODULE: Calendar
// ============================================

export type CalendarEventType = 'meeting' | 'deadline' | 'task' | 'personal' | 'travel';

export interface EventReminder {
  type: 'email' | 'push';
  minutesBefore: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  
  title: string;
  description?: string;
  type: CalendarEventType;
  
  startTime: Timestamp;
  endTime: Timestamp;
  isAllDay: boolean;
  timezone: string;
  
  location?: string;
  zoomLink?: string;
  
  projectId?: string;
  contactId?: string;
  
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  recurrenceParentId?: string;
  
  reminders: EventReminder[];
  
  googleEventId?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WorkingHours {
  start: string; // HH:mm
  end: string;
}

export interface AvailabilitySettings {
  userId: string;
  
  workingDays: number[]; // 0-6
  workingHours: WorkingHours;
  breakTimes: WorkingHours[];
  
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  
  blockedDates: Timestamp[];
  
  updatedAt: Timestamp;
}

export interface AppointmentType {
  id: string;
  userId: string;
  name: string;
  durationMinutes: number;
  description?: string;
  color?: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  userId: string;
  appointmentTypeId: string;
  contactId?: string;
  
  scheduledAt: Timestamp;
  duration: number;
  
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  
  status: BookingStatus;
  
  calendarEventId: string;
  
  confirmationSentAt?: Timestamp;
  reminderSentAt?: Timestamp;
  
  createdAt: Timestamp;
}

export interface GoogleCalendarTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
}

// ============================================
// MODULE: Forms
// ============================================

export type FormFieldType = 
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'number'
  | 'dropdown' | 'checkboxes' | 'radio' | 'date' | 'time'
  | 'file' | 'signature' | 'rating' | 'scale' | 'address'
  | 'heading' | 'paragraph' | 'divider';

export type FormType = 'lead_capture' | 'questionnaire' | 'feedback' | 'custom';

export interface FieldCondition {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_empty' | 'is_not_empty';
  value?: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  conditions?: FieldCondition[];
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  notifyOnSubmission: boolean;
  notificationEmail?: string;
  autoResponseEnabled: boolean;
  autoResponseTemplate?: string;
}

export interface FormStyle {
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

export interface Form {
  id: string;
  userId: string;
  
  name: string;
  slug: string;
  description?: string;
  type: FormType;
  
  fields: FormField[];
  settings: FormSettings;
  style: FormStyle;
  
  isActive: boolean;
  submissionCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FormSubmission {
  id: string;
  formId: string;
  userId: string;
  
  responses: Record<string, unknown>;
  
  submitterEmail?: string;
  submitterName?: string;
  submitterIp?: string;
  
  isRead: boolean;
  
  leadId?: string;
  contactId?: string;
  projectId?: string;
  
  createdAt: Timestamp;
}

// ============================================
// MODULE: Invoicing & Payments
// ============================================

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
export type DiscountType = 'percentage' | 'fixed';
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface PaymentScheduleItem {
  id: string;
  description: string;
  amount: number;
  dueDate: Timestamp;
  isPaid: boolean;
}

export interface RecurringConfig {
  frequency: RecurringFrequency;
  nextDate: Timestamp;
  endDate?: Timestamp;
}

export interface Invoice {
  id: string;
  userId: string;
  contactId: string;
  projectId?: string;
  
  invoiceNumber: string;
  poNumber?: string;
  
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  
  lineItems: LineItem[];
  
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount: number;
  taxRate?: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  
  notes?: string;
  internalNotes?: string;
  
  contractId?: string;
  allowTipping: boolean;
  passCcFees: boolean;
  
  paymentSchedule: PaymentScheduleItem[];
  
  status: InvoiceStatus;
  
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  viewCount: number;
  paidAt?: Timestamp;
  
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentMethod = 'stripe_card' | 'stripe_ach' | 'manual' | 'cash' | 'check';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  invoiceId: string;
  userId: string;
  
  amount: number;
  tipAmount: number;
  processingFee?: number;
  feePassedToClient: boolean;
  
  method: PaymentMethod;
  stripePaymentIntentId?: string;
  
  status: PaymentStatus;
  
  notes?: string;
  
  paidAt: Timestamp;
  createdAt: Timestamp;
}

export interface TaxRate {
  id: string;
  userId: string;
  name: string;
  rate: number;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface StripeAccount {
  userId: string;
  stripeAccountId: string;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Contracts
// ============================================

export type SignerType = 'client' | 'business';
export type SignerStatus = 'pending' | 'signed' | 'declined';
export type SignatureType = 'draw' | 'type';
export type ContractStatus = 'draft' | 'sent' | 'partially_signed' | 'signed' | 'declined' | 'expired';

export interface SignatureField {
  id: string;
  signerType: SignerType;
  label: string;
}

export interface ContractTemplate {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  content: string; // Rich text with variables
  
  signatureFields: SignatureField[];
  
  autoCountersign: boolean;
  mySignatureUrl?: string;
  
  usageCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ContractSigner {
  id: string;
  type: SignerType;
  name: string;
  email: string;
  status: SignerStatus;
  signatureData?: string; // Base64 image
  signatureType: SignatureType;
  signedAt?: Timestamp;
  signedIp?: string;
  signedUserAgent?: string;
  accessToken: string;
}

export interface Contract {
  id: string;
  userId: string;
  contactId: string;
  projectId?: string;
  invoiceId?: string;
  templateId?: string;
  
  name: string;
  content: string; // Variables filled in
  
  variableValues: Record<string, string>;
  
  signers: ContractSigner[];
  
  status: ContractStatus;
  
  sentAt?: Timestamp;
  signedAt?: Timestamp;
  expiresAt?: Timestamp;
  
  signedPdfUrl?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MODULE: Client Portal
// ============================================

export interface PortalSettings {
  userId: string;
  
  customDomain?: string;
  subdomain: string;
  
  logoUrl?: string;
  primaryColor: string;
  backgroundColor?: string;
  
  welcomeMessage?: string;
  footerText?: string;
  
  showProjects: boolean;
  showInvoices: boolean;
  showContracts: boolean;
  showFiles: boolean;
  showMessages: boolean;
  showWorkflowProgress: boolean;
  
  hidePoweredBy: boolean;
  
  updatedAt: Timestamp;
}

export interface PortalSession {
  id: string;
  contactId: string;
  userId: string; // Business owner
  token: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export type PortalActivityAction = 
  | 'login' | 'view_project' | 'view_invoice' 
  | 'pay_invoice' | 'sign_contract' | 'download_file';

export interface PortalActivity {
  id: string;
  contactId: string;
  userId: string;
  action: PortalActivityAction;
  entityType?: string;
  entityId?: string;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Workflows
// ============================================

export type DueFromType = 'start_date' | 'event_date';

export interface WorkflowTaskTemplate {
  id: string;
  name: string;
  description?: string;
  order: number;
  dueDaysOffset?: number;
  dueFrom: DueFromType;
  subtasks: { id: string; name: string }[];
  labels: string[];
}

export interface WorkflowTemplate {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  serviceType?: string;
  
  tasks: WorkflowTaskTemplate[];
  
  isDefault: boolean;
  usageCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Automations
// ============================================

export type AutomationTriggerType = 
  | 'lead_received' | 'lead_status_changed' | 'project_created'
  | 'project_status_changed' | 'invoice_sent' | 'invoice_paid'
  | 'invoice_overdue' | 'contract_sent' | 'contract_signed'
  | 'form_submitted' | 'event_approaching';

export type ConditionOperator = 
  | 'equals' | 'not_equals' | 'contains' 
  | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export type AutomationActionType = 
  | 'send_email' | 'wait' | 'update_status' 
  | 'add_tag' | 'remove_tag' | 'webhook' | 'notify';

export interface AutomationTrigger {
  type: AutomationTriggerType;
  config?: Record<string, unknown>;
}

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface AutomationConditions {
  match: 'all' | 'any';
  rules: ConditionRule[];
}

export interface AutomationAction {
  id: string;
  order: number;
  type: AutomationActionType;
  config: Record<string, unknown>;
}

export interface Automation {
  id: string;
  userId: string;
  
  name: string;
  description?: string;
  
  trigger: AutomationTrigger;
  conditions?: AutomationConditions;
  actions: AutomationAction[];
  
  isEnabled: boolean;
  
  runCount: number;
  lastRunAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AutomationRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type ActionLogStatus = 'pending' | 'success' | 'failed' | 'skipped';

export interface ActionLog {
  actionId: string;
  status: ActionLogStatus;
  error?: string;
  executedAt?: Timestamp;
}

export interface AutomationRunTrigger {
  type: string;
  entityId: string;
  entityType: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  userId: string;
  
  triggeredBy: AutomationRunTrigger;
  
  status: AutomationRunStatus;
  currentActionIndex: number;
  
  actionLogs: ActionLog[];
  
  startedAt: Timestamp;
  completedAt?: Timestamp;
}

export type QueueStatus = 'pending' | 'executed' | 'cancelled';

export interface AutomationQueue {
  id: string;
  automationRunId: string;
  executeAt: Timestamp;
  actionIndex: number;
  status: QueueStatus;
  createdAt: Timestamp;
}

// ============================================
// MODULE: Settings
// ============================================

export interface BusinessSettings {
  userId: string;
  
  businessName: string;
  businessType?: string;
  
  logoUrl?: string;
  
  address?: Address;
  
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  
  defaultCurrency: string;
  
  updatedAt: Timestamp;
}

export interface BrandingSettings {
  userId: string;
  
  primaryColor: string;
  secondaryColor?: string;
  fontFamily?: string;
  
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  
  updatedAt: Timestamp;
}

export interface EmailNotificationSettings {
  newLead: boolean;
  newMessage: boolean;
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  contractSigned: boolean;
  dailyDigest: boolean;
}

export interface PushNotificationSettings {
  newLead: boolean;
  newMessage: boolean;
  invoicePaid: boolean;
}

export interface NotificationSettings {
  userId: string;
  
  emailNotifications: EmailNotificationSettings;
  pushNotifications: PushNotificationSettings;
  
  updatedAt: Timestamp;
}

export interface OAuthTokens {
  connected: boolean;
  email?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Timestamp;
}

export interface Integrations {
  userId: string;
  
  google?: OAuthTokens;
  zoom?: OAuthTokens;
  
  updatedAt: Timestamp;
}

export type SubscriptionPlan = 'free' | 'starter' | 'standard' | 'plus';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled';

export interface Subscription {
  userId: string;
  
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MODULE: Skills Library
// ============================================

export type SkillCategory = 'Content' | 'SEO' | 'Development' | 'Marketing' | 'Design' | 'Analytics' | 'Operations';
export type SkillSource = 'internal' | 'imported';

export interface Skill {
  id: string;
  orgId: string;
  name: string;
  description: string;
  category: SkillCategory;
  content: string; // markdown
  tags: string[];
  agentIds: string[]; // which agents have this skill
  source: SkillSource;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MODULE: Client Knowledge Base
// ============================================

export type ClientDocStatus = 'active' | 'prospect' | 'past';

export interface ClientDocContact {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface ClientDocProject {
  name: string;
  status: string;
  description: string;
}

export interface ClientDoc {
  id: string;
  orgId: string;
  clientName: string;
  industry: string;
  status: ClientDocStatus;
  overview: string; // markdown
  contacts: ClientDocContact[];
  projects: ClientDocProject[];
  meetingNotes: string; // markdown
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// MODULE: Agents (AI Team)
// ============================================

export type AgentStatus = 'active' | 'idle' | 'offline';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AgentStatus;
  description: string;
  skills: string[];
  skillIds?: string[];
  clientIds?: string[];
  slackChannel?: string;
  personality: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  orgId: string;
  stats: {
    tasksCompleted: number;
    tasksInProgress: number;
    learnings: number;
  };
}

// ============================================
// MODULE: Tasks
// ============================================

export type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskRecurringFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface TaskRecurringConfig {
  frequency: TaskRecurringFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  nextDue?: Timestamp;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | string[];
  assignedToName: string | string[];
  projectId?: string;
  clientId?: string;
  clientName?: string;
  skillIds?: string[];
  labels: string[];
  dueDate?: Timestamp;
  isRecurring: boolean;
  recurringConfig?: TaskRecurringConfig;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  orgId: string;
  notes: string;
  feedbackNotes?: string;
}

// ============================================
// MODULE: Learnings
// ============================================

export type LearningCategory = 'seo' | 'development' | 'design' | 'marketing' | 'client-management';
export type LearningImpact = 'high' | 'medium' | 'low';
export type LearningStatus = 'draft' | 'published' | 'archived';

export interface Learning {
  id: string;
  title: string;
  description: string;
  category: LearningCategory;
  tags: string[];
  client?: string;
  project?: string;
  impact: LearningImpact;
  actionable: boolean;
  dateCreated: Timestamp;
  createdBy: string;
  lastUpdated: Timestamp;
  updatedBy: string;
  status: LearningStatus;
  orgId: string;
}

// ============================================
// Collection Names (for consistency)
// ============================================

export const COLLECTIONS = {
  // Auth
  USERS: 'users',
  
  // RBAC
  ORGANISATIONS: 'organisations',
  ROLES: 'roles',
  ORG_MEMBERS: 'orgMembers',
  SYSTEM_ADMINS: 'systemAdmins',
  
  // Contacts
  CONTACTS: 'contacts',
  TAGS: 'tags',
  CUSTOM_FIELD_DEFINITIONS: 'customFieldDefinitions',
  
  // Leads
  LEADS: 'leads',
  LEAD_FORMS: 'leadForms',
  PROPOSALS: 'proposals',
  
  // Projects
  PROJECTS: 'projects',
  PROJECT_FILES: 'projectFiles',
  PROJECT_NOTES: 'projectNotes',
  
  // Messages
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  MESSAGE_TEMPLATES: 'messageTemplates',
  CHAT_WIDGET_SETTINGS: 'chatWidgetSettings',
  
  // Calendar
  CALENDAR_EVENTS: 'calendarEvents',
  AVAILABILITY_SETTINGS: 'availabilitySettings',
  APPOINTMENT_TYPES: 'appointmentTypes',
  BOOKINGS: 'bookings',
  GOOGLE_CALENDAR_TOKENS: 'googleCalendarTokens',
  
  // Forms
  FORMS: 'forms',
  FORM_SUBMISSIONS: 'formSubmissions',
  
  // Invoicing
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  TAX_RATES: 'taxRates',
  STRIPE_ACCOUNTS: 'stripeAccounts',
  
  // Contracts
  CONTRACT_TEMPLATES: 'contractTemplates',
  CONTRACTS: 'contracts',
  
  // Portal
  PORTAL_SETTINGS: 'portalSettings',
  PORTAL_SESSIONS: 'portalSessions',
  PORTAL_ACTIVITY: 'portalActivity',
  
  // Workflows
  WORKFLOW_TEMPLATES: 'workflowTemplates',
  TASK_LABELS: 'taskLabels',
  
  // Automations
  AUTOMATIONS: 'automations',
  AUTOMATION_RUNS: 'automationRuns',
  AUTOMATION_QUEUE: 'automationQueue',
  
  // Settings
  BUSINESS_SETTINGS: 'businessSettings',
  BRANDING_SETTINGS: 'brandingSettings',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  INTEGRATIONS: 'integrations',
  SUBSCRIPTIONS: 'subscriptions',
  
  // Agents & Tasks
  AGENTS: 'agents',
  TASKS: 'tasks',
  
  // Skills & Client Docs
  SKILLS: 'skills',
  CLIENT_DOCS: 'clientDocs',
  
  // Learnings
  LEARNINGS: 'learnings',
  
  // Learning-Skill Feedback Loop
  SKILL_SUGGESTIONS: 'skillSuggestions',
  LEARNING_SKILL_RELATIONSHIPS: 'learningSkillRelationships',
  FEEDBACK_LOOP_METRICS: 'feedbackLoopMetrics',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
