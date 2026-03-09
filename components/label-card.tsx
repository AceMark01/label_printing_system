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
  en: { party: 'PARTY', item: 'ITEM', qty: 'QTY' },
  hi: { party: 'पार्टी', item: 'आइटम', qty: 'मात्रा' },
  ta: { party: 'கட்சி', item: 'பொருள்', qty: 'அளவு' },
  te: { party: 'పార్టీ', item: 'వస్తువు', qty: 'పరిమాణం' },
  mr: { party: 'पार्टी', item: 'वस्तू', qty: 'प्रमाण' },
  gu: { party: 'પક્ષ', item: 'વસ્તુ', qty: 'જથ્થો' },
  kn: { party: 'ಪಕ್ಷ', item: 'ವಸ್ತು', qty: 'ಪ್ರಮಾಣ' },
  od: { party: 'ପାର୍ଟି', item: 'ଜିନିଷ', qty: 'ପରିମାଣ' },
};

export function LabelCard({ label, languages }: LabelCardProps) {
  const sortedLanguages = Array.from(languages).sort();
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

            newTranslations[lang] = {
              party: partyData.translatedText || label.party,
              item: itemData.translatedText || label.item,
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

  const getPartyName = (lang: Language): string => {
    if (lang === 'en') return label.party;
    return translations[lang]?.party || (label.partyNames?.[lang]) || label.party;
  };

  const getItemName = (lang: Language): string => {
    if (lang === 'en') return label.item;
    return translations[lang]?.item || (label.itemNames?.[lang]) || label.item;
  };

  return (
    <div className="relative bg-white rounded-lg sm:rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all print:shadow-none print:rounded-none print:border-2 print:border-blue-300 print:break-inside-avoid min-h-[300px]">
      {/* Top Brand Bar with ACE Logo */}
      <div className="h-10 sm:h-12 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 flex items-center justify-between px-3 print:h-14">
        <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg p-1 shadow-inner border border-blue-200/50">
          <Image
            src="/logo1.png"
            alt="Logo"
            fill
            className="object-contain print:block"
            priority
          />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter print:text-2xs leading-none">Order No.</p>
          <p className="text-xs sm:text-sm font-black text-white print:text-sm leading-tight">
            {label.originalData?.SOrderNo || label.originalData?.OrderNo || label.id}
          </p>
        </div>
      </div>

      <div className="p-3 sm:p-4 print:p-4">
        {/* Location Badge */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 print:mb-2">
          <p className="text-sm font-bold text-blue-900">{label.city}</p>
          {isTranslating && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
        </div>

        {/* Content - Multiple Languages */}
        <div className="space-y-4 print:space-y-4">
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;

            return (
              <div key={lang} className={!isLast ? 'pb-3 border-b border-blue-50' : ''}>
                {/* Headers & Values */}
                <div className="space-y-2">
                  <div>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none mb-1">
                      {t.party}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                      {getPartyName(lang)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none mb-1">
                      {t.item}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-blue-800 leading-tight">
                      {getItemName(lang)}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none">
                        {t.qty}
                      </p>
                      <p className="text-xl font-black text-blue-900">
                        {label.quantity}
                      </p>
                    </div>

                    {/* Bdl Qty if available */}
                    {label.bdlQty && lang === 'en' && (
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider leading-none">Bdl Qty</p>
                        <p className="text-base font-black text-green-700">{label.bdlQty}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Remark - Single appearance at bottom */}
        {label.remark && (
          <div className="mt-3 bg-orange-50 rounded-lg p-2 border border-orange-100">
            <p className="text-[9px] font-bold text-orange-600 uppercase tracking-wider leading-none mb-1">Remark</p>
            <p className="text-[11px] font-bold text-gray-800">{label.remark}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 sm:mt-4 pt-2 border-t border-blue-50 flex justify-between items-center text-[9px] print:mt-3 print:pt-2">
          <p className="text-gray-400 font-bold tracking-tighter print:text-2xs uppercase">
            {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <div className="text-right">
            <p className="text-blue-700 font-black tracking-widest print:text-2xs">ACE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
