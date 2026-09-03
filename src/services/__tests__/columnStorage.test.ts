import { describe, it, expect, beforeEach } from 'vitest';
import {
  columnStorage,
  sanitizeColumnVisibility,
  DEFAULT_COLUMN_VISIBILITY,
  STORAGE_KEY,
} from '../columnStorage';

describe('Column Storage & Persistence Service', () => {
  beforeEach(() => {
    localStorage.clear();
    columnStorage._clearCacheForTesting();
  });

  it('loads default column visibility when localStorage is empty', () => {
    const state = columnStorage.getAll();
    expect(state).toEqual(DEFAULT_COLUMN_VISIBILITY);
    expect(state.rule).toBe(true);
    expect(state.level).toBe(true);
    expect(state.message).toBe(true);
    expect(state.file).toBe(true);
    expect(state.actions).toBe(true);
    expect(state.ruleName).toBe(false);
    expect(state.line).toBe(false);
  });

  it('unconditionally enforces actions: true even if false in raw input', () => {
    const sanitized = sanitizeColumnVisibility({
      rule: true,
      level: true,
      actions: false, // Attempt to disable actions
    });

    expect(sanitized.actions).toBe(true);
  });

  it('preserves user preference updates in localStorage', () => {
    columnStorage.save({ ruleName: true, line: true, file: false });

    const updated = columnStorage.getAll();
    expect(updated.ruleName).toBe(true);
    expect(updated.line).toBe(true);
    expect(updated.file).toBe(false);
    expect(updated.actions).toBe(true);

    // Verify localStorage payload
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.ruleName).toBe(true);
    expect(stored.actions).toBe(true);
  });

  it('toggles a column correctly and persists the state', () => {
    expect(columnStorage.getAll().tool).toBe(false);
    columnStorage.toggle('tool');
    expect(columnStorage.getAll().tool).toBe(true);
    columnStorage.toggle('tool');
    expect(columnStorage.getAll().tool).toBe(false);
  });

  it('prevents hiding the actions column via toggle', () => {
    columnStorage.toggle('actions');
    expect(columnStorage.getAll().actions).toBe(true);
  });

  it('prevents hiding the last remaining identifying data column', () => {
    // Hide all data columns except 'rule'
    columnStorage.save({
      rule: true,
      ruleName: false,
      level: false,
      message: false,
      file: false,
      line: false,
      tool: false,
      tags: false,
      taxonomies: false,
    });

    // Attempting to hide the only remaining data column 'rule' must be rejected
    const res = columnStorage.toggle('rule');
    expect(res.rule).toBe(true);
  });

  it('enables all columns with showAll()', () => {
    columnStorage.showAll();
    const state = columnStorage.getAll();

    expect(state.rule).toBe(true);
    expect(state.ruleName).toBe(true);
    expect(state.line).toBe(true);
    expect(state.tool).toBe(true);
    expect(state.tags).toBe(true);
    expect(state.taxonomies).toBe(true);
    expect(state.actions).toBe(true);
  });

  it('resets to default visibility with reset()', () => {
    columnStorage.showAll();
    columnStorage.reset();
    expect(columnStorage.getAll()).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});
