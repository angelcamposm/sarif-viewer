import { ArtifactLocation } from '../types/sarif';

/**
 * Utility service to resolve and normalize artifact URIs against originalUriBaseIds
 * and clean path artifacts according to OASIS SARIF 2.1.0 specifications.
 */
export function resolveArtifactPath(
  artifactLoc?: ArtifactLocation,
  originalUriBaseIds?: Record<string, ArtifactLocation>,
  fallbackTarget?: string
): { filePath: string; fileName: string } {
  if (!artifactLoc && !fallbackTarget) {
    return { filePath: 'Not provided', fileName: 'Not provided' };
  }

  let rawUri = artifactLoc?.uri || fallbackTarget || '';

  // If uriBaseId is provided, resolve against originalUriBaseIds
  if (artifactLoc?.uriBaseId && originalUriBaseIds) {
    const base = originalUriBaseIds[artifactLoc.uriBaseId];
    if (base && base.uri) {
      const baseUri = base.uri.endsWith('/') ? base.uri : `${base.uri}/`;
      rawUri = `${baseUri}${rawUri}`;
    }
  }

  // Normalize path
  let normalized = rawUri
    .replace(/^file:\/\/\/?/, '') // Strip file:// scheme
    .replace(/\\/g, '/')          // Standardize Windows backslashes
    .replace(/^\.\//, '');        // Strip leading ./

  // Normalize common root macro placeholders
  normalized = normalized
    .replace(/^%SRCROOT%\/?/i, '')
    .replace(/^#src_dir#\/?/i, '')
    .replace(/^%WORKSPACE%\/?/i, '');

  if (!normalized) {
    normalized = 'Not provided';
  }

  const fileName =
    normalized !== 'Not provided'
      ? normalized.split('/').filter(Boolean).pop() || normalized
      : 'Not provided';

  return { filePath: normalized, fileName };
}
