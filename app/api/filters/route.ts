import { NextResponse, NextRequest } from 'next/server';
import { getCachedSheetData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';
const NEW_API_URL = process.env.NEW_LEGACY_API_URL || '';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeProcessed = searchParams.get('includeProcessed') === 'true';

        // Fetch fresh data from Google Sheets first
        const allData = await getCachedSheetData(APPS_SCRIPT_URL || NEW_API_URL);

        // Fetch already printed labels from Supabase to hide them from the dropdowns if necessary
        const { data: printedLabels } = await supabase
            .from('labels_tracking')
            .select('label_id')
            .eq('status', 'printed');
        const printedIds = new Set((printedLabels || []).map(l => l.label_id));

        const cities = new Set<string>();
        const parties = new Set<string>();
        const items = new Set<string>();
        const transporters = new Set<string>();

        const getValue = (obj: any, targetKey: string) => {
            if (!obj) return undefined;
            if (obj[targetKey] !== undefined) return obj[targetKey];
            
            const lowerTarget = targetKey.toLowerCase();
            const keys = Object.keys(obj);
            
            // Try case-insensitive exact match first
            const exactKey = keys.find(k => k.toLowerCase() === lowerTarget);
            if (exactKey) return obj[exactKey];
            
            // Try removing spaces (fuzzy match)
            const cleanTarget = lowerTarget.replace(/\s+/g, '');
            const fuzzyKey = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === cleanTarget);
            if (fuzzyKey) return obj[fuzzyKey];
            
            // Field mapping for special cases
            if (lowerTarget === 'accountname' || lowerTarget === 'party') {
                return obj['AccountName'] || obj['Party'] || obj['Account Name'] || obj['party'];
            }
            if (lowerTarget === 'productname' || lowerTarget === 'item') {
                return obj['ProductName'] || obj['Item'] || obj['Product Name'] || obj['item'];
            }
            if (lowerTarget === 'transporter' || lowerTarget === 'transportername' || lowerTarget === 'transportname') {
                return obj['Transporter'] || obj['TransporterName'] || obj['TransportName'] || obj['transporter'];
            }
            
            return undefined;
        };

        allData.forEach((item: any, index: number) => {
            const orderNo = getValue(item, 'OrderNo') || getValue(item, 'SOrderNo') || `item-${index}`;
            const id = `${orderNo}-${index}`;

            // Skip processed labels if not included
            if (!includeProcessed && printedIds.has(id)) return;

            const city = getValue(item, 'City');
            if (city) cities.add(city.toString().trim());

            const party = getValue(item, 'AccountName') || getValue(item, 'Party');
            if (party) parties.add(party.toString().trim());

            const prod = getValue(item, 'ProductName') || getValue(item, 'Item');
            if (prod) items.add(prod.toString().trim());

            const transporter = getValue(item, 'Transporter') || getValue(item, 'TransportName');
            if (transporter) transporters.add(transporter.toString().trim());
        });

        return NextResponse.json({
            cities: Array.from(cities).filter(Boolean).sort(),
            parties: Array.from(parties).filter(Boolean).sort(),
            items: Array.from(items).filter(Boolean).sort(),
            transporters: Array.from(transporters).filter(Boolean).sort()
        });
    } catch (error: any) {
        console.error('Filter API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
