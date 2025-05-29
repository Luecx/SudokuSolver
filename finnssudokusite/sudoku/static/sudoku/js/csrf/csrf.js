/**
 * @file csrf.js
 * @description Utility function to retrieve the CSRF token from the HTML document.
 * This token is required for secure POST requests in Django-based or other CSRF-protected backends.
 * The token must be embedded in a <meta> tag with name="csrf-token".
 *
 * Example meta tag expected in your HTML head:
 * <meta name="csrf-token" content="{{ csrf_token }}">
 *
 * This module can be imported wherever CSRF protection is needed for fetch/AJAX requests.
 */

/**
 * Retrieves the CSRF token from the HTML <meta> tag.
 *
 * @returns {string} The CSRF token string.
 * @throws {TypeError} If the meta tag is not found or has no content attribute.
 */
export function getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}
