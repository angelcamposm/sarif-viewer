import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindingsTable } from '../FindingsTable';
import { NormalizedFinding } from '../../types/viewer';
import { columnStorage } from '../../services/columnStorage';

const mockFindings: NormalizedFinding[] = [
  {
    id: 'f1',
    runIndex: 0,
    resultIndex: 0,
    toolName: 'CodeQL',
    toolVersion: '2.14.0',
    ruleId: 'js/sql-injection',
    ruleName: 'SQL Injection Vulnerability',
    ruleDescription: 'Untrusted user input in SQL query.',
    effectiveLevel: 'error',
    originalLevel: 'error',
    isLevelOverridden: false,
    message: 'User input flows into raw SQL query.',
    filePath: 'src/controllers/userController.ts',
    fileName: 'userController.ts',
    line: 42,
    column: 15,
    endLine: 42,
    endColumn: 80,
    tags: ['security', 'cwe-89'],
    taxonomies: [{ taxonomyName: 'CWE', id: 'CWE-89' }],
    properties: {},
    isMuted: false,
    rawResult: {} as any,
  },
];

describe('FindingsTable Component & Column Customization', () => {
  beforeEach(() => {
    localStorage.clear();
    columnStorage._clearCacheForTesting();
  });

  it('renders default columns (Rule, Level, Message, File, Actions)', () => {
    render(
      <FindingsTable
        findings={mockFindings}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
        onToggleMute={vi.fn()}
      />
    );

    expect(screen.getByRole('columnheader', { name: /rule/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /level/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /message/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /file/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeDefined();

    // Default hidden columns should not be rendered
    expect(screen.queryByRole('columnheader', { name: /rule name/i })).toBeNull();
    expect(screen.queryByRole('columnheader', { name: /line/i })).toBeNull();
  });

  it('opens column customizer popover and shows column list', () => {
    render(
      <FindingsTable
        findings={mockFindings}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
        onToggleMute={vi.fn()}
      />
    );

    const columnsBtn = screen.getByRole('button', { name: /columns/i });
    fireEvent.click(columnsBtn);

    expect(screen.getByText('Table Columns')).toBeDefined();
    expect(screen.getByText(/5 of 10 columns visible/i)).toBeDefined();
    expect(screen.getByText('Rule Name')).toBeDefined();
    expect(screen.getByText('Line / Position')).toBeDefined();
    expect(screen.getByText('Locked')).toBeDefined(); // Actions locked badge
  });

  it('toggles an optional column on and off', () => {
    render(
      <FindingsTable
        findings={mockFindings}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
        onToggleMute={vi.fn()}
      />
    );

    // Open popover
    fireEvent.click(screen.getByRole('button', { name: /columns/i }));

    // Click "Rule Name" to enable it
    const ruleNameRow = screen.getByText('Rule Name');
    fireEvent.click(ruleNameRow);

    // Header and cell for Rule Name should now be rendered
    expect(screen.getByRole('columnheader', { name: /rule name/i })).toBeDefined();
    expect(screen.getByText('SQL Injection Vulnerability')).toBeDefined();
  });

  it('enables all columns with "Show all" action', () => {
    render(
      <FindingsTable
        findings={mockFindings}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
        onToggleMute={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /columns/i }));

    const allBtn = screen.getByRole('button', { name: /^all$/i });
    fireEvent.click(allBtn);

    expect(screen.getByRole('columnheader', { name: /rule name/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /line/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /driver/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /tags/i })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: /standards/i })).toBeDefined();
  });

  it('resets columns to default layout with "Reset" action', () => {
    render(
      <FindingsTable
        findings={mockFindings}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
        onToggleMute={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /columns/i }));

    // Show all
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));
    expect(screen.getByRole('columnheader', { name: /rule name/i })).toBeDefined();

    // Reset
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.queryByRole('columnheader', { name: /rule name/i })).toBeNull();
  });
});
