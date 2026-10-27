'use strict';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;

// SQLite baru dimuat ketika cache benar-benar digunakan.
// Ini mencegah tes membuat/membuka database produksi.
const sqliteCacheStore = {
  get(phone) {
    return require('./db').getWhoTagCache(phone);
  },
  set(phone, value, cachedAt) {
    return require('./db').setWhoTagCache(phone, value, cachedAt);
  },
  clear(phone) {
    return require('./db').clearWhoTagCache(phone);
  },
};

function createWhoTagProvider(options = {}) {
  const cacheStore = options.cacheStore || sqliteCacheStore;
  const fetchImpl = options.fetchImpl || ((...args) => fetch(...args));
  const now = options.now || (() => Date.now());
  const getApiKey = options.getApiKey || (() => process.env.WHOTAGME_API_KEY);

  async function lookupWhoTag(phoneNumber) {
    const phone = String(phoneNumber || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return { status: 'INVALID_INPUT' };
    }

    const timestamp = now();
    try {
      const cached = cacheStore.get(phone);
      if (
        cached &&
        cached.value &&
        cached.value.status === 'AVAILABLE' &&
        timestamp - cached.cachedAt >= 0 &&
        timestamp - cached.cachedAt < CACHE_TTL_MS
      ) {
        return { ...cached.value, cache: 'HIT' };
      }
    } catch (error) {
      // Cache bermasalah tidak boleh membuat nomor tampak aman.
      console.error('WhoTag cache read error:', error.message);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return { status: 'UNAVAILABLE', reason: 'CONFIG_MISSING' };
    }

    try {
      const response = await fetchImpl('https://api.whotag.me/v1/gc/look', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || json?.success !== true) {
        return {
          status: 'UNAVAILABLE',
          reason: response.status === 429
            ? 'QUOTA_OR_RATE_LIMIT'
            : 'PROVIDER_ERROR',
        };
      }

      const data = json?.data || {};
      const result = data?.result || {};
      const profile = result?.profile || {};
      const trust = result?.trust || {};
      const spam = result?.spamInfo || {};
      const comments = result?.comments || {};

      const parseCount = (value) =>
        value !== null && value !== undefined && value !== '' &&
        Number.isFinite(Number(value)) && Number(value) >= 0
          ? Number(value)
          : null;

      const tagCount = parseCount(profile.tagCount);
      const commentCount = parseCount(comments.commentCount);
      const hasValue = (value) =>
        value !== null && value !== undefined &&
        String(value).trim() !== '';

      const hasEvidence =
        hasValue(result.badge) ||
        hasValue(trust.level) ||
        hasValue(spam.degree) ||
        tagCount !== null ||
        commentCount !== null;

      const noData = Boolean(data?.meta?.errorCode) || !hasEvidence;
      const value = {
        status: noData ? 'NO_DATA' : 'AVAILABLE',
        source: 'WhoTag.me / Getcontact',
        badge: result.badge ?? null,
        trustLevel: trust.level ?? null,
        spamDegree: spam.degree ?? null,
        tagCount,
        commentCount,
        checkedAt: new Date(timestamp).toISOString(),
        caveat: 'Sinyal reputasi bukan bukti pasti penipuan atau keamanan.',
      };

      // Hanya cache bukti yang tersedia. NO_DATA dan error tidak disimpan.
      if (value.status === 'AVAILABLE') {
        try {
          cacheStore.set(phone, value, timestamp);
        } catch (error) {
          // Hasil live tetap bisa dipakai walau cache gagal ditulis.
          console.error('WhoTag cache write error:', error.message);
        }
        return { ...value, cache: 'MISS' };
      }

      return value;
    } catch (error) {
      return {
        status: 'UNAVAILABLE',
        reason: error?.name === 'TimeoutError'
          ? 'TIMEOUT'
          : 'NETWORK_ERROR',
      };
    }
  }

  function clearWhoTagCache(phone) {
    return cacheStore.clear(phone);
  }

  return { lookupWhoTag, clearWhoTagCache };
}

const provider = createWhoTagProvider();
module.exports = {
  lookupWhoTag: provider.lookupWhoTag,
  clearWhoTagCache: provider.clearWhoTagCache,
  createWhoTagProvider,
  CACHE_TTL_MS,
};
