import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  columnStorage,
  TABLE_COLUMNS,
  DEFAULT_COLUMN_VISIBILITY,
} from '../services/columnStorage';
import { TableColumnKey, ColumnVisibilityState, ColumnMetadata } from '../types/viewer';

export function useColumnPreferences() {
  const columnVisibility = useSyncExternalStore(
    (onStoreChange) => columnStorage.subscribe(onStoreChange),
    () => columnStorage.getSnapshot(),
    () => DEFAULT_COLUMN_VISIBILITY
  );

  const toggleColumn = useCallback((key: TableColumnKey) => {
    columnStorage.toggle(key);
  }, []);

  const setColumnVisibility = useCallback((state: Partial<ColumnVisibilityState>) => {
    columnStorage.save(state);
  }, []);

  const showAllColumns = useCallback(() => {
    columnStorage.showAll();
  }, []);

  const resetToDefault = useCallback(() => {
    columnStorage.reset();
  }, []);

  const isColumnVisible = useCallback(
    (key: TableColumnKey) => Boolean(columnVisibility[key]),
    [columnVisibility]
  );

  const visibleCount = useMemo(
    () => Object.values(columnVisibility).filter(Boolean).length,
    [columnVisibility]
  );

  const visibleDataColumnsCount = useMemo(() => {
    return TABLE_COLUMNS.filter((c) => c.canHide && columnVisibility[c.key]).length;
  }, [columnVisibility]);

  // A column cannot be unchecked if it's the last remaining data column
  const canToggleOff = useCallback(
    (key: TableColumnKey) => {
      const colDef = TABLE_COLUMNS.find((c) => c.key === key);
      if (!colDef?.canHide) return false;
      if (!columnVisibility[key]) return true; // Already hidden, can turn on
      return visibleDataColumnsCount > 1; // Can only turn off if more than 1 data column is visible
    },
    [columnVisibility, visibleDataColumnsCount]
  );

  return {
    columnVisibility,
    columns: TABLE_COLUMNS as ColumnMetadata[],
    toggleColumn,
    setColumnVisibility,
    showAllColumns,
    resetToDefault,
    isColumnVisible,
    visibleCount,
    totalColumnsCount: TABLE_COLUMNS.length,
    canToggleOff,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
  };
}
