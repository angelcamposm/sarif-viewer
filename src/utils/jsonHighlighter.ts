/**
 * Syntax highlighter for JSON data structures.
 * Produces safe HTML strings with thematic syntax classes for dark code editors.
 */
export function highlightJson(json: any): string {
  const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);

  // HTML entity escaping for security (XSS prevention)
  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Tokenizer regex matching JSON keys, strings, numbers, booleans, and null
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-300'; // numbers
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // JSON Object Key
          const keyName = match.slice(0, -1);
          return `<span class="text-sky-300 font-semibold">${keyName}</span><span class="text-slate-400">:</span>`;
        } else {
          // JSON String Value
          cls = 'text-emerald-300';
        }
      } else if (/true|false/.test(match)) {
        // Boolean
        cls = 'text-rose-400 font-bold';
      } else if (/null/.test(match)) {
        // Null
        cls = 'text-purple-300 italic';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}
