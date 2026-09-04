import DOMPurify from 'dompurify';

// Hook to automatically enforce secure external link properties on all <a> tags
if (typeof window !== 'undefined' || typeof globalThis !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'sub', 'sup', 'small',
  'code', 'pre', 'kbd', 'samp', 'var',
  'blockquote', 'hr', 'br',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'a', 'details', 'summary',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'title',
  'align', 'valign', 'colspan', 'rowspan', 'scope',
  'id', 'name', 'width', 'height', 'lang', 'dir',
];

const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Checks if a string contains HTML markup tags.
 */
export function isHtmlContent(content?: string): boolean {
  if (!content) return false;
  return /<(?:[a-z][\w-]*)\b[^>]*>/i.test(content);
}

/**
 * Validates if a URI is safe for use in href attributes (https, http, mailto).
 * Prevents javascript: and data: script injection vectors.
 */
export function isSafeUri(uri?: string): boolean {
  if (!uri) return false;
  const trimmed = uri.trim();
  try {
    const parsed = new URL(trimmed, 'https://placeholder.local');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:';
  } catch {
    return /^https?:\/\//i.test(trimmed);
  }
}

/**
 * Safely sanitizes raw HTML string using DOMPurify with strict tag and protocol allowlists.
 * Shift-left security: Prevents XSS from untrusted or malicious SARIF data.
 */
export function renderSafeHtml(htmlContent?: string): string {
  if (!htmlContent) return '';

  return DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}

/**
 * Safely render markdown to sanitized HTML.
 * Parses markdown syntax while preserving allowed HTML tags and neutralizing XSS vectors.
 */
export function renderSafeMarkdown(markdownText?: string): string {
  if (!markdownText) return '';

  let html = markdownText;

  // Fenced Code blocks: ```language ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg my-2 text-xs overflow-x-auto font-mono"><code>${code}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-slate-200 dark:border-zinc-700">$1</code>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(^|[^a-zA-Z0-9_])_([^_]+)_(?![a-zA-Z0-9_])/g, '$1<em>$2</em>');

  // Markdown links: [text](url) - Linear regex
  html = html.replace(/\[([^[\]]+)\]\((https?:\/\/[^\s()]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5">$1</a>');

  // Convert newlines to <br/> only if not already using HTML block elements
  if (!/<(?:p|div|h[1-6]|ul|ol|li|table|pre|blockquote)\b/i.test(html)) {
    html = html.replaceAll('\n', '<br/>');
  }

  // Sanitize with DOMPurify
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
}

/**
 * Basic text sanitizer to prevent raw injection in text contexts.
 */
export function sanitizeText(text?: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
