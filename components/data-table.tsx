'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/mock-data';
import type { Label, Language } from '@/lib/types';

interface DataTableProps {
  labels: Label[] | undefined;
  selectedIds: Set<string>;
  language: Language;
  onSelectionChange: (ids: Set<string>) => void;
}

export function DataTable({
  labels = [],
  selectedIds,
  language,
  onSelectionChange,
}: DataTableProps) {
  const t = translations[language] || translations['en'];
  const safeLabels = labels || [];

  const handleSelectAll = () => {
    if (selectedIds.size === safeLabels.length && safeLabels.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(safeLabels.map((l) => l.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    onSelectionChange(newIds);
  };

  return (
    <div className="space-y-4">
      {/* Mobile-only Selection Info & Select All */}
      <div className="sm:hidden flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={selectedIds.size > 0 && selectedIds.size === safeLabels.length}
            onCheckedChange={handleSelectAll}
            className="w-5 h-5 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <span className="text-sm font-bold text-blue-900">Select All ({safeLabels.length})</span>
        </label>
        <div className="text-xs font-black text-orange-600 uppercase tracking-tighter">
          {selectedIds.size} Selected
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {safeLabels.length === 0 ? (
          <div className="text-center py-8 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium">
            No labels found
          </div>
        ) : (
          safeLabels.map((label) => (
            <div
              key={label.id}
              onClick={() => handleToggleRow(label.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedIds.has(label.id)
                  ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400'
                  : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white bg-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      {label.originalData?.SOrderNo || label.originalData?.OrderNo || 'NO ID'}
                    </span>
                    <span className="text-xs font-bold text-blue-900">{label.city}</span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {label.party}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 bg-blue-100/50 px-2 py-1 rounded inline-block">
                    {label.item}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Qty</span>
                      <span className="text-base font-black text-blue-900">{label.quantity}</span>
                    </div>
                    {label.bdlQty && (
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Bdl</span>
                        <span className="text-sm font-bold text-green-700">{label.bdlQty}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Checkbox
                  checked={selectedIds.has(label.id)}
                  onCheckedChange={() => handleToggleRow(label.id)}
                  className="w-6 h-6 border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1 shadow-sm"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block border-2 border-blue-200 rounded-xl overflow-hidden bg-card shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-blue-700 bg-blue-600 shadow-sm">
                <th className="px-3 sm:px-4 py-4 text-left">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === safeLabels.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="border-white/50 bg-white/10 data-[state=checked]:bg-white data-[state=checked]:text-blue-600 shadow-inner"
                  />
                </th>
                <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Order No.
                </th>
                <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  City
                </th>
                <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Party
                </th>
                <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Item
                </th>
                <th className="px-3 sm:px-4 py-4 text-right font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Qty
                </th>
                <th className="px-3 sm:px-4 py-4 text-right font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                  Bdl Qty
                </th>
              </tr>
            </thead>
            <tbody>
              {safeLabels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-medium">
                    No labels found
                  </td>
                </tr>
              ) : (
                safeLabels.map((label, idx) => (
                  <tr
                    key={label.id}
                    className={`border-b border-blue-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                      } hover:bg-blue-100/50 cursor-pointer`}
                    onClick={() => handleToggleRow(label.id)}
                  >
                    <td className="px-3 sm:px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(label.id)}
                        onCheckedChange={() => handleToggleRow(label.id)}
                        aria-label={`Select ${label.city}`}
                        className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">
                      {label.originalData?.SOrderNo || label.originalData?.OrderNo || '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-blue-700 font-bold">
                      {label.city}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap">
                      {label.party}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap">
                      {label.item}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-bold text-blue-600">
                      {label.quantity}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-800">
                      {label.bdlQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
