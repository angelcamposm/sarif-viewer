/**
 * Generate a deterministic hash string from input components.
 * Used for creating consistent IDs for findings when SARIF correlationGuid/fingerprints are absent.
 */
export function generateDeterministicHash(parts: (string | number | undefined | null)[]): string {
  const str = parts.map((p) => (p !== undefined && p !== null ? String(p) : '')).join('::');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to 32-bit unsigned hex string
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `find_${hex}`;
}
