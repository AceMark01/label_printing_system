import { NextResponse, NextRequest } from 'next/server';
import { getCachedData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';

/**
 * MIGRATION API
 * This route fetches all data from the fallback API and inserts it into Supabase labels table.
 * Use this only once to seed your Supabase database.
 * 
 * Access: GET /api/migrate
 */
export async function GET(request: NextRequest) {
    try {
        if (!APPS_SCRIPT_URL) {
            return NextResponse.json({ error: 'GOOGLE_SHEET_API_URL missing' }, { status: 500 });
        }

        console.log('Fetching data from API for migration...');
        const allData = await getCachedData(APPS_SCRIPT_URL, true);

        const getValue = (obj: any, targetKey: string) => {
            if (obj[targetKey] !== undefined) return obj[targetKey];
            const lowerTarget = targetKey.toLowerCase();
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerTarget);
            if (foundKey) return obj[foundKey];
            const noSpaceTarget = lowerTarget.replace(/\s+/g, '');
            const foundNoSpaceKey = Object.keys(obj).find(k => k.toLowerCase().replace(/\s+/g, '') === noSpaceTarget);
            return foundNoSpaceKey ? obj[foundNoSpaceKey] : undefined;
        };

        const migratedRecords = allData.map((item: any) => {
            const orderNo = getValue(item, 'SOrderNo') || getValue(item, 'OrderNo') || 'legacy';

            // "Processed" logic: if column N has value, it's processed
            const colN = item['N'] || item[13] || getValue(item, 'N');
            const processed = colN && colN.toString().trim() !== '';

            return {
                order_no: orderNo.toString(),
                city: getValue(item, 'City') || '',
                party: getValue(item, 'AccountName') || '',
                item: getValue(item, 'ProductName') || '',
                quantity: parseInt(getValue(item, 'DispatchQty')) || 0,
                remark: getValue(item, 'Remark') || '',
                bdl_qty: getValue(item, 'DispatchBdlQty')?.toString() || '',
                transporter: (function () {
                    let t = getValue(item, 'Transporter') || getValue(item, 'Transporter Name');
                    if (!t) {
                        const pVal = getValue(item, 'P') || item[15] || item['15'] || item[16] || item['16'];
                        if (pVal) t = pVal;
                    }
                    if (!t) {
                        const transKey = Object.keys(item).find(k => k.toLowerCase().includes('trans'));
                        if (transKey) t = item[transKey];
                    }
                    return t || '';
                })(),
                party_hi: getValue(item, 'Party in hindi') || '',
                party_od: getValue(item, 'Party in oriya') || '',
                item_hi: getValue(item, 'Item in hindi') || '',
                item_od: getValue(item, 'Item in oriya') || '',
                city_hi: getValue(item, 'City in Hindi') || '',
                city_od: getValue(item, 'City in oriya') || '',
                processed: !!processed,
                original_data: item
            };
        });

        console.log(`Prepared ${migratedRecords.length} records for migration.`);

        // Insert into Supabase in chunks to avoid payload limits
        const chunkSize = 100;
        let successCount = 0;
        let errors = [];

        for (let i = 0; i < migratedRecords.length; i += chunkSize) {
            const chunk = migratedRecords.slice(i, i + chunkSize);
            const { error } = await supabase.from('labels').insert(chunk);

            if (error) {
                console.error(`Error in chunk ${i}-${i + chunkSize}:`, error);
                errors.push(error);
            } else {
                successCount += chunk.length;
            }
        }

        return NextResponse.json({
            message: 'Migration completed',
            total: migratedRecords.length,
            success: successCount,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error: any) {
        console.error('Migration Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
