/**
 * Security utility functions for input sanitization
 */

/**
 * Strips HTML tags from a string to prevent XSS attacks
 * @param input - The string to sanitize
 * @returns The sanitized string with HTML tags removed
 */
export const stripHtmlTags = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Re-encode dangerous characters after decoding
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  return sanitized.trim();
};

/**
 * Sanitizes user input for safe storage and display
 * Removes potentially dangerous content while preserving legitimate text
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  let sanitized = input.trim();
  
  // Remove HTML tags but keep the text content
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove javascript: and data: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s{3,}/g, '  ');
  
  return sanitized;
};

/**
 * Validates and sanitizes an email address
 * @param email - The email to validate
 * @returns The sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const sanitized = email.trim().toLowerCase();
  
  // Basic email pattern validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(sanitized)) {
    return '';
  }
  
  // Additional check for max length
  if (sanitized.length > 255) {
    return '';
  }
  
  return sanitized;
};

/**
 * Sanitizes a phone number
 * @param phone - The phone number to sanitize
 * @returns The sanitized phone number
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Keep only digits, spaces, hyphens, parentheses, and plus sign
  const sanitized = phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
  
  // Limit length
  if (sanitized.length > 30) {
    return sanitized.substring(0, 30);
  }
  
  return sanitized;
};

/**
 * Escapes HTML entities for safe display
 * Use this when displaying user-generated content
 * @param input - The string to escape
 * @returns The escaped string
 */
export const escapeHtml = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
