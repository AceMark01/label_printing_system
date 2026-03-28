import { Label, FilterState } from './types';

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

/**
 * Fetches label data from the centralized Supabase/API backend.
 * Now strictly using the new FilterState interface for type safety.
 */
export async function fetchTicTakData(
    page = 1, 
    limit = 20, 
    filters?: Partial<FilterState>
): Promise<PaginatedLabels> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
    });

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                params.append(key, value.join(','));
            } else if (typeof value === 'string' && value) {
                params.append(key, value);
            } else if (typeof value === 'boolean' && value) {
                params.append(key, 'true');
            }
        });
    }

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

/**
 * Fetches available filter options (cities, parties, etc.) from Supabase.
 */
export async function fetchFilterData(includeProcessed = false): Promise<TicTakFilters> {
    const params = new URLSearchParams();
    if (includeProcessed) params.append('includeProcessed', 'true');
    const response = await fetch(`/api/filters?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch filters');
    }
    return await response.json();
}
