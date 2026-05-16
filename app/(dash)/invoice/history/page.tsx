'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Download, 
  Calendar, 
  Clock,
  Package,
  Loader2,
  FileText,
  Pencil
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
import { useDebounce } from '@/hooks/use-debounce';
import React from 'react';

const HistoryRow = React.memo(({ item, onDetail }: { item: any, onDetail: (item: any) => void }) => {
  return (
    <tr className="border-b border-slate-100 last:border-0 bg-white hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
        {new Date(item.created_at || item.s_order_date || Date.now()).toLocaleDateString('en-CA')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
        #{item.s_order_no_string || item.order_no || '000000'}
      </td>
      <td className="px-6 py-4 max-w-[200px] truncate text-sm font-semibold text-slate-600">
        {item.product_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0ea5e9]">
        {item.account_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#86efac] text-[#14532d]">
          Completed
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
        {item.actual_qty} QTY
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button className="text-slate-400 hover:text-blue-500 transition-colors" onClick={() => onDetail(item)}>
          <Pencil className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
});

HistoryRow.displayName = 'HistoryRow';

export default function InvoiceHistoryPage() {
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
          .not('invoice', 'is', null)
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
      (item.order_no || '').toString().toLowerCase().includes(q)
    );
  }, [history, debouncedSearch]);

  const handleShowDetail = useCallback((item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoice History</h1>
          <p className="text-sm text-slate-500 mt-1">Archive of all recently printed invoice labels.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search archive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 rounded-md border-slate-200 bg-white focus-visible:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-slate-500 font-semibold text-sm">Loading history...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="w-full">
              <div className="overflow-x-auto rounded-md bg-white border border-slate-200 hidden md:block m-4">
                <table className="w-full text-left border-spacing-0">
                  <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Invoice No</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider">Qty</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <HistoryRow key={item.id} item={item} onDetail={handleShowDetail} />
                  ))}
                </tbody>
              </table>
            </div>

              <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
                {filteredHistory.map((item) => (
                  <div key={item.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-slate-900 truncate">{item.account_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase whitespace-nowrap">{item.product_name}</span>
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase whitespace-nowrap">{item.city}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 leading-none">{item.actual_qty}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase mt-1">Qty</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-medium">{new Date(item.created_at || item.s_order_date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{new Date(item.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm"
                        onClick={() => handleShowDetail(item)}
                        className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
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
            <div className="py-24 text-center px-8 bg-white border-t border-slate-100">
               <div className="w-16 h-16 bg-slate-50 rounded-md flex items-center justify-center mx-auto mb-6 border border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300" />
               </div>
               <h3 className="text-lg font-semibold text-slate-900 mb-1">No results found</h3>
               <p className="text-sm text-slate-500 max-w-xs mx-auto">Try adjusting your search criteria or explore your print logs later.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl w-[95vw] rounded-lg p-0 overflow-hidden border border-slate-200 shadow-xl">
          <div className="bg-slate-50 p-6 border-b border-slate-200 relative overflow-hidden">
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="text-lg font-semibold text-slate-900 truncate">{selectedItem?.account_name}</DialogTitle>
                  <DialogDescription className="text-slate-500 text-xs mt-1">
                    Label Record Details
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <InfoBlock label="Order Number" value={selectedItem?.s_order_no_string || selectedItem?.order_no} icon={<FileText className="w-4 h-4" />} />
            <InfoBlock label="City / Region" value={selectedItem?.city} icon={<Package className="w-4 h-4" />} />
            <InfoBlock label="Product Item" value={selectedItem?.product_name} icon={<Package className="w-4 h-4" />} />
            <InfoBlock label="Actual Quantity" value={selectedItem?.actual_qty} icon={<Package className="w-4 h-4" />} />
            <InfoBlock label="Transporter" value={selectedItem?.transporter_name} icon={<Loader2 className="w-4 h-4" />} />
            <InfoBlock label="Printed By" value={selectedItem?.printed_by} icon={<Package className="w-4 h-4 text-emerald-600" />} />
            <InfoBlock label="Status" value={selectedItem?.processed ? 'Processed' : 'Draft'} icon={<Package className="w-4 h-4 text-emerald-600" />} />
            <InfoBlock label="Printed On" value={selectedItem?.print_time || (selectedItem?.created_at ? new Date(selectedItem.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A')} icon={<Calendar className="w-4 h-4" />} />
            
            {selectedItem?.remark && (
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Remarks & Notes</p>
                <div className="p-3 bg-slate-50 rounded-md text-slate-600 font-medium text-sm border border-slate-200">
                  {selectedItem.remark}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
             <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-md font-medium h-10">Dismiss</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoBlock({ label, value, icon }: { label: string, value: any, icon: any }) {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-1 min-w-0">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}
