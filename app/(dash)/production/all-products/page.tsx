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
    <div className="flex flex-col gap-0 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-48">
      {/* Search and Stats Section (Frozen Top) */}
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md pt-6 pb-4 px-4 sm:px-10 lg:px-12 -mx-4 sm:-mx-10 lg:-mx-12 border-b border-slate-200/60 flex flex-col lg:flex-row items-center gap-4 shadow-sm transition-all">
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

      <div className="hidden lg:block bg-white border-b border-slate-200 shadow-sm overflow-x-auto -mx-4 sm:-mx-10 lg:-mx-12 transition-all duration-500">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 text-center w-16">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                      checked={data.length > 0 && selectedItems.size === data.length}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-20">SN</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-32">Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left min-w-[400px]">Product Details</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-32">Godown</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-28">Total Qty</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-28">Genrated</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-28">Remaining</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center min-w-[300px]">Bundle Breakup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-8 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32 mx-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                        <AlertCircle className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-slate-900 tracking-tight">Sync Interrupted</p>
                        <p className="text-slate-500 font-bold max-w-sm mx-auto text-[10px] uppercase tracking-widest">{error}</p>
                      </div>
                      <Button onClick={handleRefresh} className="rounded-2xl h-12 px-8 font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200 text-[10px] uppercase tracking-widest transition-all active:scale-95">Retry Fetch</Button>
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className={cn(
                    "group transition-all duration-300 cursor-pointer",
                    selectedItems.has(item.id) ? "bg-indigo-50/40" : "hover:bg-slate-50/50"
                  )} onClick={() => toggleSelectItem(item.id)}>
                    <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-transform group-hover:scale-110"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-black text-slate-400 text-center tabular-nums">{item.sNo}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight">
                        {item.productCode}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase">
                        {item.productName}
                       </p>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{item.godown}</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="text-sm font-black text-slate-400 tabular-nums">
                        {Math.round(Number(item.totalQty || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-600 tabular-nums">
                          {Math.round(Number(item.producedQty || 0))}
                        </span>
                        <div className="w-full h-1 bg-emerald-100 rounded-full mt-1 overflow-hidden">
                           <div 
                             className="h-full bg-emerald-500 transition-all duration-1000" 
                             style={{ width: `${Math.min(100, (Number(item.producedQty) / Number(item.totalQty || 1)) * 100)}%` }} 
                           />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl tabular-nums border border-rose-100">
                        {Math.round(Number(item.remainingQty || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-black text-slate-900">{item.bld || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">bld</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100 pl-6">
                          <span className="text-xs font-black text-slate-900">{item.crt || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">CRT</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100 pl-6">
                          <span className="text-xs font-black text-slate-900">{item.smallCrt || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Small</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-10 py-48 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-40 h-40 rounded-[5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                        <Package className="w-20 h-20" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Work Queue Empty</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
      
      {/* Main Card View (Mobile) */}
      <div className="lg:hidden flex flex-col gap-4 px-4 pb-24">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 animate-pulse space-y-4">
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
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <p className="text-slate-900 font-black">Something went wrong</p>
            <Button onClick={handleRefresh} size="sm" className="bg-rose-600 rounded-xl">Retry</Button>
          </div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 active:scale-[0.98] shadow-sm",
                selectedItems.has(item.id) ? "border-indigo-500 bg-indigo-50/30" : "border-slate-100"
              )}
              onClick={() => toggleSelectItem(item.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{item.productCode}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">SN: {item.sNo}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight uppercase">{item.productName}</p>
                </div>
                <input
                  type="checkbox"
                  className="w-6 h-6 rounded-xl border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedItems.has(item.id)}
                  readOnly
                />
              </div>
 
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-sm font-black text-slate-900">{Math.round(Number(item.totalQty || 0))}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100/50">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Genrated</p>
                  <p className="text-sm font-black text-emerald-700">{Math.round(Number(item.producedQty || 0))}</p>
                </div>
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100/50">
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Remain</p>
                  <p className="text-sm font-black text-rose-700">{Math.round(Number(item.remainingQty || 0))}</p>
                </div>
              </div>
 
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase">{item.godown}</span>
                </div>
                <div className="flex gap-2">
                   {['bld', 'crt', 'smallCrt'].map((type) => (
                      <div key={type} className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-900 leading-none">{item[type] || 0}</span>
                        <span className="text-[7px] font-black text-slate-400 uppercase leading-none mt-1">{type.replace('smallCrt', 'Small')}</span>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center">
            <Package className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
