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
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProductionPreview() {
  const [items, setItems] = useState<any[]>([]);
  const [templateType, setTemplateType] = useState('standard');
  const [isEditing, setIsEditing] = useState(false);
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
            sNo: true,
            bundles: true,
            godown: true
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
    if (text.length > limit * 2.5) return 'text-[16px]';
    if (text.length > limit * 2) return 'text-[18px]';
    if (text.length > limit * 1.5) return 'text-[24px]';
    if (text.length > limit) return 'text-[32px]';
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
        const currentVis = item.fieldVisibility || { productName: true, sNo: true, bundles: true, godown: true };
        return {
          ...item,
          fieldVisibility: {
            ...currentVis,
            [field]: !currentVis[field]
          }
        };
      }
      return item;
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = () => {
    toast.success('Production labels confirmed locally');
    // Note: No API call here ensures spreadsheet data is not affected
    router.push('/production/all-products');
  };

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Top Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Type className="w-5 h-5 text-indigo-600" />
              Final Print
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ready to print: {items.filter(i => i.isVisible !== false).length} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "rounded-xl font-bold transition-all",
              isEditing ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : "bg-white"
            )}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'Save Changes' : 'Edit Labels'}
          </Button>
          <Button 
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl font-bold bg-white border-slate-200 shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={handleConfirm}
            className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirm & Save
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-8 space-y-4">
        {/* Preview Container */}
        <div ref={printRef} className="space-y-4 print:space-y-0 print:p-0">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "bg-white shadow-xl relative print:shadow-none print:border-0 overflow-hidden mx-auto transition-all",
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
              {/* Entire Copy Toggle - Edit mode only */}
              {isEditing && (
                <div className="absolute top-4 left-6 z-10 print:hidden flex items-center gap-3 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200">
                  <input 
                    type="checkbox" 
                    checked={item.isVisible !== false}
                    onChange={() => toggleVisibility(item.id)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-600">Print this product</span>
                </div>
              )}

              {/* Top Copy */}
              <div
                className="w-full relative flex flex-col items-center justify-center overflow-hidden"
                style={{ height: '142mm', boxSizing: 'border-box' }}
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-lg overflow-hidden flex flex-col uppercase">
                  <ProductionLabelContent item={item} isEditing={isEditing} handleEditChange={handleEditChange} handleBundleChange={handleBundleChange} getFontSize={getFontSize} toggleFieldVisibility={toggleFieldVisibility} />
                </div>
              </div>

              {/* Separation Line */}
              <div className="flex-1 w-full flex items-center justify-center relative min-h-[2mm]">
                <div className="w-full border-b border-dashed border-slate-400 print:border-slate-800"></div>
                <div className="absolute right-0 text-[8px] font-black uppercase text-slate-300 pr-4 print:hidden">Cut Here</div>
              </div>

              {/* Bottom Copy */}
              <div
                className="w-full relative flex flex-col items-center justify-center overflow-hidden"
                style={{ height: '142mm', boxSizing: 'border-box' }}
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-lg overflow-hidden flex flex-col">
                   <ProductionLabelContent item={item} isEditing={isEditing} handleEditChange={handleEditChange} handleBundleChange={handleBundleChange} getFontSize={getFontSize} toggleFieldVisibility={toggleFieldVisibility} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
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
  const vis = item.fieldVisibility || { productName: true, sNo: true, bundles: true, godown: true };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 md:p-8 overflow-hidden">
      <div className="space-y-6">
        {/* Header Area */}
        <div className="flex justify-between items-start">
          <div className={cn("space-y-4 flex-1 pr-6 transition-opacity", !vis.productName && "opacity-0 print:invisible")}>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Languages className="w-3.5 h-3.5" />
                Product Specification / उत्पाद विवरण
              </p>
              {isEditing && (
                <input 
                  type="checkbox" 
                  checked={vis.productName} 
                  onChange={() => toggleFieldVisibility(item.id, 'productName')}
                  className="w-4 h-4 print:hidden cursor-pointer"
                />
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <input 
                  value={item.productName}
                  onChange={(e) => handleEditChange(item.id, 'productName', e.target.value)}
                  className="w-full text-xl font-black border-b-2 border-slate-200 outline-none pb-1 uppercase focus:border-indigo-600"
                />
                <input 
                  value={item.productNameHi}
                  onChange={(e) => handleEditChange(item.id, 'productNameHi', e.target.value)}
                  className="w-full text-xl font-black border-b-2 border-slate-200 outline-none pb-1 focus:border-indigo-600"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className={cn("font-black text-black leading-tight uppercase tracking-tight", getFontSize(item.productName, "text-[42px]"))}>
                  {item.productName}
                </h2>
                <h2 className={cn("font-black text-slate-800 leading-tight", getFontSize(item.productNameHi, "text-[42px]"))}>
                  {item.productNameHi}
                </h2>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Code</p>
            <p className="text-2xl font-black text-black uppercase tracking-tighter bg-slate-100 px-3 py-1 rounded-lg">
              {item.productCode}
            </p>
          </div>
        </div>

        <div className="h-0.5 bg-black w-full opacity-10" />

        {/* Details Grid */}
        <div className="flex items-start justify-between">
          <div className="space-y-6 flex-1 pr-8">
            <div className={cn("space-y-1 transition-opacity", !vis.sNo && "opacity-0 print:invisible")}>
              <div className="flex items-center gap-3">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">S NO / क्रमांक</p>
                {isEditing && (
                  <input 
                    type="checkbox" 
                    checked={vis.sNo} 
                    onChange={() => toggleFieldVisibility(item.id, 'sNo')}
                    className="w-4 h-4 print:hidden cursor-pointer"
                  />
                )}
              </div>
              <p className="text-3xl font-black text-black">{item.sNo}</p>
            </div>
            
            <div className={cn("space-y-1 transition-opacity", !vis.bundles && "opacity-0 print:invisible")}>
              <div className="flex items-center gap-3">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Calculated Bundles / कुल बंडल</p>
                {isEditing && (
                  <input 
                    type="checkbox" 
                    checked={vis.bundles} 
                    onChange={() => toggleFieldVisibility(item.id, 'bundles')}
                    className="w-4 h-4 print:hidden cursor-pointer"
                  />
                )}
              </div>
              <div className="flex items-end gap-3 translate-y-1">
                <p className="text-[56px] font-black text-black leading-none">{item.totalBundles}</p>
                <div className="flex flex-col pb-2">
                   <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                     Type: <span className="text-indigo-600 font-black">{item.selectedBundle}</span>
                   </p>
                   {isEditing && (
                      <div className="print:hidden mt-1 px-1">
                        <select 
                          value={item.selectedBundle}
                          onChange={(e) => handleBundleChange(item.id, e.target.value)}
                          className="text-[10px] bg-slate-100 border-none rounded p-1 font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                           <option value="bld">bld</option>
                           <option value="CRT">CRT</option>
                           <option value="SmallCRT">Small</option>
                        </select>
                      </div>
                   )}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">
                {item.pendingQty} items • {item.divisor} per {item.selectedBundle}
              </p>
            </div>
          </div>

          <div className="space-y-4 w-1/2">
             <div className={cn("space-y-2 border-l border-slate-100 pl-8 overflow-hidden transition-opacity", !vis.godown && "opacity-0 print:invisible")}>
               <div className="flex items-center gap-3">
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Godown / गोदाम</p>
                  {isEditing && (
                    <input 
                      type="checkbox" 
                      checked={vis.godown} 
                      onChange={() => toggleFieldVisibility(item.id, 'godown')}
                      className="w-4 h-4 print:hidden cursor-pointer"
                    />
                  )}
               </div>
               {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      value={item.godown}
                      onChange={(e) => handleEditChange(item.id, 'godown', e.target.value)}
                      className="w-full text-lg font-black border-b border-slate-200 outline-none uppercase focus:border-indigo-600"
                    />
                    <input 
                      value={item.godownHi}
                      onChange={(e) => handleEditChange(item.id, 'godownHi', e.target.value)}
                      className="w-full text-lg font-black border-b border-slate-200 outline-none focus:border-indigo-600"
                    />
                  </div>
               ) : (
                  <div className="space-y-1 overflow-hidden">
                    <p className={cn("font-black text-black uppercase truncate", getFontSize(item.godown, "text-[32px]", 15))}>{item.godown}</p>
                    <p className={cn("font-black text-slate-700 truncate", getFontSize(item.godownHi, "text-[32px]", 15))}>{item.godownHi}</p>
                  </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-100 flex items-end justify-between">
        <div className="space-y-1">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Date</p>
           <p className="text-lg font-bold tabular-nums text-slate-900 border-b-4 border-black inline-block">
             {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
           </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="w-32 h-14 relative flex items-center justify-center">
             <img src="/logo1.png" alt="AceMark" className="w-full h-full object-contain" />
           </div>
        </div>
      </div>
    </div>
  );
}
