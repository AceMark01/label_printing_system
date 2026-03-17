import { Label } from './types';

export interface TicTakRow {
    ProductName: string;
    AccountName: string;
    Remark: string;
    DispatchQty: number;
    DispatchBdlQty: number;
    SOrderNo: string;
    City: string;
    Transporter?: string;
}

export interface PaginatedLabels {
    data: Label[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface TicTakFilters {
    cities: string[];
    parties: string[];
    items: string[];
    transporters: string[];
}

export async function fetchTicTakData(
    page = 1, 
    limit = 20, 
    filters?: {
        cities?: string[],
        parties?: string[],
        items?: string[],
        transporters?: string[],
        q?: string
    }
): Promise<PaginatedLabels> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    if (filters?.cities?.length) params.append('cities', filters.cities.join(','));
    if (filters?.parties?.length) params.append('parties', filters.parties.join(','));
    if (filters?.items?.length) params.append('items', filters.items.join(','));
    if (filters?.transporters?.length) params.append('transporters', filters.transporters.join(','));
    if (filters?.q) params.append('q', filters.q);

    const response = await fetch(`/api/labels?${params.toString()}`);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || errorData.details || 'Failed to fetch data from labels API');
    }

    return await response.json();
}

export async function fetchFilterData(): Promise<TicTakFilters> {
    const response = await fetch('/api/filters');
    if (!response.ok) {
        throw new Error('Failed to fetch filters');
    }
    return await response.json();
}
