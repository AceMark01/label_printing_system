'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Label, Language } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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

  ta: {
    party: 'பார்ட்டி நேம்',
    item: 'ப்ராடக்ட்',
    qty: 'குவாண்டிட்டி',
    bundles: 'பண்டல்கள்',
    city: 'சிட்டி'
  },

  te: {
    party: 'పార్టీ నేమ్',
    item: 'ప్రొడక్ట్',
    qty: 'క్వాంటిటీ',
    bundles: 'బండిల్స్',
    city: 'సిటీ'
  },

  mr: {
    party: 'पार्टी नेम',
    item: 'प्रॉडक्ट',
    qty: 'क्वांटिटी',
    bundles: 'बंडल',
    city: 'सिटी'
  },

  gu: {
    party: 'પાર્ટી નેમ',
    item: 'પ્રોડક્ટ',
    qty: 'ક્વોન્ટિટી',
    bundles: 'બંડલ',
    city: 'સિટી'
  },

  kn: {
    party: 'ಪಾರ್ಟಿ ನೇಮ್',
    item: 'ಪ್ರೊಡಕ್ಟ್',
    qty: 'ಕ್ವಾಂಟಿಟಿ',
    bundles: 'ಬಂಡಲ್',
    city: 'ಸಿಟಿ'
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
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
      const nonEnLangs = sortedLanguages.filter(l => l !== 'en');
      if (nonEnLangs.length === 0) return;

      setIsTranslating(true);
      const newTranslations: Record<string, Record<string, string>> = { ...translations };
      let changed = false;

      for (const lang of nonEnLangs) {
        // Skip if we already have sheet data for this language
        const hasSheetData = label.partyNames?.[lang] && label.itemNames?.[lang];
        if (hasSheetData) continue;

        if (!newTranslations[lang]) {
          try {
            // Translate Party
            const partyRes = await fetch('/api/translate', {
              method: 'POST',
              body: JSON.stringify({ text: label.party, target: lang }),
            });
            const partyData = await partyRes.json();

            // Translate Item
            const itemRes = await fetch('/api/translate', {
              method: 'POST',
              body: JSON.stringify({ text: label.item, target: lang }),
            });
            const itemData = await itemRes.json();

            // Translate City
            const cityRes = await fetch('/api/translate', {
              method: 'POST',
              body: JSON.stringify({ text: label.city, target: lang }),
            });
            const cityData = await cityRes.json();

            newTranslations[lang] = {
              party: partyData.translatedText || label.party,
              item: itemData.translatedText || label.item,
              city: cityData.translatedText || label.city,
            };
            changed = true;
          } catch (e) {
            console.error(`Translation error for ${lang}:`, e);
          }
        }
      }

      if (changed) {
        setTranslations(newTranslations);
      }
      setIsTranslating(false);
    };

    fetchTranslations();
  }, [sortedLanguages.length, label.id]);

  const getFontSize = (text: string, baseSize: string, limit: number = 20) => {
    if (!text) return baseSize;
    // Refined scaling for better space utilization in print
    if (text.length > limit * 2.5) return 'text-xs sm:text-base print:text-base';
    if (text.length > limit * 1.8) return 'text-base sm:text-2xl print:text-2xl';
    if (text.length > limit) return 'text-2xl sm:text-4xl print:text-4xl';
    return baseSize;
  };

  const getPartyName = (lang: Language): string => {
    if (lang === 'en') return label.party;
    return (label.partyNames?.[lang]) || translations[lang]?.party || label.party;
  };

  const getItemName = (lang: Language): string => {
    if (lang === 'en') return label.item;
    return (label.itemNames?.[lang]) || translations[lang]?.item || label.item;
  };

  const getCityName = (lang: Language): string => {
    if (lang === 'en') return label.city;
    return (label.cityNames?.[lang]) || translations[lang]?.city || label.city;
  };

  return (
    <div className="relative bg-white overflow-hidden border border-gray-400 print:border-2 print:border-black w-full h-full flex flex-col font-sans">

      {/* Main Body - Centered to match Live Preview feel (but start higher in print to utilize space) */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 print:p-1 justify-center print:justify-start print:pt-6 bg-white relative z-10 overflow-hidden">
        <div className="w-full space-y-6 print:space-y-4">
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;
            const partyName = getPartyName(lang);
            const itemName = getItemName(lang);

            const isTamil = lang === 'ta';
            const isHindi = lang === 'hi';

            return (
              <div key={lang} lang={lang} className={`${!isLast ? (isTamil ? 'pb-3 mb-2' : isHindi ? 'pb-5 mb-4' : 'pb-4 mb-3') + ' border-b border-dashed border-gray-200 print:border-black' : ''} space-y-2 sm:space-y-3`}>
                <div className="space-y-1">
                  {/* Party Name - Always visible or potentially toggleable? Prompt said Product and Quantity */}
                  <p className="leading-tight break-words">
                    <span className={`font-bold text-gray-400 uppercase tracking-widest ${isTamil ? 'text-xs sm:text-sm print:text-sm' : isHindi ? 'text-base sm:text-lg print:text-base' : 'text-sm sm:text-base print:text-sm'}`}>{t.party}: </span>
                    <span className={`font-black text-black ${getFontSize(partyName, isTamil ? 'text-2xl sm:text-4xl print:text-3xl' : isHindi ? 'text-5xl sm:text-7xl print:text-5xl' : 'text-4xl sm:text-6xl print:text-4xl', 20)}`}>
                      {partyName}
                    </span>
                  </p>

                  {/* Product/Item */}
                  <div className="flex items-start gap-2">
                    {(fieldVisibility?.[lang]?.product !== false) && (
                      <p className="leading-tight break-words">
                        <span className={`font-bold text-gray-400 uppercase tracking-widest ${isTamil ? 'text-xs sm:text-sm print:text-sm' : isHindi ? 'text-base sm:text-lg print:text-base' : 'text-sm sm:text-base print:text-sm'}`}>{t.item}: </span>
                        <span className={`font-bold text-gray-900 ${getFontSize(itemName, isTamil ? 'text-xl sm:text-2xl print:text-2xl' : isHindi ? 'text-3xl sm:text-5xl print:text-4xl' : 'text-2xl sm:text-4xl print:text-3xl', 30)}`}>
                          {itemName}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Qty & Bundles Row - Structured */}
                <div className="flex items-center gap-4 pt-3 print:pt-2">
                  <div className="flex items-center gap-3">
                    {fieldVisibility?.[lang]?.quantity !== false && (
                      <>
                        <span className={`font-bold text-gray-400 uppercase tracking-widest ${isTamil ? 'text-xs sm:text-sm print:text-sm' : isHindi ? 'text-base sm:text-lg print:text-base' : 'text-sm sm:text-base print:text-sm'}`}>{t.qty}: </span>
                        <span className={`font-black text-black tabular-nums ${isTamil ? 'text-2xl sm:text-4xl print:text-2xl' : isHindi ? 'text-5xl sm:text-6xl print:text-4xl' : 'text-4xl sm:text-5xl print:text-3xl'}`}>
                          {label.quantity}
                        </span>
                      </>
                    )}
                  </div>

                  {label.bdlQty && (
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200 print:border-black">
                      <span className={`font-bold text-gray-400 uppercase tracking-widest ${isTamil ? 'text-xs sm:text-sm print:text-sm' : isHindi ? 'text-base sm:text-lg print:text-base' : 'text-sm sm:text-base print:text-sm'}`}>{t.bundles || 'Bundles'}: </span>
                      <span className={`font-black text-gray-800 tabular-nums ${isTamil ? 'text-2xl sm:text-4xl print:text-2xl' : isHindi ? 'text-5xl sm:text-6xl print:text-4xl' : 'text-4xl sm:text-5xl print:text-3xl'}`}>
                        {label.bdlQty}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pl-3 border-l border-gray-200 print:border-black">
                    <span className={`font-bold text-gray-400 uppercase tracking-widest ${isTamil ? 'text-xs sm:text-sm print:text-sm' : isHindi ? 'text-base sm:text-lg print:text-base' : 'text-sm sm:text-base print:text-sm'}`}>{t.city}: </span>
                    <span className={`font-black text-gray-800 uppercase tracking-tight ${isTamil ? 'text-xl sm:text-2xl print:text-lg' : isHindi ? 'text-2xl sm:text-4xl print:text-2xl' : 'text-xl sm:text-3xl print:text-xl'}`}>
                      {getCityName(lang)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Bar - Slim */}
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 text-gray-400 print:text-black">
        <div className="flex items-baseline gap-1">
          <span className="text-[7px] font-black uppercase tracking-widest">DATE:</span>
          <span className="text-[10px] font-bold tabular-nums">
            {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-0.5 bg-gray-200" />
          <p className="text-[10px] font-black tracking-[0.3em] italic uppercase">Ace</p>
        </div>
      </div>
    </div>
  );
}
