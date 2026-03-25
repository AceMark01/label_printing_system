'use client';

import { useMemo, useState } from 'react';
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
  selectedCities: Set<string>;
  selectedParties: Set<string>;
  selectedItems: Set<string>;
  selectedTransporters: Set<string>;
  searchQuery: string;
  language: Language;
  onCitiesChange: (cities: Set<string>) => void;
  onPartiesChange: (parties: Set<string>) => void;
  onItemsChange: (items: Set<string>) => void;
  onTransportersChange: (transporters: Set<string>) => void;
  onSearchQueryChange: (query: string) => void;
  onClearFilters: () => void;
  availableCities?: string[];
  availableParties?: string[];
  availableItems?: string[];
  availableTransporters?: string[];
  includeProcessed?: boolean;
  onIncludeProcessedChange?: (val: boolean) => void;
}

const MultiSelectDropdown = ({ 
  label, 
  options, 
  selectedValues, 
  onValuesChange, 
  placeholder 
}: { 
  label: string, 
  options: string[], 
  selectedValues: Set<string>, 
  onValuesChange: (vals: Set<string>) => void,
  placeholder: string
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    const next = new Set(selectedValues);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      next.add(opt);
    }
    onValuesChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "w-full justify-between bg-white border-slate-200 rounded-xl h-11 font-bold text-xs hover:border-slate-300 transition-all text-left shadow-sm",
              selectedValues.size > 0 && "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20"
            )}
          >
            <span className="truncate">
              {selectedValues.size === 0 
                ? placeholder 
                : `${selectedValues.size} selected`}
            </span>
            <ChevronDown className={cn("ml-2 h-3.5 w-3.5 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[280px] p-0 rounded-xl border-slate-200 shadow-2xl overflow-hidden z-[100] animate-in zoom-in-95 duration-200" 
          align="start"
        >
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search..." 
                className="h-10 pl-9 text-xs bg-white rounded-xl border-slate-200 focus-visible:ring-blue-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">No results found</div>
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
                    checked={selectedValues.has(opt)}
                    className="pointer-events-none border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                  />
                  <span className="text-xs text-slate-700 font-bold group-hover:text-blue-700 transition-colors truncate">
                    {opt}
                  </span>
                  {selectedValues.has(opt) && <Check className="ml-auto h-3.5 w-3.5 text-blue-600" />}
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 text-[10px] font-bold text-slate-500 px-4 hover:bg-white rounded-lg transition-all"
              onClick={() => {
                onValuesChange(new Set());
                setSearchTerm('');
              }}
            >
              Reset
            </Button>
            <Button 
              size="sm" 
              className="h-9 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-lg shadow-sm active:scale-95 transition-all"
              onClick={() => setOpen(false)}
            >
              Apply Filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export function FilterPanel({
  labels = [],
  selectedCities,
  selectedParties,
  selectedItems,
  selectedTransporters,
  searchQuery,
  language,
  onCitiesChange,
  onPartiesChange,
  onItemsChange,
  onTransportersChange,
  onSearchQueryChange,
  onClearFilters,
  availableCities,
  availableParties,
  availableItems,
  availableTransporters,
  includeProcessed = false,
  onIncludeProcessedChange,
}: FilterPanelProps) {
  const safeLabels = labels || [];
  const t = translations[language] || translations['en'];

  const cities = useMemo(
    () => availableCities || [...new Set(safeLabels.map((l) => l.city))].sort(),
    [safeLabels, availableCities]
  );

  const parties = useMemo(
    () =>
      availableParties || [
        ...new Set(
          safeLabels
            .filter((l) => selectedCities.size === 0 || selectedCities.has(l.city))
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
                (selectedCities.size === 0 || selectedCities.has(l.city)) &&
                (selectedParties.size === 0 || selectedParties.has(l.party))
            )
            .map((l) => l.item)
        ),
      ].sort(),
    [safeLabels, selectedCities, selectedParties, availableItems]
  );

  const transporters = useMemo(
    () =>
      availableTransporters || ([
        ...new Set(
          safeLabels
            .filter(
              (l) =>
                (selectedCities.size === 0 || selectedCities.has(l.city)) &&
                (selectedParties.size === 0 || selectedParties.has(l.party)) &&
                (selectedItems.size === 0 || selectedItems.has(l.item))
            )
            .map((l) => l.transporter)
            .filter(Boolean)
        ),
      ].sort() as string[]),
    [safeLabels, selectedCities, selectedParties, selectedItems, availableTransporters]
  );

  const hasActiveFilters = 
    selectedCities.size > 0 || 
    selectedParties.size > 0 || 
    selectedItems.size > 0 || 
    selectedTransporters.size > 0 || 
    searchQuery;

  return (
    <div className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label htmlFor="search-input" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
            Search
          </Label>
          <div className="relative group">
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors",
              searchQuery && "text-blue-500"
            )} />
            <Input
              id="search-input"
              placeholder="Search party or items..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className={cn(
                "pl-11 pr-10 bg-white border-slate-200 rounded-xl h-11 font-bold text-xs transition-all shadow-sm w-full",
                searchQuery && "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20"
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
          placeholder="Any Transporter"
        />

        {/* Actions unified in grid */}
        <div className="flex items-end gap-3 min-w-0">
          <div 
            className={cn(
              "flex items-center gap-3 px-4 h-11 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group flex-1 min-w-0 justify-center",
              includeProcessed && "bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700"
            )} 
            onClick={() => onIncludeProcessedChange?.(!includeProcessed)}
          >
            <Checkbox 
              id="include-processed"
              checked={includeProcessed}
              onCheckedChange={(checked) => onIncludeProcessedChange?.(checked === true)}
              className={cn(
                "border-slate-300 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 rounded-md shrink-0",
                includeProcessed && "border-white/50"
              )}
            />
            <Label 
              htmlFor="include-processed" 
              className={cn(
                "text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors truncate",
                includeProcessed ? "text-white" : "text-slate-600 group-hover:text-blue-600"
              )}
            >
              Processed
            </Label>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearFilters}
              className="h-11 w-11 shrink-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all shadow-sm border border-slate-100"
              title="Clear All Filters"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
