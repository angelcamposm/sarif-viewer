import { describe, it, expect } from 'vitest';
import { highlightJson } from '../jsonHighlighter';

describe('JSON Syntax Highlighter', () => {
  it('correctly tokenizes and applies syntax highlighting classes to JSON structures', () => {
    const sample = {
      ruleId: 'SEC001',
      line: 42,
      isVulnerable: true,
      notes: null,
    };

    const output = highlightJson(sample);

    // Assert key highlighting
    expect(output).toContain('class="text-sky-300 font-semibold">"ruleId"</span>');
    // Assert string highlighting
    expect(output).toContain('class="text-emerald-300">"SEC001"</span>');
    // Assert number highlighting
    expect(output).toContain('class="text-amber-300">42</span>');
    // Assert boolean highlighting
    expect(output).toContain('class="text-rose-400 font-bold">true</span>');
    // Assert null highlighting
    expect(output).toContain('class="text-purple-300 italic">null</span>');
  });

  it('safely escapes HTML tags to prevent XSS injection', () => {
    const malicious = {
      xss: '<script>alert("hacked")</script>',
    };

    const output = highlightJson(malicious);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });
});
