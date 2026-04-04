'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Box, X, Search, RefreshCw, Factory, Download, PlusCircle, AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProductionAllProducts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const router = useRouter();

  const fetchData = useCallback(async (query = '', force = false) => {
    setLoading(true);
    try {
      // Use logic to fetch all data at once with high limit
      const res = await fetch(`/api/production?limit=5000&q=${encodeURIComponent(query)}${force ? '&refresh=true' : ''}`);
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        const filteredData = result.data.filter((item: any) => Number(item.pendingQty || 0) > 0);
        setData(filteredData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching production data:', err);
      setError('Failed to fetch data from the server.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // One-time fetch (or when search query changes)
  useEffect(() => {
    fetchData(searchQuery, true);
  }, [searchQuery, fetchData]);

  const toggleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleGenerateLabels = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one product');
      return;
    }
    const selectedData = data.filter(item => selectedItems.has(item.id));
    localStorage.setItem('selectedProductionItems', JSON.stringify(selectedData));
    router.push('/production/preview');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(searchQuery, true);
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-48">
      {/* Search and Stats Section (Frozen Top) */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pt-6 pb-4 -mt-8 mb-2 -mx-8 px-8 border-b border-slate-200/50 flex flex-col lg:flex-row items-center gap-4 transition-all">
        <div className="w-fit bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-colors">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 leading-none">{data.length}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Items</span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center p-0 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-indigo-600")} />
          </Button>
        </div>

        <div className="flex-1 bg-white border border-slate-200 p-1 rounded-2xl flex items-center group focus-within:border-indigo-200 transition-all shadow-sm">
          <div className="pl-4 pr-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search product code, name or godown..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-300 h-10"
          />
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery('')} className="mr-1 h-8 w-8 rounded-lg text-slate-400 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className={cn(
          "items-center gap-4 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm transition-all duration-500 overflow-hidden",
          selectedItems.size > 0 ? "flex" : "hidden"
        )}>
          <div className="pl-3 pr-2 flex flex-col items-center">
            <span className="text-[10px] font-black text-indigo-600 leading-none tabular-nums">{selectedItems.size}</span>
            <span className="text-[8px] font-black text-slate-400 uppercase">Label Sets</span>
          </div>
          <Button
            onClick={handleGenerateLabels}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-9 px-6 shadow-lg shadow-indigo-100"
          >
            Generate Labels
          </Button>
        </div>
      </div>

      {/* Main Table View (Desktop) */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="px-4 py-2.5 text-center w-16">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-white/30 bg-white/10 text-white focus:ring-white/50 cursor-pointer"
                      checked={data.length > 0 && selectedItems.size === data.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 text-center w-28 border-l border-white/10">Order S NO</th>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 text-left border-l border-white/10">Product / Code</th>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 text-left border-l border-white/10">Location (Godown)</th>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 text-center border-l border-white/10">Pending Qty</th>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 text-center border-l border-white/10">Bundle Breakup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-3.5 h-3.5 bg-slate-100 rounded mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="space-y-1.5"><div className="h-2.5 bg-slate-100 rounded-full w-12" /><div className="h-4 bg-slate-100 rounded-full w-40" /></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-full w-16" /></td>
                    <td className="px-4 py-3"><div className="h-7 bg-slate-100 rounded-full w-10 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-7 bg-slate-100 rounded-full w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-slate-900">Sync Interrupted</p>
                        <p className="text-slate-500 font-bold max-w-sm mx-auto text-[10px]">{error}</p>
                      </div>
                      <Button onClick={handleRefresh} className="rounded-xl h-10 px-6 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200 text-[10px] uppercase tracking-widest">Retry Fetch</Button>
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className={cn(
                    "group transition-all duration-300 cursor-pointer",
                    selectedItems.has(item.id) ? "bg-indigo-50/60" : "hover:bg-slate-50/80"
                  )} onClick={() => toggleSelectItem(item.id)}>
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-transform group-hover:scale-110"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-black text-slate-900 text-center tabular-nums">{item.sNo}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tight opacity-70">{item.productCode}</p>
                        <p className="text-sm font-black text-slate-900 leading-tight">
                          {item.productName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-700">{item.godown}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {Math.round(Number(item.pendingQty || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">{item.bld || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">bld</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">{item.crt || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CRT</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-900">{item.smallCrt || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Small</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-10 py-48 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-32 h-32 rounded-[4rem] bg-slate-50 flex items-center justify-center text-slate-200">
                        <Package className="w-16 h-16" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-slate-300">Work Queue Empty</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Card View (Mobile) */}
      <div className="lg:hidden flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-8 h-8 bg-slate-100 rounded-full" />
              </div>
              <div className="h-6 bg-slate-100 rounded w-full" />
              <div className="h-6 bg-slate-100 rounded w-3/4" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-12 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <p className="text-slate-900 font-black">Something went wrong</p>
            <Button onClick={handleRefresh} size="sm" className="bg-rose-600">Retry</Button>
          </div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-white p-5 rounded-3xl border transition-all duration-300 active:scale-[0.98]",
                selectedItems.has(item.id) ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200"
              )}
              onClick={() => toggleSelectItem(item.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.productCode}</p>
                  <p className="text-sm font-black text-slate-800 leading-tight">{item.productName}</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedItems.has(item.id)}
                  readOnly
                />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Godown</p>
                  <p className="text-xs font-bold text-slate-700">{item.godown}</p>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Order SN</p>
                  <p className="text-xs font-bold text-slate-700">{item.sNo}</p>
                </div>
                <div className="flex-1 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-right">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Pending</p>
                  <p className="text-sm font-black text-indigo-700">{Math.round(Number(item.pendingQty || 0))}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
                <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-black text-slate-900">{item.bld || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">bld</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-black text-slate-900">{item.crt || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CRT</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-black text-slate-900">{item.smallCrt || 0}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Small</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-20 rounded-3xl border border-slate-200 text-center">
            <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-black">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
