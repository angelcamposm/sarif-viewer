/**
 * Formats a software or tool version string to have a consistent single 'v' prefix without duplication
 * (e.g. '1.0.0', 'v1.0.0', 'vv1.0.0', or 'V1.0.0' -> 'v1.0.0').
 */
export function formatVersion(version?: string): string {
  if (!version) return '';
  const trimmed = version.trim();
  if (!trimmed) return '';
  const clean = trimmed.replace(/^v+/i, '');
  return clean ? `v${clean}` : trimmed;
}
