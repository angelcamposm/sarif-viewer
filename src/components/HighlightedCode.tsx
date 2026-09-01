import React from 'react';
import type Prism from 'prismjs';
import { tokenizeCode, getTokenClass } from '../utils/syntaxHighlight';

interface HighlightedCodeProps {
  code: string;
  language?: string;
  filePath?: string;
  isDiffDeleted?: boolean;
  isDiffInserted?: boolean;
}

function renderToken(
  token: string | Prism.Token,
  key: string | number,
  isDiffDeleted = false,
  isDiffInserted = false
): React.ReactNode {
  if (typeof token === 'string') {
    return token;
  }

  const tokenClass = getTokenClass(token.type, isDiffDeleted, isDiffInserted);

  if (Array.isArray(token.content)) {
    return (
      <span key={key} className={tokenClass}>
        {token.content.map((sub, idx) =>
          renderToken(sub, `${key}-${idx}`, isDiffDeleted, isDiffInserted)
        )}
      </span>
    );
  }

  if (typeof token.content === 'object' && token.content !== null) {
    return (
      <span key={key} className={tokenClass}>
        {renderToken(token.content, `${key}-sub`, isDiffDeleted, isDiffInserted)}
      </span>
    );
  }

  return (
    <span key={key} className={tokenClass}>
      {token.content}
    </span>
  );
}

/**
 * Secure syntax highlighter component.
 * Uses Prism to tokenize code and renders pure React text nodes (0 innerHTML / 0 XSS risk).
 */
export const HighlightedCode: React.FC<HighlightedCodeProps> = ({
  code,
  language,
  filePath,
  isDiffDeleted = false,
  isDiffInserted = false,
}) => {
  const tokens = tokenizeCode(code, language, filePath);

  return (
    <code>
      {tokens.map((token, idx) =>
        renderToken(token, `token-${idx}`, isDiffDeleted, isDiffInserted)
      )}
    </code>
  );
};
