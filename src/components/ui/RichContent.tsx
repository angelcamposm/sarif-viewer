import React, { useMemo } from 'react';
import { renderSafeHtml, renderSafeMarkdown, isHtmlContent } from '../../utils/sanitize';

interface RichContentProps {
  text?: string;
  markdown?: string;
  className?: string;
}

/**
 * Reusable component for rendering rich, secure HTML and Markdown content.
 * Follows SARIF 2.1.0 specification §3.11.3:
 * 1. Prefers `markdown` if present.
 * 2. If only `text` is present and contains HTML tags, renders sanitized HTML.
 * 3. Otherwise renders sanitized markdown/text.
 */
export const RichContent: React.FC<RichContentProps> = ({
  text,
  markdown,
  className = '',
}) => {
  const sanitizedHtml = useMemo(() => {
    if (markdown) {
      return renderSafeMarkdown(markdown);
    }
    if (text && isHtmlContent(text)) {
      return renderSafeHtml(text);
    }
    if (text) {
      return renderSafeMarkdown(text);
    }
    return '';
  }, [text, markdown]);

  if (!sanitizedHtml) return null;

  return (
    <div
      className={`sarif-rich-content text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed break-words
        [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-zinc-100 [&_h1]:mt-3.5 [&_h1]:mb-2
        [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-zinc-100 [&_h2]:mt-3 [&_h2]:mb-1.5
        [&_h3]:text-xs [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-slate-700 [&_h3]:dark:text-zinc-300 [&_h3]:mt-2.5 [&_h3]:mb-1
        [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:text-slate-800 [&_h4]:dark:text-zinc-200 [&_h4]:mt-2 [&_h4]:mb-1
        [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-2.5
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-2.5
        [&_li]:leading-relaxed
        [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_table]:my-2.5 [&_table]:rounded-lg [&_table]:border [&_table]:border-slate-200 [&_table]:dark:border-zinc-800 [&_table]:overflow-x-auto [&_table]:block
        [&_thead]:bg-slate-50 [&_thead]:dark:bg-zinc-900
        [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-800 [&_th]:dark:text-zinc-200 [&_th]:border-b [&_th]:border-slate-200 [&_th]:dark:border-zinc-800
        [&_td]:px-3 [&_td]:py-1.5 [&_td]:border-b [&_td]:border-slate-100 [&_td]:dark:border-zinc-800/80 [&_td]:text-slate-700 [&_td]:dark:text-zinc-300
        [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:dark:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:py-0.5 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-zinc-400 [&_blockquote]:my-2
        [&_hr]:border-slate-200 [&_hr]:dark:border-zinc-800 [&_hr]:my-3
        [&_code]:font-mono [&_code]:text-[11px] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:dark:bg-zinc-800 [&_code]:text-slate-800 [&_code]:dark:text-zinc-200 [&_code]:border [&_code]:border-slate-200/80 [&_code]:dark:border-zinc-700/80
        [&_pre]:bg-slate-900 [&_pre]:dark:bg-zinc-950 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2.5 [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-slate-800 [&_pre]:dark:border-zinc-800/80
        [&_pre_code]:bg-transparent [&_pre_code]:dark:bg-transparent [&_pre_code]:border-none [&_pre_code]:p-0 [&_pre_code]:text-inherit
        [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-800 [&_a]:dark:hover:text-blue-300 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-0.5
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
