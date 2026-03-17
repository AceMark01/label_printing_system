import { NextResponse, NextRequest } from 'next/server';

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

        if (!APPS_SCRIPT_URL) {
            console.error('GOOGLE_SHEET_API_URL is not set in environment variables');
            return NextResponse.json({ error: 'Config missing' }, { status: 500 });
        }

        console.log(`Fetching page ${page} with limit ${limit} from:`, APPS_SCRIPT_URL);
        const response = await fetch(APPS_SCRIPT_URL);

        if (!response.ok) {
            console.error(`Fetch failed with status: ${response.status}`);
            const text = await response.text();
            console.error('Response body:', text.substring(0, 200));
            throw new Error(`Failed to fetch from Apps Script: ${response.statusText}`);
        }

        const responseText = await response.text();

        // Safety check: Is it actually JSON? (Google Errors are HTML)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            return NextResponse.json({
                error: 'Google Script error: Received HTML instead of JSON.',
                details: 'The script returned an error page. Check your doGet() implementation and deployment permissions.',
                snippet: responseText.substring(0, 100)
            }, { status: 500 });
        }

        let rawData;
        try {
            rawData = JSON.parse(responseText);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON format from script', details: e instanceof Error ? e.message : 'Parse error' }, { status: 500 });
        }

        // Ensure rawData is an array
        const allData = Array.isArray(rawData) ? rawData : (rawData?.DataRec || rawData?.data || []);

        // Debug: Log first item to see keys/structure
        if (allData.length > 0) {
            console.log('API DEBUG - First item keys:', Object.keys(allData[0]));
            console.log('API DEBUG - First item sample:', JSON.stringify(allData[0]).substring(0, 500));
        }

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

        // Map the data to the expected Label format prioritizing user requested fields
        const mappedData = allData.map((item: any, index: number) => {
            const orderNo = getValue(item, 'SOrderNo') || getValue(item, 'OrderNo') || 'no-order';
            return {
                // Combine OrderNo with index to ensure uniqueness across all rows
                id: `${orderNo}-${index}`,
                city: getValue(item, 'City') || '',
                party: getValue(item, 'AccountName') || '',
                item: getValue(item, 'ProductName') || '',
                quantity: parseInt(getValue(item, 'DispatchQty')) || 0,
                remark: getValue(item, 'Remark') || '',
                bdlQty: getValue(item, 'DispatchBdlQty') || '',
                date: new Date().toISOString().split('T')[0],
                // Pre-translated names from sheet
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
                    // 1. Direct key lookups
                    const direct = getValue(item, 'Transporter') || getValue(item, 'Transporter Name');
                    if (direct) return direct;
                    
                    // 2. Column P / Index fallback
                    const pVal = getValue(item, 'P') || item[15] || item['15'] || item[16] || item['16'];
                    if (pVal) return pVal;
                    
                    // 3. Search for any key with 'trans' or 'transport'
                    const transKey = Object.keys(item).find(k => {
                        const kl = k.toLowerCase();
                        return kl.includes('trans') || kl.includes('transport');
                    });
                    if (transKey) return item[transKey];
                    
                    // 4. Case-insensitive P
                    const pKey = Object.keys(item).find(k => k.toUpperCase() === 'P');
                    if (pKey) return item[pKey];

                    return '';
                })(),
                // Keep original fields
                originalData: {
                    ...item
                }
        };
        });

        // Apply server-side filtering
        const filteredData = mappedData.filter((item: any) => {
            // New Filter: Column N must be null/empty
            const rawItem = item.originalData;
            const colN = rawItem['N'] || rawItem[13] || getValue(rawItem, 'N');
            if (colN && colN.toString().trim() !== '') return false;

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

        console.log(`Returning ${paginatedData.length} records of total ${total} (Filtered) (Page ${page})`);

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
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
