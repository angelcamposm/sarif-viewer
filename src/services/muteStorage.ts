import { MuteRecord } from '../types/viewer';

const STORAGE_KEY = 'sarif_viewer_muted_alerts_v1';

let memoryCache: Record<string, MuteRecord> | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in muteStorage listener:', e);
    }
  });
}

function loadFromLocalStorage(): Record<string, MuteRecord> {
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
}

function persistToLocalStorage(records: Record<string, MuteRecord>): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save muted alerts to localStorage', e);
  }
}

// Listen to cross-tab storage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memoryCache = loadFromLocalStorage();
      notifyListeners();
    }
  });
}

/**
 * Browser storage manager for muted static analysis findings.
 * Includes in-memory caching and useSyncExternalStore compatibility.
 */
export const muteStorage = {
  getAll(): Record<string, MuteRecord> {
    if (memoryCache === null) {
      memoryCache = loadFromLocalStorage();
    }
    return memoryCache;
  },

  getSnapshot(): Record<string, MuteRecord> {
    return muteStorage.getAll();
  },

  get(id: string): MuteRecord | undefined {
    return muteStorage.getAll()[id];
  },

  isMuted(id: string): boolean {
    return !!muteStorage.getAll()[id];
  },

  mute(record: MuteRecord): void {
    const all = { ...this.getAll(), [record.id]: record };
    memoryCache = all;
    persistToLocalStorage(all);
    notifyListeners();
  },

  unmute(id: string): void {
    const all = { ...this.getAll() };
    if (all[id]) {
      delete all[id];
      memoryCache = all;
      persistToLocalStorage(all);
      notifyListeners();
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
    memoryCache = {};
    persistToLocalStorage({});
    notifyListeners();
  },

  import(records: MuteRecord[]): number {
    const all = { ...this.getAll() };
    let importedCount = 0;
    for (const rec of records) {
      if (rec && rec.id && rec.ruleId) {
        all[rec.id] = rec;
        importedCount++;
      }
    }
    memoryCache = all;
    persistToLocalStorage(all);
    notifyListeners();
    return importedCount;
  },

  exportJson(): string {
    const all = this.getAll();
    return JSON.stringify(Object.values(all), null, 2);
  },

  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
