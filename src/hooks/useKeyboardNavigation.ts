import { useEffect } from 'react';
import { NormalizedFinding } from '../types/viewer';

export function useKeyboardNavigation(
  findings: NormalizedFinding[],
  selectedFindingId: string | null,
  onSelectFindingId: (id: string) => void
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (findings.length === 0) return;
        e.preventDefault();

        const currentIndex = findings.findIndex((f) => f.id === selectedFindingId);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < findings.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : findings.length - 1;
        }

        if (findings[nextIndex]) {
          onSelectFindingId(findings[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findings, selectedFindingId, onSelectFindingId]);
}
