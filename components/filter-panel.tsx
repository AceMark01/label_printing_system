import React, { useMemo, useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { translations } from '@/lib/mock-data';
import type { Label as LabelType, Language } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  labels: LabelType[] | undefined;
  selectedCities: string[];
  selectedParties: string[];
  selectedItems: string[];
  selectedTransporters: string[];
  searchQuery: string;
  language: Language;
  onCitiesChange: (cities: string[]) => void;
  onPartiesChange: (parties: string[]) => void;
  onItemsChange: (items: string[]) => void;
  onTransportersChange: (transporters: string[]) => void;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
  availableCities?: string[];
  availableParties?: string[];
  availableItems?: string[];
  availableTransporters?: string[];
}

/**
 * Fast O(n) filter using a pre-compiled lowercase search term.
 * Much faster than chained .filter().includes() for large option lists.
 */
function fastFilter(options: string[], term: string): string[] {
  if (!term) return options;
  const lower = term.toLowerCase();
  const result: string[] = [];
  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase().includes(lower)) result.push(options[i]);
  }
  return result;
}

const MultiSelectDropdown = memo(({
  label,
  options,
  selectedValues,
  onValuesChange,
  placeholder
}: {
  label: string;
  options: string[];
  selectedValues: string[];
  onValuesChange: (vals: string[]) => void;
  placeholder: string;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  
  // Local "Draft" state: prevents Parent re-rendering on EVERY checkbox click
  const [draftSelected, setDraftSelected] = useState<Set<string>>(new Set(selectedValues));

  // Sync draft with external state when popover opens
  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) {
      setDraftSelected(new Set(selectedValues));
    } else {
      setSearchTerm('');
    }
  };

  // Fast filter using optimized algorithm
  const filteredOptions = useMemo(
    () => fastFilter(options, searchTerm),
    [options, searchTerm]
  );

  const toggleOption = useCallback(
    (opt: string) => {
      setDraftSelected(prev => {
        const next = new Set(prev);
        if (next.has(opt)) {
          next.delete(opt);
        } else {
          next.add(opt);
        }
        return next;
      });
    },
    []
  );

  const handleApply = () => {
    onValuesChange(Array.from(draftSelected));
    setOpen(false);
  };

  const handleReset = () => {
    setDraftSelected(new Set());
  };

  // Trigger label: show name when 1 selected, count when many
  const triggerLabel = useMemo(() => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selected`;
  }, [selectedValues, placeholder]);

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
        {label}
      </Label>
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-between bg-white border-slate-200 rounded-xl h-11 font-bold text-xs hover:border-slate-300 transition-all text-left shadow-sm',
              selectedValues.length > 0 &&
                'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20'
            )}
          >
            <span
              className="block max-w-[calc(100%-1.5rem)] whitespace-nowrap overflow-hidden text-ellipsis"
              title={triggerLabel}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              className={cn(
                'ml-2 h-3.5 w-3.5 shrink-0 opacity-50 transition-transform',
                open && 'rotate-180'
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[340px] p-0 rounded-xl border-slate-200 shadow-2xl overflow-hidden z-[200] animate-in zoom-in-95 duration-200"
          align="start"
          sideOffset={6}
        >
          {/* Search */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                className="h-10 pl-9 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {draftSelected.size > 0 && (
              <p className="text-[10px] font-bold text-indigo-500 mt-2 px-1">
                {draftSelected.size} item{draftSelected.size > 1 ? 's' : ''} selected (draft)
              </p>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                   key={opt}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     toggleOption(opt);
                   }}
                   className="flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-all group mb-0.5 last:mb-0"
                >
                  <Checkbox
                    checked={draftSelected.has(opt)}
                    className="pointer-events-none border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md shrink-0"
                  />
                  <span
                    className="text-xs text-slate-700 font-bold group-hover:text-blue-700 transition-colors break-words min-w-0 flex-1 leading-snug"
                    title={opt}
                  >
                    {opt}
                  </span>
                  {draftSelected.has(opt) && (
                    <Check className="ml-auto h-3.5 w-3.5 text-blue-600 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[10px] font-bold text-slate-500 px-4 hover:bg-white rounded-lg transition-all"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="h-9 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-lg shadow-sm active:scale-95 transition-all"
              onClick={handleApply}
            >
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

interface FilterPanelProps {
  labels: LabelType[] | undefined;
  selectedCities: string[];
  selectedParties: string[];
  selectedItems: string[];
  selectedTransporters: string[];
  selectedGodowns: string[];
  searchQuery: string;
  language: Language;
  onCitiesChange: (cities: string[]) => void;
  onPartiesChange: (parties: string[]) => void;
  onItemsChange: (items: string[]) => void;
  onTransportersChange: (transporters: string[]) => void;
  onGodownsChange: (godowns: string[]) => void;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
  availableCities?: string[];
  availableParties?: string[];
  availableItems?: string[];
  availableTransporters?: string[];
  availableGodowns?: string[];
}

/**
 * Fast O(n) filter using a pre-compiled lowercase search term.
 */
export const FilterPanel = memo(function FilterPanel({
  labels = [],
  selectedCities = [],
  selectedParties = [],
  selectedItems = [],
  selectedTransporters = [],
  selectedGodowns = [],
  searchQuery = '',
  language,
  onCitiesChange,
  onPartiesChange,
  onItemsChange,
  onTransportersChange,
  onGodownsChange,
  onSearchQueryChange,
  onClearFilters,
  availableCities = [],
  availableParties = [],
  availableItems = [],
  availableTransporters = [],
  availableGodowns = [],
}: FilterPanelProps) {
  const safeLabels = labels || [];

  const cities = useMemo(
    () => availableCities || [...new Set(safeLabels.map((l) => l.city))].sort(),
    [safeLabels, availableCities]
  );

  const parties = useMemo(
    () =>
      availableParties || [
        ...new Set(
          safeLabels
            .filter((l) => selectedCities.length === 0 || selectedCities.includes(l.city))
            .map((l) => l.party)
        ),
      ].sort(),
    [safeLabels, selectedCities, availableParties]
  );

  const items = useMemo(
    () =>
      availableItems || [
        ...new Set(
          safeLabels
            .filter(
              (l) =>
                (selectedCities.length === 0 || selectedCities.includes(l.city)) &&
                (selectedParties.length === 0 || selectedParties.includes(l.party))
            )
            .map((l) => l.item)
        ),
      ].sort(),
    [safeLabels, selectedCities, selectedParties, availableItems]
  );

  const transporters = useMemo(
    () =>
      availableTransporters ||
      ([
        ...new Set(
          safeLabels
            .filter(
              (l) =>
                (selectedCities.length === 0 || selectedCities.includes(l.city)) &&
                (selectedParties.length === 0 || selectedParties.includes(l.party)) &&
                (selectedItems.length === 0 || selectedItems.includes(l.item))
            )
            .map((l) => l.transporter)
            .filter(Boolean)
        ),
      ].sort() as string[]),
    [safeLabels, selectedCities, selectedParties, selectedItems, availableTransporters]
  );

  const godowns = useMemo(
    () => 
      availableGodowns || [
        ...new Set(safeLabels.map((l) => l.godown || 'MAIN'))
      ].sort(),
    [safeLabels, availableGodowns]
  );

  const hasActiveFilters =
    selectedCities.length > 0 ||
    selectedParties.length > 0 ||
    selectedItems.length > 0 ||
    selectedTransporters.length > 0 ||
    selectedGodowns.length > 0 ||
    !!searchQuery;

  return (
    <div className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label
            htmlFor="search-input"
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1"
          >
            Search
          </Label>
          <div className="relative group">
            <Search
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors',
                searchQuery && 'text-blue-500'
              )}
            />
            <Input
              id="search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className={cn(
                'pl-11 pr-10 bg-white border-slate-200 rounded-xl h-11 font-bold text-xs transition-all shadow-sm w-full',
                searchQuery && 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-50 rounded-full transition-colors text-slate-300 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <MultiSelectDropdown
          label="Parties"
          options={parties}
          selectedValues={selectedParties}
          onValuesChange={onPartiesChange}
          placeholder="All Parties"
        />

        <MultiSelectDropdown
          label="Cities"
          options={cities}
          selectedValues={selectedCities}
          onValuesChange={onCitiesChange}
          placeholder="All Cities"
        />

        <MultiSelectDropdown
          label="Products"
          options={items}
          selectedValues={selectedItems}
          onValuesChange={onItemsChange}
          placeholder="All Products"
        />

        <MultiSelectDropdown
          label="Transporters"
          options={transporters}
          selectedValues={selectedTransporters}
          onValuesChange={onTransportersChange}
          placeholder="Any Transport"
        />

        <MultiSelectDropdown
          label="Godowns"
          options={godowns}
          selectedValues={selectedGodowns}
          onValuesChange={onGodownsChange}
          placeholder="All Godowns"
        />

        {/* Clear filters — last column */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 opacity-0 select-none">
            &nbsp;
          </Label>
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className={cn(
              'h-11 w-full rounded-xl font-bold text-xs transition-all border',
              hasActiveFilters
                ? 'text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 shadow-sm active:scale-95'
                : 'text-slate-300 border-slate-100 cursor-not-allowed'
            )}
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
});
