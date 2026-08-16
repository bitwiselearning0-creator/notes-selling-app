/**
 * Bitwise Learning Security & XSS Protection Engine
 * Prevents Cross-Site Scripting (XSS), HTML Injection, Script Execution & Malicious Input Payloads.
 */

/**
 * Escapes special HTML characters to prevent XSS injection.
 */
export function escapeHTML(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;');
}

/**
 * Sanitizes search queries by stripping HTML tags, script protocols, and limiting length.
 */
export function sanitizeSearchQuery(query: string, maxLen = 100): string {
  if (typeof query !== 'string') return '';
  
  // 1. Remove dangerous script protocols & HTML tags
  let cleaned = query
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '');

  // 2. Truncate to maximum safe length to prevent payload flooding / ReDoS
  cleaned = cleaned.slice(0, maxLen);

  return cleaned;
}

/**
 * Validates and sanitizes text inputs for forms (names, titles, comments).
 */
export function sanitizeTextInput(text: string, maxLen = 250): string {
  if (typeof text !== 'string') return '';
  const sanitized = text
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
  return sanitized;
}

/**
 * Strict email validation regex to reject malicious email strings.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Strict phone validation regex.
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^\d{10,12}$/.test(cleanPhone);
}
