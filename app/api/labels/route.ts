import { NextResponse, NextRequest } from 'next/server';
import { getCachedSheetData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const APPS_SCRIPT_URL = process.env.GOOGLE_SHEET_API_URL || '';
const NEW_API_URL = process.env.NEW_LEGACY_API_URL || 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/ReadyForDeliveryV2.ashx';
const USE_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url';

const CITY_TRANSLATIONS: Record<string, { hi: string, od: string }> = {
    'kolkata': { hi: 'कोलकाता', od: 'କୋଲକାତା' },
    'delhi': { hi: 'दिल्ली', od: 'ଦିଲ୍ଲୀ' },
    'mumbai': { hi: 'मुंबई', od: 'ମୁମ୍ବାଇ' },
    'chennai': { hi: 'चेन्नई', od: 'ଚେନ୍ନାଇ' },
    'bhubaneswar': { hi: 'भुवनेश्वर', od: 'ଭୁବନେଶ୍ୱର' },
    'cuttack': { hi: 'कटक', od: 'କଟକ' },
    'rourkela': { hi: 'राउरकेला', od: 'ରାଉରକେଲା' },
    'puri': { hi: 'पुरी', od: 'ପୁରୀ' },
    'sambalpur': { hi: 'संबलपुर', od: 'ସମ୍ବଲପୁର' },
    'balasore': { hi: 'बालासोर', od: 'ବାଲେଶ୍ୱର' },
    'berhampur': { hi: 'बरहामपुर', od: 'ବ୍ରହ୍ମପୁର' },
    'baripada': { hi: 'बारीपदा', od: 'ବାରିପଦା' },
    'angul': { hi: 'अंगुल', od: 'ଅନୁଗୋଳ' },
    'jharsuguda': { hi: 'झारसुगुड़ा', od: 'ଝାରସୁଗୁଡ଼ା' },
    'jaipur': { hi: 'जयपुर', od: 'ଜୟପୁର' },
    'bangalore': { hi: 'बेंगलुरु', od: 'ବାଙ୍ଗାଲୋର' },
    'hyderabad': { hi: 'हैदराबाद', od: 'ହାଇଦ୍ରାବାଦ' },
    'patna': { hi: 'पटना', od: 'ପାଟନା' },
    'ranchi': { hi: 'रांची', od: 'ରାଞ୍ଚି' },
    'raipur': { hi: 'रायपुर', od: 'ରାୟପୁର' },
};

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
        const countOnly = searchParams.get('countOnly') === 'true';

/*
        // --- SUPABASE PATH ---
        if (USE_SUPABASE) {
            let query = supabase
                .from('labels')
                .select('*', { count: 'exact' });

            if (!includeProcessed) {
                query = query.eq('processed', false);
            }

            // Map UI filter keys to precise Postgres columns
            if (filterCities.length > 0) query = query.in('city', filterCities);
            if (filterParties.length > 0) query = query.in('account_name', filterParties);
            if (filterItems.length > 0) query = query.in('product_name', filterItems);
            if (filterTransporters.length > 0) query = query.in('transporter_name', filterTransporters);

            if (searchQuery) {
                query = query.or(`account_name.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            // Map Postgres row back to the exact interface the frontend expects (`Label`)
            const mappedData = (data || []).map(item => ({
                id: item.id,
                city: item.city || '',
                party: item.account_name || '',
                item: item.product_name || '',
                quantity: item.dispatch_qty || 0,
                remark: item.remark || '',
                bdlQty: item.dispatch_bdl_qty || '',
                date: item.s_order_date || item.created_on || new Date(item.created_at).toISOString().split('T')[0],
                // Fallbacks since translations are removed from DB schema
                partyNames: { hi: '', od: '' },
                itemNames: { hi: '', od: '' },
                cityNames: { hi: '', od: '' },
                transporter: item.transporter_name || '',
                originalData: item
            }));

            return NextResponse.json({
                data: mappedData,
                meta: {
                    total: count || 0,
                    page,
                    limit,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            });
        }
*/

        // --- EXTERNAL API / GOOGLE SHEETS FALLBACK ---
        // We use APPS_SCRIPT_URL (Google) first as requested
        const allData = await getCachedSheetData(APPS_SCRIPT_URL || NEW_API_URL);

        if (countOnly) {
            return NextResponse.json({ count: allData.length });
        }

        // --- MASTER DATA CROSS-REFERENCE ---
        // Fetch all parties and products to use for translation mapping
        // This is more efficient for batch processing than individual queries
        const [{ data: masterParties }, { data: masterProducts }] = await Promise.all([
            supabase.from('parties').select('*'),
            supabase.from('products').select('*')
        ]);

        // Create fast lookup maps
        const partyMap = new Map((masterParties || []).map(p => [(p.name_eng || '').toLowerCase().trim(), p]));
        const productMap = new Map((masterProducts || []).map(p => [(p.item_name_eng || p.name_eng || '').toLowerCase().trim(), p]));

        // Fetch already printed labels from both tracking and history tables
        const [
            { data: printedTracking },
            { data: printedHistory }
        ] = await Promise.all([
            supabase.from('labels_tracking').select('label_id').eq('status', 'printed'),
            supabase.from('labels').select('order_no')
        ]);
        
        const printedIds = new Set((printedTracking || []).map(l => l.label_id));
        const printedOrderNos = new Set((printedHistory || []).map(l => l.order_no).filter(Boolean));

        const getValue = (obj: any, targetKey: string) => {
            if (!obj) return undefined;
            if (obj[targetKey] !== undefined) return obj[targetKey];
            
            const lowerTarget = targetKey.toLowerCase();
            const keys = Object.keys(obj);
            
            // Try case-insensitive exact match first
            const exactKey = keys.find(k => k.toLowerCase() === lowerTarget);
            if (exactKey) return obj[exactKey];
            
            // Try removing spaces (fuzzy match)
            const cleanTarget = lowerTarget.replace(/\s+/g, '');
            const fuzzyKey = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === cleanTarget);
            if (fuzzyKey) return obj[fuzzyKey];
            
            // Field mapping for Quantity
            if (lowerTarget === 'quantity' || lowerTarget === 'dispatchqty' || lowerTarget === 'actualqty') {
                return obj['DispatchQty'] || obj['ActualQty'] || obj['Qty'] || obj['quantity'];
            }
            
            // Field mapping for Transporter
            if (lowerTarget === 'transporter' || lowerTarget === 'transportername' || lowerTarget === 'transportname') {
                return obj['Transporter'] || obj['TransporterName'] || obj['TransportName'];
            }
            
            return undefined;
        };

        const mappedData = allData.map((item: any, index: number) => {
            const orderNo = getValue(item, 'OrderNo') || getValue(item, 'SOrderNo') || `item-${index}`;
            const id = `${orderNo}-${index}`;
            const englishParty = (getValue(item, 'AccountName') || getValue(item, 'Party') || '').toString().trim();
            const englishProduct = (getValue(item, 'ProductName') || getValue(item, 'Item') || '').toString().trim();
            const englishCity = (getValue(item, 'City') || '').toString().trim();

            const masterParty = partyMap.get(englishParty.toLowerCase());
            const masterProduct = productMap.get(englishProduct.toLowerCase());

            return {
                id,
                city: englishCity,
                party: englishParty,
                item: englishProduct,
                quantity: parseInt(getValue(item, 'DispatchQty')) || 0,
                remark: getValue(item, 'Remark') || '',
                bdlQty: getValue(item, 'DispatchBdlQty') || '',
                date: getValue(item, 'SOrderDate') || getValue(item, 'CreatedOn') || new Date().toISOString().split('T')[0],
                partyNames: {
                    hi: getValue(item, 'Party in hindi') || masterParty?.name_hi || englishParty,
                    od: getValue(item, 'Party in oriya') || masterParty?.name_od || englishParty,
                },
                itemNames: {
                    hi: getValue(item, 'Item in hindi') || masterProduct?.item_name_hi || masterProduct?.name_hi || englishProduct,
                    od: getValue(item, 'Item in oriya') || masterProduct?.item_name_od || masterProduct?.name_od || englishProduct,
                },
                cityNames: {
                    hi: getValue(item, 'City in Hindi') || masterParty?.city_hi || (englishCity && CITY_TRANSLATIONS[englishCity.toLowerCase().trim()] ? CITY_TRANSLATIONS[englishCity.toLowerCase().trim()]?.hi : '') || englishCity,
                    od: getValue(item, 'City in oriya') || masterParty?.city_od || (englishCity && CITY_TRANSLATIONS[englishCity.toLowerCase().trim()] ? CITY_TRANSLATIONS[englishCity.toLowerCase().trim()]?.od : '') || englishCity,
                },
                transporter: getValue(item, 'Transporter') || getValue(item, 'TransportName') || '',
                pdf: getValue(item, 'PDF Link') || '',
                originalData: item,
                isPrinted: printedIds.has(id)
            };
        });

        const filteredData = mappedData.filter((item: any) => {
            // Hide already printed labels unless specifically requested to show all
            const isOrderAlreadyInHistory = printedOrderNos.has(item.originalData['OrderNo']) || 
                                           printedOrderNos.has(item.originalData['SOrderNo']) ||
                                           printedOrderNos.has(item.originalData['order_no']);

            if ((item.isPrinted || isOrderAlreadyInHistory) && !includeProcessed) return false;

            if (!includeProcessed) {
                // If it's the new API, we might not have 'N' column for processing
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
                const cityMatch = item.city.toLowerCase().includes(searchQuery);
                if (!partyMatch && !itemMatch && !cityMatch) return false;
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
    } 
    catch (error: any) {
        console.error('Data Fetching API Error:', error);
        return NextResponse.json({
            error: error.message,
        }, { status: 500 });
    }
}

