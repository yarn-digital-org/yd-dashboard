/**
 * Input sanitisation utilities for XSS prevention
 */

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/** Escape HTML special characters */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/** Remove potentially dangerous content from rich text */
export function sanitizeRichText(input: string): string {
  return input
    // Remove script tags and content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*\S+/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs in href/src
    .replace(/(href|src)\s*=\s*["']?\s*data\s*:/gi, '$1="')
    // Remove iframe, embed, object tags
    .replace(/<(iframe|embed|object|applet|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|embed|object|applet|form)[^>]*\/?>/gi, '');
}

/** Sanitise a generic object recursively, stripping HTML from string values */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = stripHtml(value).trim();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map(item =>
        typeof item === 'string' ? stripHtml(item).trim() : item
      );
    }
  }
  return result;
}
