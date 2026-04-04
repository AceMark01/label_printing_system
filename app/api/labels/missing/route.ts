import { NextResponse, NextRequest } from 'next/server';
import { getCachedData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';
const NEW_API_URL = process.env.NEW_LEGACY_API_URL || 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/LabelPrinting.ashx';

export async function GET(request: NextRequest) {
    try {
        const allData = await getCachedData(NEW_API_URL);

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

        // 1. Scan the entire Master Parties table for missing translations
        masterParties?.forEach(p => {
            if (!p.name_hi || !p.name_od || p.name_hi.trim() === '' || p.name_od.trim() === '') {
                const key = (p.name_eng || '').toLowerCase().trim();
                if (!seenParties.has(key)) {
                    missingItems.push({
                        type: 'party',
                        english: p.name_eng,
                        hindi: p.name_hi || '',
                        odia: p.name_od || '',
                        orderNo: 'MASTER'
                    });
                    seenParties.add(key);
                }
            }
        });

        // 2. Scan the entire Master Products table for missing translations
        masterProducts?.forEach(p => {
            if (!p.item_name_hi || !p.item_name_od || p.item_name_hi.trim() === '' || p.item_name_od.trim() === '') {
                const key = (p.item_name_eng || '').toLowerCase().trim();
                if (!seenProducts.has(key)) {
                    missingItems.push({
                        type: 'product',
                        english: p.item_name_eng,
                        hindi: p.item_name_hi || '',
                        odia: p.item_name_od || '',
                        orderNo: 'MASTER'
                    });
                    seenProducts.add(key);
                }
            }
        });

        // 3. Keep existing logic to scan *New* items from current orders (to pick up items not in master yet)
        allData.forEach((item: any) => {
            const rawParty = (item['PartyName'] || item['AccountName'] || item['Party'] || '').toString().trim();
            const rawProduct = (item['ProductName'] || item['Item'] || '').toString().trim();

            if (!rawParty || !rawProduct) return;

            const partyKey = rawParty.toLowerCase();
            const productKey = rawProduct.toLowerCase();

            // Only add if we haven't already seen it in the master scan
            if (!partyMap.has(partyKey) && !seenParties.has(partyKey)) {
                missingItems.push({
                    type: 'party',
                    english: rawParty,
                    hindi: '',
                    odia: '',
                    orderNo: item['SOrderNoString'] || item['OrderNo'] || item['SOrderNo'] || 'ORDER'
                });
                seenParties.add(partyKey);
            }

            if (!productMap.has(productKey) && !seenProducts.has(productKey)) {
                missingItems.push({
                    type: 'product',
                    english: rawProduct,
                    hindi: '',
                    odia: '',
                    orderNo: item['SOrderNoString'] || item['OrderNo'] || item['SOrderNo'] || 'ORDER'
                });
                seenProducts.add(productKey);
            }
        });

        // Correctly group collected items by type
        const parties = missingItems.filter(i => i.type === 'party');
        const products = missingItems.filter(i => i.type === 'product');

        return NextResponse.json({
            parties: parties,
            products: products,
            total: missingItems.length
        });
    } catch (error: any) {
        console.error('Missing Translations API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
