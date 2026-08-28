import { MuteRecord } from '../types/viewer';

const STORAGE_KEY = 'sarif_viewer_muted_alerts_v1';
const EVENT_NAME = 'sarif_mute_storage_updated';

/**
 * Browser storage manager for muted static analysis findings.
 */
export const muteStorage = {
  getAll(): Record<string, MuteRecord> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return {};
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed as Record<string, MuteRecord>;
    } catch (e) {
      console.warn('Failed to read muted alerts from localStorage', e);
      return {};
    }
  },

  get(id: string): MuteRecord | undefined {
    const all = this.getAll();
    return all[id];
  },

  isMuted(id: string): boolean {
    const all = this.getAll();
    return !!all[id];
  },

  mute(record: MuteRecord): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const all = this.getAll();
      all[record.id] = record;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: all }));
      }
    } catch (e) {
      console.error('Failed to save muted alert to localStorage', e);
    }
  },

  unmute(id: string): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const all = this.getAll();
      if (all[id]) {
        delete all[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: all }));
        }
      }
    } catch (e) {
      console.error('Failed to remove muted alert from localStorage', e);
    }
  },

  toggleMute(record: Omit<MuteRecord, 'mutedAt'>): boolean {
    if (this.isMuted(record.id)) {
      this.unmute(record.id);
      return false;
    } else {
      this.mute({
        ...record,
        mutedAt: new Date().toISOString(),
      });
      return true;
    }
  },

  clearAll(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: {} }));
      }
    } catch (e) {
      console.error('Failed to clear muted alerts from localStorage', e);
    }
  },

  import(records: MuteRecord[]): number {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return 0;
      const all = this.getAll();
      let importedCount = 0;
      for (const rec of records) {
        if (rec && rec.id && rec.ruleId) {
          all[rec.id] = rec;
          importedCount++;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: all }));
      }
      return importedCount;
    } catch (e) {
      console.error('Failed to import muted alerts', e);
      return 0;
    }
  },

  exportJson(): string {
    const all = this.getAll();
    return JSON.stringify(Object.values(all), null, 2);
  },

  subscribe(callback: (records: Record<string, MuteRecord>) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, MuteRecord>>;
      callback(customEvent.detail || this.getAll());
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        callback(this.getAll());
      }
    });
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
    };
  },
};
