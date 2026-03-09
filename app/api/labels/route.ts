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

        // Map the data to the expected Label format prioritizing user requested fields
        const mappedData = allData.map((item: any, index: number) => ({
            id: item.OrderNo || item.SOrderNo || item['S Order No'] || `row-${index}`,
            city: item.City || '',
            party: item.AccountName || item.Party || item['Account Name'] || '',
            item: item.ProductName || item.Item || item['Product Name'] || '',
            quantity: parseInt(item.DispatchQty || item.Qty || item['Dispatch Qty']) || 0,
            remark: item.Remark || '',
            bdlQty: item.DispatchBdlQty || item['Dispatch Bdl Qty'] || '',
            date: new Date().toISOString().split('T')[0],
            // Keep original fields plus the specific requested ones
            originalData: {
                ...item, // Include all raw fields
                ProductName: item.ProductName,
                AccountName: item.AccountName,
                Remark: item.Remark,
                DispatchQty: item.DispatchQty,
                DispatchBdlQty: item.DispatchBdlQty,
                SOrderNo: item.SOrderNo,
                OrderNo: item.OrderNo,
                City: item.City
            }
        }));

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
