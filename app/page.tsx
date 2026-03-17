'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { translations, languageNames } from '@/lib/mock-data';
import { fetchTicTakData } from '@/lib/google-sheets';
import { FilterPanel } from '@/components/filter-panel';
import { DataTable } from '@/components/data-table';
import { LabelCard } from '@/components/label-card';
import { PreviewLabelCard } from '@/components/preview-label-card';
import { A5PrintLayout } from '@/components/a5-print-layout';
import { PrintLayout } from '@/components/print-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Download, Printer, LayoutGrid, FileText, Box, Loader2, Filter, SlidersHorizontal, Settings2 } from 'lucide-react';
import type { Language } from '@/lib/types';
import { useCallback } from 'react';

const allLanguages: Language[] = ['en', 'hi', 'od'];

// Trusted Types Bypass for Print Preview and html2canvas/jspdf compatibility
if (typeof window !== 'undefined' && (window as any).trustedTypes && (window as any).trustedTypes.createPolicy) {
  try {
    // Only create if it doesn't exist to avoid duplicates
    if (!(window as any).trustedTypes.defaultPolicy) {
      (window as any).trustedTypes.createPolicy('default', {
        createHTML: (html: string) => html,
        createScriptURL: (url: string) => url,
        createScript: (script: string) => script,
      });
    }
  } catch (e) {
    console.warn('Trusted Types policy could not be initialized:', e);
  }
}

export default function Home() {
  const [labels, setLabels] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingSinglePdf, setIsExportingSinglePdf] = useState<string | null>(null);
  const [printingLabel, setPrintingLabel] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [labelLanguages, setLabelLanguages] = useState<Set<Language>>(new Set(['hi', 'od']));
  const [fieldVisibility, setFieldVisibility] = useState<Record<Language, { product: boolean, quantity: boolean }>>(
    allLanguages.reduce((acc, lang) => ({
      ...acc,
      [lang]: { product: true, quantity: true }
    }), {} as Record<Language, { product: boolean, quantity: boolean }>)
  );
  const [bundleOverrides, setBundleOverrides] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'select' | 'preview' | 'print'>('select');

  const printRef = useRef<HTMLDivElement>(null);
  const singlePrintRef = useRef<HTMLDivElement>(null);
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
      // Dropdown filters
      if (selectedCity && label.city !== selectedCity) return false;
      if (selectedParty && label.party !== selectedParty) return false;
      if (selectedItem && label.item !== selectedItem) return false;

      // Search bar filter (Party or Item)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const partyMatch = label.party?.toLowerCase().includes(query);
        const itemMatch = label.item?.toLowerCase().includes(query);
        if (!partyMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [labels, selectedCity, selectedParty, selectedItem, searchQuery]);

  // Get selected label details
  const selectedLabelDetails = useMemo(() => {
    return filteredLabels
      .filter((label) => selectedLabels.has(label.id))
      .map(label => ({
        ...label,
        bdlQty: bundleOverrides[label.id] !== undefined ? bundleOverrides[label.id] : label.bdlQty
      }));
  }, [filteredLabels, selectedLabels, bundleOverrides]);

  const handleClearFilters = () => {
    setSelectedCity(null);
    setSelectedParty(null);
    setSelectedItem(null);
    setSearchQuery('');
  };

  const toggleLanguage = (lang: Language) => {
    const newLanguages = new Set(labelLanguages);
    if (newLanguages.has(lang)) {
      if (newLanguages.size > 1) {
        newLanguages.delete(lang);
        setLabelLanguages(newLanguages);
      }
    } else {
      if (newLanguages.size >= 2) {
        alert("You can only select up to 2 languages per template.");
        return;
      }
      newLanguages.add(lang);
      setLabelLanguages(newLanguages);
    }
  };

  const toggleFieldVisibility = (lang: Language, field: 'product' | 'quantity') => {
    setFieldVisibility(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: !prev[lang][field]
      }
    }));
  };
  
  const handleUpdateBundle = (labelId: string, value: string) => {
    setBundleOverrides(prev => ({
      ...prev,
      [labelId]: value
    }));
  };

  const handlePrint = () => {
    // Standard window.print() is much more reliable on mobile than window.open()
    // It triggers the system print dialog which has 'Save as PDF' built-in
    window.print();
  };

  const handleExportPdf = async () => {
    if (selectedLabelDetails.length === 0) return;
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

      // Find all A4 pages rendered in the preview
      const pages = document.querySelectorAll('[data-pdf-page]');

      if (pages.length === 0) {
        throw new Error('No pages found to export. Please ensure labels are selected and visible in preview.');
      }

      for (let i = 0; i < pages.length; i++) {
        const pageElement = pages[i] as HTMLElement;

        const canvas = await html2canvas(pageElement, {
          scale: 2, // Slightly lower scale for mobile memory but still high res
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000, // Longer timeout for mobile connections
          onclone: (clonedDoc) => {
            // Ensure the element is visible in the clone
            const el = clonedDoc.querySelector('[data-pdf-page]') as HTMLElement;
            if (el) el.style.display = 'block';

            // Ultra-stable fix for modern CSS color support in html2canvas
            // Remove EVERYTHING that might contain problematic modern CSS
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => s.remove());

            // Inject only the absolutely necessary baseline CSS using standard hex colors
            const style = clonedDoc.createElement('style');
            style.textContent = `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans:wght@400;700;900&family=Noto+Sans+Devanagari:wght@400;700;900&family=Noto+Sans+Tamil:wght@400;700;900&family=Noto+Sans+Telugu:wght@400;700;900&family=Noto+Sans+Oriya:wght@400;700;900&display=swap');
              
              * { 
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body { background: white !important; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif !important; }
              
              [data-pdf-page] {
                width: 210mm;
                height: 297mm;
                background: white !important;
                display: flex !important;
                flex-direction: column !important;
                padding: 10mm 15mm !important;
                position: relative !important;
              }
              
              /* Layout Utilities */
              .flex { display: flex !important; }
              .flex-1 { flex: 1 1 0% !important; }
              .flex-col { flex-direction: column !important; }
              .items-center { align-items: center !important; }
              .items-baseline { align-items: baseline !important; }
              .justify-center { justify-content: center !important; }
              .justify-between { justify-content: space-between !important; }
              .w-full { width: 100% !important; }
              .h-full { height: 100% !important; }
              .h-12 { height: 3rem !important; }
              .h-16 { height: 4rem !important; }
              .h-18 { height: 4.5rem !important; }
              .h-8 { height: 2rem !important; }
              .w-28 { width: 7rem !important; }
              .w-36 { width: 9rem !important; }
              .w-44 { width: 11rem !important; }
              .w-12 { width: 3rem !important; }
              .h-0\.5 { height: 2px !important; }
              .relative { position: relative !important; }
              .absolute { position: absolute !important; }
              .z-10 { z-index: 10 !important; }
              .overflow-hidden { overflow: hidden !important; }
              
              /* Spacing Utilities */
              .p-3 { padding: 0.75rem !important; }
              .p-5 { padding: 1.25rem !important; }
              .p-10 { padding: 2.5rem !important; }
              .p-16 { padding: 4rem !important; }
              .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
              .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
              .pt-2 { padding-top: 0.5rem !important; }
              .pt-4 { padding-top: 1rem !important; }
              .pt-5 { padding-top: 1.25rem !important; }
              .pt-8 { padding-top: 2rem !important; }
              .pb-2 { padding-bottom: 0.5rem !important; }
              .pb-3 { padding-bottom: 0.75rem !important; }
              .pb-4 { padding-bottom: 1rem !important; }
              .pb-10 { padding-bottom: 2.5rem !important; }
              .pb-12 { padding-bottom: 3rem !important; }
              .pb-16 { padding-bottom: 4rem !important; }
              .mb-1 { margin-bottom: 0.25rem !important; }
              .mb-2 { margin-bottom: 0.5rem !important; }
              .mb-12 { margin-bottom: 3rem !important; }
              .pl-4 { padding-left: 1rem !important; }
              .pl-6 { padding-left: 1.5rem !important; }
              .pl-8 { padding-left: 2rem !important; }
              .pl-12 { padding-left: 3rem !important; }
              .gap-1 { gap: 0.25rem !important; }
              .gap-2 { gap: 0.5rem !important; }
              .gap-3 { gap: 0.75rem !important; }
              .gap-4 { gap: 1rem !important; }
              .gap-6 { gap: 1.5rem !important; }
              .gap-8 { gap: 2rem !important; }
              .gap-10 { gap: 2.5rem !important; }
              .gap-16 { gap: 4rem !important; }
              .space-y-1 > * + * { margin-top: 0.25rem !important; }
              .space-y-2 > * + * { margin-top: 0.5rem !important; }
              .space-y-3 > * + * { margin-top: 0.75rem !important; }
              .space-y-4 > * + * { margin-top: 1rem !important; }
              .space-y-5 > * + * { margin-top: 1.25rem !important; }
              .space-y-6 > * + * { margin-top: 1.5rem !important; }
              .space-y-8 > * + * { margin-top: 2rem !important; }
              .space-y-12 > * + * { margin-top: 3rem !important; }
              .space-y-24 > * + * { margin-top: 6.25rem !important; }
              .w-24 { width: 6rem !important; }
              
              /* Typography Utilities */
              .text-black { color: #000000 !important; }
              .text-white { color: #ffffff !important; }
              .text-gray-900 { color: #111827 !important; }
              .text-gray-800 { color: #1f2937 !important; }
              .text-gray-700 { color: #374151 !important; }
              .text-gray-600 { color: #4b5563 !important; }
              .text-gray-500 { color: #6b7280 !important; }
              .text-gray-400, .text-grey-400 { color: #9ca3af !important; }
              .font-bold { font-weight: 700 !important; }
              .font-black { font-weight: 900 !important; }
              .uppercase { text-transform: uppercase !important; }
              .italic { font-style: italic !important; }
              .tracking-tight { letter-spacing: -0.025em !important; }
              .tracking-wider { letter-spacing: 0.05em !important; }
              .tracking-widest { letter-spacing: 0.1em !important; }
              .tabular-nums { font-variant-numeric: tabular-nums !important; }
              .leading-tight { line-height: 1.25 !important; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap !important; }
              .break-words { overflow-wrap: break-word !important; }
              
              .text-\[7px\] { font-size: 7px !important; }
              .text-\[10px\] { font-size: 10px !important; }
              .text-\[12px\] { font-size: 12px !important; }
              .text-\[14px\] { font-size: 14px !important; }
              .text-\[16px\] { font-size: 16px !important; }
              .text-\[18px\] { font-size: 18px !important; }
              .text-\[20px\] { font-size: 20px !important; }
              .text-\[22px\] { font-size: 22px !important; }
              .text-\[24px\] { font-size: 24px !important; }
              .text-\[28px\] { font-size: 28px !important; }
              .text-\[32px\] { font-size: 32px !important; }
              .text-\[36px\] { font-size: 36px !important; }
              .text-\[42px\] { font-size: 42px !important; }
              .text-\[48px\] { font-size: 48px !important; }
              .text-xs { font-size: 0.75rem !important; }
              .text-sm { font-size: 0.875rem !important; }
              .text-lg { font-size: 1.125rem !important; }
              .text-xl { font-size: 1.25rem !important; }
              .text-2xl { font-size: 1.5rem !important; }
              .text-3xl { font-size: 1.875rem !important; }
              .text-4xl { font-size: 2.25rem !important; }
              .text-6xl { font-size: 3.75rem !important; }
              
              /* Background & Border Utilities */
              .bg-white { background-color: #ffffff !important; }
              .bg-blue-600 { background-color: #2563eb !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              .bg-gray-200 { background-color: #e5e7eb !important; }
              .border { border: 1px solid #d1d5db !important; }
              .border-2 { border-width: 2px !important; }
              .border-blue-600 { border-color: #2563eb !important; }
              .border-t { border-top: 1px solid #d1d5db !important; }
              .border-b { border-bottom: 1px solid #d1d5db !important; }
              .border-l { border-left: 1px solid #d1d5db !important; }
              .border-dashed { border-style: dashed !important; }
              .border-gray-100 { border-color: #f3f4f6 !important; }
              .border-gray-200 { border-color: #e5e7eb !important; }
              .border-gray-300 { border-color: #d1d5db !important; }
              .border-gray-400 { border-color: #9ca3af !important; }
              .border-black { border-color: #000000 !important; }
              .rounded-lg { border-radius: 0.5rem !important; }
              .rounded { border-radius: 0.25rem !important; }
              .bg-blue-200 { background-color: #bfdbfe !important; }
              
              /* Indian Scripts Font Support */
              [lang="hi"] { font-family: 'Noto Sans Devanagari', sans-serif !important; }
              [lang="ta"] { font-family: 'Noto Sans Tamil', sans-serif !important; }
              [lang="te"] { font-family: 'Noto Sans Telugu', sans-serif !important; }
              [lang="od"] { font-family: 'Noto Sans Oriya', sans-serif !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        if (i > 0) {
          pdf.addPage();
        }

        // Add the captured image as the full A4 page
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'SLOW');
      }

      pdf.save(`Ace-Labels-${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.pdf`);
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      alert('Error exporting PDF: ' + (error.message || 'Please try again.'));
    } finally {
      setIsExportingPdf(false);
    }
  };
  const handleExportPdfSingle = async (label: any) => {
    setIsExportingSinglePdf(label.id);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // We'll use a hidden container to render exactly one A4 page for this label
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      document.body.appendChild(tempContainer);

      // We need to render A5PrintLayout with just this one label
      // Since we can't easily render React to DOM here without a portal or mounting, 
      // we'll rely on the fact that we can target the existing preview if we want, 
      // but the preview is SCALED. 
      // Instead, we'll use the 'print' tab's container but filter it.
      // Actually, let's just use the hidden container approach with a dedicated ref.

      const singlePage = singlePrintRef.current;
      if (!singlePage) return;

      const canvas = await html2canvas(singlePage, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ultra-stable fix for modern CSS color support in html2canvas
          // Remove EVERYTHING that might contain problematic modern CSS
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach(s => s.remove());

          // Inject only the absolutely necessary baseline CSS using standard hex colors
          const style = clonedDoc.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Noto+Sans:wght@400;700;900&family=Noto+Sans+Devanagari:wght@400;700;900&family=Noto+Sans+Tamil:wght@400;700;900&family=Noto+Sans+Telugu:wght@400;700;900&family=Noto+Sans+Oriya:wght@400;700;900&display=swap');
            
            * { 
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body { background: white !important; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif !important; }
            
            [data-pdf-page] {
              width: 210mm;
              height: 297mm;
              background: white !important;
              display: flex !important;
              flex-direction: column !important;
              padding: 10mm 15mm !important;
              position: relative !important;
            }
            
            /* Layout Utilities */
            .flex { display: flex !important; }
            .flex-1 { flex: 1 1 0% !important; }
            .flex-col { flex-direction: column !important; }
            .items-center { align-items: center !important; }
            .items-baseline { align-items: baseline !important; }
            .justify-center { justify-content: center !important; }
            .justify-between { justify-content: space-between !important; }
            .w-full { width: 100% !important; }
            .h-full { height: 100% !important; }
            .h-12 { height: 3rem !important; }
            .h-16 { height: 4rem !important; }
            .h-18 { height: 4.5rem !important; }
            .h-8 { height: 2rem !important; }
            .w-28 { width: 7rem !important; }
            .w-36 { width: 9rem !important; }
            .w-44 { width: 11rem !important; }
            .w-12 { width: 3rem !important; }
            .h-0\.5 { height: 2px !important; }
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            .z-10 { z-index: 10 !important; }
            .overflow-hidden { overflow: hidden !important; }
            
            /* Spacing Utilities */
            .p-3 { padding: 0.75rem !important; }
            .p-5 { padding: 1.25rem !important; }
            .p-10 { padding: 2.5rem !important; }
            .p-16 { padding: 4rem !important; }
            .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
            .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
            .pt-2 { padding-top: 0.5rem !important; }
            .pt-4 { padding-top: 1rem !important; }
            .pt-5 { padding-top: 1.25rem !important; }
            .pt-8 { padding-top: 2rem !important; }
            .pb-2 { padding-bottom: 0.5rem !important; }
            .pb-3 { padding-bottom: 0.75rem !important; }
            .pb-4 { padding-bottom: 1rem !important; }
            .pb-10 { padding-bottom: 2.5rem !important; }
            .pb-12 { padding-bottom: 3rem !important; }
            .pb-16 { padding-bottom: 4rem !important; }
            .mb-1 { margin-bottom: 0.25rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mb-12 { margin-bottom: 3rem !important; }
            .pl-4 { padding-left: 1rem !important; }
            .pl-6 { padding-left: 1.5rem !important; }
            .pl-8 { padding-left: 2rem !important; }
            .pl-12 { padding-left: 3rem !important; }
            .gap-1 { gap: 0.25rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-3 { gap: 0.75rem !important; }
            .gap-4 { gap: 1rem !important; }
            .gap-6 { gap: 1.5rem !important; }
            .gap-8 { gap: 2rem !important; }
            .gap-10 { gap: 2.5rem !important; }
            .gap-16 { gap: 4rem !important; }
            .space-y-1 > * + * { margin-top: 0.25rem !important; }
            .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .space-y-3 > * + * { margin-top: 0.75rem !important; }
            .space-y-4 > * + * { margin-top: 1rem !important; }
            .space-y-5 > * + * { margin-top: 1.25rem !important; }
            .space-y-6 > * + * { margin-top: 1.5rem !important; }
            .space-y-8 > * + * { margin-top: 2rem !important; }
            .space-y-12 > * + * { margin-top: 3rem !important; }
            .space-y-24 > * + * { margin-top: 6.25rem !important; }
            .w-24 { width: 6rem !important; }
            
            /* Typography Utilities */
            .text-black { color: #000000 !important; }
            .text-white { color: #ffffff !important; }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .text-gray-400, .text-grey-400 { color: #9ca3af !important; }
            .font-bold { font-weight: 700 !important; }
            .font-black { font-weight: 900 !important; }
            .uppercase { text-transform: uppercase !important; }
            .italic { font-style: italic !important; }
            .tracking-tight { letter-spacing: -0.025em !important; }
            .tracking-wider { letter-spacing: 0.05em !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .tabular-nums { font-variant-numeric: tabular-nums !important; }
            .leading-tight { line-height: 1.25 !important; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap !important; }
            .break-words { overflow-wrap: break-word !important; }
            
            .text-\[7px\] { font-size: 7px !important; }
            .text-\[10px\] { font-size: 10px !important; }
            .text-\[12px\] { font-size: 12px !important; }
            .text-\[14px\] { font-size: 14px !important; }
            .text-\[16px\] { font-size: 16px !important; }
            .text-\[18px\] { font-size: 18px !important; }
            .text-\[20px\] { font-size: 20px !important; }
            .text-\[22px\] { font-size: 22px !important; }
            .text-\[24px\] { font-size: 24px !important; }
            .text-\[28px\] { font-size: 28px !important; }
            .text-\[32px\] { font-size: 32px !important; }
            .text-\[36px\] { font-size: 36px !important; }
            .text-\[42px\] { font-size: 42px !important; }
            .text-\[48px\] { font-size: 48px !important; }
            .text-xs { font-size: 0.75rem !important; }
            .text-sm { font-size: 0.875rem !important; }
            .text-lg { font-size: 1.125rem !important; }
            .text-xl { font-size: 1.25rem !important; }
            .text-2xl { font-size: 1.5rem !important; }
            .text-3xl { font-size: 1.875rem !important; }
            .text-4xl { font-size: 2.25rem !important; }
            .text-6xl { font-size: 3.75rem !important; }
            
            /* Background & Border Utilities */
            .bg-white { background-color: #ffffff !important; }
            .bg-blue-600 { background-color: #2563eb !important; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
            .border { border: 1px solid #d1d5db !important; }
            .border-2 { border-width: 2px !important; }
            .border-blue-600 { border-color: #2563eb !important; }
            .border-t { border-top: 1px solid #d1d5db !important; }
            .border-b { border-bottom: 1px solid #d1d5db !important; }
            .border-l { border-left: 1px solid #d1d5db !important; }
            .border-dashed { border-style: dashed !important; }
            .border-gray-100 { border-color: #f3f4f6 !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .border-gray-300 { border-color: #d1d5db !important; }
            .border-gray-400 { border-color: #9ca3af !important; }
            .border-black { border-color: #000000 !important; }
            .rounded-lg { border-radius: 0.5rem !important; }
            .rounded { border-radius: 0.25rem !important; }
            .bg-blue-200 { background-color: #bfdbfe !important; }
            
            /* Indian Scripts Font Support */
            [lang="hi"] { font-family: 'Noto Sans Devanagari', sans-serif !important; }
            [lang="ta"] { font-family: 'Noto Sans Tamil', sans-serif !important; }
            [lang="te"] { font-family: 'Noto Sans Telugu', sans-serif !important; }
            [lang="od"] { font-family: 'Noto Sans Oriya', sans-serif !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'SLOW');
      pdf.save(`Ace-Label-${label.party}-${label.id}.pdf`);
    } catch (error: any) {
      console.error('Single PDF Export Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsExportingSinglePdf(null);
    }
  };

  const handlePrintSingle = (label: any) => {
    setPrintingLabel(label);
    // Short delay to allow React to render the hidden print container
    setTimeout(() => {
      window.print();
      setPrintingLabel(null);
    }, 150);
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
      <div className="no-print">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 group cursor-default">
                <div className="relative w-9 h-9 sm:w-12 sm:h-12 p-1.5 bg-white rounded-lg sm:rounded-xl shadow-lg shadow-blue-600/10 border border-blue-50 group-hover:scale-105 transition-transform overflow-hidden">
                  <Image
                    src="/logo1.png"
                    alt="Logo"
                    fill
                    className="object-contain p-0.5"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg sm:text-3xl font-black tracking-tight text-gradient leading-none mb-0.5 sm:mb-1">
                    Label Printing
                  </h1>
                  <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Professional
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Session</span>
                  <span className="text-xs font-bold text-blue-900">{new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div className="glass px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-2 border-blue-100 shadow-sm">
                  <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  <span className="text-xs sm:text-sm font-black text-blue-900 leading-none">{selectedLabels.size} <span className="hidden sm:inline">Labels</span></span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="sticky top-[68px] z-40 grid w-full grid-cols-3 max-w-2xl mx-auto mb-6 sm:mb-10 bg-white/70 backdrop-blur-lg p-1 rounded-xl border border-blue-100 shadow-md">
              <TabsTrigger
                value="select"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2 sm:py-2.5 text-[10px] sm:text-sm"
              >
                <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="leading-none">Orders</span>
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2 sm:py-2.5 text-[10px] sm:text-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="leading-none">Preview</span>
              </TabsTrigger>
              <TabsTrigger
                value="print"
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg font-bold py-2 sm:py-2.5 text-[10px] sm:text-sm"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="leading-none">Print</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Select Orders */}
            <TabsContent value="select" className="space-y-6">
              <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
                {/* Desktop Filters Sidebar */}
                <div className="hidden lg:block lg:col-span-1">
                  <Card className="sticky top-32 premium-card">
                    <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-t-2xl px-5 py-4">
                      <CardTitle className="flex items-center gap-2 text-md font-black tracking-tight">
                        <SlidersHorizontal className="w-4 h-4 text-blue-200" />
                        Quick Filters
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <FilterPanel
                        labels={labels}
                        selectedCity={selectedCity}
                        selectedParty={selectedParty}
                        selectedItem={selectedItem}
                        searchQuery={searchQuery}
                        language="en"
                        onCityChange={setSelectedCity}
                        onPartyChange={setSelectedParty}
                        onItemChange={setSelectedItem}
                        onSearchQueryChange={setSearchQuery}
                        onClearFilters={handleClearFilters}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Data Table Area */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Mobile Filter Row */}
                  <div className="lg:hidden flex items-center justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h2 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-600" />
                        Orders List
                      </h2>
                    </div>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="rounded-xl border-blue-200 flex items-center gap-2 font-bold text-blue-700 bg-white shadow-sm">
                          <Filter className="w-4 h-4" />
                          Filters
                          {(selectedCity || selectedParty || selectedItem) && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="rounded-t-[2rem] h-[60vh] px-6 py-8">
                        <SheetHeader className="mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                              <SlidersHorizontal className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <SheetTitle className="text-xl font-black text-blue-900">Search Filters</SheetTitle>
                              <SheetDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Refine your order selection
                              </SheetDescription>
                            </div>
                          </div>
                        </SheetHeader>
                        <div className="mt-4">
                          <FilterPanel
                            labels={labels}
                            selectedCity={selectedCity}
                            selectedParty={selectedParty}
                            selectedItem={selectedItem}
                            searchQuery={searchQuery}
                            language="en"
                            onCityChange={setSelectedCity}
                            onPartyChange={setSelectedParty}
                            onItemChange={setSelectedItem}
                            onSearchQueryChange={setSearchQuery}
                            onClearFilters={handleClearFilters}
                          />
                          <div className="mt-8">
                            <Button
                              className="w-full h-12 rounded-xl bg-blue-600 font-bold"
                              onClick={() => {
                                // Standard behavior is just closing, which SheetTrigger handles if wrapped correctly or if we use manual control
                                // but here we just want a "Show Results" feel
                              }}
                            >
                              Apply Filters & Close
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
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
                    Language Settings
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
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <header className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <span className="text-lg font-black tracking-tight text-blue-900">Live Preview</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                          {selectedLabelDetails.length} Labels
                        </span>
                      </div>
                    </header>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                      {selectedLabelDetails.map((label) => (
                        <div
                          key={label.id}
                          className="group relative bg-white shadow-xl border border-gray-200 overflow-hidden origin-top transition-all hover:shadow-2xl hover:-translate-y-1"
                          style={{
                            width: '100%',
                            maxWidth: '420px',
                            aspectRatio: '210 / 148.5',
                            height: 'auto'
                          }}
                        >
                          <PreviewLabelCard
                            label={label}
                            languages={Array.from(labelLanguages)}
                            fieldVisibility={fieldVisibility}
                            onToggleField={toggleFieldVisibility}
                            onUpdateBundle={handleUpdateBundle}
                          />

                          {/* Single Action Overlay */}
                          <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none">
                            <div className="flex gap-2 pointer-events-auto scale-90 sm:scale-100">
                              <Button
                                size="sm"
                                onClick={() => handlePrintSingle(label)}
                                className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-lg font-bold"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                              </Button>
                              <Button
                                size="sm"
                                disabled={isExportingSinglePdf === label.id}
                                onClick={() => handleExportPdfSingle(label)}
                                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg font-bold"
                              >
                                {isExportingSinglePdf === label.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Reference for capturing single label (Hidden) */}
                          <div className="hidden">
                            <div ref={singlePrintRef}>
                              <A5PrintLayout
                                labels={[label]}
                                languages={Array.from(labelLanguages)}
                                fieldVisibility={fieldVisibility}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                      <div className="bg-slate-50 p-2 sm:p-8 rounded-2xl border border-slate-100 overflow-hidden min-h-[400px] flex justify-center">
                        <div
                          className="origin-top transition-all duration-500 ease-in-out preview-scaler"
                          style={{
                            width: '210mm',
                          }}
                        >
                          <div ref={printRef} data-print-container className="bg-white shadow-2xl">
                            <A5PrintLayout
                              labels={selectedLabelDetails}
                              languages={Array.from(labelLanguages)}
                              fieldVisibility={fieldVisibility}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-8 p-5 glass border-blue-100 rounded-2xl">
                        <p className="text-sm text-blue-900 font-medium leading-relaxed">
                          <span className="font-black text-blue-700 mr-2 uppercase tracking-widest text-xs">Pro Tip:</span>
                          This layout displays <strong>2 labels per A4 page (Top & Bottom)</strong>. Perfect for cutting from the middle to get two identical A5 labels.
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

      {/* 
        Print Container 
        This is what actually gets printed when window.print() is called.
    */}
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
        {printingLabel ? (
          <A5PrintLayout
            labels={[printingLabel]}
            languages={Array.from(labelLanguages)}
            fieldVisibility={fieldVisibility}
          />
        ) : (
          <A5PrintLayout
            labels={selectedLabelDetails}
            languages={Array.from(labelLanguages)}
            fieldVisibility={fieldVisibility}
          />
        )}
      </div>
    </div>
  );
}
