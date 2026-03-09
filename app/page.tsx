'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { translations, languageNames } from '@/lib/mock-data';
import { fetchTicTakData } from '@/lib/google-sheets';
import { FilterPanel } from '@/components/filter-panel';
import { DataTable } from '@/components/data-table';
import { LabelCard } from '@/components/label-card';
import { A5PrintLayout } from '@/components/a5-print-layout';
import { PrintLayout } from '@/components/print-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, LayoutGrid, FileText, Box, Loader2 } from 'lucide-react';
import type { Language } from '@/lib/types';
import { useCallback } from 'react';

const allLanguages: Language[] = ['en', 'hi', 'ta', 'te', 'mr', 'gu', 'kn', 'od'];

export default function Home() {
  const [labels, setLabels] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [labelLanguages, setLabelLanguages] = useState<Set<Language>>(new Set(['en', 'hi']));
  const [activeTab, setActiveTab] = useState<'select' | 'preview' | 'print'>('select');

  const printRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const paginated = await fetchTicTakData(1, 50);
        setLabels(paginated.data);
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
  }, []);

  // Fetch more logic
  const fetchMoreData = useCallback(async () => {
    if (isFetchingMore || !hasMore || loading) return;

    setIsFetchingMore(true);
    try {
      console.log(`Loading more data: Page ${page}`);
      const paginated = await fetchTicTakData(page, 50);
      if (paginated.data && paginated.data.length > 0) {
        // Prevent adding duplicates if API returns same data
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
  }, [page, isFetchingMore, hasMore, loading]);

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
      {
        rootMargin: '200px', // Trigger slightly before reaching the bottom
        threshold: 0.1
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, fetchMoreData]);

  // Filter labels based on selected filters (searches across all loaded labels)
  const filteredLabels = useMemo(() => {
    return labels.filter((label) => {
      if (selectedCity && label.city !== selectedCity) return false;
      if (selectedParty && label.party !== selectedParty) return false;
      if (selectedItem && label.item !== selectedItem) return false;
      return true;
    });
  }, [labels, selectedCity, selectedParty, selectedItem]);

  // Get selected label details
  const selectedLabelDetails = useMemo(() => {
    return filteredLabels.filter((label) => selectedLabels.has(label.id));
  }, [filteredLabels, selectedLabels]);

  const handleClearFilters = () => {
    setSelectedCity(null);
    setSelectedParty(null);
    setSelectedItem(null);
  };

  const toggleLanguage = (lang: Language) => {
    const newLanguages = new Set(labelLanguages);
    if (newLanguages.has(lang)) {
      newLanguages.delete(lang);
    } else {
      newLanguages.add(lang);
    }
    // Ensure at least one language is selected
    if (newLanguages.size > 0) {
      setLabelLanguages(newLanguages);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=1200,height=800');
      if (printWindow) {
        const content = printRef.current.innerHTML;
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Labels</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @page { size: A4 portrait; margin: 0; }
                body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                .print-container { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; }
                @media print {
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="print-container">${content}</div>
            </body>
          </html>
        `);
        printWindow.document.close();

        // Wait for images to load
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      }
    }
  };

  const handleExportPdf = async () => {
    if (selectedLabelDetails.length === 0) return;
    setIsExportingPdf(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      if (printRef.current) {
        // Ensure the element is visible and has correct dimensions
        const element = printRef.current;

        // Capture the canvas with optimized settings
        const canvas = await html2canvas(element, {
          scale: 3, // Higher resolution for printing
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff', // Force white background
          logging: false,
          onclone: (clonedDoc) => {
            // Aggressively clean up styles to avoid "lab" or "oklch" parsing errors
            const styles = clonedDoc.getElementsByTagName('style');
            for (let i = 0; i < styles.length; i++) {
              let css = styles[i].innerHTML;
              // Replace any modern color functions with a safe fallback
              css = css.replace(/oklch\([^)]+\)/g, '#3b82f6');
              css = css.replace(/lab\([^)]+\)/g, '#3b82f6');
              styles[i].innerHTML = css;
            }

            // Remove all link tags (external stylesheets) that might contain modern colors
            const links = clonedDoc.getElementsByTagName('link');
            for (let i = links.length - 1; i >= 0; i--) {
              if (links[i].rel === 'stylesheet') {
                links[i].remove();
              }
            }

            const clonedElement = clonedDoc.querySelector('[data-print-container]');
            if (clonedElement) {
              (clonedElement as HTMLElement).style.transform = 'none';
              (clonedElement as HTMLElement).style.position = 'static';
              (clonedElement as HTMLElement).style.margin = '0';
              (clonedElement as HTMLElement).style.padding = '0';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        // Add subsequent pages if content overflows A4
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }

        pdf.save(`labels-${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error: any) {
      console.error('Detailed PDF Export Error:', error);
      alert('Error exporting PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLabels(new Set(filteredLabels.map((l) => l.id)));
    } else {
      setSelectedLabels(new Set());
    }
  };

  const handleSelectLabel = (id: string, checked: boolean) => {
    const newIds = new Set(selectedLabels);
    if (checked) {
      newIds.add(id);
    } else {
      newIds.delete(id);
    }
    setSelectedLabels(newIds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 p-2 bg-white rounded-xl shadow-xl shadow-blue-600/20 border-2 border-blue-50 group-hover:scale-110 transition-transform animate-float overflow-hidden">
                <Image
                  src="/logo1.png"
                  alt="Logo"
                  fill
                  className="object-contain p-0.5"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gradient">
                  Label Printing System
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  ACE Professional Warehouse
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Current Session</span>
                <span className="text-xs font-bold text-blue-900">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border-blue-100">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                <span className="text-sm font-black text-blue-900">{selectedLabels.size} Labels</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-10 bg-blue-50 p-1 rounded-xl border border-blue-100 shadow-sm">
            <TabsTrigger
              value="select"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2.5 text-xs sm:text-sm"
            >
              <Box className="w-4 h-4" />
              Select Orders
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2.5 text-xs sm:text-sm"
            >
              <LayoutGrid className="w-4 h-4" />
              Preview Labels
            </TabsTrigger>
            <TabsTrigger
              value="print"
              className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2.5 text-xs sm:text-sm"
            >
              <Printer className="w-4 h-4" />
              Print Setup
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Select Orders */}
          <TabsContent value="select" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-32 premium-card">
                  <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-t-2xl">
                    <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
                      <FileText className="w-5 h-5 text-blue-200" />
                      Quick Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FilterPanel
                      labels={labels}
                      selectedCity={selectedCity}
                      selectedParty={selectedParty}
                      selectedItem={selectedItem}
                      language="en"
                      onCityChange={setSelectedCity}
                      onPartyChange={setSelectedParty}
                      onItemChange={setSelectedItem}
                      onClearFilters={handleClearFilters}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Data Table */}
              <div className="lg:col-span-3 pb-20">
                <Card className="premium-card">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b border-blue-100 rounded-t-2xl">
                    <CardTitle className="text-blue-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <span className="font-black tracking-tight">Active Orders</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                          {filteredLabels.length}/{labels.length} Loaded
                        </span>
                      </div>
                      {(loading || isFetchingMore) && (
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                          <span className="animate-pulse">Loading</span>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loading && labels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <p className="text-gray-500 font-medium">Fetching worksheet records...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-16 bg-red-50 rounded-lg border-2 border-dashed border-red-200 p-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Box className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 mb-2">Connectivity Error</h3>
                        <p className="text-red-700 mb-4 max-w-md mx-auto">{error}</p>
                        <Button
                          variant="outline"
                          onClick={() => window.location.reload()}
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Retry Connection
                        </Button>
                      </div>
                    ) : labels.length > 0 ? (
                      <div className="space-y-4">
                        <DataTable
                          labels={filteredLabels}
                          selectedIds={selectedLabels}
                          language="en"
                          onSelectionChange={setSelectedLabels}
                        />

                        {/* Loading Observer Trigger */}
                        <div
                          ref={observerTarget}
                          className="h-20 flex items-center justify-center border-t border-blue-50 mt-4"
                        >
                          {isFetchingMore ? (
                            <div className="flex items-center gap-3 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-full animate-pulse">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Fetching more records...</span>
                            </div>
                          ) : hasMore ? (
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <div className="w-8 h-[1px] bg-gray-200" />
                              Scroll to see more
                              <div className="w-8 h-[1px] bg-gray-200" />
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <div className="w-8 h-[1px] bg-gray-200" />
                              All records loaded
                              <div className="w-8 h-[1px] bg-gray-200" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No records found</h3>
                        <p className="text-gray-500">Try adjusting your filters or check your data source.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Preview Labels */}
          <TabsContent value="preview" className="space-y-6">
            {/* Language Selection */}
            <Card className="premium-card">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-t-2xl">
                <CardTitle className="font-black tracking-tight flex items-center gap-3">
                  <span className="p-2 glass-dark rounded-lg">🌐</span>
                  Translation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {allLanguages.map((lang) => (
                    <label
                      key={lang}
                      className="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all"
                    >
                      <Checkbox
                        checked={labelLanguages.has(lang)}
                        onCheckedChange={() => toggleLanguage(lang)}
                      />
                      <span className="text-sm font-semibold text-gray-700">
                        {languageNames[lang]}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Label Preview */}
            {selectedLabelDetails.length > 0 ? (
              <Card className="premium-card">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b border-blue-100 rounded-t-2xl">
                  <CardTitle className="text-blue-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      <span className="font-black tracking-tight">Live Preview</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                        {selectedLabelDetails.length} Labels
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 px-4 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {selectedLabelDetails.map((label) => (
                      <LabelCard
                        key={label.id}
                        label={label}
                        languages={Array.from(labelLanguages)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-gray-300 shadow-lg">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-gray-400 mb-4">📭</div>
                  <p className="text-gray-500 font-semibold">No labels selected</p>
                  <p className="text-sm text-gray-400">Select labels from the Orders tab to preview them here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Print Setup */}
          <TabsContent value="print" className="space-y-6">
            {selectedLabelDetails.length > 0 ? (
              <>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button
                    onClick={handlePrint}
                    disabled={isExportingPdf}
                    className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-black py-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-lg group disabled:opacity-50 disabled:scale-100"
                  >
                    <Printer className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    Print Labels
                  </Button>
                  <Button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-black py-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-lg group disabled:opacity-50 disabled:scale-100"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6 mr-3 group-hover:translate-y-1 transition-transform" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Print Preview */}
                <Card className="premium-card">
                  <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b border-blue-100 rounded-t-2xl">
                    <CardTitle className="text-blue-900 font-black tracking-tight">Paper Setup (A5 Size Labels)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 overflow-auto max-h-[600px] no-scrollbar">
                      <div ref={printRef} data-print-container className="bg-white shadow-2xl mx-auto origin-top transition-transform">
                        <A5PrintLayout labels={selectedLabelDetails} languages={Array.from(labelLanguages)} />
                      </div>
                    </div>
                    <div className="mt-8 p-5 glass border-blue-100 rounded-2xl">
                      <p className="text-sm text-blue-900 font-medium leading-relaxed">
                        <span className="font-black text-blue-700 mr-2 uppercase tracking-widest text-xs">Pro Tip:</span>
                        This layout displays <strong>4 labels per A4 page</strong>. For perfect results, ensure your printer is set to "Portrait" orientation and "A4" paper size in the system print dialog.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed border-2 border-gray-300 shadow-lg">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="text-gray-400 mb-4">🖨️</div>
                  <p className="text-gray-500 font-semibold">No labels to print</p>
                  <p className="text-sm text-gray-400">Select and preview labels first before printing</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-100 bg-white/80 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>Label Hub © 2025 • Professional Warehouse Management Solution</p>
        </div>
      </footer>
    </div>
  );
}
