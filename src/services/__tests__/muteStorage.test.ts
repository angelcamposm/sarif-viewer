import { describe, it, expect, beforeEach } from 'vitest';
import { muteStorage } from '../muteStorage';
import { MuteRecord } from '../../types/viewer';

describe('MuteStorage Service', () => {
  beforeEach(() => {
    muteStorage.clearAll();
  });

  it('stores and retrieves muted findings', () => {
    const record: MuteRecord = {
      id: 'test_find_1',
      ruleId: 'SEC001',
      filePath: 'src/app.ts',
      line: 10,
      reason: 'Accepted Risk',
      justification: 'Dev environment only',
      mutedAt: new Date().toISOString(),
    };

    muteStorage.mute(record);
    expect(muteStorage.isMuted('test_find_1')).toBe(true);
    expect(muteStorage.get('test_find_1')?.reason).toBe('Accepted Risk');

    muteStorage.unmute('test_find_1');
    expect(muteStorage.isMuted('test_find_1')).toBe(false);
  });

  it('imports suppression list array', () => {
    const records: MuteRecord[] = [
      {
        id: 'rec_1',
        ruleId: 'R1',
        reason: 'False Positive',
        mutedAt: new Date().toISOString(),
      },
      {
        id: 'rec_2',
        ruleId: 'R2',
        reason: 'Compensating Control',
        mutedAt: new Date().toISOString(),
      },
    ];

    const imported = muteStorage.import(records);
    expect(imported).toBe(2);
    expect(muteStorage.isMuted('rec_1')).toBe(true);
    expect(muteStorage.isMuted('rec_2')).toBe(true);
  });
});
