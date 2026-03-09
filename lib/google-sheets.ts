import { Label } from './types';

export interface TicTakRow {
    ProductName: string;
    AccountName: string;
    Remark: string;
    DispatchQty: number;
    DispatchBdlQty: number;
    SOrderNo: string;
    City: string;
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

export async function fetchTicTakData(page = 1, limit = 20): Promise<PaginatedLabels> {
    const response = await fetch(`/api/labels?page=${page}&limit=${limit}`);

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
