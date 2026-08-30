import { Artifact, Region } from '../types/sarif';

/**
 * Finds an artifact by index or by comparing normalized file paths.
 */
function findTargetArtifact(
  artifacts: Artifact[] = [],
  artifactIndex?: number,
  filePath?: string
): Artifact | undefined {
  if (artifactIndex !== undefined && artifacts[artifactIndex]) {
    return artifacts[artifactIndex];
  }

  if (filePath) {
    const cleanTarget = filePath.toLowerCase().replace(/\\/g, '/');
    return artifacts.find((a) => {
      const uri = a.location?.uri?.toLowerCase().replace(/\\/g, '/');
      return uri && (uri.endsWith(cleanTarget) || cleanTarget.endsWith(uri));
    });
  }

  return undefined;
}

/**
 * Extracts a line-range slice from source text.
 */
function extractLineRegion(text: string, region: Region): string {
  const lines = text.split(/\r?\n/);
  const startLineIdx = Math.max(0, (region.startLine || 1) - 1);
  const endLineIdx = region.endLine !== undefined ? Math.min(lines.length, region.endLine) : startLineIdx + 1;

  return lines.slice(startLineIdx, endLineIdx).join('\n');
}

/**
 * Extracts a character-offset slice from source text.
 */
function extractOffsetRegion(text: string, region: Region): string {
  const offset = region.charOffset || 0;
  const length = region.charLength || 100;
  return text.substring(offset, offset + length);
}

/**
 * Extracts a code snippet from embedded artifacts if region.snippet is not explicitly provided.
 */
export function extractSnippetFromArtifacts(
  artifacts: Artifact[] = [],
  artifactIndex?: number,
  filePath?: string,
  region?: Region
): string | undefined {
  if (!region || (region.startLine === undefined && region.charOffset === undefined)) {
    return undefined;
  }

  const targetArtifact = findTargetArtifact(artifacts, artifactIndex, filePath);
  if (!targetArtifact?.contents?.text) {
    return undefined;
  }

  const text = targetArtifact.contents.text;

  if (region.startLine !== undefined) {
    return extractLineRegion(text, region);
  }

  if (region.charOffset !== undefined) {
    return extractOffsetRegion(text, region);
  }

  return undefined;
}
