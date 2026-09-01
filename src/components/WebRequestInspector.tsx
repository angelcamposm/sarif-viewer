import React, { useState } from 'react';
import { NormalizedWebRequest, NormalizedWebResponse } from '../types/viewer';
import { ArrowUpRight, ArrowDownLeft, Copy, Check } from 'lucide-react';
import { HighlightedCode } from './HighlightedCode';

interface WebRequestInspectorProps {
  webRequest?: NormalizedWebRequest;
  webResponse?: NormalizedWebResponse;
}

function getMethodBadgeClass(method?: string): string {
  const m = (method || 'GET').toUpperCase();
  switch (m) {
    case 'POST':
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'PUT':
    case 'PATCH':
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'DELETE':
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    default:
      return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
  }
}

function getStatusBadgeClass(statusCode?: number): string {
  if (!statusCode) return 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
  if (statusCode >= 200 && statusCode < 300) {
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }
  if (statusCode >= 500) {
    return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  }
  if (statusCode >= 400) {
    return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
}

function detectBodyLanguage(body: string, headers?: Record<string, string>): string {
  const contentType = headers ? Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1] : '';
  if (contentType?.includes('json') || (body.trim().startsWith('{') && body.trim().endsWith('}')) || (body.trim().startsWith('[') && body.trim().endsWith(']'))) {
    return 'json';
  }
  if (contentType?.includes('xml') || contentType?.includes('html') || body.trim().startsWith('<')) {
    return 'markup';
  }
  return 'javascript';
}

const HeadersTable: React.FC<{ headers?: Record<string, string>; colorClass: string }> = ({ headers, colorClass }) => {
  if (!headers || Object.keys(headers).length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
        Headers ({Object.keys(headers).length})
      </div>
      <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 font-mono text-xs shadow-2xs overflow-x-auto">
        {Object.entries(headers).map(([k, v]) => (
          <div key={k} className="px-3 py-1.5 flex items-start gap-3">
            <span className={`font-semibold shrink-0 ${colorClass}`}>{k}:</span>
            <span className="text-slate-800 dark:text-zinc-200 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WebRequestDetails: React.FC<{ webRequest: NormalizedWebRequest }> = ({ webRequest }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyTarget = () => {
    if (webRequest.target) {
      navigator.clipboard.writeText(webRequest.target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Target URL & Method */}
      <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-mono shadow-2xs justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide shrink-0 ${getMethodBadgeClass(webRequest.method)}`}>
            {webRequest.method || 'GET'}
          </span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate" title={webRequest.target}>
            {webRequest.target || '/'}
          </span>
        </div>
        {webRequest.target && (
          <button
            type="button"
            onClick={handleCopyTarget}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <HeadersTable headers={webRequest.headers} colorClass="text-indigo-600 dark:text-indigo-400" />

      {webRequest.body && (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Request Body Payload
          </div>
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-xs overflow-x-auto text-slate-800 dark:text-zinc-200 leading-relaxed shadow-2xs">
            <pre>
              <HighlightedCode
                code={webRequest.body}
                language={detectBodyLanguage(webRequest.body, webRequest.headers)}
              />
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const WebResponseDetails: React.FC<{ webResponse: NormalizedWebResponse }> = ({ webResponse }) => (
  <div className="space-y-3.5">
    {/* Protocol & Status */}
    <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-mono shadow-2xs">
      <span className="text-slate-500 dark:text-zinc-400 font-medium">
        {webResponse.protocol || 'HTTP/1.1'}
      </span>
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wide ${getStatusBadgeClass(webResponse.statusCode)}`}>
        {webResponse.statusCode ?? 'N/A'} {webResponse.reasonPhrase || ''}
      </span>
    </div>

    <HeadersTable headers={webResponse.headers} colorClass="text-purple-600 dark:text-purple-400" />

    {webResponse.body && (
      <div className="space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Response Body Payload
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-xs overflow-x-auto text-slate-800 dark:text-zinc-200 leading-relaxed max-h-80 overflow-y-auto shadow-2xs">
          <pre>
            <HighlightedCode
              code={webResponse.body}
              language={detectBodyLanguage(webResponse.body, webResponse.headers)}
            />
          </pre>
        </div>
      </div>
    )}
  </div>
);

export const WebRequestInspector: React.FC<WebRequestInspectorProps> = ({ webRequest, webResponse }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>(webRequest ? 'request' : 'response');

  if (!webRequest && !webResponse) return null;

  return (
    <div className="space-y-4">
      {/* Sub-selector between Request and Response */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-700/80">
          {webRequest && (
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'request'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>HTTP Request</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase ${getMethodBadgeClass(webRequest.method)}`}>
                {webRequest.method || 'GET'}
              </span>
            </button>
          )}

          {webResponse && (
            <button
              type="button"
              onClick={() => setActiveTab('response')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'response'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>HTTP Response</span>
              {webResponse.statusCode && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getStatusBadgeClass(webResponse.statusCode)}`}>
                  {webResponse.statusCode}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Traffic details */}
      {activeTab === 'request' && webRequest && <WebRequestDetails webRequest={webRequest} />}
      {activeTab === 'response' && webResponse && <WebResponseDetails webResponse={webResponse} />}
    </div>
  );
};
