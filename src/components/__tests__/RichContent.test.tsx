import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichContent } from '../ui/RichContent';

describe('RichContent Component', () => {
  it('renders SonarQube HTML rule description with headings, paragraphs, and lists', () => {
    const sonarqubeHtml = `
      <h2>Why is this an issue?</h2>
      <p>Formatting strings with user input is vulnerable to format string injection.</p>
      <h3>Noncompliant Code Example</h3>
      <pre><code>printf(userInput);</code></pre>
      <h3>Compliant Solution</h3>
      <pre><code>printf("%s", userInput);</code></pre>
      <ul>
        <li>Use explicit format specifiers.</li>
        <li>Validate all input.</li>
      </ul>
    `;

    render(<RichContent text={sonarqubeHtml} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Why is this an issue?' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Noncompliant Code Example' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 3, name: 'Compliant Solution' })).toBeDefined();
    expect(screen.getByText(/Formatting strings with user input/)).toBeDefined();
    expect(screen.getByText('Use explicit format specifiers.')).toBeDefined();
  });

  it('prefers markdown when both text and markdown are provided (SARIF §3.11.3)', () => {
    const text = 'Plain text fallback message';
    const markdown = '**Markdown Title**: Use `safeMethod()` to sanitize input.';

    render(<RichContent text={text} markdown={markdown} />);

    expect(screen.getByText('Markdown Title')).toBeDefined();
    expect(screen.getByText('safeMethod()')).toBeDefined();
    expect(screen.queryByText('Plain text fallback message')).toBeNull();
  });

  it('renders HTML tables with proper table cells and headers', () => {
    const tableHtml = `
      <table>
        <thead>
          <tr><th>Parameter</th><th>Type</th></tr>
        </thead>
        <tbody>
          <tr><td>authHeader</td><td>String</td></tr>
        </tbody>
      </table>
    `;

    render(<RichContent text={tableHtml} />);

    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Parameter')).toBeDefined();
    expect(screen.getByText('authHeader')).toBeDefined();
  });

  it('returns null when neither text nor markdown is provided', () => {
    const { container } = render(<RichContent />);
    expect(container.firstChild).toBeNull();
  });
});
