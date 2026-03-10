'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { Label, Language } from '@/lib/types';

interface PreviewLabelCardProps {
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
        party: 'पार्टी नेम',
        item: 'प्रोडक्ट',
        qty: 'क्வாंटीटी',
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

export function PreviewLabelCard({ label, languages }: PreviewLabelCardProps) {
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
        if (text.length > limit * 2.5) return isMulti ? 'text-[8px] sm:text-[10px]' : 'text-[10px] sm:text-xs';
        if (text.length > limit * 1.8) return isMulti ? 'text-[10px] sm:text-xs' : 'text-sm sm:text-lg';
        if (text.length > limit) return isMulti ? 'text-xs sm:text-base' : 'text-lg sm:text-2xl';
        return baseSize;
    };

    const getPartyName = (lang: Language) => lang === 'en' ? label.party : translations[lang]?.party || label.party;
    const getItemName = (lang: Language) => lang === 'en' ? label.item : translations[lang]?.item || label.item;
    const getCityName = (lang: Language) => lang === 'en' ? label.city : translations[lang]?.city || label.city;

    const isMulti = sortedLanguages.length > 1;

    return (
        <div className="relative bg-white w-full h-full flex flex-col font-sans border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            {/* Premium Header - More compact if multi */}
            <div className={`${isMulti ? 'h-10 sm:h-12' : 'h-14 sm:h-16'} bg-gradient-to-r from-gray-50 to-white border-b flex items-center px-4 transition-all`}>
                <div className={`relative ${isMulti ? 'w-24 h-6 sm:w-28 sm:h-8' : 'w-32 h-10'}`}>
                    <Image src="/ace.png" alt="Logo" fill className="object-contain object-left" priority />
                </div>
            </div>

            {/* Content Area - Aggressively compacted for multi-language */}
            <div className={`flex-1 ${isMulti ? 'p-2 sm:p-3' : 'p-4 sm:p-8'} flex flex-col justify-center bg-white overflow-hidden`}>
                <div className={`w-full ${isMulti ? 'space-y-1 sm:space-y-2' : 'space-y-6 sm:space-y-10'}`}>
                    {sortedLanguages.map((lang, idx) => {
                        const t = labelTranslations[lang];
                        const isLast = idx === sortedLanguages.length - 1;
                        const partyName = getPartyName(lang);
                        const itemName = getItemName(lang);

                        return (
                            <div key={lang} className={`${!isLast && isMulti ? 'pb-1 sm:pb-2 border-b border-dashed border-gray-100' : !isLast ? 'pb-6 border-b border-dashed' : ''} space-y-0`}>
                                <p className="leading-tight truncate sm:whitespace-normal">
                                    <span className={`${isMulti ? 'text-[8px] sm:text-[10px]' : 'text-xs'} font-bold text-gray-500 uppercase tracking-widest`}>{t.party}: </span>
                                    <span className={`font-black text-gray-900 ${getFontSize(partyName, isMulti ? 'text-sm sm:text-xl' : 'text-4xl', 20)}`}>
                                        {partyName}
                                    </span>
                                </p>
                                <p className="leading-tight truncate sm:whitespace-normal">
                                    <span className={`${isMulti ? 'text-[8px] sm:text-[10px]' : 'text-xs'} font-bold text-gray-500 uppercase tracking-widest`}>{t.item}: </span>
                                    <span className={`font-bold text-gray-800 ${getFontSize(itemName, isMulti ? 'text-xs sm:text-base' : 'text-2xl', 30)}`}>
                                        {itemName}
                                    </span>
                                </p>

                                <div className={`flex items-center gap-4 ${isMulti ? 'pt-0.5' : 'pt-2'}`}>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <span className={`${isMulti ? 'text-[8px] sm:text-[10px]' : 'text-xs'} font-bold text-gray-400 uppercase tracking-widest`}>{t.qty}: </span>
                                        <span className={`${isMulti ? 'text-lg sm:text-2xl' : 'text-3xl sm:text-6xl'} font-black text-black`}>{label.quantity}</span>
                                    </div>
                                    {label.bdlQty && (
                                        <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 border-l">
                                            <span className={`${isMulti ? 'text-[8px] sm:text-[10px]' : 'text-xs'} font-bold text-gray-400 uppercase tracking-widest`}>{t.bundles}: </span>
                                            <span className={`${isMulti ? 'text-base sm:text-lg' : 'text-xl sm:text-3xl'} font-black text-gray-700`}>{label.bdlQty}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 border-l">
                                        <span className={`${isMulti ? 'text-[8px] sm:text-[10px]' : 'text-xs'} font-bold text-gray-400 uppercase tracking-widest`}>{t.city}: </span>
                                        <span className={`${isMulti ? 'text-[9px] sm:text-[11px]' : 'text-sm sm:text-lg'} font-black text-gray-800 uppercase`}>{getCityName(lang)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Minimal Footer */}
            <div className={`${isMulti ? 'h-6 sm:h-8' : 'h-8 sm:h-10'} bg-gray-50 border-t flex items-center justify-between px-4 sm:px-6`}>
                <span className={`${isMulti ? 'text-[7px] sm:text-[8px]' : 'text-[9px]'} font-bold text-gray-400 uppercase tracking-widest`}>
                    DATE: {new Date(label.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className={`${isMulti ? 'text-[7px] sm:text-[8px]' : 'text-[9px]'} font-black italic text-gray-300 tracking-widest uppercase`}>Ace Premium</span>
            </div>
        </div>
    );
}
