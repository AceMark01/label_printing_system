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

        // Google Translate free API (gtx client)
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from translation API: ${response.statusText}`);
        }

        const data = await response.json();

        // The structure returned by this endpoint is nested: [[["translated", "source", ...], ...]]
        let translatedText = '';
        if (data && data[0] && Array.isArray(data[0])) {
            translatedText = data[0].map((item: any) => item[0]).join('');
        }

        return NextResponse.json({ translatedText });
    } catch (error: any) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
