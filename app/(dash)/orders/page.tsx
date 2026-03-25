'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { fetchTicTakData, fetchFilterData } from '@/lib/google-sheets';
import { FilterPanel } from '@/components/filter-panel';
import { DataTable } from '@/components/data-table';
import { A5PrintLayout } from '@/components/a5-print-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Download, Printer, Box, Loader2, Filter, SlidersHorizontal, ArrowRight, X } from 'lucide-react';
import type { Language } from '@/lib/types';
import { toast } from 'sonner';

const allLanguages: Language[] = ['en', 'hi', 'od'];

export default function OrdersPage() {
  const [labels, setLabels] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [printingLabel, setPrintingLabel] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedTransporters, setSelectedTransporters] = useState<Set<string>>(new Set());
  const [availableFilters, setAvailableFilters] = useState<{
    cities: string[];
    parties: string[];
    items: string[];
    transporters: string[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [includeProcessed, setIncludeProcessed] = useState(false);
  const [labelLanguages, setLabelLanguages] = useState<Set<Language>>(new Set(['hi', 'od']));
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, Record<Language, { product: boolean, quantity: boolean }>>>({});
  const [bundleOverrides, setBundleOverrides] = useState<Record<string, string>>({});
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmPrintOpen, setConfirmPrintOpen] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [paginated, filters] = await Promise.all([
          fetchTicTakData(1, 50, { includeProcessed }),
          fetchFilterData(includeProcessed)
        ]);
        
        setLabels(paginated.data);
        setAvailableFilters(filters);
        setHasMore(paginated.meta.page < paginated.meta.totalPages);
        setPage(2);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Something went wrong while fetching data.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [includeProcessed]);

  // Fetch more logic
  const fetchMoreData = useCallback(async () => {
    if (isFetchingMore || !hasMore || loading) return;
    setIsFetchingMore(true);
    try {
      const filters = {
        cities: Array.from(selectedCities),
        parties: Array.from(selectedParties),
        items: Array.from(selectedItems),
        transporters: Array.from(selectedTransporters),
        q: searchQuery,
        includeProcessed
      };
      const paginated = await fetchTicTakData(page, 50, filters);
      if (paginated.data && paginated.data.length > 0) {
        setLabels(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newUniqueLabels = paginated.data.filter(l => !existingIds.has(l.id));
          return [...prev, ...newUniqueLabels];
        });
        setHasMore(paginated.meta.page < paginated.meta.totalPages);
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Error fetching more:', err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, isFetchingMore, hasMore, loading, includeProcessed, selectedCities, selectedParties, selectedItems, selectedTransporters, searchQuery]);

  // Setup intersection observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          fetchMoreData();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, fetchMoreData]);

  // Effect to handle filter changes
  useEffect(() => {
    let isMounted = true;
    async function applyFilters() {
      if (loading && labels.length === 0) return;
      setLoading(true);
      setLabels([]);
      setPage(1);
      try {
        const filters = {
          cities: Array.from(selectedCities),
          parties: Array.from(selectedParties),
          items: Array.from(selectedItems),
          transporters: Array.from(selectedTransporters),
          q: searchQuery,
          includeProcessed
        };
        const paginated = await fetchTicTakData(1, 50, filters);
        if (isMounted) {
          setLabels(paginated.data);
          setHasMore(paginated.meta.page < paginated.meta.totalPages);
          setPage(2);
        }
      } catch (err: any) {
        console.error('Error applying filters:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    const timer = setTimeout(applyFilters, 300);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [selectedCities, selectedParties, selectedItems, selectedTransporters, searchQuery, includeProcessed]);

  // Handle Re-generation from history
  useEffect(() => {
    const regenData = sessionStorage.getItem('regenerate-label');
    if (regenData) {
      try {
        const item = JSON.parse(regenData);
        if (item && item.id) {
          // Add to labels if not already there
          setLabels(prev => {
            if (prev.find(l => l.id === item.id)) return prev;
            return [item, ...prev];
          });
          // Select it and open preview
          setSelectedLabels(new Set([item.id]));
          setPreviewOpen(true);
          sessionStorage.removeItem('regenerate-label');
          toast.success('Reprinting label from history');
        }
      } catch (e) {
        console.error('Failed to parse regeneration data:', e);
      }
    }
  }, []);

  const selectedLabelDetails = useMemo(() => {
    return labels
      .filter((label) => selectedLabels.has(label.id))
      .map(label => ({
        ...label,
        bdlQty: bundleOverrides[label.id] !== undefined ? bundleOverrides[label.id] : label.bdlQty
      }));
  }, [labels, selectedLabels, bundleOverrides]);

  const handleClearFilters = () => {
    setSelectedCities(new Set());
    setSelectedParties(new Set());
    setSelectedItems(new Set());
    setSelectedTransporters(new Set());
    setSearchQuery('');
  };

  const handleBundleChange = (id: string, newQty: string) => {
    setBundleOverrides(prev => ({
      ...prev,
      [id]: newQty
    }));
  };

  const handleVisibilityChange = (id: string, field: 'product' | 'quantity', visible: boolean, lang: Language) => {
    setFieldVisibility(prev => {
      const current = prev[id] || {};
      const hi = current.hi || { product: true, quantity: true };
      const od = current.od || { product: true, quantity: true };
      const en = current.en || { product: true, quantity: true };
      
      const newVisibility = { 
        hi: { ...hi }, 
        od: { ...od },
        en: { ...en }
      };

      // Update the specific language field
      if (lang === 'hi') {
        newVisibility.hi[field] = visible;
        // Only auto-uncheck quantity if product is newly unchecked, 
        // but allow checking quantity back individually
        if (field === 'product' && !visible) newVisibility.hi.quantity = false;
      } else if (lang === 'od') {
        newVisibility.od[field] = visible;
        if (field === 'product' && !visible) newVisibility.od.quantity = false;
      } else {
        newVisibility.en[field] = visible;
        if (field === 'product' && !visible) newVisibility.en.quantity = false;
      }

      return {
        ...prev,
        [id]: newVisibility
      };
    });
  };

  const handlePrint = async () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    // Open the system print dialog
    window.print();
    
    // After the print dialog closes, ask if it was successful
    // We can't know if they clicked print or cancel, so we must ask
    setTimeout(() => {
      setConfirmPrintOpen(true);
    }, 500);
  };

  const handleConfirmPrintSuccess = async () => {
    if (selectedLabels.size > 0) {
      try {
        await fetch('/api/master', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'track_printed', 
            data: { 
              labels: selectedLabelDetails.map(l => ({
                id: l.id,
                orderNo: l.originalData?.OrderNo || l.originalData?.SOrderNo || l.id.split('-')[0],
                sOrderNoString: l.originalData?.SOrderNoString || '',
                sOrderDate: l.date || l.originalData?.SOrderDate || '',
                createdOn: l.originalData?.CreatedOn || '',
                itemName: l.item,
                party: l.party,
                remark: l.remark || '',
                qty: l.quantity,
                dispatchQty: l.quantity,
                bdlQty: l.bdlQty,
                sOrderNo: l.originalData?.SOrderNo || '',
                sOrderDetailId: l.originalData?.SOrderDetailId || '',
                sOrderId: l.originalData?.SOrderId || '',
                employeeName: l.originalData?.EmployeeName || '',
                city: l.city,
                transporter: l.transporter || '',
                originalData: l
              }))
            } 
          }),
        });
        setLabels(prev => prev.filter(l => !selectedLabels.has(l.id)));
        setSelectedLabels(new Set());
        setPreviewOpen(false);
        setConfirmPrintOpen(false);
        toast.success('Labels marked as printed and saved to history');
      } catch (err) {
        console.error('Error tracking printed labels:', err);
        toast.error('Failed to save history, but labels remain selected');
      }
    }
  };

  const handleExportPdf = async () => {
    if (selectedLabelDetails.length === 0 || !printRef.current) return;
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: true
      });

      const pages = printRef.current.querySelectorAll('[data-pdf-page]');
      
      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageElement, {
          scale: 4,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: pageElement.offsetWidth,
          height: pageElement.offsetHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      const pdfName = `Ace-Labels-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`;
      pdf.save(pdfName);
      
      await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'track_printed', 
          data: { 
            labels: selectedLabelDetails,
            pdf: pdfName 
          } 
        }),
      });
      setLabels(prev => prev.filter(l => !selectedLabels.has(l.id)));
      setSelectedLabels(new Set());
      setPreviewOpen(false);
      toast.success('PDF generated and saved to history');
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      toast.error('Error exporting PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Orders Master</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and generate labels for your product inventory.</p>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <div className="bg-white px-5 py-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="relative">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-600 relative" />
            </div>
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{selectedLabels.size} Labels Selected</span>
          </div>
          {selectedLabels.size > 0 && (
            <Button 
                onClick={() => setPreviewOpen(true)}
                className="h-11 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold text-sm flex items-center gap-2 active:scale-95 transition-all animate-in zoom-in duration-300"
            >
                Generate Labels
                <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Horizontal Filter Bar at the Top */}
        <FilterPanel
          labels={labels}
          selectedCities={selectedCities}
          selectedParties={selectedParties}
          selectedItems={selectedItems}
          selectedTransporters={selectedTransporters}
          searchQuery={searchQuery}
          language="en"
          onCitiesChange={setSelectedCities}
          onPartiesChange={setSelectedParties}
          onItemsChange={setSelectedItems}
          onTransportersChange={setSelectedTransporters}
          onSearchQueryChange={setSearchQuery}
          onClearFilters={handleClearFilters}
          availableCities={availableFilters?.cities}
          availableParties={availableFilters?.parties}
          availableItems={availableFilters?.items}
          availableTransporters={availableFilters?.transporters}
          includeProcessed={includeProcessed}
          onIncludeProcessedChange={setIncludeProcessed}
        />

        {/* Full-Width Data Table */}
        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-0">
            {loading && labels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-48 space-y-8">
                <div className="relative">
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-50 animate-pulse" />
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin absolute top-6 left-6" />
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900 mb-2">Synchronizing Storefront</p>
                    <p className="text-slate-500 font-bold">Please wait while we fetch the latest order records...</p>
                </div>
                </div>
            ) : error ? (
                <div className="text-center py-40 px-8">
                <div className="w-32 h-32 bg-red-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Box className="w-16 h-16 text-red-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Backend Unavailable</h3>
                <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto text-lg leading-relaxed">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="rounded-[1.5rem] border-red-200 text-red-600 h-16 px-12 font-bold text-lg hover:bg-red-50 transition-all shadow-xl shadow-red-500/10 active:scale-95">
                    Recover Connection
                </Button>
                </div>
            ) : labels.length > 0 ? (
                <div className="overflow-hidden">
                <DataTable
                    labels={labels}
                    selectedIds={selectedLabels}
                    language="en"
                    onSelectionChange={setSelectedLabels}
                />
                <div ref={observerTarget} className="h-40 flex items-center justify-center border-t border-slate-50/50 bg-slate-50/10">
                    {isFetchingMore && (
                        <div className="flex items-center gap-4 text-indigo-600 font-bold bg-white px-8 py-4 rounded-xl shadow-lg border border-slate-100">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Fetching records...
                        </div>
                    )}
                    {!hasMore && labels.length > 0 && (
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">Inventory sync complete — END OF RECORDS</div>
                    )}
                </div>
                </div>
            ) : (
                <div className="py-56 text-center">
                <div className="w-40 h-40 bg-slate-50 rounded-[3.5rem] flex items-center justify-center mx-auto mb-10 relative">
                     <Box className="w-20 h-20 text-slate-200" />
                     <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                        <X className="w-6 h-6 text-red-400" />
                     </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-2">No Matching Data</p>
                <p className="text-slate-500 font-bold text-lg">Try adjusting your filters or clearing the search query.</p>
                <Button onClick={handleClearFilters} variant="ghost" className="mt-8 font-bold text-blue-600 hover:bg-blue-50 rounded-xl px-8 h-12">Clear Active Filters</Button>
                </div>
            )}
            </CardContent>
        </Card>
      </div>



      {/* PREVIEW MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="print:hidden max-w-[98vw] w-full lg:max-w-[1400px] h-[95vh] rounded-xl p-0 overflow-hidden shadow-2xl flex flex-col bg-slate-50 border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Print Preview</DialogTitle>
                <DialogDescription className="sr-only">Preview and configure your labels before printing.</DialogDescription>
                <p className="font-medium text-slate-500 text-sm mt-0.5 flex items-center gap-2">
                  Ready to print {selectedLabels.size} labels
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)} className="rounded-lg hover:bg-slate-100 w-10 h-10">
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
                        if (newLangs.has(lang)) {
                          if (newLangs.size > 1) newLangs.delete(lang);
                        } else {
                          if (newLangs.size < 2) newLangs.add(lang);
                        }
                        setLabelLanguages(newLangs);
                      }}
                      className={cn(
                        "h-10 px-3 rounded-md font-medium text-sm transition-all flex items-center justify-between border",
                        labelLanguages.has(lang) 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <span>{lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Oriya'}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        labelLanguages.has(lang) ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      )}>
                        {labelLanguages.has(lang) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3 flex-1 overflow-hidden flex flex-col min-h-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-shrink-0">Selected Orders ({selectedLabelDetails.length})</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {selectedLabelDetails.map((label: any) => (
                    <div key={label.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-medium text-slate-900 text-sm line-clamp-1 flex-1">{label.party || 'Unknown Party'}</div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Bdl:</span>
                          <input 
                            type="text" 
                            value={label.bdlQty || ''} 
                            onChange={(e) => {
                              const value = e.target.value;
                              setBundleOverrides(prev => ({
                                ...prev,
                                [label.id]: value
                              }));
                            }}
                            className="w-10 text-xs font-bold text-blue-600 focus:outline-none bg-transparent text-right"
                            placeholder="Qty"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 text-xs border-t border-slate-100 pt-2">
                        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            checked={labelLanguages.has('hi') ? (fieldVisibility[label.id]?.hi?.product !== false) : true}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldVisibility(prev => {
                                const current = prev[label.id] || {};
                                const hi = current.hi || { product: true, quantity: true };
                                const od = current.od || { product: true, quantity: true };
                                return {
                                  ...prev,
                                  [label.id]: {
                                    hi: { ...hi, product: checked, quantity: checked ? hi.quantity : false },
                                    od: { ...od, product: checked, quantity: checked ? od.quantity : false }
                                  }
                                };
                              });
                            }}
                          />
                          <span>Prod</span>
                        </label>

                        <label className={`flex items-center gap-1.5 cursor-pointer hover:text-slate-900 transition-colors ${(labelLanguages.has('hi') ? fieldVisibility[label.id]?.hi?.product === false : false) ? 'opacity-40 pointer-events-none' : ''}`}>
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            checked={labelLanguages.has('hi') ? (fieldVisibility[label.id]?.hi?.quantity !== false) : true}
                            disabled={labelLanguages.has('hi') ? fieldVisibility[label.id]?.hi?.product === false : false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFieldVisibility(prev => {
                                const current = prev[label.id] || {};
                                const hi = current.hi || { product: true, quantity: true };
                                const od = current.od || { product: true, quantity: true };
                                return {
                                  ...prev,
                                  [label.id]: {
                                    hi: { ...hi, quantity: checked },
                                    od: { ...od, quantity: checked }
                                  }
                                };
                              });
                            }}
                          />
                          <span>Qty</span>
                        </label>

                        <div className="flex-1 text-right text-[10px] font-bold text-slate-400 truncate uppercase" title={label.item}>
                          {label.item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 pt-4 border-t border-slate-100 mt-auto flex-shrink-0">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</h3>
                <div className="grid gap-2">
                  <Button 
                    disabled={isExportingPdf}
                    onClick={handleExportPdf}
                    variant="outline"
                    className="h-10 w-full justify-start rounded-md border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" /> : <Download className="w-4 h-4 mr-2" /> }
                    Save PDF
                  </Button>

                  <Button 
                    disabled={isExportingPdf}
                    onClick={handlePrint}
                    className="h-10 w-full justify-start rounded-md bg-blue-600 hover:bg-blue-700 font-medium text-white shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Now
                  </Button>
                </div>
              </section>
            </div>

            <div className="flex-1 bg-slate-100/50 overflow-y-auto preview-container custom-scrollbar relative">
              <div className="flex flex-col items-center py-8 px-4 min-h-full">
                <div className="mb-4 bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-medium shadow-sm w-fit mx-auto z-20 relative">
                  A4 Template Output
                </div>

                <div className="preview-scaler-container shadow-sm bg-white rounded flex-shrink-0 border border-slate-200">
                  <div className="preview-scaler">
                    <div className="w-[210mm] min-h-[297mm] bg-white" ref={printRef}>
                      <A5PrintLayout
                        labels={selectedLabelDetails}
                        languages={Array.from(labelLanguages)}
                        fieldVisibility={fieldVisibility}
                        onBundleChange={handleBundleChange}
                        onVisibilityChange={handleVisibilityChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 mb-12">
                  <Button 
                    onClick={handlePrint}
                    className="h-14 px-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-3 font-bold group transition-all active:scale-95"
                  >
                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Print All Selected Labels
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>

      <div className="hidden print:block print:w-full print:bg-white print:m-0 print:p-0">
        <A5PrintLayout
          labels={selectedLabelDetails}
          languages={Array.from(labelLanguages)}
          fieldVisibility={fieldVisibility}
          onBundleChange={handleBundleChange}
          onVisibilityChange={handleVisibilityChange}
        />
      </div>

      <Dialog open={confirmPrintOpen} onOpenChange={setConfirmPrintOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Confirm Print Status</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-2">
              Did you successfully print all {selectedLabels.size} labels? Labels will be moved to history after confirmation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
                variant="outline" 
                onClick={() => setConfirmPrintOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-slate-600 border-slate-200"
            >
                No, Keep Selected
            </Button>
            <Button 
                onClick={handleConfirmPrintSuccess}
                className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
                Yes, Printed Successfully
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Mobile Visibility - Fixed Bottom Center - Modern FAB Style */}
      {selectedLabels.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[999] lg:hidden pointer-events-auto w-fit">
          <Button 
            onClick={() => setPreviewOpen(true)}
            className="h-12 px-6 rounded-full bg-indigo-600 text-white shadow-lg flex items-center gap-3 border border-white/20 backdrop-blur-md active:scale-95 transition-all animate-in slide-in-from-bottom-10 fade-in duration-500 overflow-hidden group"
          >
            <Printer className="w-4 h-4" />
            <span className="font-bold text-sm tracking-tight">Print {selectedLabels.size} Labels</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
