// ── Keyed memory cache ───────────────────────────────────────────────────────────
interface CacheEntry {
  data: any[];
  timestamp: number;
  etag?: string;
}

const CACHE_TTL_MS      = 5 * 60 * 1000;  // 5 min — serve fresh data
const STALE_MAX_MS      = 30 * 60 * 1000; // 30 min — serve stale while refreshing
const PREREFRESH_MS     = 60 * 1000;       // start background refresh 60s before expiry

// Storage keyed by URL to prevent data leakage between different sheets/APIs
const memoryCacheMap = new Map<string, CacheEntry>();
const pendingRequestsMap = new Map<string, Promise<any[]>>();
const backgroundRefreshScheduledSet = new Set<string>();

// ── Low-level fetch with ETag conditional request ────────────────────────────────
async function fetchFromSource(
  url: string,
  existingEtag?: string
): Promise<{ data: any[] | null; etag?: string }> {
  const headers: Record<string, string> = {};
  if (existingEtag) {
    headers['If-None-Match'] = existingEtag;
  }

  const response = await fetch(url, { cache: 'no-store', headers });

  if (response.status === 304) {
    return { data: null, etag: existingEtag };
  }

  if (!response.ok) {
    throw new Error(`External API failed: ${response.status} ${response.statusText}`);
  }

  const etag = response.headers.get('etag') ?? undefined;
  const text = await response.text();
  if (!text || text.trim() === '') {
    return { data: [], etag: undefined };
  }

  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Received HTML instead of JSON — check API URL.');
  }

  let rawData: any;
  try {
    rawData = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON from external API.');
  }

  const data: any[] = Array.isArray(rawData)
    ? rawData
    : rawData?.DataRec ?? rawData?.data ?? [];

  return { data, etag };
}

// ── Background refresh (does NOT block any request) ──────────────────────────────
function scheduleBackgroundRefresh(url: string, delayMs: number) {
  if (backgroundRefreshScheduledSet.has(url)) return;
  backgroundRefreshScheduledSet.add(url);

  setTimeout(async () => {
    backgroundRefreshScheduledSet.delete(url);
    const cache = memoryCacheMap.get(url);
    if (!cache) return;
    
    try {
      const { data, etag } = await fetchFromSource(url, cache.etag);
      if (data !== null) {
        memoryCacheMap.set(url, { data, timestamp: Date.now(), etag });
      } else {
        memoryCacheMap.set(url, { ...cache, timestamp: Date.now() });
      }
      scheduleBackgroundRefresh(url, CACHE_TTL_MS - PREREFRESH_MS);
    } catch (e) {
      // background fail is silent
    }
  }, delayMs);
}

// ── Main exported function ───────────────────────────────────────────────────────
export async function getCachedData(url: string, forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  const cache = memoryCacheMap.get(url);
  const age = cache ? now - cache.timestamp : Infinity;

  // ── Layer 1: Fresh cache ──
  if (!forceRefresh && cache && age < CACHE_TTL_MS) {
    const timeUntilExpiry = CACHE_TTL_MS - age;
    if (timeUntilExpiry < PREREFRESH_MS) {
      scheduleBackgroundRefresh(url, 0);
    }
    return cache.data;
  }

  // ── Layer 2: Stale but usable ──
  if (!forceRefresh && cache && age < STALE_MAX_MS) {
    scheduleBackgroundRefresh(url, 0);
    return cache.data;
  }

  // ── Layer 3: No cache or forced ──
  let pending = pendingRequestsMap.get(url);
  if (pending) return pending;

  pending = (async () => {
    try {
      const existingCache = memoryCacheMap.get(url);
      const { data, etag } = await fetchFromSource(url, existingCache?.etag);

      let finalData: any[];
      if (data === null && existingCache) {
        finalData = existingCache.data;
        memoryCacheMap.set(url, { data: finalData, timestamp: Date.now(), etag });
      } else {
        finalData = data || [];
        memoryCacheMap.set(url, { data: finalData, timestamp: Date.now(), etag });
      }

      scheduleBackgroundRefresh(url, CACHE_TTL_MS - PREREFRESH_MS);
      return finalData;
    } finally {
      pendingRequestsMap.delete(url);
    }
  })();

  pendingRequestsMap.set(url, pending);
  return pending;
}

/**
 * Invalidates the memory cache immediately for a specific URL or all URLs.
 */
export function invalidateDataCache(url?: string): void {
  if (url) {
    memoryCacheMap.delete(url);
    pendingRequestsMap.delete(url);
    backgroundRefreshScheduledSet.delete(url);
  } else {
    memoryCacheMap.clear();
    pendingRequestsMap.clear();
    backgroundRefreshScheduledSet.clear();
  }
}
