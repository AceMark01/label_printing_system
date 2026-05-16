'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { fetchInvoiceData } from '@/lib/data-api';
import { DataTable } from '@/components/data-table';
import { A5PrintLayout } from '@/components/a5-print-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Printer, Box, Loader2, Search, RefreshCw, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Language } from '@/lib/types';

const allLanguages: Language[] = ['en', 'hi', 'od'];

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [labelLanguages, setLabelLanguages] = useState<Set<Language>>(new Set(['hi', 'od']));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [fieldVisibility, setFieldVisibility] = useState<Record<string, Record<Language, { product: boolean, quantity: boolean }>>>({});
  const [bundleOverrides, setBundleOverrides] = useState<Record<string, string>>({});

  const printRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadData = async (pageNum = 1, isSearching = false) => {
    if (pageNum === 1) setLoading(true);
    else setIsFetchingMore(true);
    
    try {
      const result = await fetchInvoiceData(pageNum, 50, searchQuery);
      if (pageNum === 1) {
        setInvoices(result.data);
      } else {
        setInvoices(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const newInvoices = result.data.filter(i => !existingIds.has(i.id));
          return [...prev, ...newInvoices];
        });
      }
      setHasMore(result.meta.page < result.meta.totalPages);
      setPage(pageNum + 1);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoice data');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1, true);
  };

  // Scrolling Pagination Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          loadData(page);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => { if (target) observer.unobserve(target); };
  }, [page, hasMore, loading, isFetchingMore]);

  const selectedInvoiceDetails = useMemo(() => {
    return invoices
      .filter((inv) => selectedIds.has(inv.id))
      .map((inv: any) => ({
        ...inv,
        bdlQty: bundleOverrides[inv.id] !== undefined ? bundleOverrides[inv.id] : inv.bdlQty
      }));
  }, [invoices, selectedIds, bundleOverrides]);

  const handleBundleChange = (id: string, newQty: string) => {
    setBundleOverrides(prev => ({ ...prev, [id]: newQty }));
  };

  const handleVisibilityChange = (id: string, field: 'product' | 'quantity', visible: boolean, lang: Language) => {
    setFieldVisibility(prev => {
      const current = prev[id] || {};
      const hi = current.hi || { product: true, quantity: true };
      const od = current.od || { product: true, quantity: true };
      const en = current.en || { product: true, quantity: true };

      const newVisibility = { hi: { ...hi }, od: { ...od }, en: { ...en } };

      if (lang === 'hi') {
        newVisibility.hi[field] = visible;
        if (field === 'product' && !visible) newVisibility.hi.quantity = false;
      } else if (lang === 'od') {
        newVisibility.od[field] = visible;
        if (field === 'product' && !visible) newVisibility.od.quantity = false;
      } else {
        newVisibility.en[field] = visible;
        if (field === 'product' && !visible) newVisibility.en.quantity = false;
      }

      return { ...prev, [id]: newVisibility };
    });
  };

  const handlePrint = async () => {
    window.print();
    setTimeout(() => setConfirmPrintOpen(true), 500);
  };

  const handleConfirmPrintSuccess = async () => {
    if (selectedIds.size > 0) {
      try {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : { name: 'Unknown User' };
        
        await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'track_printed',
            data: {
              printed_by: user.name,
              print_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              labels: selectedInvoiceDetails.map(l => ({
                id: l.id,
                orderNo: l.orderRef,
                sOrderNoString: l.orderRef || '',
                sOrderDate: l.date || '',
                createdOn: l.date || '',
                itemName: l.item,
                party: l.party,
                remark: l.remark || '',
                qty: l.quantity,
                totalQty: l.totalQty || l.quantity,
                dispatchQty: l.quantity,
                bdlQty: l.bdlQty,
                city: l.city,
                transporter: l.transporter || '',
                invoice: 'invoice',
                originalData: l.originalData
              }))
            }
          }),
        });
        setInvoices(prev => prev.filter(l => !selectedIds.has(l.id)));
        setSelectedIds(new Set());
        setPreviewOpen(false);
        setConfirmPrintOpen(false);
        toast.success('Invoices marked as printed and saved to history');
      } catch (err) {
        console.error('Error tracking printed invoices:', err);
        toast.error('Failed to save history');
      }
    }
  };

  const handleExportPdf = async () => {
    if (selectedInvoiceDetails.length === 0 || !printRef.current) return;
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pages = printRef.current.querySelectorAll('[data-pdf-page]');

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageElement, {
          scale: 4, useCORS: true, logging: false, backgroundColor: '#ffffff',
          width: pageElement.offsetWidth, height: pageElement.offsetHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      pdf.save(`Ace-Invoices-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
      toast.success('PDF generated successfully');
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      toast.error('Error exporting PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sales Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Print labels from invoices</p>
          </div>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200 rounded-md text-sm focus-visible:ring-indigo-500"
              />
            </form>
            <Button 
              onClick={() => loadData(1)} 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 rounded-md border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {selectedIds.size > 0 && (
              <Button
                onClick={() => setPreviewOpen(true)}
                className="h-10 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center gap-2 transition-colors"
              >
                Generate Labels ({selectedIds.size})
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading && invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-bold text-sm">Fetching records...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center px-6">
                <p className="text-slate-500 text-sm font-medium mb-6">{error}</p>
                <Button onClick={() => loadData(1)}>Try Again</Button>
              </div>
            ) : invoices.length > 0 ? (
              <div className="overflow-hidden">
                <DataTable
                  labels={invoices}
                  selectedIds={selectedIds}
                  language="en"
                  onSelectionChange={setSelectedIds}
                />
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                  {isFetchingMore && <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />}
                  {!hasMore && invoices.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">End of records</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-32 text-center">
                <p className="text-xl font-bold text-slate-900 mb-1">No Invoices Found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="print:hidden max-w-[98vw] w-full lg:max-w-[1400px] h-[95vh] rounded-lg p-0 overflow-hidden shadow-xl flex flex-col bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <DialogTitle className="text-lg font-semibold text-slate-900">Print Preview</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="rounded-md">
              <X className="w-5 h-5 text-slate-500" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            <div className="w-full lg:w-[320px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 lg:p-5 flex flex-col gap-4 lg:gap-6 z-10 box-border lg:h-full max-h-[35vh] lg:max-h-full min-h-0">
              <section className="space-y-3 flex-shrink-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Print Languages</h3>
                <div className="flex flex-col gap-2">
                  {allLanguages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        const newLangs = new Set(labelLanguages);
                        if (newLangs.has(lang)) { if (newLangs.size > 1) newLangs.delete(lang); }
                        else { if (newLangs.size < 2) newLangs.add(lang); }
                        setLabelLanguages(newLangs);
                      }}
                      className={cn(
                        "h-10 px-3 rounded-md font-medium text-sm transition-all flex items-center justify-between border",
                        labelLanguages.has(lang) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <span>{lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Oriya'}</span>
                      <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", labelLanguages.has(lang) ? "border-blue-600 bg-blue-600" : "border-slate-300")}>
                        {labelLanguages.has(lang) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex-1" />

              <section className="space-y-3 pt-4 border-t border-slate-100">
                <Button disabled={isExportingPdf} onClick={handleExportPdf} variant="outline" className="w-full justify-start rounded-md h-10">
                  {isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Save PDF
                </Button>
                <Button disabled={isExportingPdf} onClick={handlePrint} className="w-full justify-start rounded-md h-10 bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Now
                </Button>
              </section>
            </div>

            <div className="flex-1 bg-slate-100/50 overflow-y-auto preview-container custom-scrollbar relative p-8">
              <div className="w-[210mm] min-h-[297mm] bg-white mx-auto shadow-xl" ref={printRef}>
                <A5PrintLayout
                  labels={selectedInvoiceDetails}
                  languages={Array.from(labelLanguages)}
                  fieldVisibility={fieldVisibility}
                  onBundleChange={handleBundleChange}
                  onVisibilityChange={handleVisibilityChange}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="hidden print:block print:w-full print:bg-white print:m-0 print:p-0">
        <A5PrintLayout
          labels={selectedInvoiceDetails}
          languages={Array.from(labelLanguages)}
          fieldVisibility={fieldVisibility}
          onBundleChange={handleBundleChange}
          onVisibilityChange={handleVisibilityChange}
        />
      </div>

      <Dialog open={confirmPrintOpen} onOpenChange={setConfirmPrintOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Confirm Print Status</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm pt-2">
              Did you successfully print all {selectedIds.size} labels? Labels will be moved to history after confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button variant="outline" onClick={() => setConfirmPrintOpen(false)} className="flex-1 rounded-md font-medium text-slate-600">
              No, Keep Selected
            </Button>
            <Button onClick={handleConfirmPrintSuccess} className="flex-1 rounded-md font-medium bg-blue-600 hover:bg-blue-700 text-white">
              Yes, Printed Successfully
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
