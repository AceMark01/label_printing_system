'use client';

import Image from 'next/image';
import type { Label, Language } from '@/lib/types';

interface LabelCardProps {
  label: Label;
  languages: Language[];
  fieldVisibility?: Record<Language, { product: boolean, quantity: boolean }>;
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

export function LabelCard({ label, languages, fieldVisibility }: LabelCardProps) {
  const sortedLanguages = Array.from(languages).sort((a, b) => {
    if (a === 'hi') return -1;
    if (b === 'hi') return 1;
    return a.localeCompare(b);
  });

  const getFontSize = (text: string, baseSize: string, limit: number = 20) => {
    if (!text) return baseSize;
    if (text.length > limit * 2.5) return 'text-xs sm:text-base print:text-base';
    if (text.length > limit * 1.8) return 'text-base sm:text-2xl print:text-2xl';
    if (text.length > limit) return 'text-2xl sm:text-4xl print:text-4xl';
    return baseSize;
  };

  const getPartyName = (lang: Language): string => {
    if (lang === 'en') return label.party;
    return (label.partyNames?.[lang]) || label.party;
  };

  const getItemName = (lang: Language): string => {
    if (lang === 'en') return label.item;
    return (label.itemNames?.[lang]) || label.item;
  };

  const getCityName = (lang: Language): string => {
    if (lang === 'en') return label.city;
    return (label.cityNames?.[lang]) || label.city;
  };

  return (
    <div className="relative bg-white border-[2px] border-black w-full h-full flex flex-col font-sans print:border-[3px] print:shadow-none">
      {/* Main Body */}
      <div className="flex-1 flex flex-col p-6 sm:p-8 print:p-5 justify-start bg-white relative overflow-hidden">
        <div className="w-full space-y-6 print:space-y-4">
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;
            const partyName = getPartyName(lang);
            const itemName = getItemName(lang);
            const cityName = getCityName(lang);
            const isHindi = lang === 'hi';
            const isOdia = lang === 'od';

            return (
              <div 
                key={lang} 
                lang={lang} 
                className={`${!isLast ? 'pb-6 mb-4 border-b-2 border-dashed border-gray-200 print:pb-4 print:mb-2' : ''} space-y-4 print:space-y-2`}
              >
                {/* Party Row */}
                <div className="flex items-start gap-4">
                  <span className={`font-black uppercase tracking-wider text-gray-400 whitespace-nowrap pt-2 ${isHindi || isOdia ? 'text-[10px] print:text-[8px]' : 'text-[8px] print:text-[6px]'} min-w-[70px] print:min-w-[50px]`}>
                    {t.party}:
                  </span>
                  <h2 className={`font-black text-black leading-[1.1] break-words uppercase flex-1 ${getFontSize(partyName, 'text-4xl sm:text-6xl print:text-4xl', 15)}`}>
                    {partyName}
                  </h2>
                </div>

                {/* Product Row */}
                {(fieldVisibility?.[lang]?.product !== false) && (
                  <div className="flex items-start gap-4">
                    <span className={`font-black uppercase tracking-wider text-gray-400 whitespace-nowrap pt-1 ${isHindi || isOdia ? 'text-[10px] print:text-[8px]' : 'text-[8px] print:text-[6px]'} min-w-[70px] print:min-w-[50px]`}>
                      {t.item}:
                    </span>
                    <h3 className={`font-extrabold text-gray-800 leading-tight break-words flex-1 ${getFontSize(itemName, 'text-2xl sm:text-4xl print:text-2xl', 25)}`}>
                      {itemName}
                    </h3>
                  </div>
                )}

                {/* Details Row (Qty, Bdl, City) */}
                <div className="flex items-end gap-6 print:gap-4 pt-2">
                  {/* Quantity */}
                  <div className="flex flex-col">
                    <span className={`font-black uppercase tracking-wider text-gray-400 ${isHindi || isOdia ? 'text-[10px] print:text-[8px]' : 'text-[8px] print:text-[6px]'}`}>
                      {t.qty}
                    </span>
                    <span className="font-black text-black text-4xl sm:text-6xl print:text-3xl tabular-nums leading-none">
                      {label.quantity}
                    </span>
                  </div>

                  {/* Bundles */}
                  {label.bdlQty && (
                    <div className="flex flex-col border-l-2 border-black pl-6 print:pl-4">
                      <span className={`font-black uppercase tracking-wider text-gray-400 ${isHindi || isOdia ? 'text-[10px] print:text-[8px]' : 'text-[8px] print:text-[6px]'}`}>
                        {t.bundles || 'Bundles'}
                      </span>
                      <span className="font-black text-gray-900 text-3xl sm:text-5xl print:text-2xl tabular-nums leading-none">
                        {label.bdlQty}
                      </span>
                    </div>
                  )}

                  {/* City */}
                  <div className="flex flex-col border-l-2 border-black pl-6 print:pl-4">
                    <span className={`font-black uppercase tracking-wider text-gray-400 ${isHindi || isOdia ? 'text-[10px] print:text-[8px]' : 'text-[8px] print:text-[6px]'}`}>
                      {t.city}
                    </span>
                    <span className="font-black text-black text-3xl sm:text-6xl print:text-4xl uppercase tracking-tighter leading-none whitespace-nowrap">
                      {cityName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="h-10 bg-white border-t border-gray-100 flex items-center justify-between px-6 print:h-8 print:px-4">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">DATE:</span>
          <span className="text-[10px] font-bold tabular-nums text-gray-600">
            {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-[1px] bg-gray-100" />
          <div className="relative w-12 h-6 print:w-10 print:h-5">
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
