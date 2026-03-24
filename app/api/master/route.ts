import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        if (type === 'party') {
            const { name, name_hi, name_od, city, city_hi, city_od } = data;
            const { data: result, error } = await supabase
                .from('parties')
                .insert([{ 
                    name, 
                    name_hi, 
                    name_od, 
                    city, 
                    city_hi, 
                    city_od 
                }])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        } 
        
        if (type === 'product') {
            const { name, name_hi, name_od } = data;
            const { data: result, error } = await supabase
                .from('products')
                .insert([{ 
                    name, 
                    name_hi, 
                    name_od 
                }])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        if (type === 'track_printed') {
            const { labels: labelData, pdf } = data;
            if (!labelData || !Array.isArray(labelData)) {
                return NextResponse.json({ error: 'labels array is required' }, { status: 400 });
            }

            const inserts = labelData.map(label => ({
                order_no: label.orderNo || '',
                s_order_no_string: label.sOrderNoString || '',
                s_order_date: label.sOrderDate || null,
                created_on: label.createdOn || null,
                product_name: label.itemName || '',
                account_name: label.party || '',
                remark: label.remark || '',
                actual_qty: parseInt(label.qty?.toString()) || 0,
                dispatch_qty: parseInt(label.dispatchQty?.toString()) || 0,
                dispatch_bdl_qty: label.bdlQty?.toString() || '',
                s_order_no: label.sOrderNo || '',
                s_order_detail_id: label.sOrderDetailId || '',
                s_order_id: label.sOrderId || '',
                employee_name: label.employeeName || '',
                city: label.city || '',
                transporter_name: label.transporter || '',
                pdf: 'done',
                processed: true,
                original_data: label
            }));

            // 1. Mark them as printed in our tracking table (used by the filters/ui to hide items)
            const trackingInserts = labelData.map(label => ({
                label_id: label.id,
                status: 'printed',
                printed_at: new Date().toISOString()
            }));

            const { error: trackingError } = await supabase
                .from('labels_tracking')
                .upsert(trackingInserts, { onConflict: 'label_id' });

            if (trackingError) {
                console.error('Labels Tracking Sync Error:', trackingError);
                // Non-critical, continue to history save
            }

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
                pdf: 'done' // Test indicator
            }));

            const { error: historyError } = await supabase
                .from('labels')
                .insert(fullInserts);

            if (historyError) {
                console.error('Labels Full History Insert Error:', historyError);
                return NextResponse.json({ 
                    error: `History save failed: ${historyError.message}`,
                    details: historyError
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, count: fullInserts.length });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error: any) {
        console.error('Master Data Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
