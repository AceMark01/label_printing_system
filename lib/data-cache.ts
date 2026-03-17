
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 30 * 1000; // 30 seconds cache
let sheetCache: CacheEntry<any[]> | null = null;
let isFetching = false;
let pendingRequest: Promise<any[]> | null = null;

export async function getCachedSheetData(url: string, forceRefresh = false): Promise<any[]> {
  const now = Date.now();

  // If we have valid cache and not forcing refresh, return it
  if (!forceRefresh && sheetCache && (now - sheetCache.timestamp < CACHE_TTL)) {
    console.log('Using cached sheet data (Age: ' + (now - sheetCache.timestamp) + 'ms)');
    return sheetCache.data;
  }

  // If already fetching, return the existing promise to avoid multiple simultaneous fetches
  if (isFetching && pendingRequest) {
    console.log('Fetch already in progress, waiting for existing request...');
    return pendingRequest;
  }

  console.log('Fetching fresh data from Google Sheets...');
  isFetching = true;
  
  pendingRequest = (async () => {
    try {
      const response = await fetch(url, {
         // Prevent Next.js from caching the fetch result itself in a way we can't control
         next: { revalidate: 0 } 
      });

      if (!response.ok) {
        throw new Error(`Google Sheet fetch failed: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Safety check: Is it actually JSON?
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('Google Script error: Received HTML instead of JSON.');
      }

      let rawData;
      try {
        rawData = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid JSON format from Google Sheets');
      }

      const allData = Array.isArray(rawData) ? rawData : (rawData?.DataRec || rawData?.data || []);
      
      sheetCache = {
        data: allData,
        timestamp: Date.now()
      };
      
      return allData;
    } finally {
      isFetching = false;
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}
