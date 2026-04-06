'use client';

import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import type { Label, Language } from '@/lib/types';

interface LabelCardProps {
  label: Label;
  languages: Language[];
  fieldVisibility?: Partial<Record<Language, { product: boolean, quantity: boolean }>>;
  onBundleChange?: (id: string, newQty: string) => void;
  onQuantityChange?: (id: string, newQty: string) => void;
  onVisibilityChange?: (id: string, field: 'product' | 'quantity', visible: boolean, lang: Language) => void;
}

const labelTranslations: Record<Language, Record<string, string>> = {
  en: {
    party: 'Party Name',
    item: 'Product',
    qty: 'Quantity',
    city: 'City',
    bundles: 'Bundles'
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

export function LabelCard({ label, languages, fieldVisibility, onBundleChange, onQuantityChange, onVisibilityChange }: LabelCardProps) {
  // Sort by fixed order so they don't flip when clicking: Hindi (hi) -> Odia (od) -> English (en)
  const preferredOrder: Language[] = ['hi', 'od', 'en'];
  const activeLanguages = [...languages]
    .sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b))
    .slice(0, 2);

  if (activeLanguages.length === 0) activeLanguages.push('hi', 'od');
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    activeLanguages.forEach(async (lang) => {
      if (lang === 'en') return;

      const fieldsToTranslate = [
        { key: 'party', text: label.party, existing: label.partyNames?.[lang] },
        { key: 'item', text: label.item, existing: label.itemNames?.[lang] },
        { key: 'city', text: label.city, existing: label.cityNames?.[lang] }
      ];

      fieldsToTranslate.forEach(async (field) => {
        // Translate if no translation exists or if it exactly matches English (case-insensitive)
        const isMissing = !field.existing || field.existing.trim() === '' || field.existing.toLowerCase() === field.text.toLowerCase();

        if (isMissing && field.text) {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: field.text, target: lang })
            });
            const data = await res.json();
            if (data.translatedText) {
              setDynamicTranslations(prev => ({
                ...prev,
                [lang]: {
                  ...(prev[lang] || {}),
                  [field.key]: data.translatedText
                }
              }));
            }
          } catch (e) {
            console.error(`Failed to dynamically translate ${field.key}`, e);
          }
        }
      });
    });
  }, [label.party, label.item, label.city, label.partyNames, label.itemNames, label.cityNames, activeLanguages.join(',')]);

  const getPartyName = (lang: Language) => {
    if (lang === 'en') return label.party;
    return dynamicTranslations[lang]?.party || label.partyNames?.[lang] || label.party;
  };

  const getItemName = (lang: Language) => {
    if (lang === 'en') return label.item;
    return dynamicTranslations[lang]?.item || label.itemNames?.[lang] || label.item;
  };

  const getDynamicFontSize = (text: string = '', baseSize: number = 28) => {
    const len = text.length;
    if (len > 40) return `text-[${Math.max(16, baseSize - 12)}px]`;
    if (len > 25) return `text-[${Math.max(20, baseSize - 8)}px]`;
    if (len > 15) return `text-[${Math.max(24, baseSize - 4)}px]`;
    return `text-[${baseSize}px]`;
  };

  const getCityName = (lang: Language) => {
    if (lang === 'en') return label.city;
    return dynamicTranslations[lang]?.city || label.cityNames?.[lang] || label.city;
  };

  return (
    <div className="bg-white w-full h-full rounded-[20px] shadow-xl overflow-hidden border border-gray-100/50 flex flex-col font-sans tracking-tight print:shadow-none print:border-none print:rounded-none">
      <div className="px-8 pt-5 pb-2 flex flex-col justify-around flex-1 overflow-hidden">
        {activeLanguages.map((lang, idx) => {
          const t = labelTranslations[lang];
          const partyName = getPartyName(lang);
          const itemName = getItemName(lang);

          return (
            <div key={`${lang}-${idx}`} className={cn(
              "flex flex-col gap-2.5",
              idx === 0 && activeLanguages.length > 1 && "pb-5 border-b border-dotted border-gray-300 mb-2.5"
            )}>
              {/* Party Name Row */}
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 font-semibold text-[22px] whitespace-nowrap">
                  {t.party}:
                </span>
                <span className={cn("text-gray-900 font-extrabold leading-tight", getDynamicFontSize(partyName, 28))}>
                  {partyName}
                </span>
              </div>

              {/* Product Row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => onVisibilityChange?.(label.id, 'product', !fieldVisibility?.[lang]?.product, lang)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 print:hidden transition-all active:scale-90"
                    style={{ backgroundColor: fieldVisibility?.[lang]?.product !== false ? '#2563eb' : '#e5e7eb' }}
                  >
                    {fieldVisibility?.[lang]?.product !== false && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className={cn(
                    "flex items-baseline gap-2 transition-opacity duration-200",
                    fieldVisibility?.[lang]?.product === false && "opacity-20 print:invisible"
                  )}>
                    <span className="text-gray-400 font-semibold text-[22px] whitespace-nowrap">
                      {t.item}:
                    </span>
                    <span className={cn("text-gray-900 font-extrabold leading-tight", getDynamicFontSize(itemName, 28))}>
                      {itemName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qty, Bundle, City Row */}
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center gap-2 min-w-0">
                  <button 
                    onClick={() => onVisibilityChange?.(label.id, 'quantity', !fieldVisibility?.[lang]?.quantity, lang)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 print:hidden transition-all active:scale-90"
                    style={{ backgroundColor: fieldVisibility?.[lang]?.quantity !== false ? '#2563eb' : '#e5e7eb' }}
                  >
                    {fieldVisibility?.[lang]?.quantity !== false && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <div className={cn(
                    "flex items-baseline gap-1.5 transition-opacity duration-200",
                    fieldVisibility?.[lang]?.quantity === false && "opacity-20 print:invisible"
                  )}>
                    <span className="text-gray-400 font-semibold text-[22px] whitespace-nowrap">
                      {t.qty}:
                    </span>
                    <div className="text-gray-900 font-extrabold text-[44px] tabular-nums tracking-tight">
                      {onQuantityChange ? (
                        <input 
                          type="text" 
                          value={label.quantity} 
                          onChange={(e) => onQuantityChange(label.id, e.target.value)}
                          className="w-auto min-w-[60px] text-gray-900 font-extrabold text-[44px] bg-transparent border-none p-0 focus:ring-0 text-center print:w-auto tabular-nums tracking-tight"
                          style={{ width: `${Math.max(2, label.quantity?.toString().length || 1)}ch` }}
                        />
                      ) : (
                        label.quantity
                      )}
                    </div>
                  </div>
                </div>

                {/* Bundle */}
                <div className="flex items-baseline gap-1 border-l border-gray-200 pl-4">
                  <span className="text-gray-400 font-semibold text-[22px] whitespace-nowrap">
                    {t.bundles}:
                  </span>
                  <div className="relative">
                    {onBundleChange ? (
                      <input 
                        type="text" 
                        value={label.bdlQty || '1'} 
                        onChange={(e) => onBundleChange(label.id, e.target.value)}
                        className="w-auto min-w-[40px] text-gray-900 font-extrabold text-[44px] bg-transparent border-none p-0 focus:ring-0 text-center print:w-16 tabular-nums tracking-tight"
                        style={{ width: `${Math.max(1, (label.bdlQty || '1').toString().length)}ch` }}
                      />
                    ) : (
                      <div className="min-w-[20px] text-gray-900 font-extrabold text-[44px] text-center px-1 tabular-nums tracking-tight">
                        {label.bdlQty || '1'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-100/50" />
                  </div>
                </div>

                {/* City */}
                <div className="flex items-baseline gap-2 border-l border-gray-100 pl-8">
                  <span className="text-gray-400 font-semibold text-[22px] whitespace-nowrap">
                    {t.city}:
                  </span>
                  <span className="text-gray-900 font-extrabold text-[32px]">
                    {getCityName(lang)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50/50 border-t border-gray-100 px-8 py-2 flex items-center justify-between print:bg-transparent">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-bold text-[14px]">DATE:</span>
          <span className="text-gray-500 font-bold text-[15px]">
            {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <img src="/ace.png" alt="A C E" className="h-8 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
