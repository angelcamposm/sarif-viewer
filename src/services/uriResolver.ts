import { ArtifactLocation } from '../types/sarif';

/**
 * Traverses chained uriBaseId hierarchies in originalUriBaseIds.
 */
function resolveChainedUriPrefix(
  initialUriBaseId?: string,
  originalUriBaseIds?: Record<string, ArtifactLocation>
): string {
  if (!initialUriBaseId || !originalUriBaseIds) {
    return '';
  }

  let currentUriBaseId: string | undefined = initialUriBaseId;
  const visited = new Set<string>();
  let accumulatedPrefix = '';

  while (currentUriBaseId && originalUriBaseIds[currentUriBaseId] && !visited.has(currentUriBaseId)) {
    visited.add(currentUriBaseId);
    const base: ArtifactLocation | undefined = originalUriBaseIds[currentUriBaseId];
    if (base?.uri) {
      const baseUri = base.uri.endsWith('/') ? base.uri : `${base.uri}/`;
      accumulatedPrefix = `${baseUri}${accumulatedPrefix}`;
    }
    currentUriBaseId = base?.uriBaseId;
  }

  return accumulatedPrefix;
}

/**
 * Normalizes an artifact URI string by stripping schemes, standardizing slashes, and removing macro placeholders.
 */
function normalizeArtifactUri(rawUri: string): string {
  if (!rawUri) return 'Not provided';

  const normalized = rawUri
    .replace(/^file:\/\/\/?/, '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^%SRCROOT%\/?/i, '')
    .replace(/^#src_dir#\/?/i, '')
    .replace(/^%WORKSPACE%\/?/i, '');

  return normalized || 'Not provided';
}

/**
 * Extracts the file basename from a normalized path string.
 */
function extractArtifactFileName(normalizedPath: string): string {
  if (normalizedPath === 'Not provided') {
    return 'Not provided';
  }
  return normalizedPath.split('/').filter(Boolean).pop() || normalizedPath;
}

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

  const prefix = resolveChainedUriPrefix(artifactLoc?.uriBaseId, originalUriBaseIds);
  const baseUri = artifactLoc?.uri || fallbackTarget || '';
  const fullRawUri = `${prefix}${baseUri}`;

  const filePath = normalizeArtifactUri(fullRawUri);
  const fileName = extractArtifactFileName(filePath);

  return { filePath, fileName };
}
