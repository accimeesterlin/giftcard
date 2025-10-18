/**
 * HTML escape utility for preventing XSS in email templates
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Escape HTML for use in HTML attributes
 */
export function escapeHtmlAttribute(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] || char)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
