import { describe, it, expect } from 'vitest';
import { resolveArtifactPath } from '../uriResolver';

describe('URI & Path Resolver Service', () => {
  it('resolves relative path against originalUriBaseIds', () => {
    const artifactLoc = { uri: 'controllers/UserController.java', uriBaseId: 'SRCROOT' };
    const originalUriBaseIds = {
      SRCROOT: { uri: 'src/main/java/' },
    };

    const result = resolveArtifactPath(artifactLoc, originalUriBaseIds);
    expect(result.filePath).toBe('src/main/java/controllers/UserController.java');
    expect(result.fileName).toBe('UserController.java');
  });

  it('cleans file:// prefixes and backslashes', () => {
    const artifactLoc = { uri: 'file:///C:/projects/app/main.py' };
    const result = resolveArtifactPath(artifactLoc);

    expect(result.filePath).toBe('C:/projects/app/main.py');
    expect(result.fileName).toBe('main.py');
  });

  it('strips %SRCROOT% macros', () => {
    const artifactLoc = { uri: '%SRCROOT%/services/auth.ts' };
    const result = resolveArtifactPath(artifactLoc);

    expect(result.filePath).toBe('services/auth.ts');
    expect(result.fileName).toBe('auth.ts');
  });

  it('resolves chained uriBaseId hierarchies', () => {
    const artifactLoc = { uri: 'handler.go', uriBaseId: 'MODULE' };
    const originalUriBaseIds = {
      REPO_ROOT: { uri: 'file:///workspace/repo/' },
      SRC_DIR: { uri: 'src/backend/', uriBaseId: 'REPO_ROOT' },
      MODULE: { uri: 'api/', uriBaseId: 'SRC_DIR' },
    };

    const result = resolveArtifactPath(artifactLoc, originalUriBaseIds);
    expect(result.filePath).toBe('workspace/repo/src/backend/api/handler.go');
    expect(result.fileName).toBe('handler.go');
  });
});
