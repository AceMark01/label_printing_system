// ── In-process memory cache ──────────────────────────────────────────────────────
interface CacheEntry {
  data: any[];
  timestamp: number;
  etag?: string;
}

const CACHE_TTL_MS      = 5 * 60 * 1000;  // 5 min — serve fresh data
const STALE_MAX_MS      = 30 * 60 * 1000; // 30 min — serve stale while refreshing
const PREREFRESH_MS     = 60 * 1000;       // start background refresh 60s before expiry

let memoryCache: CacheEntry | null = null;
let pendingRequest: Promise<any[]> | null = null;
let backgroundRefreshScheduled = false;

// ── Low-level fetch with ETag conditional request ────────────────────────────────
async function fetchFromSource(
  url: string,
  existingEtag?: string
): Promise<{ data: any[] | null; etag?: string }> {
  const headers: Record<string, string> = {};
  if (existingEtag) {
    // 304 Not Modified → server sends no body, so we keep our copy
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
  if (backgroundRefreshScheduled) return;
  backgroundRefreshScheduled = true;

  setTimeout(async () => {
    backgroundRefreshScheduled = false;
    // Only refresh if the cache hasn't already been invalidated/refreshed elsewhere
    if (!memoryCache) return;
    try {
      const { data, etag } = await fetchFromSource(url, memoryCache.etag);
      if (data !== null) {
        memoryCache = { data, timestamp: Date.now(), etag };
      } else {
        // 304: bump timestamp so TTL resets without a full download
        memoryCache = { ...memoryCache, timestamp: Date.now() };
      }
      scheduleBackgroundRefresh(url, CACHE_TTL_MS - PREREFRESH_MS);
    } catch (e) {
      // Background refresh failed — silently ignore, next foreground request will retry
      backgroundRefreshScheduled = false;
    }
  }, delayMs);
}

// ── Main exported function ───────────────────────────────────────────────────────
/**
 * Returns cached data with stale-while-revalidate semantics.
 *
 * Layer 1 – FRESH (< 5 min):          Return from memory instantly.
 * Layer 2 – STALE (5–30 min):         Return stale data instantly + trigger background refresh.
 * Layer 3 – VERY STALE / EMPTY cache: Await fresh fetch (user waits once).
 *
 * @param url           External API URL
 * @param forceRefresh  Bypass all caching (used by migrate route only)
 */
export async function getCachedData(url: string, forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  const age = memoryCache ? now - memoryCache.timestamp : Infinity;

  // ── Layer 1: Fresh cache — serve immediately ──
  if (!forceRefresh && memoryCache && age < CACHE_TTL_MS) {
    // Schedule background pre-refresh when we're ~60s from expiry
    const timeUntilExpiry = CACHE_TTL_MS - age;
    if (timeUntilExpiry < PREREFRESH_MS) {
      scheduleBackgroundRefresh(url, 0);
    }
    return memoryCache.data;
  }

  // ── Layer 2: Stale but usable — return immediately + refresh in background ──
  if (!forceRefresh && memoryCache && age < STALE_MAX_MS) {
    scheduleBackgroundRefresh(url, 0); // start right away in background
    return memoryCache.data;           // user gets data instantly, no wait
  }

  // ── Layer 3: No cache or forced or too old — user must wait ──
  // De-duplicate: if another request is already fetching, piggyback on it
  if (pendingRequest) return pendingRequest;

  pendingRequest = (async () => {
    try {
      const { data, etag } = await fetchFromSource(url, memoryCache?.etag);

      if (data === null) {
        // 304 Not Modified — reset TTL
        memoryCache = { data: memoryCache!.data, timestamp: Date.now(), etag };
      } else {
        memoryCache = { data, timestamp: Date.now(), etag };
      }

      // Schedule next background refresh
      scheduleBackgroundRefresh(url, CACHE_TTL_MS - PREREFRESH_MS);

      return memoryCache.data;
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
}

/**
 * Invalidates the memory cache immediately.
 * Call after write operations (print tracking, master data) so the next
 * foreground request fetches fresh data.
 */
export function invalidateDataCache(): void {
  memoryCache = null;
  pendingRequest = null;
  backgroundRefreshScheduled = false;
}
