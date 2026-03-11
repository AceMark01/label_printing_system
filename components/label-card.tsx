'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Label, Language } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface LabelCardProps {
  label: Label;
  languages: Language[];
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


export function LabelCard({ label, languages }: LabelCardProps) {
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
    if (text.length > limit * 2.5) return 'text-[10px] sm:text-sm';
    if (text.length > limit * 1.8) return 'text-sm sm:text-lg';
    if (text.length > limit) return 'text-lg sm:text-2xl';
    return baseSize;
  };

  const getPartyName = (lang: Language): string => {
    if (lang === 'en') return label.party;
    return translations[lang]?.party || (label.partyNames?.[lang]) || label.party;
  };

  const getItemName = (lang: Language): string => {
    if (lang === 'en') return label.item;
    return translations[lang]?.item || (label.itemNames?.[lang]) || label.item;
  };

  const getCityName = (lang: Language): string => {
    if (lang === 'en') return label.city;
    return translations[lang]?.city || label.city;
  };

  return (
    <div className="relative bg-white overflow-hidden border border-gray-400 print:border-2 print:border-black w-full h-full flex flex-col font-sans">
      {/* Top Header - Large Logo (Compacted) */}
      <div className="h-12 sm:h-16 bg-gray-100 border-b border-gray-300 flex items-center px-4 print:h-18 print:bg-white print:border-b-2 print:border-black relative z-10">
        <div className="flex items-center">
          <div className="relative w-28 h-8 sm:w-36 sm:h-10 print:w-44 print:h-14">
            <Image src="/ace.png" alt="Logo" fill className="object-contain object-left" priority />
          </div>
        </div>
      </div>

      {/* Main Body - Balanced to fill space without overflow */}
      <div className="flex-1 flex flex-col p-3 sm:p-5 justify-center bg-white relative z-10">
        <div className="space-y-4 print:space-y-6">
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;
            const partyName = getPartyName(lang);
            const itemName = getItemName(lang);

            return (
              <div key={lang} lang={lang} className={`${!isLast ? 'pb-4 border-b border-dashed border-gray-100 print:border-black' : ''} space-y-1`}>
                {/* Party Name */}
                <p className="leading-tight break-words">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">{t.party}: </span>
                  <span className={`font-black text-black ${getFontSize(partyName, 'text-xl sm:text-4xl', 20)}`}>
                    {partyName}
                  </span>
                </p>

                {/* Product/Item */}
                <p className="leading-tight break-words">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">{t.item}: </span>
                  <span className={`font-bold text-gray-900 ${getFontSize(itemName, 'text-lg sm:text-2xl', 30)}`}>
                    {itemName}
                  </span>
                </p>

                {/* Qty & Bundles Row - Structured */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{t.qty}: </span>
                    <span className="text-3xl sm:text-6xl font-black text-black tabular-nums">
                      {label.quantity}
                    </span>
                  </div>

                  {label.bdlQty && (
                    <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{t.bundles || 'Bundles'}: </span>
                      <span className="text-xl sm:text-2xl font-black text-gray-800 tabular-nums">
                        {label.bdlQty}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">{t.city}: </span>
                    <span className="text-xs sm:text-sm font-black text-gray-800 uppercase">
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
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 text-gray-400">
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
