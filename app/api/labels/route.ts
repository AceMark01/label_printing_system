import { NextResponse, NextRequest } from 'next/server';
import { getCachedSheetData } from '@/lib/data-cache';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const filterCities = searchParams.get('cities')?.split(',').filter(Boolean) || [];
        const filterParties = searchParams.get('parties')?.split(',').filter(Boolean) || [];
        const filterItems = searchParams.get('items')?.split(',').filter(Boolean) || [];
        const filterTransporters = searchParams.get('transporters')?.split(',').filter(Boolean) || [];
        const searchQuery = searchParams.get('q')?.toLowerCase() || '';
        const includeProcessed = searchParams.get('includeProcessed') === 'true';

        if (!APPS_SCRIPT_URL) {
            console.error('GOOGLE_SHEET_API_URL is not set in environment variables');
            return NextResponse.json({ error: 'Config missing' }, { status: 500 });
        }

        // Use the new cache utility to get data faster
        const allData = await getCachedSheetData(APPS_SCRIPT_URL);

        // Helper to get value from item with flexible key lookup
        const getValue = (obj: any, targetKey: string) => {
            if (obj[targetKey] !== undefined) return obj[targetKey];
            // Case-insensitive lookup
            const lowerTarget = targetKey.toLowerCase();
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerTarget);
            if (foundKey) return obj[foundKey];
            // Lookup with/without spaces
            const noSpaceTarget = lowerTarget.replace(/\s+/g, '');
            const foundNoSpaceKey = Object.keys(obj).find(k => k.toLowerCase().replace(/\s+/g, '') === noSpaceTarget);
            if (foundNoSpaceKey) return obj[foundNoSpaceKey];
            
            // Special fallback for transporter - search for keys containing 'trans'
            if (lowerTarget === 'transporter') {
                const transKey = Object.keys(obj).find(k => k.toLowerCase().includes('trans'));
                if (transKey) return obj[transKey];
            }
            
            return undefined;
        };

        // Map and filter in one pass if possible, or filter mapped data
        const mappedData = allData.map((item: any, index: number) => {
            const orderNo = getValue(item, 'SOrderNo') || getValue(item, 'OrderNo') || 'no-order';
            return {
                id: `${orderNo}-${index}`,
                city: getValue(item, 'City') || '',
                party: getValue(item, 'AccountName') || '',
                item: getValue(item, 'ProductName') || '',
                quantity: parseInt(getValue(item, 'DispatchQty')) || 0,
                remark: getValue(item, 'Remark') || '',
                bdlQty: getValue(item, 'DispatchBdlQty') || '',
                date: new Date().toISOString().split('T')[0],
                partyNames: {
                    hi: getValue(item, 'Party in hindi') || '',
                    od: getValue(item, 'Party in oriya') || '',
                },
                itemNames: {
                    hi: getValue(item, 'Item in hindi') || '',
                    od: getValue(item, 'Item in oriya') || '',
                },
                cityNames: {
                    hi: getValue(item, 'City in Hindi') || '',
                    od: getValue(item, 'City in oriya') || '',
                },
                transporter: (function() {
                    const direct = getValue(item, 'Transporter') || getValue(item, 'Transporter Name');
                    if (direct) return direct;
                    const pVal = getValue(item, 'P') || item[15] || item['15'] || item[16] || item['16'];
                    if (pVal) return pVal;
                    const transKey = Object.keys(item).find(k => {
                        const kl = k.toLowerCase();
                        return kl.includes('trans') || kl.includes('transport');
                    });
                    if (transKey) return item[transKey];
                    const pKey = Object.keys(item).find(k => k.toUpperCase() === 'P');
                    if (pKey) return item[pKey];
                    return '';
                })(),
                originalData: item
            };
        });

        // Apply server-side filtering
        const filteredData = mappedData.filter((item: any) => {
            // "Past" Data Filter: Column N must be null/empty unless includeProcessed is true
            if (!includeProcessed) {
                const rawItem = item.originalData;
                const colN = rawItem['N'] || rawItem[13] || getValue(rawItem, 'N');
                if (colN && colN.toString().trim() !== '') return false;
            }

            if (filterCities.length > 0 && !filterCities.includes(item.city)) return false;
            if (filterParties.length > 0 && !filterParties.includes(item.party)) return false;
            if (filterItems.length > 0 && !filterItems.includes(item.item)) return false;
            if (filterTransporters.length > 0 && (!item.transporter || !filterTransporters.includes(item.transporter))) return false;
            
            if (searchQuery) {
                const partyMatch = item.party.toLowerCase().includes(searchQuery);
                const itemMatch = item.item.toLowerCase().includes(searchQuery);
                if (!partyMatch && !itemMatch) return false;
            }
            return true;
        });

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
        console.error('Data Fetching API Error:', error);
        return NextResponse.json({
            error: error.message,
        }, { status: 500 });
    }
}

