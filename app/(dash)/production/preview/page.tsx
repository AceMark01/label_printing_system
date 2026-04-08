'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Printer,
  ArrowLeft,
  Download,
  CheckCircle2,
  Settings2,
  Type,
  Languages,
  Layers,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProductionPreview() {
  const [items, setItems] = useState<any[]>([]);
  const [templateType, setTemplateType] = useState('standard');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintSuccessOpen, setIsPrintSuccessOpen] = useState(false);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('selectedProductionItems');
    if (stored) {
      const data = JSON.parse(stored);
      // Auto-select bundle logic: find the max value among bld, crt, smallCrt
      const processed = data.map((item: any) => {
        const bld = parseFloat(item.bld) || 0;
        const crt = parseFloat(item.crt) || 0;
        const scrt = parseFloat(item.smallCrt) || 0;
        const pending = parseFloat(item.pendingQty) || 0;

        // Find which bundle type has the largest base value to set as default
        let initialBundle = 'bld';
        let initialDivisor = bld;

        if (crt > initialDivisor) {
          initialBundle = 'CRT';
          initialDivisor = crt;
        }
        if (scrt > initialDivisor) {
          initialBundle = 'SmallCRT';
          initialDivisor = scrt;
        }

        // Calculation: Pending Qty / Divisor = Total Bundles (Whole Number)
        const totalBundles = initialDivisor > 0 ? Math.floor(pending / initialDivisor) : 0;

        return {
          ...item,
          isVisible: true,
          selectedBundle: initialBundle,
          divisor: initialDivisor,
          totalBundles: totalBundles,
          fieldVisibility: {
            productName: true,
            bundles: true
          }
        };
      });
      setItems(processed);
    } else {
      router.push('/production/all-products');
    }
  }, [router]);

  const handleBundleChange = (id: number, bundleType: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let divisor = 0;
        if (bundleType === 'bld') divisor = parseFloat(item.bld) || 0;
        if (bundleType === 'CRT') divisor = parseFloat(item.crt) || 0;
        if (bundleType === 'SmallCRT') divisor = parseFloat(item.smallCrt) || 0;

        const pending = parseFloat(item.pendingQty) || 0;
        const totalBundles = divisor > 0 ? Math.floor(pending / divisor) : 0;

        return { ...item, selectedBundle: bundleType, divisor, totalBundles };
      }
      return item;
    }));
  };

  const getFontSize = (text: string, baseSize: string, limit: number = 20) => {
    if (!text) return baseSize;
    const len = text.length;
    if (len > limit * 3) return 'text-[14px]';
    if (len > limit * 2.5) return 'text-[16px]';
    if (len > limit * 2) return 'text-[20px]';
    if (len > limit * 1.5) return 'text-[28px]';
    if (len > limit * 1.2) return 'text-[36px]';
    if (len > limit) return 'text-[44px]';
    return baseSize;
  };

  const handleEditChange = (id: number, field: string, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) return { ...item, [field]: value };
      return item;
    }));
  };

  const toggleVisibility = (id: number) => {
    setItems(items.map(item => {
      if (item.id === id) return { ...item, isVisible: !item.isVisible };
      return item;
    }));
  };

  const toggleFieldVisibility = (id: number, field: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const currentVis = item.fieldVisibility || { productName: true, bundles: true };
        const nextValue = !currentVis[field];

        const newVis = {
          ...currentVis,
          [field]: nextValue
        };

        // If product name is hidden, also hide bundles by default
        if (field === 'productName' && nextValue === false) {
          newVis.bundles = false;
        }

        return {
          ...item,
          fieldVisibility: newVis
        };
      }
      return item;
    }));
  };

  const handlePrint = () => {
    window.print();
    // After print dialog closes, ask if it was successful
    setTimeout(() => {
      setIsPrintSuccessOpen(true);
    }, 1000);
  };

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      const visibleItems = items.filter(item => item.isVisible !== false);
      const ids = visibleItems.map(item => Number(item.id) + 1); // Row number in sheet (index + 2 usually, but API id starts at 1)

      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : { name: 'Unknown System' };

      const response = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          printed_by: user.name,
          print_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Labels printed and production updated successfully');
        localStorage.removeItem('selectedProductionItems');
        router.push('/production/all-products');
      } else {
        throw new Error(result.error || 'Failed to update sheet');
      }
    } catch (error: any) {
      console.error('Confirm error:', error);
      toast.error('Failed to sync with Google Sheet: ' + error.message);
    } finally {
      setIsSaving(false);
      setIsPrintSuccessOpen(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Post-Print Confirmation Modal */}
      {isPrintSuccessOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 print:hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-sm w-full animate-in zoom-in duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Printer className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Printed Successfully?</h3>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 uppercase tracking-widest disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Yes, Mark Done'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsPrintSuccessOpen(false)}
                  className="rounded-xl h-12 text-slate-400 font-bold uppercase tracking-widest hover:bg-slate-50"
                >
                  No, Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Header (Mobile & Desktop) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-slate-100 h-10 w-10 p-0 md:w-auto md:px-4"
          >
            <ArrowLeft className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />
          <h1 className="text-sm md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1 md:gap-2">
            <Type className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
            <span className="hidden sm:inline">Final Print</span>
            <span className="sm:hidden">Print</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "rounded-xl font-bold transition-all h-10 md:h-12 px-3 md:px-6",
              isEditing ? "bg-amber-50 border-amber-600 text-amber-600" : "bg-white border-slate-200 text-slate-600"
            )}
          >
            <Edit3 className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">{isEditing ? 'Save' : 'Edit Labels'}</span>
            <span className="md:hidden">{isEditing ? 'Save' : 'Edit'}</span>
          </Button>
          <Button
            onClick={handlePrint}
            className="rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 h-10 md:h-12 px-4 md:px-8 uppercase tracking-widest text-[10px] md:text-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8 pb-12">
        {/* Mobile-Only Card View */}
        <div className="lg:hidden flex flex-col gap-6 print:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-white p-6 rounded-[2.5rem] border-2 transition-all duration-300 shadow-sm",
                item.isVisible === false ? "opacity-30 grayscale border-slate-50" : "border-slate-100 shadow-indigo-50/20"
              )}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{item.productCode}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 leading-tight uppercase">{item.productName}</p>
                  <p className="text-md font-bold text-slate-500 leading-tight">{item.productNameHi}</p>
                </div>
                {isEditing && (
                  <input
                    type="checkbox"
                    checked={item.isVisible !== false}
                    onChange={() => toggleVisibility(item.id)}
                    className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Bundles</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 tabular-nums">{item.totalBundles}</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.selectedBundle}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Qty / {item.selectedBundle}</p>
                  <span className="text-4xl font-black text-slate-900 tabular-nums">{item.divisor}</span>
                </div>
              </div>

              {isEditing && (
                <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Edit Bundle Type</p>
                  <div className="flex gap-2">
                    {['bld', 'CRT', 'SmallCRT'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleBundleChange(item.id, type)}
                        className={cn(
                          "flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                          item.selectedBundle === type ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border border-slate-200 text-slate-400"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Print-Only / Desktop A4 Template */}
        <div ref={printRef} className="hidden lg:flex flex-col gap-4 print:flex print:gap-0 print:p-0">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "bg-white shadow-xl relative print:shadow-none print:border-0 overflow-hidden mx-auto transition-all origin-top sticker-preview",
                item.isVisible === false ? "opacity-20 grayscale border-dashed border-slate-200 print:hidden mb-0 h-0" : "mb-8 print:mb-0"
              )}
              style={{
                width: '210mm',
                height: item.isVisible === false ? '0' : '290mm',
                display: item.isVisible === false ? 'none' : 'flex',
                flexDirection: 'column',
                padding: '4mm 10mm',
                boxSizing: 'border-box',
                pageBreakAfter: idx === items.length - 1 ? 'avoid' : 'always',
                pageBreakInside: 'avoid',
                backgroundColor: 'white'
              }}
            >
              {isEditing && (
                <div className="absolute top-4 left-6 z-10 print:hidden flex items-center gap-3 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200">
                  <input
                    type="checkbox"
                    checked={item.isVisible !== false}
                    onChange={() => toggleVisibility(item.id)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-600">Print</span>
                </div>
              )}

              {/* Top Copy */}
              <div
                className="w-full relative flex flex-col items-center justify-center overflow-hidden"
                style={{ height: '135mm', boxSizing: 'border-box' }}
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-lg overflow-hidden flex flex-col uppercase">
                  <ProductionLabelContent item={item} isEditing={isEditing} handleEditChange={handleEditChange} handleBundleChange={handleBundleChange} getFontSize={getFontSize} toggleFieldVisibility={toggleFieldVisibility} />
                </div>
              </div>

              {/* Separation Line */}
              <div className="flex-1 w-full flex items-center justify-center relative min-h-[15mm]">
                <div className="w-full border-b border-dashed border-slate-400 print:border-slate-800"></div>
                <div className="absolute right-0 text-[8px] font-black uppercase text-slate-300 pr-4">Cut Here</div>
              </div>

              {/* Bottom Copy */}
              <div
                className="w-full relative flex flex-col items-center justify-center overflow-hidden"
                style={{ height: '135mm', boxSizing: 'border-box' }}
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-lg overflow-hidden flex flex-col">
                  <ProductionLabelContent item={item} isEditing={false} handleEditChange={handleEditChange} handleBundleChange={handleBundleChange} getFontSize={getFontSize} toggleFieldVisibility={toggleFieldVisibility} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sticker-preview {
            transform: scale(calc((100vw - 32px) / 794));
            transform-origin: top;
            margin-bottom: calc(-290mm * (1 - ((100vw - 32px) / 794))) !important;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            min-height: 297mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
          }
          .print-container {
            width: 210mm !important;
            margin: 0 auto !important;
          }
          .print\:hidden {
            display: none !important;
          }
          * {
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

function ProductionLabelContent({ item, isEditing, handleEditChange, handleBundleChange, getFontSize, toggleFieldVisibility }: any) {
  const vis = item.fieldVisibility || { productName: true, bundles: true };
  const [dynamicHiName, setDynamicHiName] = useState<string>('');

  useEffect(() => {
    const isMissing = !item.productNameHi || item.productNameHi.trim() === '' || item.productNameHi.toLowerCase() === item.productName.toLowerCase();

    if (isMissing && item.productName) {
      const fetchTranslation = async () => {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.productName, target: 'hi' })
          });
          const data = await res.json();
          if (data.translatedText) {
            setDynamicHiName(data.translatedText);
          }
        } catch (e) {
          console.error("Failed to translate production product name", e);
        }
      };
      fetchTranslation();
    }
  }, [item.productName, item.productNameHi]);

  const productNameHi = dynamicHiName || item.productNameHi || item.productName;

  return (
    <div className="flex-1 flex flex-col justify-between p-6 md:p-8 overflow-hidden bg-white relative">
      <div className="flex flex-col gap-6 flex-1">
        {/* Product Section */}
        <div className={cn("flex flex-col gap-4 transition-opacity", !vis.productName && "opacity-20 print:invisible")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => isEditing && toggleFieldVisibility(item.id, 'productName')}
                disabled={!isEditing}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 print:hidden transition-all",
                  vis.productName ? "bg-blue-600" : "bg-gray-200",
                  !isEditing && "cursor-default"
                )}
              >
                {vis.productName && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span className="text-gray-400 font-medium text-[20px] md:text-[22px]">उत्पाद विवरण:</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-gray-400 font-bold text-[12px] md:text-[14px] uppercase tracking-widest leading-none">Product Code</span>
              <span className="text-gray-900 font-black text-[28px] md:text-[32px] leading-tight mt-1">{item.productCode}</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={item.productName}
                  onChange={(e) => handleEditChange(item.id, 'productName', e.target.value)}
                  className="w-full text-[36px] md:text-[40px] font-black border-b-2 border-gray-100 outline-none pb-1 uppercase focus:border-blue-600"
                />
                <input
                  value={productNameHi}
                  onChange={(e) => handleEditChange(item.id, 'productNameHi', e.target.value)}
                  className="w-full text-[28px] md:text-[32px] font-black border-b-2 border-gray-100 outline-none pb-1 focus:border-blue-600"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <h2 className={cn("font-black text-gray-900 leading-tight uppercase tracking-tight", getFontSize(item.productName, "text-[52px]"))}>
                  {item.productName}
                </h2>
                <h2 className={cn("font-black text-gray-700 leading-tight", getFontSize(productNameHi, "text-[36px]"))}>
                  {productNameHi}
                </h2>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-dotted border-gray-300 w-full" />

        {/* Quantities Section */}
        <div className={cn("flex flex-col gap-6 transition-opacity", !vis.bundles && "opacity-20 print:invisible")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => isEditing && toggleFieldVisibility(item.id, 'bundles')}
                disabled={!isEditing}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 print:hidden transition-all",
                  vis.bundles ? "bg-blue-600" : "bg-gray-200",
                  !isEditing && "cursor-default"
                )}
              >
                {vis.bundles && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span className="text-gray-400 font-medium text-[20px] md:text-[22px]">कुल बंडल:</span>
            </div>
          </div>

          <div className="flex items-end gap-6 md:gap-8">
            <div className="relative">
              <span className="text-[72px] font-black text-gray-900 leading-none tracking-tighter tabular-nums">
                {item.totalBundles}
              </span>
              <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-blue-200" />
            </div>

            <div className="flex flex-col gap-1 pb-1">
              <span className="text-gray-400 font-bold text-[14px] uppercase tracking-widest leading-none">Type: {item.selectedBundle}</span>
              <span className="text-gray-400 font-bold text-[14px] uppercase tracking-widest leading-none mt-1.5">Qty: {item.divisor} per {item.selectedBundle}</span>
              {isEditing && (
                <select
                  value={item.selectedBundle}
                  onChange={(e) => handleBundleChange(item.id, e.target.value)}
                  className="mt-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-black cursor-pointer hover:bg-gray-100 print:hidden"
                >
                  <option value="bld">Bld</option>
                  <option value="CRT">CRT</option>
                  <option value="SmallCRT">Small</option>
                </select>
              )}
            </div>

            <div className="flex-1" />

            <div className="flex flex-col items-end pb-1">
              <span className="text-gray-400 font-bold text-[12px] md:text-[14px] uppercase tracking-widest leading-none">GODOWN</span>
              <span className="text-gray-900 font-black text-[28px] md:text-[32px] leading-none mt-1.5">{item.godown}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Area Area */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end print:bg-transparent">
        <div className="flex items-center gap-1.5">
          <img src="/ace.png" alt="A C E" className="h-7 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
