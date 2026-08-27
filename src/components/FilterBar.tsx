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
  CheckCircle2,
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

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableRules,
  availableTags,
  levelOptions,
}) => {
  // Popover open states
  const [levelOpen, setLevelOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [muteOpen, setMuteOpen] = useState(false);

  // Search filter inputs inside Rule & Tag comboboxes
  const [ruleSearch, setRuleSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  const ruleSearchInputRef = useRef<HTMLInputElement>(null);
  const tagSearchInputRef = useRef<HTMLInputElement>(null);

  const handleRuleOpenChange = (open: boolean) => {
    setRuleOpen(open);
    if (!open) {
      setRuleSearch('');
    } else {
      setTimeout(() => ruleSearchInputRef.current?.focus(), 50);
    }
  };

  const handleTagOpenChange = (open: boolean) => {
    setTagOpen(open);
    if (!open) {
      setTagSearch('');
    } else {
      setTimeout(() => tagSearchInputRef.current?.focus(), 50);
    }
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedLevel !== 'all' ||
    filters.selectedRule !== 'all' ||
    filters.selectedTag !== 'all' ||
    filters.muteStatus !== 'all';

  const baseLevelOptions = levelOptions.filter((opt) => !opt.isOverride);
  const overrideLevelOptions = levelOptions.filter((opt) => opt.isOverride);

  // Filter rules by user search in combobox
  const filteredRules = availableRules.filter(
    (r) =>
      r.id.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(ruleSearch.toLowerCase()))
  );

  // Filter tags by user search in combobox
  const filteredTags = availableTags.filter((t) =>
    t.tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // Helper to get active level label & icon
  const getActiveLevelDisplay = () => {
    if (filters.selectedLevel === 'all') return { label: 'All levels', icon: null };
    if (filters.selectedLevel === 'error')
      return { label: 'Errors', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> };
    if (filters.selectedLevel === 'warning')
      return { label: 'Warnings', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> };
    if (filters.selectedLevel === 'note')
      return { label: 'Notes', icon: <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> };
    if (filters.selectedLevel === 'none')
      return { label: 'None', icon: <CircleSlash className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" /> };
    if (filters.selectedLevel.startsWith('override:')) {
      const tag = filters.selectedLevel.replace('override:', '');
      return { label: `${tag}`, icon: <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> };
    }
    return { label: filters.selectedLevel, icon: null };
  };

  const activeLevel = getActiveLevelDisplay();

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
        {/* Search Input Box */}
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
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              placeholder="Search by rule, message, file path, tag..."
              className="w-full pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 dark:placeholder-zinc-500 shadow-2xs transition-all"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. Level Combobox Popover */}
        <div className="w-full sm:w-48">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
            Level
          </label>
          <Popover.Root open={levelOpen} onOpenChange={setLevelOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
                  filters.selectedLevel !== 'all'
                    ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                    : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {activeLevel.icon}
                  <span className="truncate">{activeLevel.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform ${levelOpen ? 'rotate-180' : ''}`} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={4}
                className="w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 text-xs text-slate-800 dark:text-zinc-200"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Original Levels
                </div>
                <div className="space-y-0.5">
                  {baseLevelOptions.map((opt) => {
                    const isSelected = filters.selectedLevel === opt.value;
                    let icon = null;
                    if (opt.value === 'error') icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
                    if (opt.value === 'warning') icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
                    if (opt.value === 'note') icon = <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
                    if (opt.value === 'none') icon = <CircleSlash className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onFilterChange({ selectedLevel: opt.value });
                          setLevelOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {icon}
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {overrideLevelOptions.length > 0 && (
                  <>
                    <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Overwritten Detail
                    </div>
                    <div className="space-y-0.5">
                      {overrideLevelOptions.map((opt) => {
                        const isSelected = filters.selectedLevel === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onFilterChange({ selectedLevel: opt.value });
                              setLevelOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>{opt.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        {/* 2. Searchable Rule Combobox Popover */}
        <div className="w-full sm:w-56">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
            Rule
          </label>
          <Popover.Root open={ruleOpen} onOpenChange={handleRuleOpenChange}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
                  filters.selectedRule !== 'all'
                    ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                    : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="truncate font-mono">
                  {filters.selectedRule === 'all' ? 'All rules' : filters.selectedRule}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform ${ruleOpen ? 'rotate-180' : ''}`} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={4}
                className="w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-2 z-50 animate-in fade-in-50 zoom-in-95 text-xs text-slate-800 dark:text-zinc-200"
              >
                {/* Search input inside Rule combobox */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    ref={ruleSearchInputRef}
                    type="text"
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    placeholder="Search rules by ID or name..."
                    className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                  />
                  {ruleSearch && (
                    <button
                      type="button"
                      onClick={() => setRuleSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                  {/* Option: All Rules */}
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({ selectedRule: 'all' });
                      setRuleOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                      filters.selectedRule === 'all'
                        ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>All rules</span>
                    {filters.selectedRule === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>

                  {filteredRules.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 dark:text-zinc-500 text-xs">No matching rules</div>
                  ) : (
                    filteredRules.map((rule) => {
                      const isSelected = filters.selectedRule === rule.id;
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => {
                            onFilterChange({ selectedRule: rule.id });
                            setRuleOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer group ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-mono font-medium truncate">{rule.id}</div>
                            {rule.name && rule.name !== rule.id && (
                              <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate group-hover:text-slate-500 dark:group-hover:text-zinc-400">
                                {rule.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded text-[10px] font-mono border border-slate-200 dark:border-zinc-700">
                              {rule.count}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        {/* 3. Searchable Tag Combobox Popover (if tags exist) */}
        {availableTags.length > 0 && (
          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
              Tag
            </label>
            <Popover.Root open={tagOpen} onOpenChange={handleTagOpenChange}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
                    filters.selectedTag !== 'all'
                      ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                      : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                    <span className="truncate">{filters.selectedTag === 'all' ? 'All tags' : filters.selectedTag}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform ${tagOpen ? 'rotate-180' : ''}`} />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={4}
                  className="w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-2 z-50 animate-in fade-in-50 zoom-in-95 text-xs text-slate-800 dark:text-zinc-200"
                >
                  {/* Search input inside Tag combobox */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      ref={tagSearchInputRef}
                      type="text"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      placeholder="Search tags..."
                      className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                    {tagSearch && (
                      <button
                        type="button"
                        onClick={() => setTagSearch('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
                    {/* Option: All Tags */}
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange({ selectedTag: 'all' });
                        setTagOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                        filters.selectedTag === 'all'
                          ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>All tags</span>
                      {filters.selectedTag === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>

                    {filteredTags.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 dark:text-zinc-500 text-xs">No matching tags</div>
                    ) : (
                      filteredTags.map(({ tag, count }) => {
                        const isSelected = filters.selectedTag === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              onFilterChange({ selectedTag: tag });
                              setTagOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate pr-2">
                              <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-blue-500 shrink-0" />
                              <span className="truncate font-mono">{tag}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded text-[10px] font-mono border border-slate-200 dark:border-zinc-700">
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        )}

        {/* 4. Mute Status Combobox Popover */}
        <div className="w-full sm:w-40">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
            Mute Status
          </label>
          <Popover.Root open={muteOpen} onOpenChange={setMuteOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={`w-full py-2 px-3 text-xs flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 border rounded-lg shadow-2xs transition-all cursor-pointer ${
                  filters.muteStatus !== 'all'
                    ? 'border-blue-400 dark:border-zinc-600 bg-blue-50/40 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-medium ring-1 ring-blue-200 dark:ring-zinc-600'
                    : 'border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {filters.muteStatus === 'muted' ? (
                    <BellOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : filters.muteStatus === 'active' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  )}
                  <span className="truncate">
                    {filters.muteStatus === 'all'
                      ? 'All status'
                      : filters.muteStatus === 'active'
                      ? 'Active only'
                      : 'Muted only'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 transition-transform ${muteOpen ? 'rotate-180' : ''}`} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={4}
                className="w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in-50 zoom-in-95 text-xs text-slate-800 dark:text-zinc-200"
              >
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({ muteStatus: 'all' });
                      setMuteOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                      filters.muteStatus === 'all'
                        ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span>All status</span>
                    </div>
                    {filters.muteStatus === 'all' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({ muteStatus: 'active' });
                      setMuteOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                      filters.muteStatus === 'active'
                        ? 'bg-blue-50 dark:bg-zinc-800 text-blue-900 dark:text-zinc-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Active only</span>
                    </div>
                    {filters.muteStatus === 'active' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onFilterChange({ muteStatus: 'muted' });
                      setMuteOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors cursor-pointer ${
                      filters.muteStatus === 'muted'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BellOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Muted only</span>
                    </div>
                    {filters.muteStatus === 'muted' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 active:bg-slate-100 dark:active:bg-zinc-600 border border-slate-300 dark:border-zinc-700 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>Clear filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
