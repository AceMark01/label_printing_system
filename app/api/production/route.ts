import { NextResponse, NextRequest } from 'next/server';
import { getCachedData } from '@/lib/data-cache';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';

export async function GET(request: NextRequest) {
    try {
        if (!APPS_SCRIPT_URL) {
            return NextResponse.json({ error: 'GOOGLE_SHEET_API_URL missing' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;
        const searchQuery = searchParams.get('q')?.toLowerCase().trim() || '';
        const forceRefresh = searchParams.get('refresh') === 'true';
        const isHistory = searchParams.get('history') === 'true';

        // Append sheet name to the Apps Script URL
        const sheetUrl = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}sheet=Production Data`;

        const allData = await getCachedData(sheetUrl, forceRefresh);

        const getValue = (obj: any, targetKey: string) => {
            if (!obj) return undefined;
            if (obj[targetKey] !== undefined) return obj[targetKey];

            const lowerTarget = targetKey.toLowerCase();
            const keys = Object.keys(obj);

            // Try case-insensitive exact match
            const exactKey = keys.find(k => k.toLowerCase() === lowerTarget);
            if (exactKey) return obj[exactKey];

            // Try removing spaces
            const cleanTarget = lowerTarget.replace(/\s+/g, '');
            const fuzzyKey = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === cleanTarget);
            if (fuzzyKey) return obj[fuzzyKey];

            return undefined;
        };

        // Fetch Master Data
        const { data: masterProducts } = await import('@/lib/supabase').then(m => m.supabase.from('products').select('*'));
        const productMap = new Map((masterProducts || []).map(p => [(p.item_name_eng || p.name_eng || '').toLowerCase().trim(), p]));

        const mappedData = allData.map((item: any, index: number) => {
            const doneVal = (getValue(item, 'Done') || '').toString().toLowerCase().trim();
            const sNoVal = getValue(item, 'S NO') || getValue(item, 'SNO') || index + 1;

            const englishProduct = (getValue(item, 'ProductName') || getValue(item, 'Product Name') || '').toString().trim();
            const masterProduct = productMap.get(englishProduct.toLowerCase());

            return {
                id: index + 1,
                sNo: sNoVal,
                sNoNum: parseInt(sNoVal.toString().replace(/[^0-9]/g, '')) || 0,
                productCode: getValue(item, 'ProductCode') || getValue(item, 'Product Code') || '',
                productName: englishProduct,
                godown: getValue(item, 'Godown') || '',
                pendingQty: getValue(item, 'Production Pending qty') || getValue(item, 'Pending Qty') || 0,
                done: doneVal === 'done' || doneVal === 'yes' || doneVal === 'true' || doneVal === '1',

                // Bundle types
                bld: getValue(item, 'bld') || '',
                crt: getValue(item, 'CRT') || '',
                smallCrt: getValue(item, 'SmallCRT') || getValue(item, 'Small CRT') || '',

                // Translation support
                productNameHi: masterProduct?.item_name_hi || masterProduct?.name_hi || getValue(item, 'Item In hindi') || getValue(item, 'Product Name Hindi') || englishProduct,
                productNameOd: masterProduct?.item_name_od || masterProduct?.name_od || getValue(item, 'Item In oriya') || getValue(item, 'Product Name Oriya') || englishProduct,
                godownHi: getValue(item, 'Godown in hindi') || getValue(item, 'Godown Hindi') || '',
                godownOd: getValue(item, 'Godown in oriya') || getValue(item, 'Godown Oriya') || '',

                originalData: item
            };
        });

        const filteredData = mappedData.filter((item: any) => {
            // 1. Skip rows that are empty or have no identifier
            if (!item.productCode && !item.productName) return false;

            // 2. EXCLUDE/INCLUDE DONE items based on isHistory
            if (isHistory) {
                if (!item.done) return false;
            } else {
                if (item.done) return false;

                // ONLY SHOW positive pending quantities for active view
                const rawQty = item.pendingQty?.toString() || '0';
                const cleanQty = parseFloat(rawQty.replace(/[^-0-9.]/g, '')) || 0;
                if (cleanQty <= 0) return false;
            }

            // 3. APPLY Search Filter
            if (searchQuery) {
                const codeMatch = (item.productCode || '').toString().toLowerCase().includes(searchQuery);
                const nameMatch = (item.productName || '').toString().toLowerCase().includes(searchQuery);
                const godownMatch = (item.godown || '').toString().toLowerCase().includes(searchQuery);
                if (!codeMatch && !nameMatch && !godownMatch) return false;
            }
            return true;
        });

        // SORT DATA by S NO (Numeric)
        filteredData.sort((a, b) => a.sNoNum - b.sNoNum);

        const total = filteredData.length;
        const paginatedData = filteredData.slice(offset, offset + limit);

        return NextResponse.json({
            data: paginatedData,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Production Data API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!APPS_SCRIPT_URL) {
            return NextResponse.json({ error: 'GOOGLE_SHEET_API_URL missing' }, { status: 500 });
        }

        const body = await request.json();
        const { ids, printed_by, print_time } = body; // Array of IDs and metadata

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 });
        }

        // Send update to Google Apps Script
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'batchUpdate',
                sheet: 'Production Data',
                updates: ids.map(id => ({
                  id,
                  Done: 'Done',
                  printed_by: printed_by || 'System',
                  print_time: print_time || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                }))
            })
        });

        const resultRaw = await response.text();
        let result: any;

        try {
            result = JSON.parse(resultRaw);
        } catch (e) {
            console.error('Google Apps Script non-JSON response:', resultRaw);
            throw new Error('Google Sheets API returned an invalid response. Please check your Apps Script configuration.');
        }

        if (result.error) {
            throw new Error(result.error);
        }

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Production Update API Error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown server error during spreadsheet sync'
        }, { status: 500 });
    }
}
