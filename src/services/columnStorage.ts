import { TableColumnKey, ColumnVisibilityState, ColumnMetadata } from '../types/viewer';

export const STORAGE_KEY = 'sarif_viewer_table_columns_v1';

export const TABLE_COLUMNS: ColumnMetadata[] = [
  {
    key: 'rule',
    label: 'Rule ID',
    description: 'Rule identifier with analysis badges (Flow, Fix, DAST, Suppressed)',
    defaultVisible: true,
    canHide: true,
  },
  {
    key: 'ruleName',
    label: 'Rule Name',
    description: 'Descriptive title or human-readable rule summary',
    defaultVisible: false,
    canHide: true,
  },
  {
    key: 'level',
    label: 'Severity / Level',
    description: 'Finding severity level badge (Error, Warning, Note, None)',
    defaultVisible: true,
    canHide: true,
  },
  {
    key: 'message',
    label: 'Message',
    description: 'Diagnostic message or finding description',
    defaultVisible: true,
    canHide: true,
  },
  {
    key: 'file',
    label: 'File Path',
    description: 'Target source code file path or URI',
    defaultVisible: true,
    canHide: true,
  },
  {
    key: 'line',
    label: 'Line / Position',
    description: 'Start line and column coordinates (e.g. L42:15)',
    defaultVisible: false,
    canHide: true,
  },
  {
    key: 'tool',
    label: 'Analysis Driver',
    description: 'Tool name and version (e.g. CodeQL, SonarQube, Semgrep)',
    defaultVisible: false,
    canHide: true,
  },
  {
    key: 'tags',
    label: 'Tags',
    description: 'Category and classification tags',
    defaultVisible: false,
    canHide: true,
  },
  {
    key: 'taxonomies',
    label: 'Standards / CWE',
    description: 'Security taxonomies, CWE, OWASP, and NIST mappings',
    defaultVisible: false,
    canHide: true,
  },
  {
    key: 'actions',
    label: 'Actions',
    description: 'Interactive controls (Raw SARIF JSON and Mute finding)',
    defaultVisible: true,
    canHide: false,
  },
];

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = TABLE_COLUMNS.reduce(
  (acc, col) => {
    acc[col.key] = col.defaultVisible;
    return acc;
  },
  {} as ColumnVisibilityState
);

let memoryCache: ColumnVisibilityState | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in columnStorage listener:', e);
    }
  });
}

/**
 * Sanitizes and validates a column visibility state, strictly guaranteeing `actions: true`
 * and ensuring all expected keys are defined with boolean values.
 */
export function sanitizeColumnVisibility(raw: any): ColumnVisibilityState {
  const result = { ...DEFAULT_COLUMN_VISIBILITY };

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    TABLE_COLUMNS.forEach((col) => {
      if (typeof raw[col.key] === 'boolean') {
        result[col.key] = raw[col.key];
      }
    });
  }

  // Enforce rule: Actions must never be hidden
  result.actions = true;

  // Enforce rule: At least 1 identifying data column must be visible
  const dataColumns = TABLE_COLUMNS.filter((c) => c.canHide).map((c) => c.key);
  const hasVisibleDataColumn = dataColumns.some((k) => result[k]);
  if (!hasVisibleDataColumn) {
    result.rule = true;
  }

  return result;
}

function loadFromLocalStorage(): ColumnVisibilityState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_COLUMN_VISIBILITY };
    }
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { ...DEFAULT_COLUMN_VISIBILITY };
    const parsed = JSON.parse(data);
    return sanitizeColumnVisibility(parsed);
  } catch (e) {
    console.warn('Failed to read column preferences from localStorage', e);
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }
}

function persistToLocalStorage(state: ColumnVisibilityState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const sanitized = sanitizeColumnVisibility(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Failed to save column preferences to localStorage', e);
  }
}

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      memoryCache = loadFromLocalStorage();
      notifyListeners();
    }
  });
}

export const columnStorage = {
  getAll(): ColumnVisibilityState {
    if (!memoryCache) {
      memoryCache = loadFromLocalStorage();
    }
    return memoryCache;
  },

  getSnapshot(): ColumnVisibilityState {
    return columnStorage.getAll();
  },

  save(state: Partial<ColumnVisibilityState>): ColumnVisibilityState {
    const current = this.getAll();
    const updated = sanitizeColumnVisibility({ ...current, ...state });
    memoryCache = updated;
    persistToLocalStorage(updated);
    notifyListeners();
    return updated;
  },

  toggle(key: TableColumnKey): ColumnVisibilityState {
    const current = this.getAll();
    const colDef = TABLE_COLUMNS.find((c) => c.key === key);

    // If column cannot be hidden (e.g. actions), do nothing
    if (!colDef?.canHide) {
      return { ...current };
    }

    const nextValue = !current[key];

    // If attempting to hide the last visible data column, reject
    if (!nextValue) {
      const visibleDataColumns = TABLE_COLUMNS.filter((c) => c.canHide && current[c.key]);
      if (visibleDataColumns.length <= 1 && current[key]) {
        return { ...current };
      }
    }

    return this.save({ [key]: nextValue });
  },

  showAll(): ColumnVisibilityState {
    const allVisible = TABLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as ColumnVisibilityState);
    return this.save(allVisible);
  },

  reset(): ColumnVisibilityState {
    return this.save(DEFAULT_COLUMN_VISIBILITY);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  _clearCacheForTesting(): void {
    memoryCache = null;
  },
};
