import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import type { Label, Language } from '@/lib/types';

interface PreviewLabelCardProps {
    label: Label;
    languages: Language[];
    fieldVisibility?: Partial<Record<Language, { product: boolean, quantity: boolean }>>;
    onToggleField?: (lang: Language, field: 'product' | 'quantity') => void;
    onUpdateBundle?: (labelId: string, value: string) => void;
    onUpdateQuantity?: (labelId: string, value: string) => void;
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

export function PreviewLabelCard({ label, languages, fieldVisibility, onToggleField, onUpdateBundle, onUpdateQuantity }: PreviewLabelCardProps) {
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

    const getCityName = (lang: Language) => {
        if (lang === 'en') return label.city;
        return dynamicTranslations[lang]?.city || label.cityNames?.[lang] || label.city;
    };

    const getDynamicFontSize = (text: string = '', baseSize: number = 18) => {
        const len = text.length;
        // Start shrinking at 25 chars to prevent line wrapping for names like the spiral notebook
        if (len > 90) return `text-[${Math.max(11, baseSize - 7)}px]`;
        if (len > 70) return `text-[${Math.max(13, baseSize - 5)}px]`;
        if (len > 50) return `text-[${Math.max(15, baseSize - 3)}px]`;
        if (len > 35) return `text-[${Math.max(16, baseSize - 2)}px]`;
        if (len > 25) return `text-[${Math.max(17, baseSize - 1)}px]`;
        return `text-[${baseSize}px]`;
    };

    return (
        <div className="bg-white w-full rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col font-sans h-full tracking-tight">
            <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
                {activeLanguages.map((lang, idx) => {
                    const t = labelTranslations[lang];
                    const partyName = getPartyName(lang);
                    const itemName = getItemName(lang);
                    const isProductVisible = fieldVisibility?.[lang]?.product !== false;
                    const isQuantityVisible = fieldVisibility?.[lang]?.quantity !== false;

                    return (
                        <div key={`${lang}-${idx}`} className={cn(
                            "flex flex-col gap-2",
                            idx === 0 && activeLanguages.length > 1 && "pb-3 border-b border-dotted border-gray-300"
                        )}>
                            {/* Party Name Row */}
                            <div className="flex items-baseline gap-1.5 overflow-hidden">
                                <span className="text-gray-400 font-medium text-[14px] shrink-0">
                                    {t.party}:
                                </span>
                                <span className={cn("text-gray-900 font-extrabold leading-tight", getDynamicFontSize(partyName, 18))}>
                                    {partyName}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onToggleField?.(lang, 'product')}
                                    className="shrink-0 transition-transform active:scale-95"
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center transition-colors",
                                        isProductVisible ? "bg-blue-600" : "bg-gray-200"
                                    )}>
                                        {isProductVisible && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                                <div className="flex items-baseline gap-1.5 overflow-hidden">
                                    <span className="text-gray-400 font-medium text-[14px] shrink-0">
                                        {t.item}:
                                    </span>
                                    <span className={cn(
                                        "font-black leading-tight",
                                        isProductVisible ? "text-gray-800" : "text-gray-300",
                                        getDynamicFontSize(itemName, 18)
                                    )}>
                                        {itemName}
                                    </span>
                                </div>
                            </div>

                            {/* Qty, Bundle, City Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                {/* Quantity */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onToggleField?.(lang, 'quantity')}
                                        className="shrink-0 transition-transform active:scale-95"
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded flex items-center justify-center transition-colors",
                                            isQuantityVisible ? "bg-blue-600" : "bg-gray-200"
                                        )}>
                                            {isQuantityVisible && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-gray-400 font-medium text-[14px]">
                                            {t.qty}:
                                        </span>
                                        <span className={cn(
                                            "font-black text-[20px]",
                                            isQuantityVisible ? "text-gray-900" : "text-gray-300"
                                        )}>
                                            {onUpdateQuantity ? (
                                                <input
                                                    type="text"
                                                    value={label.quantity}
                                                    onChange={(e) => onUpdateQuantity(label.id, e.target.value)}
                                                    className="w-12 text-center bg-transparent border-none p-0 focus:ring-0 font-black"
                                                />
                                            ) : label.quantity}
                                        </span>
                                    </div>
                                </div>

                                {/* Bundle */}
                                <div className="flex items-baseline gap-1.5 border-l border-gray-100 pl-4">
                                    <span className="text-gray-400 font-medium text-[14px]">
                                        {t.bundles}:
                                    </span>
                                    <div className="relative">
                                        {onUpdateBundle ? (
                                            <input
                                                type="text"
                                                value={label.bdlQty || '1'}
                                                onChange={(e) => onUpdateBundle(label.id, e.target.value)}
                                                className="w-10 text-gray-900 font-black text-[20px] bg-transparent border-none p-0 focus:ring-0 text-center"
                                            />
                                        ) : (
                                            <span className="text-gray-900 font-black text-[20px]">
                                                {label.bdlQty || '1'}
                                            </span>
                                        )}
                                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-200" />
                                    </div>
                                </div>

                                {/* City */}
                                <div className="flex items-baseline gap-1.5 border-l border-gray-100 pl-4">
                                    <span className="text-gray-400 font-medium text-[14px]">
                                        {t.city}:
                                    </span>
                                    <span className="text-gray-900 font-black text-[14px] uppercase whitespace-nowrap">
                                        {getCityName(lang)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="bg-gray-50/50 border-t border-gray-100 px-4 py-1 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="h-[1px] bg-gray-200 flex-1 max-w-[60px]" />
                    <img src="/ace.png" alt="A C E" className="h-6 w-auto object-contain" />
                </div>
            </div>
        </div>
    );
}
