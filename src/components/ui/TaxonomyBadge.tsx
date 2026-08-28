import React from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { NormalizedTaxonomyReference } from '../../types/viewer';

interface TaxonomyBadgeProps {
  taxonomy: NormalizedTaxonomyReference;
}

export const TaxonomyBadge: React.FC<TaxonomyBadgeProps> = ({ taxonomy }) => {
  const isCwe = taxonomy.taxonomyName.toUpperCase().includes('CWE') || taxonomy.id.toUpperCase().startsWith('CWE');
  const isOwasp = taxonomy.taxonomyName.toUpperCase().includes('OWASP') || taxonomy.id.toUpperCase().startsWith('A0') || taxonomy.id.toUpperCase().startsWith('A1');

  const badgeStyle = isCwe
    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900/60'
    : isOwasp
    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/60'
    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700';

  if (taxonomy.url) {
    return (
      <a
        href={taxonomy.url}
        target="_blank"
        rel="noopener noreferrer"
        title={taxonomy.name ? `${taxonomy.name} (${taxonomy.url})` : `View standard definition (${taxonomy.url})`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors shadow-2xs group cursor-pointer ${badgeStyle}`}
      >
        <ShieldAlert className="w-3 h-3 opacity-70" />
        <span>{taxonomy.id}</span>
        {taxonomy.name && <span className="hidden sm:inline font-sans text-[10px] opacity-80 max-w-[140px] truncate">· {taxonomy.name}</span>}
        <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <span
      title={taxonomy.name || taxonomy.id}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium border shadow-2xs ${badgeStyle}`}
    >
      <ShieldAlert className="w-3 h-3 opacity-70" />
      <span>{taxonomy.id}</span>
      {taxonomy.name && <span className="hidden sm:inline font-sans text-[10px] opacity-80 max-w-[140px] truncate">· {taxonomy.name}</span>}
    </span>
  );
};
