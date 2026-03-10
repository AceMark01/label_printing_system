import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text, target } = await request.json();

        if (!text || !target) {
            return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 });
        }

        if (target === 'en') {
            return NextResponse.json({ translatedText: text });
        }

        // Map languages to Google Transliteration Input Tool codes
        const itcMap: Record<string, string> = {
            hi: 'hi-t-i0-und',
            ta: 'ta-t-i0-und',
            te: 'te-t-i0-und',
            mr: 'mr-t-i0-und',
            gu: 'gu-t-i0-und',
            kn: 'kn-t-i0-und',
            od: 'or-t-i0-und',
            or: 'or-t-i0-und'
        };

        const itc = itcMap[target];

        if (itc) {
            try {
                // Try Transliteration first (Best for Party Names/Products)
                const transiltUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`;
                const transResponse = await fetch(transiltUrl);

                if (transResponse.ok) {
                    const transData = await transResponse.json();
                    if (transData && transData[0] === 'SUCCESS' && transData[1][0] && transData[1][0][1][0]) {
                        return NextResponse.json({ translatedText: transData[1][0][1][0] });
                    }
                }
            } catch (e) {
                console.warn('Transliteration failed, falling back to translation:', e);
            }
        }

        // Fallback to standard Google Translate (gtx client)
        let apiTarget = target;
        if (target === 'od') apiTarget = 'or';

        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${apiTarget}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from translation API: ${response.statusText}`);
        }

        const data = await response.json();
        let translatedText = '';
        if (data && data[0] && Array.isArray(data[0])) {
            translatedText = data[0].map((item: any) => item[0]).join('');
        }

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
