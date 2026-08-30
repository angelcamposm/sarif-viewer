import React, { useState } from 'react';
import { NormalizedFinding, MuteRecord } from '../types/viewer';
import { BellOff, X } from 'lucide-react';

interface MuteModalProps {
  finding: NormalizedFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmMute: (record: MuteRecord) => void;
  onConfirmUnmute: (findingId: string) => void;
}

interface MuteFormProps {
  finding: NormalizedFinding;
  onClose: () => void;
  onConfirmMute: (record: MuteRecord) => void;
  onConfirmUnmute: (findingId: string) => void;
}

const MuteFormFields: React.FC<{
  reason: MuteRecord['reason'];
  setReason: (r: MuteRecord['reason']) => void;
  justification: string;
  setJustification: (j: string) => void;
  author: string;
  setAuthor: (a: string) => void;
}> = ({ reason, setReason, justification, setJustification, author, setAuthor }) => (
  <>
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Suppression Reason
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as any)}
        className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 cursor-pointer"
      >
        <option value="False Positive">False Positive (Scanner incorrect)</option>
        <option value="Accepted Risk">Accepted Risk (Known & tolerated)</option>
        <option value="Compensating Control">Compensating Control in place (WAF/Gateway)</option>
        <option value="Fix Pending">Fix Pending (Tracked in backlog)</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Justification / Notes (Optional)
      </label>
      <textarea
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        placeholder="Explain why this finding is suppressed for audit compliance..."
        rows={3}
        className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500"
      />
    </div>

    <div>
      <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
        Reviewer
      </label>
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
      />
    </div>
  </>
);

const MuteStatusBanner: React.FC<{ muteRecord?: MuteRecord }> = ({ muteRecord }) => (
  <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 space-y-1">
    <div className="font-semibold">Currently Muted</div>
    <div>Reason: <strong>{muteRecord?.reason}</strong></div>
    {muteRecord?.justification && (
      <div>Justification: <em>"{muteRecord.justification}"</em></div>
    )}
    <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
      Muted by {muteRecord?.mutedBy || 'Reviewer'} on {new Date(muteRecord?.mutedAt || '').toLocaleString()}
    </div>
  </div>
);

const MuteForm: React.FC<MuteFormProps> = ({
  finding,
  onClose,
  onConfirmMute,
  onConfirmUnmute,
}) => {
  const isAlreadyMuted = finding.isMuted;
  const [reason, setReason] = useState<MuteRecord['reason']>(finding.muteRecord?.reason || 'False Positive');
  const [justification, setJustification] = useState(finding.muteRecord?.justification || '');
  const [author, setAuthor] = useState(finding.muteRecord?.mutedBy || 'SecOps Reviewer');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyMuted) {
      onConfirmUnmute(finding.id);
    } else {
      onConfirmMute({
        id: finding.id,
        ruleId: finding.ruleId,
        filePath: finding.filePath,
        line: finding.line ?? undefined,
        reason,
        justification,
        mutedBy: author,
        mutedAt: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
      <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-md border border-slate-200 dark:border-zinc-800">
        <div className="text-[11px] text-slate-500 dark:text-zinc-400 mb-0.5">Finding Message:</div>
        <div className="text-slate-800 dark:text-zinc-200 font-medium line-clamp-2">{finding.message}</div>
      </div>

      {!isAlreadyMuted ? (
        <MuteFormFields
          reason={reason}
          setReason={setReason}
          justification={justification}
          setJustification={setJustification}
          author={author}
          setAuthor={setAuthor}
        />
      ) : (
        <MuteStatusBanner muteRecord={finding.muteRecord} />
      )}

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-medium cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-1.5 rounded-md text-white font-semibold shadow-xs cursor-pointer ${
            isAlreadyMuted ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          {isAlreadyMuted ? 'Unmute Finding' : 'Mute in Browser Storage'}
        </button>
      </div>
    </form>
  );
};

export const MuteModal: React.FC<MuteModalProps> = ({
  finding,
  isOpen,
  onClose,
  onConfirmMute,
  onConfirmUnmute,
}) => {
  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-md w-full p-6 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <BellOff className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {finding.isMuted ? 'Manage Muted Alert' : 'Mute Finding'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                {finding.ruleId} • {finding.filePath}:{finding.line || '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <MuteForm
          key={finding.id}
          finding={finding}
          onClose={onClose}
          onConfirmMute={onConfirmMute}
          onConfirmUnmute={onConfirmUnmute}
        />
      </div>
    </div>
  );
};
