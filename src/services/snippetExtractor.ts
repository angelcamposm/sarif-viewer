import { Artifact, Region } from '../types/sarif';

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

  // 1. Locate artifact by index or matching URI
  let targetArtifact: Artifact | undefined;
  if (artifactIndex !== undefined && artifacts[artifactIndex]) {
    targetArtifact = artifacts[artifactIndex];
  } else if (filePath) {
    const cleanTarget = filePath.toLowerCase().replace(/\\/g, '/');
    targetArtifact = artifacts.find((a) => {
      const uri = a.location?.uri?.toLowerCase().replace(/\\/g, '/');
      return uri && (uri.endsWith(cleanTarget) || cleanTarget.endsWith(uri));
    });
  }

  if (!targetArtifact || !targetArtifact.contents?.text) {
    return undefined;
  }

  const text = targetArtifact.contents.text;

  // 2. Extract line-based slice
  if (region.startLine !== undefined) {
    const lines = text.split(/\r?\n/);
    const startLineIdx = Math.max(0, region.startLine - 1);
    const endLineIdx = region.endLine !== undefined ? Math.min(lines.length, region.endLine) : startLineIdx + 1;

    const slice = lines.slice(startLineIdx, endLineIdx);
    return slice.join('\n');
  }

  // 3. Extract character offset-based slice
  if (region.charOffset !== undefined) {
    const charLen = region.charLength || 100;
    return text.substring(region.charOffset, region.charOffset + charLen);
  }

  return undefined;
}
