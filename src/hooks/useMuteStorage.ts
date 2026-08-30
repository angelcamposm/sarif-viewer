import { useSyncExternalStore } from 'react';
import { muteStorage } from '../services/muteStorage';
import { MuteRecord } from '../types/viewer';

export function useMuteStorage(): {
  mutedRecords: Record<string, MuteRecord>;
  mute: (record: MuteRecord) => void;
  unmute: (id: string) => void;
  toggleMute: (record: Omit<MuteRecord, 'mutedAt'>) => boolean;
  clearAll: () => void;
  importRecords: (records: MuteRecord[]) => number;
  exportJson: () => string;
  isMuted: (id: string) => boolean;
} {
  const mutedRecords = useSyncExternalStore(
    (onStoreChange) => muteStorage.subscribe(onStoreChange),
    () => muteStorage.getSnapshot(),
    () => ({})
  );

  return {
    mutedRecords,
    mute: (record: MuteRecord) => muteStorage.mute(record),
    unmute: (id: string) => muteStorage.unmute(id),
    toggleMute: (record: Omit<MuteRecord, 'mutedAt'>) => muteStorage.toggleMute(record),
    clearAll: () => muteStorage.clearAll(),
    importRecords: (records: MuteRecord[]) => muteStorage.import(records),
    exportJson: () => muteStorage.exportJson(),
    isMuted: (id: string) => muteStorage.isMuted(id),
  };
}
