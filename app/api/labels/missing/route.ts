import { NextResponse, NextRequest } from 'next/server';
import { getCachedSheetData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';
const NEW_API_URL = process.env.NEW_LEGACY_API_URL || 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/ReadyForDeliveryV2.ashx';

export async function GET(request: NextRequest) {
    try {
        const allData = await getCachedSheetData(APPS_SCRIPT_URL || NEW_API_URL);

        // Fetch master data for cross-referencing
        const [{ data: masterParties }, { data: masterProducts }] = await Promise.all([
            supabase.from('parties').select('name_eng, name_hi, name_od'),
            supabase.from('products').select('item_name_eng, item_name_hi, item_name_od')
        ]);

        const partyMap = new Map((masterParties || []).map(p => [(p.name_eng || '').toLowerCase().trim(), p]));
        const productMap = new Map((masterProducts || []).map(p => [(p.item_name_eng || '').toLowerCase().trim(), p]));

        const missingItems: any[] = [];
        const seenParties = new Set<string>();
        const seenProducts = new Set<string>();

        allData.forEach((item: any) => {
            const rawParty = (item['AccountName'] || item['Party'] || '').toString().trim();
            const rawProduct = (item['ProductName'] || item['Item'] || '').toString().trim();

            if (!rawParty || !rawProduct) return;

            const partyKey = rawParty.toLowerCase();
            const productKey = rawProduct.toLowerCase();

            const masterParty = partyMap.get(partyKey);
            const masterProduct = productMap.get(productKey);

            // Check if party is missing or untranslated
            if (!masterParty || !masterParty.name_hi || !masterParty.name_od) {
                if (!seenParties.has(partyKey)) {
                    missingItems.push({
                        type: 'party',
                        english: rawParty,
                        hindi: masterParty?.name_hi || '',
                        odia: masterParty?.name_od || '',
                        orderNo: item['OrderNo'] || item['SOrderNo'] || 'N/A'
                    });
                    seenParties.add(partyKey);
                }
            }

            // Check if product is missing or untranslated
            if (!masterProduct || !masterProduct.item_name_hi || !masterProduct.item_name_od) {
                if (!seenProducts.has(productKey)) {
                    missingItems.push({
                        type: 'product',
                        english: rawProduct,
                        hindi: masterProduct?.item_name_hi || '',
                        odia: masterProduct?.item_name_od || '',
                        orderNo: item['OrderNo'] || item['SOrderNo'] || 'N/A'
                    });
                    seenProducts.add(productKey);
                }
            }
        });

        // Group by type for easier consumption
        const parties = missingItems.filter(i => i.type === 'party');
        const products = missingItems.filter(i => i.type === 'product');

        return NextResponse.json({
            parties,
            products,
            total: missingItems.length
        });
    } catch (error: any) {
        console.error('Missing Translations API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
