import { describe, it, expect } from 'vitest';
import { formatVersion } from '../formatters';

describe('formatVersion Utility', () => {
  it('adds v prefix to bare version strings', () => {
    expect(formatVersion('1.0.0')).toBe('v1.0.0');
    expect(formatVersion('2.4.1-beta')).toBe('v2.4.1-beta');
  });

  it('preserves single v prefix and prevents double vv prefixes', () => {
    expect(formatVersion('v1.0.0')).toBe('v1.0.0');
    expect(formatVersion('vv1.0.0')).toBe('v1.0.0');
    expect(formatVersion('V1.0.0')).toBe('v1.0.0');
    expect(formatVersion('VV2.0.0')).toBe('v2.0.0');
  });

  it('handles whitespace gracefully', () => {
    expect(formatVersion('  v1.0.0  ')).toBe('v1.0.0');
    expect(formatVersion('  2.0.0  ')).toBe('v2.0.0');
  });

  it('returns empty string for undefined or empty inputs', () => {
    expect(formatVersion(undefined)).toBe('');
    expect(formatVersion('')).toBe('');
    expect(formatVersion('   ')).toBe('');
  });
});
