import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { detectLanguage, getTokenClass } from '../syntaxHighlight';
import { HighlightedCode } from '../../components/HighlightedCode';

describe('syntaxHighlight utilities', () => {
  describe('detectLanguage', () => {
    it('detects typescript and tsx files', () => {
      expect(detectLanguage('src/app.ts')).toBe('typescript');
      expect(detectLanguage('src/components/Button.tsx')).toBe('tsx');
    });

    it('detects javascript, python, and java files', () => {
      expect(detectLanguage('index.js')).toBe('javascript');
      expect(detectLanguage('server.py')).toBe('python');
      expect(detectLanguage('UserController.java')).toBe('java');
    });

    it('detects sql, json, yaml, and c/cpp files', () => {
      expect(detectLanguage('schema.sql')).toBe('sql');
      expect(detectLanguage('data.json')).toBe('json');
      expect(detectLanguage('config.yaml')).toBe('yaml');
      expect(detectLanguage('main.cpp')).toBe('cpp');
      expect(detectLanguage('core.c')).toBe('c');
    });

    it('falls back to clike for unknown extensions', () => {
      expect(detectLanguage('file.xyz123')).toBe('clike');
      expect(detectLanguage(undefined)).toBe('javascript');
    });
  });

  describe('getTokenClass', () => {
    it('returns appropriate classes for standard code tokens', () => {
      expect(getTokenClass('keyword')).toContain('text-[#cf222e]');
      expect(getTokenClass('string')).toContain('text-[#0a3069]');
      expect(getTokenClass('comment')).toContain('italic');
    });

    it('returns appropriate classes for diff deleted and inserted tokens', () => {
      expect(getTokenClass('keyword', true, false)).toContain('text-rose-700');
      expect(getTokenClass('keyword', false, true)).toContain('text-emerald-800');
    });
  });

  describe('HighlightedCode component', () => {
    it('renders tokenized spans safely for a TypeScript snippet', () => {
      const { container } = render(
        <HighlightedCode code="const x: number = 42;" filePath="test.ts" />
      );

      expect(screen.getByText('const')).toBeDefined();
      expect(screen.getByText('42')).toBeDefined();
      // Ensure it renders clean text elements
      expect(container.querySelector('code')).not.toBeNull();
    });

    it('renders malicious strings safely as text nodes without executing HTML', () => {
      render(
        <HighlightedCode
          code="<script>alert('xss')</script>"
          filePath="test.html"
        />
      );

      // Verify text is present as text nodes
      expect(screen.getByText(/alert/)).toBeDefined();
      // Verify no executable script element was injected into DOM
      expect(document.querySelector('script:not([type])')).toBeNull();
    });

    it('renders diff highlights when isDiffDeleted or isDiffInserted is set', () => {
      render(
        <HighlightedCode
          code="const removed = true;"
          filePath="test.ts"
          isDiffDeleted={true}
        />
      );

      const keywordSpan = screen.getByText('const');
      expect(keywordSpan.className).toContain('text-rose-700');
    });
  });
});
