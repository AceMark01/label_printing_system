'use client';

import Image from 'next/image';
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
      <div className={`flex-1 ${isMulti ? 'p-10' : 'p-16'} flex flex-col justify-center bg-white overflow-hidden print:bg-white`}>
        <div className={`w-full ${isMulti ? 'space-y-12' : 'space-y-24'}`}>
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;
            const partyName = getPartyName(lang);
            const itemName = getItemName(lang);
            const isHindi = lang === 'hi';
            const isProductVisible = fieldVisibility?.[lang]?.product !== false;
            const isQuantityVisible = fieldVisibility?.[lang]?.quantity !== false;
            const isReduced = !isProductVisible && !isQuantityVisible;

            return (
              <div 
                key={lang} 
                className={`${!isLast && isMulti ? 'pb-10 border-b border-dashed border-gray-200 print:pb-12 print:mb-12' : !isLast ? 'pb-16 border-b border-dashed border-gray-200' : ''} ${isReduced ? 'space-y-12' : 'space-y-5'}`}
              >
                {/* Party Name Row */}
                <div className={isReduced ? 'space-y-6' : 'space-y-3'}>
                  <p className="leading-tight">
                    <span className={`${isMulti ? (isHindi ? (isReduced ? 'text-[24px]' : 'text-[18px]') : (isReduced ? 'text-[20px]' : 'text-[14px]')) : (isReduced ? 'text-[32px]' : 'text-[22px]')} font-bold text-gray-400 uppercase tracking-widest`}>{t.party}: </span>
                    <span className={`font-black text-gray-900 ${getFontSize(partyName, isMulti ? (isHindi ? (isReduced ? 'text-[48px]' : 'text-[34px]') : (isReduced ? 'text-[44px]' : 'text-[30px]')) : (isReduced ? 'text-[72px]' : 'text-[52px]'), 20)}`}>
                      {partyName}
                    </span>
                  </p>
                </div>

                {/* Product Name Row */}
                <div className="flex items-center gap-4 group/field relative">
                  <p className={`leading-tight ${!isProductVisible ? 'opacity-25' : ''}`}>
                    <span className={`${isMulti ? (isHindi ? 'text-[18px]' : 'text-[14px]') : 'text-[24px]'} font-bold text-gray-400 uppercase tracking-widest`}>{t.item}: </span>
                    {isProductVisible && (
                      <span className={`font-bold text-gray-800 ${getFontSize(itemName, isMulti ? (isHindi ? 'text-[26px]' : 'text-[22px]') : 'text-[34px]', 30)}`}>
                        {itemName}
                      </span>
                    )}
                  </p>
                  <input 
                    type="checkbox" 
                    checked={isProductVisible}
                    onChange={(e) => onVisibilityChange?.(label.id, 'product', e.target.checked, lang)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-opacity cursor-pointer print:hidden absolute -left-8"
                  />
                </div>

                {/* Quantity & City Row */}
                <div className={`flex items-center ${isMulti ? (isReduced ? 'gap-12 pt-6' : 'gap-8 pt-2') : (isReduced ? 'gap-24 pt-16' : 'gap-16 pt-8')}`}>
                  <div className="flex items-center gap-4 group/field relative">
                    <div className={`flex items-center gap-3 ${!isQuantityVisible ? 'opacity-25' : ''}`}>
                      <span className={`${isMulti ? (isHindi ? 'text-[18px]' : 'text-[14px]') : 'text-[24px]'} font-bold text-gray-400 uppercase tracking-widest`}>{t.qty}: </span>
                      {isQuantityVisible && (
                        <span className={`${isMulti ? 'text-[38px]' : 'text-[62px]'} font-black text-black leading-none whitespace-nowrap`}>{label.quantity}</span>
                      )}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isQuantityVisible}
                      onChange={(e) => onVisibilityChange?.(label.id, 'quantity', e.target.checked, lang)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-opacity cursor-pointer print:hidden absolute -left-8"
                    />
                  </div>

                  {label.bdlQty !== undefined && (
                    <div className={`flex items-center gap-4 ${isMulti ? 'pl-6' : 'pl-12'} ${isQuantityVisible ? 'border-l border-gray-100' : ''}`}>
                      <span className={`${isMulti ? (isHindi ? (isReduced ? 'text-[24px]' : 'text-[18px]') : (isReduced ? 'text-[20px]' : 'text-[14px]')) : (isReduced ? 'text-[32px]' : 'text-[22px]')} font-bold text-gray-400 uppercase tracking-widest`}>{t.bundles}: </span>
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={label.bdlQty} 
                          onChange={(e) => onBundleChange?.(label.id, e.target.value)}
                          className={`${isMulti ? (isReduced ? 'text-[48px]' : 'text-[38px]') : (isReduced ? 'text-[72px]' : 'text-[62px]')} font-black text-gray-700 leading-none whitespace-nowrap bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-[1.5em] text-left hover:bg-slate-50 focus:bg-white rounded transition-colors print:p-0 print:m-0 print:bg-transparent print:hover:bg-transparent`}
                          placeholder="0"
                        />
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-200 print:bg-black group-hover:bg-blue-400 transition-colors" />
                      </div>
                    </div>
                  )}

                  <div className={`flex items-center gap-4 ${isMulti ? 'pl-6' : 'pl-12'} ${(isQuantityVisible || label.bdlQty !== undefined) ? 'border-l border-gray-100' : ''}`}>
                    <span className={`${isMulti ? (isHindi ? (isReduced ? 'text-[24px]' : 'text-[18px]') : (isReduced ? 'text-[20px]' : 'text-[14px]')) : (isReduced ? 'text-[32px]' : 'text-[22px]')} font-bold text-gray-400 uppercase tracking-widest`}>{t.city}: </span>
                    <span className={`${isMulti ? (isReduced ? 'text-[40px]' : 'text-[28px]') : (isReduced ? 'text-[60px]' : 'text-[44px]')} font-black text-gray-800 uppercase whitespace-nowrap`}>{getCityName(lang)}</span>
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

