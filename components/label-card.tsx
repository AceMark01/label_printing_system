'use client';

import Image from 'next/image';
import { cn } from "@/lib/utils";
import type { Label, Language } from '@/lib/types';

interface LabelCardProps {
  label: Label;
  languages: Language[];
  fieldVisibility?: Partial<Record<Language, { product: boolean, quantity: boolean }>>;
  onBundleChange?: (id: string, newQty: string) => void;
  onVisibilityChange?: (id: string, field: 'product' | 'quantity', visible: boolean, lang: Language) => void;
}

const labelTranslations: Record<Language, Record<string, string>> = {
  en: {
    party: 'Party Name',
    item: 'Product',
    qty: 'Quantity',
    city: 'City'
  },
  hi: {
    party: 'पार्टी नाम',
    item: 'प्रोडक्ट',
    qty: 'क्वांटिटी',
    bundles: 'बंडल',
    city: 'सिटी'
  },
  od: {
    party: 'ପାର୍ଟି ନେମ',
    item: 'ପ୍ରୋଡକ୍ଟ',
    qty: 'କ୍ୱାଣ୍ଟିଟି',
    bundles: 'ବଣ୍ଡଲ୍',
    city: 'ସିଟି'
  }
};

export function LabelCard({ label, languages, fieldVisibility, onBundleChange, onVisibilityChange }: LabelCardProps) {
  const sortedLanguages = Array.from(languages).sort((a, b) => {
    if (a === 'hi') return -1;
    if (b === 'hi') return 1;
    return a.localeCompare(b);
  });

  const isMulti = sortedLanguages.length > 1;

  const getFontSize = (text: string, baseSize: string, limit: number = 20) => {
    if (!text) return baseSize;
    // Base sizes optimized for A4-halved (A5) print area - Made even larger for better space management
    if (text.length > limit * 2.5) return isMulti ? 'text-[18px] print:text-[18px]' : 'text-[22px] print:text-[22px]';
    if (text.length > limit * 1.8) return isMulti ? 'text-[22px] print:text-[22px]' : 'text-[28px] print:text-[28px]';
    if (text.length > limit) return isMulti ? 'text-[28px] print:text-[28px]' : 'text-[38px] print:text-[38px]';
    return baseSize;
  };

  const getPartyName = (lang: Language) => lang === 'en' ? label.party : (label.partyNames?.[lang] || label.party);
  const getItemName = (lang: Language) => lang === 'en' ? label.item : (label.itemNames?.[lang] || label.item);
  const getCityName = (lang: Language) => lang === 'en' ? label.city : (label.cityNames?.[lang] || label.city);

  return (
    <div className="relative bg-white w-full h-full flex flex-col font-sans border border-gray-200 shadow-none overflow-hidden print:border-none print:shadow-none print:bg-white">
      <div className={`flex-1 ${isMulti ? 'p-6' : 'p-10'} flex flex-col justify-center bg-white overflow-y-auto print:overflow-visible print:bg-white`}>
        <div className={`w-full flex flex-col ${isMulti ? 'gap-6' : 'gap-12'} justify-center`}>
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;
            const partyName = getPartyName(lang);
            const itemName = getItemName(lang);
            const isHindi = lang === 'hi';
            
            // Check visibility per language
            const isProductVisible = fieldVisibility?.[lang]?.product !== false;
            const isQuantityVisible = fieldVisibility?.[lang]?.quantity !== false;
            
            // If both are hidden, the layout should still be balanced
            const isReduced = !isProductVisible && !isQuantityVisible;

            return (
              <div 
                key={lang} 
                className={cn(
                  "flex flex-col flex-shrink-0",
                  !isLast && isMulti && "pb-6 border-b border-dashed border-gray-100 mb-2",
                  isReduced ? "justify-center min-h-[40%]" : "gap-4"
                )}
              >
                {/* Party Name Row */}
                <div className="w-full">
                  <p className="leading-tight flex flex-wrap items-baseline gap-x-3">
                    <span className={cn(
                      "font-bold text-gray-400 uppercase tracking-widest shrink-0",
                      isMulti ? (isHindi ? "text-[16px]" : "text-[12px]") : "text-[20px]"
                    )}>
                      {t.party}:
                    </span>
                    <span className={cn(
                      "font-black text-gray-900",
                      getFontSize(partyName, isMulti ? (isHindi ? "text-[32px]" : "text-[28px]") : "text-[52px]", 20)
                    )}>
                      {partyName}
                    </span>
                  </p>
                </div>

                {/* Product Name Row - Only if visible */}
                {isProductVisible && (
                  <div className="flex items-center gap-4 group/field relative pr-8">
                    <p className="leading-tight flex flex-wrap items-baseline gap-x-3">
                      <span className={cn(
                        "font-bold text-gray-400 uppercase tracking-widest shrink-0",
                        isMulti ? (isHindi ? "text-[16px]" : "text-[12px]") : "text-18px"
                      )}>
                        {t.item}:
                      </span>
                      <span className={cn(
                        "font-bold text-gray-800",
                        getFontSize(itemName, isMulti ? (isHindi ? "text-[24px]" : "text-[20px]") : "text-[32px]", 30)
                      )}>
                        {itemName}
                      </span>
                    </p>
                    <input 
                      type="checkbox" 
                      checked={isProductVisible}
                      onChange={(e) => onVisibilityChange?.(label.id, 'product', e.target.checked, lang)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-opacity cursor-pointer print:hidden absolute right-0"
                    />
                  </div>
                )}
                {!isProductVisible && (
                   <div className="print:hidden h-0 relative">
                     <input 
                        type="checkbox" 
                        checked={false}
                        onChange={(e) => onVisibilityChange?.(label.id, 'product', e.target.checked, lang)}
                        className="w-4 h-4 rounded border-gray-100 text-gray-300 transition-opacity cursor-pointer absolute right-0 -top-4"
                      />
                   </div>
                )}

                {/* Quantity & City & Bundles Row */}
                <div className={cn(
                  "flex flex-wrap items-center gap-y-4",
                  isMulti ? "gap-x-6" : "gap-x-12",
                  isReduced ? "pt-4" : "pt-2"
                )}>
                  {/* Quantity Group */}
                  <div className="flex items-center gap-4 group/field relative pr-8 min-w-[120px]">
                    {isQuantityVisible && (
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-bold text-gray-400 uppercase tracking-widest shrink-0",
                          isMulti ? (isHindi ? "text-[16px]" : "text-[12px]") : "text-[18px]"
                        )}>
                          {t.qty}:
                        </span>
                        <span className={cn(
                          "font-black text-black leading-none whitespace-nowrap",
                          isMulti ? "text-[32px]" : "text-[52px]"
                        )}>
                          {label.quantity}
                        </span>
                      </div>
                    )}
                    <input 
                      type="checkbox" 
                      checked={isQuantityVisible}
                      onChange={(e) => onVisibilityChange?.(label.id, 'quantity', e.target.checked, lang)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-opacity cursor-pointer print:hidden absolute right-0"
                    />
                  </div>

                  {/* Bundles (Always visible if exists) */}
                  {label.bdlQty !== undefined && (
                    <div className={cn(
                      "flex items-center gap-3 border-l border-gray-100 px-4",
                      !isQuantityVisible && "border-l-0 pl-0"
                    )}>
                      <span className={cn(
                        "font-bold text-gray-400 uppercase tracking-widest shrink-0",
                        isMulti ? (isHindi ? "text-[16px]" : "text-[12px]") : "text-[18px]"
                      )}>
                        {t.bundles}:
                      </span>
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={label.bdlQty} 
                          onChange={(e) => onBundleChange?.(label.id, e.target.value)}
                          className={cn(
                            "font-black text-gray-700 leading-none whitespace-nowrap bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-[1.5em] text-left hover:bg-slate-50 focus:bg-white rounded transition-colors",
                            isMulti ? "text-[32px]" : "text-[52px]"
                          )}
                          placeholder="0"
                        />
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-200 print:bg-black group-hover:bg-blue-400 transition-colors" />
                      </div>
                    </div>
                  )}

                  {/* City (Always visible) */}
                  <div className={cn(
                    "flex items-center gap-3 border-l border-gray-100 px-4",
                    !isQuantityVisible && label.bdlQty === undefined && "border-l-0 pl-0"
                  )}>
                    <span className={cn(
                      "font-bold text-gray-400 uppercase tracking-widest shrink-0",
                      isMulti ? (isHindi ? "text-[16px]" : "text-[12px]") : "text-[18px]"
                    )}>
                      {t.city}:
                    </span>
                    <span className={cn(
                      "font-black text-gray-800 uppercase whitespace-nowrap",
                      isMulti ? "text-[24px]" : "text-[38px]"
                    )}>
                      {getCityName(lang)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="h-12 bg-gray-50 border-t border-gray-100 flex items-center justify-between px-8 text-gray-400 print:bg-white">
        <div className="flex items-baseline gap-3">
          <span className="text-[12px] font-black uppercase tracking-widest">DATE:</span>
          <span className="text-[14px] font-bold tabular-nums">
            {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-24 h-0.5 bg-gray-200" />
          <div className="relative w-16 h-8">
            <Image 
              src="/ace.png" 
              alt="Ace Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>

  );
}

