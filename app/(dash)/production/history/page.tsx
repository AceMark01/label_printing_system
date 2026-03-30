'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Box, X, Search, RefreshCw, Factory, Download, PlusCircle, AlertCircle, Package, History, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProductionHistory() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await fetch(`/api/production?page=${page}&limit=50&q=${encodeURIComponent(searchQuery)}&refresh=${isRefresh}&history=true`);
      const result = await res.json();

      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch history. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
    toast.success('Production history synced');
  };

  return (
    <div className="flex flex-col gap-6 p-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-32">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="w-fit bg-emerald-50 border border-emerald-100 p-3 rounded-2xl shadow-sm flex items-center gap-4 group transition-colors">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Audit Trail</span>
            <div className="flex items-baseline gap-1">
               <span className="text-xl font-black text-emerald-700 leading-none">{total}</span>
               <span className="text-[9px] font-bold text-emerald-600 uppercase">Jobs Done</span>
            </div>
          </div>
          <div className="w-px h-8 bg-emerald-200/50" />
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-xl bg-white hover:bg-emerald-100 text-emerald-600 flex items-center justify-center p-0 transition-all border border-emerald-100"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="flex-1 bg-white border border-slate-200 p-1 rounded-2xl flex items-center group focus-within:border-emerald-200 transition-all shadow-sm">
           <div className="pl-4 pr-3 text-slate-400">
             <Search className="w-4 h-4" />
           </div>
           <input
             type="text"
             placeholder="Search history by code, product or godown..."
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
      </div>

      {/* Main History Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-3 text-center w-16">
                  <History className="w-4 h-4 mx-auto text-slate-400" />
                </th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-28 border-l border-white/5">Order S NO</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-l border-white/5">Product / Code</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-left border-l border-white/5">Location</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-l border-white/5">Qty</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center border-l border-white/5">Completion Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-10 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="space-y-1.5"><div className="h-2.5 bg-slate-100 rounded-full w-12" /><div className="h-4 bg-slate-100 rounded-full w-40" /></div></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-full w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded-full w-10 mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-slate-100 rounded-full w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-2.5 text-center">
                       <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-2.5">
                       <p className="text-sm font-black text-slate-900 text-center tabular-nums">{item.sNo}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{item.productCode}</p>
                        <p className="text-sm font-bold text-slate-700 leading-tight">
                          {item.productName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                        <span className="text-sm font-bold text-slate-600">{item.godown}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm font-black text-slate-400 tabular-nums">
                         {item.pendingQty}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Done</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-10 py-48 text-center text-slate-300 font-bold">
                    No completed jobs found in history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-xl font-bold h-9 px-4 border-slate-200"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl font-bold h-9 px-4 border-slate-200"
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
