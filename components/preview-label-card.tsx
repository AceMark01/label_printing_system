'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Label, Language } from '@/lib/types';

interface PreviewLabelCardProps {
    label: Label;
    languages: Language[];
    fieldVisibility?: Record<Language, { product: boolean, quantity: boolean }>;
    onToggleField?: (lang: Language, field: 'product' | 'quantity') => void;
    onUpdateBundle?: (labelId: string, value: string) => void;
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

export function PreviewLabelCard({ label, languages, fieldVisibility, onToggleField, onUpdateBundle }: PreviewLabelCardProps) {
    const sortedLanguages = Array.from(languages).sort((a, b) => {
        if (a === 'hi') return -1;
        if (b === 'hi') return 1;
        return a.localeCompare(b);
    });

    const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        const fetchTranslations = async () => {
            const nonEnLangs = sortedLanguages.filter(l => l !== 'en');
            if (nonEnLangs.length === 0) return;

            const newTranslations: Record<string, Record<string, string>> = { ...translations };
            let changed = false;

            for (const lang of nonEnLangs) {
                // Skip if we already have sheet data for this language
                const hasSheetData = label.partyNames?.[lang] && label.itemNames?.[lang];
                if (hasSheetData) continue;

                if (!newTranslations[lang]) {
                    try {
                        const [partyRes, itemRes, cityRes] = await Promise.all([
                            fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: label.party, target: lang }) }),
                            fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: label.item, target: lang }) }),
                            fetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: label.city, target: lang }) })
                        ]);

                        const [partyData, itemData, cityData] = await Promise.all([
                            partyRes.json(),
                            itemRes.json(),
                            cityRes.json()
                        ]);

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

            if (changed) setTranslations(newTranslations);
        };

        fetchTranslations();
    }, [sortedLanguages.length, label.id]);

    const getFontSize = (text: string, baseSize: string, limit: number = 20) => {
        if (!text) return baseSize;
        const isMulti = sortedLanguages.length > 1;
        // Adjusted thresholds and sizes for better space utilization
        if (text.length > limit * 2.5) return isMulti ? 'text-[8px] sm:text-[10px]' : 'text-[12px] sm:text-sm';
        if (text.length > limit * 1.8) return isMulti ? 'text-[10px] sm:text-xs' : 'text-base sm:text-xl';
        if (text.length > limit) return isMulti ? 'text-xs sm:text-base' : 'text-xl sm:text-3xl';
        return baseSize;
    };

    const getPartyName = (lang: Language) => lang === 'en' ? label.party : (label.partyNames?.[lang] || translations[lang]?.party || label.party);
    const getItemName = (lang: Language) => lang === 'en' ? label.item : (label.itemNames?.[lang] || translations[lang]?.item || label.item);
    const getCityName = (lang: Language) => lang === 'en' ? label.city : (label.cityNames?.[lang] || translations[lang]?.city || label.city);

    const isMulti = sortedLanguages.length > 1;

    return (
        <div className="relative bg-white w-full h-full flex flex-col font-sans border border-gray-200 shadow-sm rounded-lg overflow-hidden">

            {/* Content Area - Balanced for better space utilization */}
            <div className={`flex-1 ${isMulti ? 'p-1.5 sm:p-3' : 'p-3 sm:p-5'} flex flex-col justify-center bg-white overflow-hidden`}>
                <div className={`w-full ${isMulti ? 'space-y-1 sm:space-y-2' : 'space-y-4 sm:space-y-6'}`}>
                    {sortedLanguages.map((lang, idx) => {
                        const t = labelTranslations[lang];
                        const isLast = idx === sortedLanguages.length - 1;
                        const partyName = getPartyName(lang);
                        const itemName = getItemName(lang);

                        const isTamil = lang === 'ta';
                        const isHindi = lang === 'hi';

                        return (
                            <div key={lang} className={`${!isLast && isMulti ? (isTamil ? 'pb-1.5 sm:pb-2' : isHindi ? 'pb-2 sm:pb-3' : 'pb-1 sm:pb-2') + ' border-b border-dashed border-gray-100' : !isLast ? 'pb-8 border-b border-dashed' : ''} space-y-1`}>
                                <div className="space-y-1">
                                    {/* Party Name - Always visible */}
                                    <p className="leading-tight truncate sm:whitespace-normal">
                                        <span className={`${isMulti ? (isTamil ? 'text-[10px] sm:text-xs' : isHindi ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs') : 'text-sm sm:text-base'} font-bold text-gray-400 uppercase tracking-widest`}>{t.party}: </span>
                                        <span className={`font-black text-gray-900 ${getFontSize(partyName, isMulti ? (isTamil ? 'text-sm sm:text-base' : isHindi ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl') : 'text-3xl sm:text-4xl', 20)}`}>
                                            {partyName}
                                        </span>
                                    </p>

                                    {/* Product/Item */}
                                    <div className="flex items-start gap-2">
                                        {onToggleField && (
                                            <input
                                                type="checkbox"
                                                checked={fieldVisibility?.[lang]?.product !== false}
                                                onChange={() => onToggleField(lang, 'product')}
                                                className="mt-1 w-4 h-4 cursor-pointer"
                                            />
                                        )}
                                        {fieldVisibility?.[lang]?.product !== false && (
                                            <p className="leading-tight truncate sm:whitespace-normal mb-1 sm:mb-2 text-grey-400">
                                                <span className={`${isMulti ? (isTamil ? 'text-[10px] sm:text-xs' : isHindi ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs') : 'text-lg'} font-bold text-gray-400 uppercase tracking-widest`}>{t.item}: </span>
                                                <span className={`font-bold ${getFontSize(itemName, isMulti ? (isTamil ? 'text-[10px] sm:text-base' : isHindi ? 'text-sm sm:text-xl' : 'text-xs sm:text-lg') : 'text-xl sm:text-2xl', 30)}`}>
                                                    {itemName}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className={`flex items-center ${isMulti ? 'gap-1 pt-0' : 'gap-4 pt-4'}`}>
                                    <div className="flex items-center gap-2">
                                        {onToggleField && (
                                            <input
                                                type="checkbox"
                                                checked={fieldVisibility?.[lang]?.quantity !== false}
                                                onChange={() => onToggleField(lang, 'quantity')}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                        )}
                                        {fieldVisibility?.[lang]?.quantity !== false && (
                                            <div className="flex items-center gap-2 text-grey-400">
                                                <span className={`${isMulti ? (isTamil ? 'text-[10px] sm:text-xs' : isHindi ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs') : 'text-lg'} font-bold text-gray-400 uppercase tracking-widest`}>{t.qty}: </span>
                                                <span className={`${isMulti ? (isTamil ? 'text-base sm:text-lg' : isHindi ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl') : 'text-3xl sm:text-4xl'} font-black`}>{label.quantity}</span>
                                            </div>
                                        )}
                                    </div>
                                    {label.bdlQty !== undefined && (
                                        <div className={`flex items-center gap-2 ${isMulti ? 'pl-2' : 'pl-4'} border-l border-gray-100`}>
                                            <span className={`${isMulti ? (isTamil ? 'text-[10px] sm:text-xs' : isHindi ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs') : 'text-sm sm:text-base'} font-bold text-gray-400 uppercase tracking-widest`}>{t.bundles}: </span>
                                            {onUpdateBundle ? (
                                                <input
                                                    type="number"
                                                    value={label.bdlQty}
                                                    onChange={(e) => onUpdateBundle(label.id, e.target.value)}
                                                    className={`${isMulti ? (isTamil ? 'text-base sm:text-lg' : isHindi ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl') : 'text-3xl sm:text-4xl'} font-black text-gray-700 ${isMulti ? 'w-12' : 'w-24'} bg-transparent border-b-2 border-blue-200 focus:border-blue-500 outline-none hover:bg-blue-50/50 transition-colors p-0 text-center`}
                                                />
                                            ) : (
                                                <span className={`${isMulti ? (isTamil ? 'text-base sm:text-lg' : isHindi ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl') : 'text-3xl sm:text-4xl'} font-black text-gray-700`}>{label.bdlQty}</span>
                                            )}
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-2 ${isMulti ? 'pl-2' : 'pl-4'} border-l`}>
                                        <span className={`${isMulti ? (isTamil ? 'text-[10px] sm:text-xs' : isHindi ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs') : 'text-sm sm:text-base'} font-bold text-gray-400 uppercase tracking-widest`}>{t.city}: </span>
                                        <span className={`${isMulti ? (isTamil ? 'text-sm sm:text-base' : isHindi ? 'text-base sm:text-lg' : 'text-base sm:text-lg') : 'text-xl sm:text-2xl'} font-black text-gray-800 uppercase`}>{getCityName(lang)}</span>
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
