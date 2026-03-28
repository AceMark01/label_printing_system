'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  Clock,
  ExternalLink,
  ChevronRight,
  Package,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import React from 'react';
import { useDebounce } from '@/hooks/use-debounce';

// Memoized row component for buttery smooth list performance
const HistoryRow = React.memo(({ item, onDetail }: { item: any, onDetail: (item: any) => void }) => {
  return (
    <tr className="group hover:bg-white/80 transition-all duration-300 animate-in fade-in ease-in-out">
      <td className="px-10 py-8">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/50 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
              <Package className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-slate-900 leading-none truncate mb-1.5">{item.account_name}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.product_name}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{item.city}</span>
              </div>
           </div>
        </div>
      </td>
      <td className="px-10 py-8">
         <div className="flex flex-col gap-1.5">
            <span className="text-slate-900 font-bold text-base flex items-center gap-2">
               <Calendar className="w-4 h-4 text-blue-500" />
               {new Date(item.created_at || item.s_order_date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
               <Clock className="w-4 h-4" />
               {new Date(item.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
         </div>
      </td>
      <td className="px-10 py-8 text-center">
         <div className="inline-flex flex-col items-center">
            <span className="text-2xl font-black text-slate-900 leading-none">{item.actual_qty}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Qty</span>
         </div>
      </td>
      <td className="px-10 py-8 text-right">
         <div className="flex items-center justify-end gap-3 transition-all transform duration-300">
            {item.pdf && item.pdf !== 'done' && (
              <Button 
                variant="outline" 
                size="icon"
                className="h-11 w-11 rounded-xl bg-white border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm"
                onClick={() => window.open(item.pdf, '_blank')}
              >
                 <Download className="w-4 h-4" />
              </Button>
            )}
            <Button 
              onClick={() => onDetail(item)}
              className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 font-bold transition-all shadow-sm flex items-center gap-2"
            >
               <FileText className="w-4 h-4" />
               Details
            </Button>
         </div>
      </td>
    </tr>
  );
});

HistoryRow.displayName = 'HistoryRow';

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('labels')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        
        if (error) throw error;
        setHistory(data || []);
      } catch (err: any) {
        console.error('Error loading history:', err);
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    if (!debouncedSearch) return history;
    const q = debouncedSearch.toLowerCase().trim();
    return history.filter(item => 
      (item.account_name || '').toLowerCase().includes(q) ||
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q) ||
      (item.order_no || '').toString().toLowerCase().includes(q)
    );
  }, [history, debouncedSearch]);

  const handleShowDetail = useCallback((item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Print History</h1>
          <p className="text-slate-500 font-medium mt-1">Archive of all recently printed and downloaded labels.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search archive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-14 pr-6 rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold shadow-sm"
            />
          </div>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="p-6 border-b border-slate-100 bg-white">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <HistoryIcon className="w-5 h-5 text-indigo-600" />
             </div>
             <div>
               <CardTitle className="text-xl font-bold text-slate-900">Archived Logs</CardTitle>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-0.5">Showing last 200 entries</p>
             </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
               <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
               <p className="text-slate-500 font-bold animate-pulse">Retreiving history archives...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left hidden md:table">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-10 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Order Info</th>
                    <th className="px-10 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-10 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                    <th className="px-10 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((item) => (
                    <HistoryRow key={item.id} item={item} onDetail={handleShowDetail} />
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-50">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="p-6 space-y-4 active:bg-slate-50 transition-colors bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-black text-slate-900 truncate">{item.account_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase whitespace-nowrap">{item.product_name}</span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase whitespace-nowrap">{item.city}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900 leading-none">{item.actual_qty}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Qty</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5 border-r border-slate-100 pr-3">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[11px] font-bold">{new Date(item.created_at || item.s_order_date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">{new Date(item.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleShowDetail(item)}
                        className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                      >
                         <FileText className="w-3.5 h-3.5" />
                         Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-40 text-center px-8 bg-white">
               <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200">
                  <FileText className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">No results found</h3>
               <p className="text-slate-500 font-bold max-w-xs mx-auto">Try adjusting your search criteria or explore your print logs later.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-[2rem] md:rounded-3xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/5">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                </div>
                <div className="min-w-0 pr-8 text-left">
                  <DialogTitle className="text-xl md:text-2xl font-bold truncate">{selectedItem?.account_name}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
                    Label Record Details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6 md:p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <InfoBlock label="Order Number" value={selectedItem?.order_no} icon={<FileText className="w-4 h-4" />} />
            <InfoBlock label="City / Region" value={selectedItem?.city} icon={<ExternalLink className="w-4 h-4" />} />
            <InfoBlock label="Product Item" value={selectedItem?.product_name} icon={<Package className="w-4 h-4" />} />
            <InfoBlock label="Actual Quantity" value={selectedItem?.actual_qty} icon={<ChevronRight className="w-4 h-4" />} />
            <InfoBlock label="Dispatch Bundle" value={selectedItem?.dispatch_bdl_qty} icon={<ChevronRight className="w-4 h-4" />} />
            <InfoBlock label="Employee Name" value={selectedItem?.employee_name} icon={<ChevronRight className="w-4 h-4" />} />
            <InfoBlock label="Transporter" value={selectedItem?.transporter_name} icon={<Loader2 className="w-4 h-4" />} />
            <InfoBlock label="Printed On" value={selectedItem?.created_at ? new Date(selectedItem.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'} icon={<Calendar className="w-4 h-4" />} />
            
            {selectedItem?.remark && (
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks & Notes</p>
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 font-medium italic border border-slate-100 text-sm">
                  "{selectedItem.remark}"
                </div>
              </div>
            )}
          </div>
          
          <div className="p-5 md:p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-end gap-3">
             <Button variant="ghost" onClick={() => setDetailOpen(false)} className="rounded-xl font-bold h-12 order-2 md:order-1 active:scale-95 transition-all">Dismiss</Button>
             <Button 
                onClick={() => {
                  const regenLabel = {
                    ...selectedItem,
                    id: selectedItem.original_data?.id || `regen-${selectedItem.id}`,
                    party: selectedItem.account_name,
                    item: selectedItem.product_name,
                    quantity: selectedItem.actual_qty,
                    bdlQty: selectedItem.dispatch_bdl_qty,
                    transporter: selectedItem.transporter_name,
                    isRegen: true
                  };
                  sessionStorage.setItem('regenerate-label', JSON.stringify(regenLabel));
                  window.location.href = '/orders';
                }}
                className="rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 order-1 md:order-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
             >
                Re-Generate Label
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoBlock({ label, value, icon }: { label: string, value: any, icon: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-1.5 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="text-blue-500/50">{icon}</span>
        {label}
      </p>
      <p className="text-base font-bold text-slate-900 truncate">{value}</p>
    </div>
  );
}
