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
  // New props for remote filter options
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
    <div className="space-y-2.5">
      <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-blue-50/50 border-blue-100 focus:ring-blue-500 rounded-xl h-11 font-medium hover:bg-blue-100/50 text-left"
          >
            <span className="truncate">
              {selectedValues.size === 0 
                ? placeholder 
                : `${selectedValues.size} selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-blue-100 shadow-xl overflow-hidden z-[100]" 
          align="start"
          onInteractOutside={(e) => {
            // Optional: can prevent closing here if needed, but 'open' state is already controlled
          }}
        >
          <div className="p-2 border-b border-blue-50 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                placeholder="Search..." 
                className="h-8 pl-8 text-xs bg-white rounded-lg border-blue-50 focus-visible:ring-blue-500" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div 
                  key={opt}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleOption(opt);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group"
                >
                  <Checkbox 
                    checked={selectedValues.has(opt)}
                    className="pointer-events-none border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <span className="text-sm text-slate-700 font-medium group-hover:text-blue-700 transition-colors truncate">
                    {opt}
                  </span>
                  {selectedValues.has(opt) && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-blue-50 bg-slate-50 flex justify-between gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] font-bold text-slate-500 px-2"
              onClick={() => onValuesChange(new Set())}
            >
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-bold text-blue-600 px-1">
                {selectedValues.size} Selected
              </div>
              <Button 
                size="sm" 
                className="h-7 text-[10px] bg-blue-600 font-bold px-3 rounded-lg"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5">
        <div className="space-y-2.5">
          <Label htmlFor="search-input" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">
            Search Party / Item
          </Label>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              id="search-input"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10 pr-10 bg-blue-50/50 border-blue-100 focus:ring-blue-500 rounded-xl h-11 font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <MultiSelectDropdown 
          label={t.filterByCity}
          options={cities}
          selectedValues={selectedCities}
          onValuesChange={onCitiesChange}
          placeholder={t.city}
        />

        <MultiSelectDropdown 
          label={t.filterByParty}
          options={parties}
          selectedValues={selectedParties}
          onValuesChange={onPartiesChange}
          placeholder={t.party}
        />

        <MultiSelectDropdown 
          label={t.filterByItem}
          options={items}
          selectedValues={selectedItems}
          onValuesChange={onItemsChange}
          placeholder={t.item}
        />

        <MultiSelectDropdown 
          label="Filter By Transporter"
          options={transporters}
          selectedValues={selectedTransporters}
          onValuesChange={onTransportersChange}
          placeholder="Transporter"
        />

        <div className="flex items-center gap-2.5 p-3 bg-blue-50/30 rounded-xl border border-blue-100/50 hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => onIncludeProcessedChange?.(!includeProcessed)}>
          <Checkbox 
            id="include-processed"
            checked={includeProcessed}
            onCheckedChange={(checked) => onIncludeProcessedChange?.(checked === true)}
            className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <div className="flex flex-col">
            <Label htmlFor="include-processed" className="text-xs font-bold text-slate-700 cursor-pointer">
              Show Processed Records
            </Label>
            <span className="text-[9px] font-medium text-slate-400">Include historical/completed data</span>
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold transition-all mt-2"
          >
            × {t.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}

