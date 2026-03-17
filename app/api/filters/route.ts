import { NextResponse, NextRequest } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';

export async function GET(request: NextRequest) {
    try {
        if (!APPS_SCRIPT_URL) {
            return NextResponse.json({ error: 'Config missing' }, { status: 500 });
        }

        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch from Apps Script: ${response.statusText}`);
        }

        const rawData = await response.json();
        const allData = Array.isArray(rawData) ? rawData : (rawData?.DataRec || rawData?.data || []);

        const cities = new Set<string>();
        const parties = new Set<string>();
        const items = new Set<string>();
        const transporters = new Set<string>();

        // Flexible key lookup helper
        const getValue = (obj: any, targetKey: string) => {
            if (obj[targetKey] !== undefined) return obj[targetKey];
            const lowerTarget = targetKey.toLowerCase();
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerTarget);
            if (foundKey) return obj[foundKey];
            return undefined;
        };

        allData.forEach((item: any) => {
            // New Filter: Only show if column N (index 13) is null/empty
            const colN = item['N'] || item[13] || getValue(item, 'N');
            if (colN && colN.toString().trim() !== '') return;

            const city = getValue(item, 'City');
            if (city) cities.add(city);

            const party = getValue(item, 'AccountName');
            if (party) parties.add(party);

            const prod = getValue(item, 'ProductName');
            if (prod) items.add(prod);

            // Transporter logic matching the labels route
            let transporter = getValue(item, 'Transporter') || getValue(item, 'Transporter Name');
            if (!transporter) {
                const pVal = getValue(item, 'P') || item[15] || item['15'] || item[16] || item['16'];
                if (pVal) transporter = pVal;
            }
            if (!transporter) {
                const transKey = Object.keys(item).find(k => {
                    const kl = k.toLowerCase();
                    return kl.includes('trans') || kl.includes('transport');
                });
                if (transKey) transporter = item[transKey];
            }
            if (transporter) transporters.add(transporter);
        });

        return NextResponse.json({
            cities: Array.from(cities).sort(),
            parties: Array.from(parties).sort(),
            items: Array.from(items).sort(),
            transporters: Array.from(transporters).sort()
        });
    } catch (error: any) {
        console.error('Filter API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
