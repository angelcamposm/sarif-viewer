import React, { useState, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  Search,
  X,
  RotateCcw,
  ChevronDown,
  Check,
  ShieldAlert,
  AlertTriangle,
  Info,
  CircleSlash,
  Tag,
  BellOff,
  SlidersHorizontal,
} from 'lucide-react';
import { FilterState } from '../types/viewer';

export interface LevelOption {
  value: string;
  label: string;
  isOverride?: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  availableRules: Array<{ id: string; name?: string; count: number }>;
  availableTags: Array<{ tag: string; count: number }>;
  levelOptions: LevelOption[];
}

function getActiveLevelDisplay(selectedLevel: string) {
  if (selectedLevel === 'all') return { label: 'All levels', icon: null };
  if (selectedLevel === 'error')
    return { label: 'Errors', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> };
  if (selectedLevel === 'warning')
    return { label: 'Warnings', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> };
  if (selectedLevel === 'note')
    return { label: 'Notes', icon: <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> };
  if (selectedLevel === 'none')
    return { label: 'None', icon: <CircleSlash className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" /> };
  if (selectedLevel.startsWith('override:')) {
    const tag = selectedLevel.replace('override:', '');
    return { label: `${tag}`, icon: <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> };
  }
  return { label: selectedLevel, icon: null };
}

const FilterSearchInput: React.FC<{
  query: string;
  onChange: (q: string) => void;
}> = ({ query, onChange }) => (
  <div className="flex-1">
    <label htmlFor="search-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
      Search Findings
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by rule, message, file path, tag..."
        className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-zinc-500 shadow-2xs transition-all"
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);

const FilterLevelDropdown: React.FC<{
  selectedLevel: string;
  levelOptions: LevelOption[];
  onSelectLevel: (lvl: string) => void;
}> = ({ selectedLevel, levelOptions, onSelectLevel }) => {
  const [open, setOpen] = useState(false);
  const activeLevel = getActiveLevelDisplay(selectedLevel);
  const baseOptions = levelOptions.filter((opt) => !opt.isOverride);
  const overrideOptions = levelOptions.filter((opt) => opt.isOverride);

  return (
    <div className="w-full sm:w-48">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
        Level
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
              selectedLevel !== 'all'
                ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              {activeLevel.icon}
              <span className="truncate">{activeLevel.label}</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-52 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            sideOffset={4}
          >
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2 py-1">
                Standard Levels
              </div>
              {baseOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelectLevel(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedLevel === opt.value
                      ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {getActiveLevelDisplay(opt.value).icon}
                    <span>{opt.label}</span>
                  </span>
                  {selectedLevel === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}

              {overrideOptions.length > 0 && (
                <>
                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2 py-1">
                      Overridden Tag Levels
                    </div>
                  </div>
                  {overrideOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelectLevel(opt.value);
                        setOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedLevel === opt.value
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-purple-500" />
                        <span className="truncate max-w-[140px]">{opt.label}</span>
                      </span>
                      {selectedLevel === opt.value && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

const FilterRuleDropdown: React.FC<{
  selectedRule: string;
  availableRules: Array<{ id: string; name?: string; count: number }>;
  onSelectRule: (rule: string) => void;
}> = ({ selectedRule, availableRules, onSelectRule }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch('');
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const filteredRules = availableRules.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full sm:w-56">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
        Rule
      </label>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
              selectedRule !== 'all'
                ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className="truncate font-mono">
              {selectedRule === 'all' ? 'All rules' : selectedRule}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-2 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            sideOffset={4}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter rules..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectRule('all');
                    setOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedRule === 'all'
                      ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>All rules</span>
                  {selectedRule === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>

                {filteredRules.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => {
                      onSelectRule(rule.id);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      selectedRule === rule.id
                        ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100 font-semibold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-mono text-[11px] font-semibold truncate">{rule.id}</div>
                      {rule.name && (
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{rule.name}</div>
                      )}
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600 dark:text-zinc-400 shrink-0">
                      {rule.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

const FilterTagDropdown: React.FC<{
  selectedTag: string;
  availableTags: Array<{ tag: string; count: number }>;
  onSelectTag: (tag: string) => void;
}> = ({ selectedTag, availableTags, onSelectTag }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch('');
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const filteredTags = availableTags.filter((t) =>
    t.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full sm:w-48">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
        Tag
      </label>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
              selectedTag !== 'all'
                ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{selectedTag === 'all' ? 'All tags' : selectedTag}</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-2 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            sideOffset={4}
          >
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter tags..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTag('all');
                    setOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedTag === 'all'
                      ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>All tags</span>
                  {selectedTag === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>

                {filteredTags.map((t) => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(t.tag);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      selectedTag === t.tag
                        ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-100 font-semibold'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate pr-2 font-mono text-[11px]">{t.tag}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600 dark:text-zinc-400 shrink-0">
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

const FilterMuteDropdown: React.FC<{
  muteStatus: string;
  onSelectMuteStatus: (status: 'all' | 'active' | 'muted') => void;
}> = ({ muteStatus, onSelectMuteStatus }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full sm:w-44">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
        Mute Status
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
              muteStatus !== 'all'
                ? 'border-amber-400 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium ring-1 ring-amber-200 dark:ring-amber-800'
                : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              {muteStatus === 'muted' ? (
                <BellOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate">
                {muteStatus === 'all' ? 'All status' : muteStatus === 'active' ? 'Active only' : 'Muted only'}
              </span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            sideOffset={4}
          >
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All status' },
                { value: 'active', label: 'Active findings' },
                { value: 'muted', label: 'Muted findings' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelectMuteStatus(opt.value as any);
                    setOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    muteStatus === opt.value
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{opt.label}</span>
                  {muteStatus === opt.value && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

const ActiveFilterChips: React.FC<{
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}> = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedLevel !== 'all' ||
    filters.selectedRule !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.muteStatus !== 'all';

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-3 animate-in fade-in duration-150">
      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
        Active Filters:
      </span>

      {filters.searchQuery && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-200 border border-blue-200 dark:border-zinc-700 text-xs">
          <span>Search: "{filters.searchQuery}"</span>
          <button type="button" onClick={() => onFilterChange({ searchQuery: '' })} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.selectedLevel !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-200 border border-blue-200 dark:border-zinc-700 text-xs">
          <span>Level: {getActiveLevelDisplay(filters.selectedLevel).label}</span>
          <button type="button" onClick={() => onFilterChange({ selectedLevel: 'all' })} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.selectedRule !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-200 border border-blue-200 dark:border-zinc-700 text-xs font-mono">
          <span>Rule: {filters.selectedRule}</span>
          <button type="button" onClick={() => onFilterChange({ selectedRule: 'all' })} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.selectedTag !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-zinc-200 border border-blue-200 dark:border-zinc-700 text-xs font-mono">
          <span>Tag: {filters.selectedTag}</span>
          <button type="button" onClick={() => onFilterChange({ selectedTag: 'all' })} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.muteStatus !== 'all' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs">
          <span>Status: {filters.muteStatus === 'active' ? 'Active only' : 'Muted only'}</span>
          <button type="button" onClick={() => onFilterChange({ muteStatus: 'all' })} className="hover:opacity-75 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onClearFilters}
        className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset all</span>
      </button>
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableRules,
  availableTags,
  levelOptions,
}) => (
  <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
    <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
      <FilterSearchInput
        query={filters.searchQuery}
        onChange={(query) => onFilterChange({ searchQuery: query })}
      />

      <FilterLevelDropdown
        selectedLevel={filters.selectedLevel}
        levelOptions={levelOptions}
        onSelectLevel={(selectedLevel) => onFilterChange({ selectedLevel })}
      />

      <FilterRuleDropdown
        selectedRule={filters.selectedRule}
        availableRules={availableRules}
        onSelectRule={(selectedRule) => onFilterChange({ selectedRule })}
      />

      <FilterTagDropdown
        selectedTag={filters.selectedTag}
        availableTags={availableTags}
        onSelectTag={(selectedTag) => onFilterChange({ selectedTag })}
      />

      <FilterMuteDropdown
        muteStatus={filters.muteStatus}
        onSelectMuteStatus={(muteStatus) => onFilterChange({ muteStatus })}
      />
    </div>

    <ActiveFilterChips
      filters={filters}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
    />
  </div>
);
