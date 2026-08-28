import React, { useState } from 'react';
import { NormalizedWebRequest, NormalizedWebResponse } from '../types/viewer';
import { Globe, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WebRequestInspectorProps {
  webRequest?: NormalizedWebRequest;
  webResponse?: NormalizedWebResponse;
}

export const WebRequestInspector: React.FC<WebRequestInspectorProps> = ({ webRequest, webResponse }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');

  if (!webRequest && !webResponse) return null;

  return (
    <div className="bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
      {/* Header */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>DAST / Web Traffic Inspector</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              HTTP request & response payloads captured by security scanner
            </p>
          </div>
        </div>

        {/* Request / Response Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
          {webRequest && (
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'request'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Request</span>
            </button>
          )}

          {webResponse && (
            <button
              type="button"
              onClick={() => setActiveTab('response')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'response'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Response</span>
              {webResponse.statusCode && (
                <span className={`ml-1 px-1 py-0.2 rounded text-[10px] font-bold ${
                  webResponse.statusCode >= 200 && webResponse.statusCode < 300
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : webResponse.statusCode >= 500
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {webResponse.statusCode}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'request' && webRequest && (
          <div className="space-y-3">
            {/* Target URL & Method */}
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                {webRequest.method || 'GET'}
              </span>
              <span className="text-slate-800 dark:text-zinc-200 truncate">{webRequest.target || '/'}</span>
            </div>

            {/* Request Headers */}
            {webRequest.headers && Object.keys(webRequest.headers).length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Headers
                </div>
                <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-200 space-y-1 overflow-x-auto">
                  {Object.entries(webRequest.headers).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <span className="text-indigo-400">{k}:</span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {webRequest.body && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Payload Body
                </div>
                <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                  <pre><code>{webRequest.body}</code></pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'response' && webResponse && (
          <div className="space-y-3">
            {/* Status Line */}
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center gap-2 text-xs font-mono">
              <span className="font-semibold text-slate-500">{webResponse.protocol || 'HTTP/1.1'}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold">
                {webResponse.statusCode ?? 'N/A'} {webResponse.reasonPhrase || ''}
              </span>
            </div>

            {/* Response Headers */}
            {webResponse.headers && Object.keys(webResponse.headers).length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Response Headers
                </div>
                <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-200 space-y-1 overflow-x-auto">
                  {Object.entries(webResponse.headers).map(([k, v]) => (
                    <div key={k} className="flex items-start gap-2">
                      <span className="text-purple-400">{k}:</span>
                      <span className="text-slate-300">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response Body */}
            {webResponse.body && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Response Body
                </div>
                <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-60 overflow-y-auto">
                  <pre><code>{webResponse.body}</code></pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
