'use client';

import Image from 'next/image';
import type { Label, Language } from '@/lib/types';

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

  const getPartyName = (lang: Language): string => {
    if (lang === 'en') return label.party;
    if (!label.partyNames) return label.party;
    return label.partyNames[lang] || label.party;
  };

  const getItemName = (lang: Language): string => {
    if (lang === 'en') return label.item;
    if (!label.itemNames) return label.item;
    return label.itemNames[lang] || label.item;
  };

  return (
    <div className="relative bg-white rounded-lg sm:rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all print:shadow-none print:rounded-none print:border-2 print:border-blue-300 print:break-inside-avoid">
      {/* Top Brand Bar with ACE Logo */}
      <div className="h-10 sm:h-12 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 flex items-center justify-between px-3 print:h-14">
        <div className="relative w-7 h-7 sm:w-8 sm:h-8">
          <Image
            src="/ace-logo.png"
            alt="ACE Logo"
            fill
            className="object-contain print:w-10 print:h-10"
            priority
          />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter print:text-2xs leading-none">Order No.</p>
          <p className="text-xs sm:text-sm font-black text-white print:text-sm leading-tight">{label.originalData?.SOrderNo || label.originalData?.OrderNo || label.id}</p>
        </div>
      </div>

      <div className="p-3 sm:p-4 print:p-4">
        {/* Location Badge */}
        <div className="flex justify-end mb-2 sm:mb-3 print:mb-2">
          <span className="inline-block bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold print:text-2xs">
            {label.city}
          </span>
        </div>

        {/* Content - Multiple Languages */}
        <div className="space-y-3 sm:space-y-4 print:space-y-3">
          {sortedLanguages.map((lang, idx) => {
            const t = labelTranslations[lang];
            const isLast = idx === sortedLanguages.length - 1;

            return (
              <div key={lang} className={!isLast ? 'pb-3 sm:pb-4 border-b border-blue-100 print:pb-3' : ''}>
                {/* Party */}
                <div className="mb-2 sm:mb-2.5 print:mb-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5 print:text-2xs">
                    {t.party}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight break-words print:text-sm">
                    {getPartyName(lang)}
                  </p>
                </div>

                {/* Item - Translated Name */}
                <div className="mb-2 sm:mb-3 print:mb-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5 print:text-2xs">
                    {t.item}
                  </p>
                  <p className="text-xs font-semibold text-blue-800 leading-tight break-words print:text-sm">
                    {getItemName(lang)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2.5 sm:p-3 border border-blue-200 print:p-3 print:border-blue-300">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 print:mb-1 print:text-2xs">
                    {t.qty}
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-transparent bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text print:text-3xl">
                    {label.quantity}
                  </p>

                  {/* Remark & BdlQty */}
                  {(label.remark || label.bdlQty) && (
                    <div className="grid grid-cols-2 gap-3 mt-3 print:mt-2">
                      {label.remark && (
                        <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-0.5 print:text-2xs">Remark</p>
                          <p className="text-sm font-bold text-gray-800 break-words print:text-xs">{label.remark}</p>
                        </div>
                      )}
                      {label.bdlQty && (
                        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-0.5 print:text-2xs">Bdl Qty</p>
                          <p className="text-sm font-black text-gray-800 print:text-xs">{label.bdlQty}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-blue-100 flex justify-between items-center text-[10px] print:mt-3 print:pt-2">
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
