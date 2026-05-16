import { NextResponse, NextRequest } from 'next/server';
import { getCachedData } from '@/lib/data-cache';
import { supabase } from '@/lib/supabase';

const NEW_INVOICE_API_URL = process.env.NEW_INVOICE_API_URL || 'http://eksai12.ddns.net:8786/ek_api/googleAutomation/LabelSalesInvoices.ashx';

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
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;
        const searchQuery = searchParams.get('q')?.toLowerCase().trim() || '';

        // Fetch from the centralized legacy API
        const allData = await getCachedData(NEW_INVOICE_API_URL);

        // --- MASTER DATA CROSS-REFERENCE ---
        const [{ data: masterParties }, { data: masterProducts }] = await Promise.all([
            supabase.from('parties').select('*'),
            supabase.from('products').select('*')
        ]);

        const partyMap = new Map((masterParties || []).map(p => [(p.name_eng || '').toLowerCase().trim(), p]));
        const productMap = new Map((masterProducts || []).map(p => [(p.item_name_eng || p.name_eng || '').toLowerCase().trim(), p]));

        const getValue = (obj: any, targetKey: string) => {
            if (!obj) return undefined;
            if (obj[targetKey] !== undefined) return obj[targetKey];

            const lowerTarget = targetKey.toLowerCase();
            const keys = Object.keys(obj);

            const exactKey = keys.find(k => k.toLowerCase() === lowerTarget);
            if (exactKey) return obj[exactKey];

            const cleanTarget = lowerTarget.replace(/\s+/g, '');
            const fuzzyKey = keys.find(k => k.toLowerCase().replace(/\s+/g, '') === cleanTarget);
            if (fuzzyKey) return obj[fuzzyKey];

            return undefined;
        };

        let mappedData = allData.map((item: any, index: number) => {
            const rawOrderNo = getValue(item, 'InvoiceNo') || getValue(item, 'InvoiceNoString') || getValue(item, 'SOrderNoString') || getValue(item, 'SOrderNo') || getValue(item, 'OrderNo') || `inv-${index}`;
            const id = `inv-${rawOrderNo}-${index}`;

            const englishParty = (getValue(item, 'PartyName') || getValue(item, 'AccountName') || getValue(item, 'Party') || '').toString().trim();
            const englishProduct = (getValue(item, 'ProductName') || getValue(item, 'Item') || '').toString().trim();
            const englishCity = (getValue(item, 'City') || '').toString().trim();

            const masterParty = partyMap.get(englishParty.toLowerCase());
            const masterProduct = productMap.get(englishProduct.toLowerCase());

            const qty = parseFloat((getValue(item, 'QTY') || getValue(item, 'Quantity') || '0').toString().replace(/[^-0-9.]/g, '')) || 0;

            return {
                id,
                orderRef: rawOrderNo,
                city: englishCity,
                party: englishParty,
                item: englishProduct,
                quantity: Math.round(qty),
                totalQty: Math.round(qty),
                remark: getValue(item, 'Remarks') || getValue(item, 'Remark') || '',
                bdlQty: getValue(item, 'BdlQty') || getValue(item, 'DispatchBdlQty') || '',
                date: getValue(item, 'InvoiceDate') || getValue(item, 'Date') || getValue(item, 'SOrderDate') || new Date().toISOString().split('T')[0],
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
                transporter: getValue(item, 'Transport') || getValue(item, 'Transporter') || getValue(item, 'TransportName') || '',
                godown: (getValue(item, 'Godown') || getValue(item, 'GodownName') || getValue(item, 'GName') || '').toString().trim(),
                originalData: item,
            };
        });

        if (searchQuery) {
            mappedData = mappedData.filter((item: any) => {
                const partyMatch = item.party.toLowerCase().includes(searchQuery);
                const itemMatch = item.item.toLowerCase().includes(searchQuery);
                const cityMatch = item.city.toLowerCase().includes(searchQuery);
                const invMatch = (item.orderRef || '').toString().toLowerCase().includes(searchQuery);
                return partyMatch || itemMatch || cityMatch || invMatch;
            });
        }

        const total = mappedData.length;
        const paginatedData = mappedData.slice(offset, offset + limit);

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
        console.error('Invoice API Error:', error);
        return NextResponse.json({
            error: error.message,
        }, { status: 500 });
    }
}
