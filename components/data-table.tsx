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
    <div className="border-2 border-blue-200 rounded-xl overflow-x-auto bg-card shadow-md">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-blue-700 bg-blue-600 shadow-sm">
            <th className="px-3 sm:px-4 py-4 text-left">
              <Checkbox
                checked={selectedIds.size > 0 && selectedIds.size === safeLabels.length}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className="border-blue-200 data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
              />
            </th>
            <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              Order No.
            </th>
            <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              City
            </th>
            <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hidden sm:table-cell">
              Party
            </th>
            <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hidden md:table-cell">
              Item
            </th>
            <th className="px-3 sm:px-4 py-4 text-right font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em]">
              Qty
            </th>
            <th className="px-3 sm:px-4 py-4 text-right font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hidden lg:table-cell">
              Bdl Qty
            </th>
            <th className="px-3 sm:px-4 py-4 text-left font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hidden lg:table-cell">
              Remark
            </th>
          </tr>
        </thead>
        <tbody>
          {safeLabels.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-medium">
                No labels found
              </td>
            </tr>
          ) : (
            safeLabels.map((label, idx) => (
              <tr
                key={label.id}
                className={`border-b border-blue-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                  } hover:bg-blue-100/50`}
              >
                <td className="px-3 sm:px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(label.id)}
                    onCheckedChange={() => handleToggleRow(label.id)}
                    aria-label={`Select ${label.city}`}
                  />
                </td>
                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">
                  {label.originalData?.SOrderNo || label.originalData?.OrderNo || '-'}
                </td>
                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-blue-700 font-bold">
                  {label.city}
                </td>
                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 hidden sm:table-cell whitespace-pre-wrap">
                  {label.party}
                </td>
                <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-800 hidden md:table-cell whitespace-pre-wrap">
                  {label.item}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-bold text-blue-600">
                  {label.quantity}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-800 hidden lg:table-cell">
                  {label.bdlQty}
                </td>
                <td className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm text-gray-600 hidden lg:table-cell italic truncate max-w-[150px]">
                  {label.remark}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
