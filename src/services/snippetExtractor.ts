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
    const cleanTarget = filePath.toLowerCase().replaceAll('\\', '/');
    return artifacts.find((a) => {
      const uri = a.location?.uri?.toLowerCase().replaceAll('\\', '/');
      return uri && (uri.endsWith(cleanTarget) || cleanTarget.endsWith(uri));
    });
  }

  return undefined;
}

const artifactLinesCache = new WeakMap<Artifact, string[]>();

function getArtifactLines(artifact: Artifact): string[] {
  let cached = artifactLinesCache.get(artifact);
  if (!cached && artifact.contents?.text) {
    cached = artifact.contents.text.split(/\r?\n/);
    artifactLinesCache.set(artifact, cached);
  }
  return cached || [];
}

/**
 * Extracts a line-range slice from source text.
 */
function extractLineRegion(lines: string[], region: Region): string {
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

  if (region.startLine !== undefined) {
    return extractLineRegion(getArtifactLines(targetArtifact), region);
  }

  if (region.charOffset !== undefined) {
    return extractOffsetRegion(targetArtifact.contents.text, region);
  }

  return undefined;
}
