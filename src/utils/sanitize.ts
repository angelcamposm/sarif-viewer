import DOMPurify from 'dompurify';

/**
 * Safely render simple markdown to sanitized HTML.
 * Shift-left security principle: prevents XSS from malicious SARIF input.
 */
export function renderSafeMarkdown(markdownText?: string): string {
  if (!markdownText) return '';

  // Escape raw HTML entities first
  let html = markdownText
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  // Code blocks: ```language ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="bg-slate-900 text-slate-100 p-3 rounded my-2 text-xs overflow-x-auto font-mono"><code>${code}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-slate-200">$1</code>');

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Markdown links: [text](url) - Non-backtracking linear regex
  html = html.replace(/\[([^[\]]+)\]\((https?:\/\/[^\s()]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline inline-flex items-center gap-0.5">$1</a>');

  // Line breaks
  html = html.replaceAll('\n', '<br/>');

  // Sanitize with DOMPurify allowing only safe tags and attributes
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'code', 'pre', 'a', 'br', 'span', 'p', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Basic text sanitizer to prevent raw injection in text contexts.
 */
export function sanitizeText(text?: string): string {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
