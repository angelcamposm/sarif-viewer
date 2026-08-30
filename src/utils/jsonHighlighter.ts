import DOMPurify from 'dompurify';

const JSON_TOKEN_REGEX = /"(?:\\.|[^"\\])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?/g;

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

  // Tokenizer regex matching JSON keys, strings, numbers, booleans, and null
  const html = escaped.replace(JSON_TOKEN_REGEX, (match) => {
    let cls = 'text-amber-300'; // numbers
    if (match.startsWith('"')) {
      if (match.endsWith(':')) {
        // JSON Object Key
        const keyName = match.slice(0, -1);
        return `<span class="text-sky-300 font-semibold">${keyName}</span><span class="text-slate-400">:</span>`;
      }
      // JSON String Value
      cls = 'text-emerald-300';
    } else if (match === 'true' || match === 'false') {
      // Boolean
      cls = 'text-rose-400 font-bold';
    } else if (match === 'null') {
      // Null
      cls = 'text-purple-300 italic';
    }
    return `<span class="${cls}">${match}</span>`;
  });

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class'],
  });
}
