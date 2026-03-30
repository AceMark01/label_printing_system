'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Box, X, Search, RefreshCw, Factory, Download, PlusCircle } from 'lucide-react';
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
        setData(result.data);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
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
    <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Factory className="w-8 h-8 text-indigo-600" />
            All Production
          </h1>
          <p className="text-slate-500 font-bold mt-1">Select products to generate production labels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleGenerateLabels}
            disabled={selectedItems.size === 0}
            className="h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Generate Labels ({selectedItems.size})
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-12 w-12 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm flex items-center justify-center p-0 active:scale-90 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Items</p>
          <p className="text-2xl font-black text-slate-900 leading-none">{total}</p>
        </div>
        <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm col-span-3">
           <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${searchQuery ? 'text-indigo-500' : 'text-slate-400'}`}>
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search by Product Code, Name or Godown..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 h-4" />
                </button>
              )}
           </div>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-center w-14">
                    <input 
                       type="checkbox" 
                       className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                       checked={data.length > 0 && selectedItems.size === data.length}
                       onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">S NO</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Code</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Godown</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pending Qty</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center uppercase">Bundle Information</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-8 mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-24" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-48" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-12 mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-48 mx-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-600">
                          <Box className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900">Sheet Sync Failed</p>
                          <p className="text-slate-500 font-bold">{error}</p>
                        </div>
                        <Button onClick={handleRefresh} variant="outline" className="mt-2 rounded-xl px-8 font-bold text-red-600 border-red-200 hover:bg-red-50">Retry Connection</Button>
                      </div>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id} className={cn(
                        "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                        selectedItems.has(item.id) && "bg-indigo-50/20"
                    )} onClick={() => toggleSelectItem(item.id)}>
                      <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                           checked={selectedItems.has(item.id)}
                           onChange={() => toggleSelectItem(item.id)}
                        />
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-400 text-center">{item.sNo}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black ring-1 ring-inset ring-indigo-700/10 uppercase tracking-tighter">
                          {item.productCode}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-900">{item.productName}</td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-600">{item.godown}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                           {item.pendingQty}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <div className="flex flex-col items-center">
                                <span className="text-slate-900 border-b border-slate-200 pb-0.5">{item.bld || 0}</span>
                                <span>bld</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className="text-slate-900 border-b border-slate-200 pb-0.5">{item.crt || 0}</span>
                                <span>CRT</span>
                             </div>
                             <div className="flex flex-col items-center">
                                <span className="text-slate-900 border-b border-slate-200 pb-0.5">{item.smallCrt || 0}</span>
                                <span>Small</span>
                             </div>
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr>
                    <td colSpan={7} className="px-6 py-32 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                            <Box className="w-10 h-10" />
                          </div>
                          <p className="text-xl font-black text-slate-400">No Production Records Found</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && !error && data.length > 0 && (
            <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {data.length} of {total} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-lg font-bold border-slate-200 text-slate-600 h-9"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1.5 px-4 font-black text-sm text-slate-900">
                  <span className="text-indigo-600">{page}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-500">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-lg font-bold border-slate-200 text-slate-600 h-9"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
