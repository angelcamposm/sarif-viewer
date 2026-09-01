import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailsPanel } from '../DetailsPanel';
import { NormalizedFinding } from '../../types/viewer';

const mockFindingBasic: NormalizedFinding = {
  id: 'finding-1',
  runIndex: 0,
  resultIndex: 0,
  toolName: 'CodeQL',
  toolVersion: '2.14.0',
  ruleId: 'js/sql-injection',
  ruleName: 'SQL Database Query Injection',
  ruleDescription: 'Untrusted user input directly concatenated into database query.',
  ruleFullDescription: 'Deep explanation of SQL injection and remediation steps.',
  ruleHelpUri: 'https://cwe.mitre.org/data/definitions/89.html',
  message: 'User input from **req.query.id** flows into raw SQL query.',
  messageMarkdown: 'User input from **req.query.id** flows into raw SQL query.',
  originalLevel: 'error',
  effectiveLevel: 'error',
  isLevelOverridden: false,
  filePath: 'src/controllers/userController.ts',
  fileName: 'userController.ts',
  line: 42,
  column: 15,
  endLine: 42,
  endColumn: 80,
  codeSnippet: 'const user = await db.query(`SELECT * FROM users WHERE id = ${req.query.id}`);',
  tags: ['security', 'cwe-89', 'critical'],
  taxonomies: [{ taxonomyName: 'CWE', id: 'CWE-89', url: 'https://cwe.mitre.org/data/definitions/89.html' }],
  properties: {},
  isMuted: false,
  rawResult: {} as any,
};

const mockFindingWithFlowAndFix: NormalizedFinding = {
  ...mockFindingBasic,
  id: 'finding-2',
  codeFlows: [
    {
      threadFlows: [
        {
          steps: [
            {
              step: 1,
              importance: 'essential',
              message: 'User input entrypoint',
              filePath: 'src/routes.ts',
              fileName: 'routes.ts',
              line: 10,
              column: 5,
            },
            {
              step: 2,
              importance: 'essential',
              message: 'Sink in database call',
              filePath: 'src/controllers/userController.ts',
              fileName: 'userController.ts',
              line: 42,
              column: 15,
            },
          ],
        },
      ],
    },
  ],
  fixes: [
    {
      description: 'Use parameterized query binding',
      artifactChanges: [
        {
          filePath: 'src/controllers/userController.ts',
          fileName: 'userController.ts',
          replacements: [
            {
              deletedRegion: { startLine: 42, startColumn: 15, endLine: 42, endColumn: 80 },
              insertedContent: 'const user = await db.query("SELECT * FROM users WHERE id = $1", [req.query.id]);',
            },
          ],
        },
      ],
    },
  ],
};

describe('DetailsPanel Component', () => {
  it('renders placeholder when no finding is selected', () => {
    render(<DetailsPanel finding={null} onToggleMute={vi.fn()} />);

    expect(screen.getByText(/select a finding from the table to view comprehensive details/i)).toBeDefined();
  });

  it('renders Overview tab by default with message, rule ID, and primary location', () => {
    const onToggleMute = vi.fn();
    const onViewRawSarif = vi.fn();

    render(
      <DetailsPanel
        finding={mockFindingBasic}
        reportFileName="report.sarif"
        onToggleMute={onToggleMute}
        onViewRawSarif={onViewRawSarif}
      />
    );

    // Header elements
    expect(screen.getByText(/finding details/i)).toBeDefined();
    expect(screen.getByText(/ID: finding-1/i)).toBeDefined();

    // Default Overview tab selected
    expect(screen.getByRole('button', { name: /overview/i })).toBeDefined();
    expect(screen.getByText('js/sql-injection')).toBeDefined();
    expect(screen.getByText('src/controllers/userController.ts')).toBeDefined();
    expect(screen.getAllByText('42').length).toBeGreaterThan(0);

    // Contextual tabs should NOT appear for basic finding
    expect(screen.queryByRole('button', { name: /dataflow/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /remediation/i })).toBeNull();
  });

  it('renders Dataflow and Remediation tabs with badges when finding has flows and fixes', () => {
    render(
      <DetailsPanel
        finding={mockFindingWithFlowAndFix}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    const dataflowTab = screen.getByRole('button', { name: /dataflow/i });
    const remediationTab = screen.getByRole('button', { name: /remediation/i });

    expect(dataflowTab).toBeDefined();
    expect(remediationTab).toBeDefined();

    // Check step count and fix count badges
    expect(screen.getByText('2')).toBeDefined(); // 2 steps
    expect(screen.getByText('1')).toBeDefined(); // 1 fix
  });

  it('switches to Dataflow tab and renders stepper on click', () => {
    render(
      <DetailsPanel
        finding={mockFindingWithFlowAndFix}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    const dataflowTab = screen.getByRole('button', { name: /dataflow/i });
    fireEvent.click(dataflowTab);

    expect(screen.getByText(/step 1 of 2/i)).toBeDefined();
    expect(screen.getByText(/taint source/i)).toBeDefined();
    expect(screen.getByText('User input entrypoint')).toBeDefined();
  });

  it('switches to Remediation tab and renders diff viewer on click', () => {
    render(
      <DetailsPanel
        finding={mockFindingWithFlowAndFix}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    const remediationTab = screen.getByRole('button', { name: /remediation/i });
    fireEvent.click(remediationTab);

    expect(screen.getByText(/use parameterized query binding/i)).toBeDefined();
    expect(screen.getByText(/Lines 42 - 42/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /copy replacement/i })).toBeDefined();
  });

  it('switches to Rule & Context tab on click', () => {
    render(
      <DetailsPanel
        finding={mockFindingBasic}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    const contextTab = screen.getByRole('button', { name: /rule & context/i });
    fireEvent.click(contextTab);

    expect(screen.getByText(/rule documentation/i)).toBeDefined();
    expect(screen.getByText(/SQL Database Query Injection/i)).toBeDefined();
    expect(screen.getByText(/SARIF Log Source/i)).toBeDefined();
    expect(screen.getByText('report.sarif')).toBeDefined();
    expect(screen.getByText(/CodeQL/i)).toBeDefined();
    expect(screen.getByText('v2.14.0')).toBeDefined();
  });

  it('resets to Overview tab when selecting a new finding', () => {
    const { rerender } = render(
      <DetailsPanel
        finding={mockFindingWithFlowAndFix}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    // Switch to Dataflow tab
    const dataflowTab = screen.getByRole('button', { name: /dataflow/i });
    fireEvent.click(dataflowTab);
    expect(screen.getByText(/step 1 of 2/i)).toBeDefined();

    // Rerender with a new finding
    rerender(
      <DetailsPanel
        finding={mockFindingBasic}
        reportFileName="report.sarif"
        onToggleMute={vi.fn()}
      />
    );

    // Active tab automatically resets to Overview
    expect(screen.getByText('Finding Overview')).toBeDefined();
    expect(screen.queryByText(/step 1 of 2/i)).toBeNull();
  });

  it('triggers onToggleMute and onViewRawSarif from header buttons', () => {
    const onToggleMute = vi.fn();
    const onViewRawSarif = vi.fn();

    render(
      <DetailsPanel
        finding={mockFindingBasic}
        reportFileName="report.sarif"
        onToggleMute={onToggleMute}
        onViewRawSarif={onViewRawSarif}
      />
    );

    const muteBtn = screen.getByRole('button', { name: /mute/i });
    fireEvent.click(muteBtn);
    expect(onToggleMute).toHaveBeenCalledWith(mockFindingBasic);

    const rawBtn = screen.getByRole('button', { name: /raw sarif/i });
    fireEvent.click(rawBtn);
    expect(onViewRawSarif).toHaveBeenCalledWith(mockFindingBasic);
  });
});
