import { describe, it, expect } from 'vitest';
import {
  renderSafeHtml,
  renderSafeMarkdown,
  isHtmlContent,
  sanitizeText,
  isSafeUri,
} from '../sanitize';

describe('Sanitization & Security Utilities', () => {
  describe('isHtmlContent', () => {
    it('detects HTML content with semantic tags', () => {
      expect(isHtmlContent('<h2>Why is this an issue?</h2>')).toBe(true);
      expect(isHtmlContent('<p>Sensitive data exposure.</p>')).toBe(true);
      expect(isHtmlContent('<div><span>Hello</span></div>')).toBe(true);
      expect(isHtmlContent('<ul><li>Item</li></ul>')).toBe(true);
      expect(isHtmlContent('<table><tr><td>Cell</td></tr></table>')).toBe(true);
      expect(isHtmlContent('<code class="language-java">int x = 1;</code>')).toBe(true);
    });

    it('returns false for plain text or markdown without tags', () => {
      expect(isHtmlContent('Plain text finding message.')).toBe(false);
      expect(isHtmlContent('**Bold text** and *italic*')).toBe(false);
      expect(isHtmlContent('Line 1\nLine 2\nLine 3')).toBe(false);
      expect(isHtmlContent('a < b and c > d')).toBe(false);
      expect(isHtmlContent(undefined)).toBe(false);
      expect(isHtmlContent('')).toBe(false);
    });
  });

  describe('renderSafeHtml', () => {
    it('preserves valid semantic HTML for SonarQube rules and rich descriptions', () => {
      const input = `
        <h2>Why is this an issue?</h2>
        <p>Sensitive data might be leaked through <code>System.out.println()</code>.</p>
        <h3>Compliant Solution</h3>
        <pre><code class="language-java">logger.info("Safe output");</code></pre>
        <table>
          <thead><tr><th>Parameter</th><th>Description</th></tr></thead>
          <tbody><tr><td>key</td><td>API key</td></tr></tbody>
        </table>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
      `;

      const sanitized = renderSafeHtml(input);
      expect(sanitized).toContain('<h2>Why is this an issue?</h2>');
      expect(sanitized).toContain('<p>Sensitive data might be leaked through <code>System.out.println()</code>.</p>');
      expect(sanitized).toContain('<h3>Compliant Solution</h3>');
      expect(sanitized).toContain('<table>');
      expect(sanitized).toContain('<th>Parameter</th>');
      expect(sanitized).toContain('<td>API key</td>');
      expect(sanitized).toContain('<li>Point 1</li>');
    });

    it('enforces secure target="_blank" and rel="noopener noreferrer" on all anchor links', () => {
      const input = '<a href="https://cwe.mitre.org/data/definitions/89.html">CWE-89 Reference</a>';
      const sanitized = renderSafeHtml(input);

      expect(sanitized).toContain('href="https://cwe.mitre.org/data/definitions/89.html"');
      expect(sanitized).toContain('target="_blank"');
      expect(sanitized).toContain('rel="noopener noreferrer"');
    });

    it('neutralizes malicious XSS script tags and event handlers', () => {
      const malicious = '<script>alert("XSS")</script><p>Text</p><img src="x" onerror="alert(1)">';
      const sanitized = renderSafeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('<p>Text</p>');
    });

    it('blocks dangerous iframe, embed, and javascript: URI schemes', () => {
      const malicious = `
        <iframe src="https://evil.com"></iframe>
        <a href="javascript:alert('pwned')">Evil Link</a>
        <embed src="malware.swf">
      `;
      const sanitized = renderSafeHtml(malicious);

      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<embed');
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('renderSafeMarkdown', () => {
    it('correctly transforms markdown constructs to sanitized HTML', () => {
      const markdown = '**Important**: Use `PreparedStatement` instead of concatenation.\nSee [docs](https://example.com).';
      const rendered = renderSafeMarkdown(markdown);

      expect(rendered).toContain('<strong>Important</strong>');
      expect(rendered).toContain('<code');
      expect(rendered).toContain('PreparedStatement</code>');
      expect(rendered).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer"');
    });

    it('handles code blocks in markdown securely', () => {
      const markdown = '```java\nString query = "SELECT * FROM users";\n```';
      const rendered = renderSafeMarkdown(markdown);

      expect(rendered).toContain('<pre class="bg-slate-900 text-slate-100');
      expect(rendered).toContain('<code>String query = "SELECT * FROM users";\n</code>');
    });
  });

  describe('sanitizeText', () => {
    it('strips all HTML tags to return plain text only', () => {
      const input = '<p>Hello <strong>World</strong>!</p>';
      expect(sanitizeText(input)).toBe('Hello World!');
    });

    it('returns empty string on empty input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('isSafeUri', () => {
    it('allows safe https and http links', () => {
      expect(isSafeUri('https://cwe.mitre.org/data/definitions/89.html')).toBe(true);
      expect(isSafeUri('http://example.com/docs')).toBe(true);
      expect(isSafeUri('mailto:security@example.com')).toBe(true);
    });

    it('rejects dangerous javascript: and data: URIs', () => {
      expect(isSafeUri('javascript:alert(1)')).toBe(false);
      expect(isSafeUri('JAVASCRIPT:alert("xss")')).toBe(false);
      expect(isSafeUri('javascript:void(0)')).toBe(false);
      expect(isSafeUri('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUri('vbscript:msgbox(1)')).toBe(false);
    });

    it('handles empty and undefined inputs safely', () => {
      expect(isSafeUri('')).toBe(false);
      expect(isSafeUri(undefined)).toBe(false);
    });
  });
});
