import DOMPurify from 'dompurify';

const STRING_OR_KEY_PATTERN = '"(?:\\\\.|[^"\\\\])*":?';
const NUMBER_PATTERN = '-?\\d+(?:\\.\\d+)?';
const KEYWORD_PATTERN = '\\b(?:true|false|null)\\b';

const JSON_TOKEN_REGEX = new RegExp(
  `${STRING_OR_KEY_PATTERN}|${NUMBER_PATTERN}|${KEYWORD_PATTERN}`,
  'g'
);

function formatToken(match: string): string {
  if (match.startsWith('"')) {
    if (match.endsWith(':')) {
      const keyName = match.slice(0, -1);
      return `<span class="text-sky-300 font-semibold">${keyName}</span><span class="text-slate-400">:</span>`;
    }
    return `<span class="text-emerald-300">${match}</span>`;
  }
  if (match === 'true' || match === 'false') {
    return `<span class="text-rose-400 font-bold">${match}</span>`;
  }
  if (match === 'null') {
    return `<span class="text-purple-300 italic">${match}</span>`;
  }
  return `<span class="text-amber-300">${match}</span>`;
}

/**
 * Syntax highlighter for JSON data structures.
 * Produces safe HTML strings with thematic syntax classes for dark code editors.
 */
export function highlightJson(json: any): string {
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);

  // HTML entity escaping for security (XSS prevention)
  const escaped = str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const html = escaped.replace(JSON_TOKEN_REGEX, formatToken);

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class'],
  });
}
