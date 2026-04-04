'use client';

import React, { memo } from 'react';
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

export const DataTable = memo(function DataTable({
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
            className="w-5 h-5 border-indigo-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
          />
          <span className="text-sm font-bold text-indigo-900">Select All ({safeLabels.length})</span>
        </label>
        {selectedIds.size > 0 ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectionChange(new Set())}
            className="h-8 px-3 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition-colors"
          >
            Clear Selected
          </Button>
        ) : (
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">
            {selectedIds.size} Selected
          </div>
        )}
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
              className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedIds.has(label.id)
                  ? 'bg-blue-50 border-blue-400 shadow-md ring-1 ring-blue-400'
                  : 'bg-white border-slate-100 hover:border-blue-200'
                }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      {label.orderRef || 'NO NO.'}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label.godown || 'MAIN'}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">
                    {label.party}
                  </h3>
                </div>
                <Checkbox
                  checked={selectedIds.has(label.id)}
                  onCheckedChange={() => handleToggleRow(label.id)}
                  className="w-6 h-6 border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1 shadow-sm"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4">
                 <p className="text-[10px] font-bold text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-lg inline-block uppercase mb-2">
                   {label.item}
                 </p>
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Balance</span>
                      <div className="flex items-baseline gap-1">
                         <span className="text-xl font-black text-slate-900">{label.quantity}</span>
                         <span className="text-xs font-bold text-slate-400">/ {label.totalQty || label.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">City</span>
                       <p className="text-sm font-black text-slate-700">{label.city || '-'}</p>
                    </div>
                 </div>
              </div>

              {label.remark && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-2">
                   <p className="text-[10px] font-bold text-amber-800 leading-tight italic">"{label.remark}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900 text-white border-b-0 shadow-md relative z-20">
                <th className="px-5 py-4 text-left w-12 rounded-tl-xl">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === safeLabels.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 shadow-sm"
                  />
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Order No
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Godown
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Party Name
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  City
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Product
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Transport
                </th>
                <th className="px-4 py-4 text-center font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">
                  Qty Balance
                </th>
                <th className="px-4 py-4 text-left font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] rounded-tr-xl">
                  Remarks / Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeLabels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No order records found
                  </td>
                </tr>
              ) : (
                safeLabels.map((label, idx) => (
                  <tr
                    key={label.id}
                    className={`transition-colors cursor-pointer group ${
                      selectedIds.has(label.id) ? 'bg-indigo-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    } hover:bg-slate-50`}
                    onClick={() => handleToggleRow(label.id)}
                  >
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(label.id)}
                        onCheckedChange={() => handleToggleRow(label.id)}
                        className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                       <p className="text-[11px] font-black text-slate-900 leading-tight tracking-tight uppercase">
                         {label.orderRef || '-'}
                       </p>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                            {label.godown || 'MAIN'}
                          </span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-black text-slate-900 uppercase leading-none">{label.party}</span>
                    </td>
                    <td className="px-4 py-3">
                       <div className="inline-flex items-center gap-2 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50">
                         <div className="w-1 h-1 rounded-full bg-blue-400" />
                         <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">
                           {label.city || 'LOCAL'}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-black text-slate-700 uppercase leading-none">{label.item}</span>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Ship Via</span>
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100/50 w-fit">
                           {label.transporter || 'DIRECT'}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900 leading-none">
                             {label.quantity}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase">of {label.totalQty || label.quantity}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       {label.remark ? (
                         <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 max-w-[180px]">
                           <p className="text-[10px] font-bold text-amber-800 leading-tight italic line-clamp-2">"{label.remark}"</p>
                         </div>
                       ) : (
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">None</span>
                       )}
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
});
