import { NextResponse, NextRequest } from 'next/server';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

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
            return foundNoSpaceKey ? obj[foundNoSpaceKey] : undefined;
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
                // Keep original fields
                originalData: {
                    ...item
                }
        };
        });

        const total = mappedData.length;
        const paginatedData = mappedData.slice(offset, offset + limit);

        console.log(`Returning ${paginatedData.length} records of total ${total} (Page ${page})`);

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
