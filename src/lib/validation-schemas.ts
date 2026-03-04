/**
 * Zod validation schemas for all API route inputs
 */
import { z } from 'zod';

// ============================================
// Common sanitisation helpers
// ============================================

/** Strip HTML tags to prevent XSS */
const sanitizeString = (val: string) =>
  val.replace(/<[^>]*>/g, '').trim();

/** Sanitised string with HTML stripped */
export const safeString = z.string().transform(sanitizeString);

/** Sanitised string that preserves some HTML (for rich content) */
export const richTextString = z.string().transform((val) =>
  val
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
);

// ============================================
// Auth
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).transform(sanitizeString),
  email: z.string().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

// ============================================
// Contacts
// ============================================

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100).transform(sanitizeString),
  lastName: z.string().max(100).transform(sanitizeString).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).transform(sanitizeString).optional(),
  company: z.string().max(200).transform(sanitizeString).optional(),
  jobTitle: z.string().max(200).transform(sanitizeString).optional(),
  source: z.string().max(100).transform(sanitizeString).optional(),
  notes: z.string().max(5000).transform(sanitizeString).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  address: z.object({
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zip: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
  }).optional(),
});

export const updateContactSchema = createContactSchema.partial();

// ============================================
// Invoices
// ============================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500).transform(sanitizeString),
  quantity: z.number().min(0).max(999999),
  rate: z.number().min(0).max(9999999),
  amount: z.number().min(0).max(9999999999),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50).transform(sanitizeString),
  clientName: z.string().min(1).max(200).transform(sanitizeString),
  clientEmail: z.string().email().max(255),
  items: z.array(invoiceItemSchema).min(1).max(100),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
  dueDate: z.string().min(1),
  notes: z.string().max(5000).transform(sanitizeString).optional(),
  paymentTerms: z.string().max(500).optional(),
  contactId: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// ============================================
// Contracts
// ============================================

export const createContractSchema = z.object({
  title: z.string().min(1).max(300).transform(sanitizeString),
  clientName: z.string().min(1).max(200).transform(sanitizeString),
  clientEmail: z.string().email().max(255),
  content: richTextString.pipe(z.string().min(1).max(100000)),
  status: z.enum(['draft', 'sent', 'signed']).default('draft'),
  notes: z.string().max(5000).transform(sanitizeString).optional(),
  contactId: z.string().optional(),
});

export const updateContractSchema = createContractSchema.partial();

// ============================================
// Content
// ============================================

export const createContentSchema = z.object({
  title: z.string().min(1).max(300).transform(sanitizeString),
  body: richTextString.pipe(z.string().max(100000)).optional(),
  type: z.enum(['blog', 'social', 'email', 'other']).default('other'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateContentSchema = createContentSchema.partial();

// ============================================
// Tags
// ============================================

export const createTagSchema = z.object({
  name: z.string().min(1).max(50).transform(sanitizeString),
  color: z.string().max(20).optional(),
});

// ============================================
// Forms
// ============================================

export const createFormSchema = z.object({
  name: z.string().min(1).max(200).transform(sanitizeString),
  description: z.string().max(2000).transform(sanitizeString).optional(),
  fields: z.array(z.object({
    id: z.string(),
    label: z.string().max(200),
    type: z.string().max(50),
    required: z.boolean().optional(),
    options: z.array(z.string().max(200)).optional(),
    placeholder: z.string().max(200).optional(),
  })).max(50).optional(),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateFormSchema = createFormSchema.partial();

// ============================================
// Automations
// ============================================

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(200).transform(sanitizeString),
  description: z.string().max(2000).transform(sanitizeString).optional(),
  trigger: z.object({
    type: z.string().min(1).max(100),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
  actions: z.array(z.object({
    type: z.string().min(1).max(100),
    config: z.record(z.string(), z.unknown()).optional(),
  })).min(1).max(20),
  enabled: z.boolean().default(false),
});

export const updateAutomationSchema = createAutomationSchema.partial();

// ============================================
// Calendar events (local)
// ============================================

export const createCalendarEventSchema = z.object({
  title: z.string().min(1).max(300).transform(sanitizeString),
  description: z.string().max(5000).transform(sanitizeString).optional(),
  start: z.string().min(1),
  end: z.string().min(1),
  allDay: z.boolean().optional(),
  location: z.string().max(500).transform(sanitizeString).optional(),
  calendarId: z.string().optional(),
  contactId: z.string().optional(),
  color: z.string().max(20).optional(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

// ============================================
// Calendar sync
// ============================================

export const calendarSyncSchema = z.object({
  action: z.enum(['import', 'export']),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
});
