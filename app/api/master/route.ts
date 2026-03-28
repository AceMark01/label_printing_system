import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { invalidateSheetCache } from '@/lib/data-cache';

// Use Service Role Key for server-side operations to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        console.log(`API REQUEST: type=${type}`, data);

        if (type === 'party') {
            const dataArray = Array.isArray(data) ? data : [data];
            
            // Deduplicate by name_eng to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
            const uniqueMap = new Map();
            dataArray.forEach(item => {
                const eng = (item.name_eng || '').toString().trim();
                if (eng.length >= 2) {
                    uniqueMap.set(eng.toLowerCase(), {
                        name_eng: eng,
                        name_hi: (item.name_hi || '').toString().trim(),
                        name_od: (item.name_od || '').toString().trim()
                    });
                }
            });
            
            const inserts = Array.from(uniqueMap.values());

            if (inserts.length === 0) {
                return NextResponse.json({ error: 'No valid records found' }, { status: 400 });
            }

            console.log(`Processing ${inserts.length} unique parties in batches...`);
            const CHUNK_SIZE = 100;
            const results = [];
            
            for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
                const chunk = inserts.slice(i, i + CHUNK_SIZE);
                const { data: chunkResult, error } = await supabase
                    .from('parties')
                    .upsert(chunk, { onConflict: 'name_eng' })
                    .select();

                if (error) {
                    console.error(`Error in party batch ${i / CHUNK_SIZE}:`, error);
                    throw error;
                }
                if (chunkResult) results.push(...chunkResult);
            }

            console.log(`Total Success: ${results.length} parties saved/updated`);
            return NextResponse.json({ success: true, data: results });
        } 
        
        if (type === 'product') {
            const dataArray = Array.isArray(data) ? data : [data];
            
            // Deduplicate by item_name_eng to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
            const uniqueMap = new Map();
            dataArray.forEach(item => {
                const eng = (item.item_name_eng || item.name_eng || '').toString().trim();
                if (eng.length >= 2) {
                    uniqueMap.set(eng.toLowerCase(), {
                        item_name_eng: eng,
                        item_name_hi: (item.item_name_hi || item.name_hi || '').toString().trim(),
                        item_name_od: (item.item_name_od || item.name_od || '').toString().trim()
                    });
                }
            });
            
            const inserts = Array.from(uniqueMap.values());

            if (inserts.length === 0) {
                return NextResponse.json({ error: 'No valid records found' }, { status: 400 });
            }

            console.log(`Processing ${inserts.length} unique products in batches...`);
            const CHUNK_SIZE = 100;
            const results = [];
            
            for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
                const chunk = inserts.slice(i, i + CHUNK_SIZE);
                const { data: chunkResult, error } = await supabase
                    .from('products')
                    .upsert(chunk, { onConflict: 'item_name_eng' })
                    .select();

                if (error) {
                    console.error(`Error in product batch ${i / CHUNK_SIZE}:`, error);
                    throw error;
                }
                if (chunkResult) results.push(...chunkResult);
            }

            console.log(`Total Success: ${results.length} products saved/updated`);
            return NextResponse.json({ success: true, data: results });
        }

        if (type === 'track_printed') {
            const { labels: labelData, pdf } = data;
            if (!labelData || !Array.isArray(labelData)) {
                return NextResponse.json({ error: 'labels array is required' }, { status: 400 });
            }

            // 1. Mark them as printed in our tracking table
            const trackingInserts = labelData.map(label => ({
                label_id: label.id,
                status: 'printed',
                printed_at: new Date().toISOString()
            }));

            const { error: trackingError } = await supabase
                .from('labels_tracking')
                .upsert(trackingInserts, { onConflict: 'label_id' });

            if (trackingError) console.error('Labels Tracking Sync Error:', trackingError);

            // 2. Insert FULL data into the main labels history table
            const fullInserts = labelData.map(label => ({
                order_no: String(label.orderNo || ''),
                s_order_no_string: String(label.sOrderNoString || ''),
                s_order_date: label.sOrderDate ? String(label.sOrderDate) : null,
                created_on: label.createdOn ? String(label.createdOn) : null,
                product_name: String(label.itemName || ''),
                account_name: String(label.party || ''),
                remark: String(label.remark || ''),
                actual_qty: Number(label.qty) || 0,
                dispatch_qty: Number(label.dispatchQty) || 0,
                dispatch_bdl_qty: String(label.bdlQty || ''),
                s_order_no: String(label.sOrderNo || ''),
                s_order_detail_id: String(label.sOrderDetailId || ''),
                s_order_id: String(label.sOrderId || ''),
                employee_name: String(label.employeeName || ''),
                city: String(label.city || ''),
                transporter_name: String(label.transporter || ''),
                processed: true,
                original_data: label,
                pdf: 'done'
            }));

            const { error: historyError } = await supabase
                .from('labels')
                .insert(fullInserts);

            if (historyError) {
                console.error('Labels Full History Insert Error:', historyError);
                throw historyError;
            }

            // Invalidate the sheet data cache so next fetch gets updated data
            invalidateSheetCache();

            return NextResponse.json({ success: true, count: fullInserts.length });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error: any) {
        console.error('Master Data API Critical Error:', error);
        return NextResponse.json({ 
            error: error.message,
            details: error
        }, { status: 500 });
    }
}
