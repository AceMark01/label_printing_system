import { NextResponse } from 'next/server';

async function performTranslation(text: string, target: string, itc: string | undefined): Promise<string> {
    if (!text.trim()) return text;

    // Try Transliteration first (Best for Party Names/Products)
    if (itc) {
        try {
            const transiltUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
            const transResponse = await fetch(transiltUrl);

            if (transResponse.ok) {
                const transData = await transResponse.json();
                if (transData && transData[0] === 'SUCCESS' && transData[1][0] && transData[1][0][1][0]) {
                    return transData[1][0][1][0];
                }
            }
        } catch (e) {
            console.warn('Transliteration failed, falling back to translation:', e);
        }
    }

    // Fallback to standard Google Translate (gtx client)
    let apiTarget = target;
    if (target === 'od') apiTarget = 'or';

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${apiTarget}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) {
        return text; // Return original on failure
    }

    const data = await response.json();
    if (data && data[0] && Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0]).join('');
    }

    return text;
}

export async function POST(request: Request) {
    try {
        const { text, target } = await request.json();

        if (!text || !target) {
            return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
        }

        // Basic HTML entity decoding
        const decodedText = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        if (target === 'en') {
            return NextResponse.json({ translatedText: decodedText });
        }

        // Map languages to Google Transliteration Input Tool codes
        const itcMap: Record<string, string> = {
            hi: 'hi-t-i0-und',
            od: 'or-t-i0-und',
            or: 'or-t-i0-und'
        };

        const itc = itcMap[target];

        // Preservation logic for:
        // 1. Text in parentheses: (A5RP), (B.BAG)
        // 2. Alphanumeric/Numeric codes: A4, 568P, No-45, 092P (any word containing a digit)
        // 3. Short codes/Brands: S, N, XL, Ace, Eco, One, Single (Specific keywords and 1-2 letter uppercase)
        const regex = /(\([^)]+\)|\b[a-zA-Z0-9\-]*\d[a-zA-Z0-9\-]*\b|\b[A-Z]{1,2}\b|\bAce\b|\bEco\b|\bOne\b|\bSingle\b)/gi;
        const parts = decodedText.split(regex);

        const translatedParts = await Promise.all(parts.map(async (part: string) => {
            if (!part) return '';
            
            // Check if it's a preserved part
            const isBrackets = part.startsWith('(') && part.endsWith(')');
            const hasDigit = /\d/.test(part);
            const isShortCode = /^[A-Z]{1,2}$/.test(part);
            const preservedKeywords = ['ace', 'eco', 'one', 'single'];
            const isPreservedKeyword = preservedKeywords.includes(part.toLowerCase().trim());

            if (isBrackets || hasDigit || isShortCode || isPreservedKeyword) {
                return part;
            }
            
            // Otherwise, translate/transliterate
            return await performTranslation(part, target, itc);
        }));

        const translatedText = translatedParts.join('');

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
