import { describe, it, expect } from 'vitest';
import { resolveEffectiveLevel, normalizeSarifLevel } from '../criticalityEngine';

describe('CriticalityEngine', () => {
  describe('normalizeSarifLevel', () => {
    it('normalizes valid SARIF levels', () => {
      expect(normalizeSarifLevel('error')).toBe('error');
      expect(normalizeSarifLevel('ERROR')).toBe('error');
      expect(normalizeSarifLevel('warning')).toBe('warning');
      expect(normalizeSarifLevel('note')).toBe('note');
      expect(normalizeSarifLevel('none')).toBe('none');
    });

    it('defaults to warning for undefined or unrecognized levels', () => {
      expect(normalizeSarifLevel(undefined)).toBe('warning');
      expect(normalizeSarifLevel('unknown-level')).toBe('warning');
    });
  });

  describe('resolveEffectiveLevel', () => {
    it('returns original level when no tags are provided', () => {
      const result = resolveEffectiveLevel('warning', []);
      expect(result.effectiveLevel).toBe('warning');
      expect(result.isOverridden).toBe(false);
    });

    it('returns original level when tags do not contain criticality keywords', () => {
      const result = resolveEffectiveLevel('warning', ['cwe-798', 'database', 'backend']);
      expect(result.effectiveLevel).toBe('warning');
      expect(result.isOverridden).toBe(false);
    });

    it('overrides warning to error when tag contains CRITICAL', () => {
      const result = resolveEffectiveLevel('warning', ['security', 'CRITICAL', 'cwe-89']);
      expect(result.effectiveLevel).toBe('error');
      expect(result.isOverridden).toBe(true);
      expect(result.overrideTag).toBe('CRITICAL');
    });

    it('overrides note to error when tag contains HIGH', () => {
      const result = resolveEffectiveLevel('note', ['HIGH']);
      expect(result.effectiveLevel).toBe('error');
      expect(result.isOverridden).toBe(true);
      expect(result.overrideTag).toBe('HIGH');
    });

    it('overrides error to note when tag contains LOW', () => {
      const result = resolveEffectiveLevel('error', ['LOW']);
      expect(result.effectiveLevel).toBe('note');
      expect(result.isOverridden).toBe(true);
      expect(result.overrideTag).toBe('LOW');
    });

    it('resolves the highest priority keyword when multiple tags exist', () => {
      // CRITICAL (weight 100) vs WARNING (weight 50)
      const result = resolveEffectiveLevel('note', ['WARNING', 'CRITICAL', 'LOW']);
      expect(result.effectiveLevel).toBe('error');
      expect(result.overrideTag).toBe('CRITICAL');
    });
  });
});
