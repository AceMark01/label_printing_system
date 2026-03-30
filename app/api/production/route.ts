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

        const mappedData = allData.map((item: any, index: number) => {
            return {
                id: index + 1,
                sNo: getValue(item, 'S NO') || getValue(item, 'SNO') || index + 1,
                productCode: getValue(item, 'ProductCode') || getValue(item, 'Product Code') || '',
                productName: getValue(item, 'ProductName') || getValue(item, 'Product Name') || '',
                godown: getValue(item, 'Godown') || '',
                pendingQty: getValue(item, 'Production Pending qty') || getValue(item, 'Pending Qty') || 0,
                
                // Bundle types
                bld: getValue(item, 'bld') || '',
                crt: getValue(item, 'CRT') || '',
                smallCrt: getValue(item, 'SmallCRT') || getValue(item, 'Small CRT') || '',

                // Translation support
                productNameHi: getValue(item, 'Item In hindi') || getValue(item, 'Product Name Hindi') || '',
                productNameOd: getValue(item, 'Item In oriya') || getValue(item, 'Product Name Oriya') || '',
                godownHi: getValue(item, 'Godown in hindi') || getValue(item, 'Godown Hindi') || '',
                godownOd: getValue(item, 'Godown in oriya') || getValue(item, 'Godown Oriya') || '',

                originalData: item
            };
        });

        const filteredData = mappedData.filter((item: any) => {
            // Skip rows that are empty or have no identifier
            if (!item.productCode && !item.productName) return false;

            if (searchQuery) {
                const codeMatch = item.productCode.toString().toLowerCase().includes(searchQuery);
                const nameMatch = item.productName.toString().toLowerCase().includes(searchQuery);
                const godownMatch = item.godown.toString().toLowerCase().includes(searchQuery);
                if (!codeMatch && !nameMatch && !godownMatch) return false;
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
        console.error('Production Data API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
