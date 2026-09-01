import Prism from 'prismjs';

// Load common language grammars into Prism
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

/**
 * Detects programming language identifier from a file path or extension.
 */
export function detectLanguage(filePath?: string): string {
  if (!filePath) return 'javascript';
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'java':
      return 'java';
    case 'py':
    case 'python':
      return 'python';
    case 'cs':
      return 'csharp';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      return 'cpp';
    case 'go':
      return 'go';
    case 'json':
      return 'json';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'html':
    case 'htm':
    case 'xml':
    case 'svg':
      return 'markup';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'css':
      return 'css';
    default:
      return 'clike';
  }
}

/**
 * Maps Prism token types to theme-aware Tailwind classes (GitHub-inspired palette).
 * Securely styled with high contrast in both light and dark themes.
 */
export function getTokenClass(type: string, isDiffDeleted = false, isDiffInserted = false): string {
  if (isDiffDeleted) {
    switch (type) {
      case 'keyword':
      case 'boolean':
        return 'text-rose-700 dark:text-rose-300 font-semibold';
      case 'string':
      case 'char':
        return 'text-rose-950 dark:text-rose-200 font-medium';
      case 'comment':
        return 'text-rose-400 dark:text-rose-400 italic';
      case 'function':
      case 'class-name':
        return 'text-purple-800 dark:text-purple-300 font-semibold';
      case 'number':
        return 'text-rose-800 dark:text-rose-300';
      default:
        return 'text-slate-900 dark:text-rose-100';
    }
  }

  if (isDiffInserted) {
    switch (type) {
      case 'keyword':
      case 'boolean':
        return 'text-emerald-800 dark:text-emerald-300 font-semibold';
      case 'string':
      case 'char':
        return 'text-emerald-950 dark:text-emerald-200 font-medium';
      case 'comment':
        return 'text-emerald-600 dark:text-emerald-400 italic';
      case 'function':
      case 'class-name':
        return 'text-purple-800 dark:text-purple-300 font-semibold';
      case 'number':
        return 'text-emerald-700 dark:text-emerald-300';
      default:
        return 'text-slate-900 dark:text-emerald-100';
    }
  }

  switch (type) {
    case 'keyword':
    case 'boolean':
      return 'text-[#cf222e] dark:text-[#ff7b72] font-semibold';
    case 'string':
    case 'char':
    case 'attr-value':
      return 'text-[#0a3069] dark:text-[#a5d6ff]';
    case 'comment':
    case 'doctype':
    case 'prolog':
      return 'text-[#6e7781] dark:text-[#8b949e] italic';
    case 'function':
    case 'function-variable':
      return 'text-[#8250df] dark:text-[#d2a8ff] font-medium';
    case 'class-name':
    case 'maybe-class-name':
      return 'text-[#953800] dark:text-[#ffa657] font-semibold';
    case 'number':
      return 'text-[#0550ae] dark:text-[#79c0ff]';
    case 'operator':
    case 'punctuation':
      return 'text-slate-700 dark:text-zinc-300';
    case 'property':
    case 'tag':
      return 'text-[#116329] dark:text-[#7ee787]';
    case 'variable':
    case 'constant':
      return 'text-[#953800] dark:text-[#ffa657]';
    default:
      return 'text-slate-800 dark:text-zinc-200';
  }
}

export function tokenizeCode(code: string, language?: string, filePath?: string): Array<string | Prism.Token> {
  const langKey = language || detectLanguage(filePath);
  const grammar = Prism.languages[langKey] || Prism.languages.clike || Prism.languages.javascript;
  return Prism.tokenize(code, grammar);
}
