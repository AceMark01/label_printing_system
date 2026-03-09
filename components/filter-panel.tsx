'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translations } from '@/lib/mock-data';
import type { Label as LabelType, Language } from '@/lib/types';

interface FilterPanelProps {
  labels: LabelType[] | undefined;
  selectedCity: string | null;
  selectedParty: string | null;
  selectedItem: string | null;
  language: Language;
  onCityChange: (city: string | null) => void;
  onPartyChange: (party: string | null) => void;
  onItemChange: (item: string | null) => void;
  onClearFilters: () => void;
}

export function FilterPanel({
  labels = [],
  selectedCity,
  selectedParty,
  selectedItem,
  language,
  onCityChange,
  onPartyChange,
  onItemChange,
  onClearFilters,
}: FilterPanelProps) {
  const safeLabels = labels || [];
  const t = translations[language] || translations['en'];

  const cities = useMemo(
    () => [...new Set(safeLabels.map((l) => l.city))].sort(),
    [safeLabels]
  );

  const parties = useMemo(
    () =>
      [
        ...new Set(
          safeLabels
            .filter((l) => !selectedCity || l.city === selectedCity)
            .map((l) => l.party)
        ),
      ].sort(),
    [safeLabels, selectedCity]
  );

  const items = useMemo(
    () =>
      [
        ...new Set(
          safeLabels
            .filter(
              (l) =>
                (!selectedCity || l.city === selectedCity) &&
                (!selectedParty || l.party === selectedParty)
            )
            .map((l) => l.item)
        ),
      ].sort(),
    [safeLabels, selectedCity, selectedParty]
  );

  const hasActiveFilters = selectedCity || selectedParty || selectedItem;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5">
        <div className="space-y-2.5">
          <Label htmlFor="city-select" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">
            {t.filterByCity}
          </Label>
          <Select value={selectedCity || 'all-cities'} onValueChange={(value) => onCityChange(value === 'all-cities' ? null : value)}>
            <SelectTrigger id="city-select" className="bg-blue-50/50 border-blue-100 focus:ring-blue-500 rounded-xl h-11 font-medium">
              <SelectValue placeholder={t.city} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-blue-100 shadow-xl overflow-hidden">
              <SelectItem value="all-cities" className="font-bold text-blue-700">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} className="cursor-pointer">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="party-select" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">
            {t.filterByParty}
          </Label>
          <Select value={selectedParty || 'all-parties'} onValueChange={(value) => onPartyChange(value === 'all-parties' ? null : value)}>
            <SelectTrigger id="party-select" className="bg-blue-50/50 border-blue-100 focus:ring-blue-500 rounded-xl h-11 font-medium">
              <SelectValue placeholder={t.party} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-blue-100 shadow-xl overflow-hidden">
              <SelectItem value="all-parties" className="font-bold text-blue-700">All Parties</SelectItem>
              {parties.map((party) => (
                <SelectItem key={party} value={party} className="cursor-pointer">
                  {party}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="item-select" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">
            {t.filterByItem}
          </Label>
          <Select value={selectedItem || 'all-items'} onValueChange={(value) => onItemChange(value === 'all-items' ? null : value)}>
            <SelectTrigger id="item-select" className="bg-blue-50/50 border-blue-100 focus:ring-blue-500 rounded-xl h-11 font-medium">
              <SelectValue placeholder={t.item} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-blue-100 shadow-xl overflow-hidden">
              <SelectItem value="all-items" className="font-bold text-blue-700">All Items</SelectItem>
              {items.map((item) => (
                <SelectItem key={item} value={item} className="cursor-pointer">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
