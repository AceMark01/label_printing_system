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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const router = useRouter();

  const fetchData = useCallback(async (p = 1, query = '', force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production?page=${p}&q=${encodeURIComponent(query)}${force ? '&refresh=true' : ''}`);
      const result = await res.json();
      if (result.error) {
        setError(result.error);
      } else {
        // Filter out negative or zero pending quantities
        const filteredData = result.data.filter((item: any) => Number(item.pendingQty || 0) > 0);
        setData(filteredData);
        setTotalPages(result.meta.totalPages);
        setTotal(filteredData.length); // Update total count to match filtered view
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

  useEffect(() => {
    // Initial fetch with forced refresh to ensure fresh data after script updates
    fetchData(page, searchQuery, true);

    // Refresh data when window gains focus 
    const handleFocus = () => {
      fetchData(page, searchQuery, true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [page, searchQuery, fetchData]);

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
    fetchData(page, searchQuery, true);
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-32">
      {/* Search and Stats Section (Frozen Top) */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pt-6 pb-4 -mt-8 mb-2 -mx-8 px-8 border-b border-slate-200/50 flex flex-col lg:flex-row items-center gap-4 transition-all">
        <div className="w-fit bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-colors">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Queue</span>
            <div className="flex items-baseline gap-1">
               <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
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

      {/* Main Table View */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
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
                         {item.pendingQty}
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
        
        {/* Pagination Professional */}
        {!loading && !error && data.length > 0 && (
          <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              Showing <span className="text-slate-900">{data.length}</span> of <span className="text-slate-900">{total}</span> High-Priority Records
            </p>
            <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-xl font-bold text-slate-400 hover:text-indigo-600 h-10 px-6 transition-all"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-6 font-black text-base border-x border-slate-50">
                <span className="text-indigo-600 tabular-nums">{page}</span>
                <span className="text-slate-200">/</span>
                <span className="text-slate-400 tabular-nums">{totalPages}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-xl font-bold text-slate-400 hover:text-indigo-600 h-10 px-6 transition-all"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
