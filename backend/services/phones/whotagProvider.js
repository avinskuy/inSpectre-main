'use strict';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;

// SQLite baru dimuat ketika cache benar-benar digunakan.
// Ini mencegah tes membuat/membuka database produksi.
const sqliteCacheStore = {
  get(phone) {
    return require('../storage/db').getWhoTagCache(phone);
  },
  set(phone, value, cachedAt) {
    return require('../storage/db').setWhoTagCache(phone, value, cachedAt);
  },
  clear(phone) {
    return require('../storage/db').clearWhoTagCache(phone);
  },
};

function createWhoTagProvider(options = {}) {
  const cacheStore = options.cacheStore || sqliteCacheStore;
  const fetchImpl = options.fetchImpl || ((...args) => fetch(...args));
  const now = options.now || (() => Date.now());
  const getApiKey = options.getApiKey || (() => process.env.WHOTAGME_API_KEY);
  const getAccountId = options.getAccountId || (() => process.env.WHOTAGME_ACCOUNT_ID);

  async function lookupWhoTag(phoneNumber) {
    const phone = String(phoneNumber || '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return { status: 'INVALID_INPUT' };
    }

    const timestamp = now();
    const apiKey = getApiKey();
    const accountId = String(getAccountId() || '').trim();

    try {
      const cached = cacheStore.get(phone);
      const cacheHasFreshTags = !accountId || (
        Array.isArray(cached?.value?.tags) &&
        ['AVAILABLE', 'NO_DATA'].includes(cached?.value?.tagsStatus)
      );
      if (
        cached &&
        cached.value &&
        cached.value.status === 'AVAILABLE' &&
        cacheHasFreshTags &&
        timestamp - cached.cachedAt >= 0 &&
        timestamp - cached.cachedAt < CACHE_TTL_MS
      ) {
        return { ...cached.value, cache: 'HIT' };
      }
    } catch (error) {
      console.error('WhoTag cache read error:', error.message);
    }

    if (!apiKey) {
      return { status: 'UNAVAILABLE', reason: 'CONFIG_MISSING' };
    }

    const headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const response = await fetchImpl('https://api.whotag.me/v1/gc/look', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phoneNumber: phone }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const json = await response.json().catch(() => null);
      if (!response.ok || json?.success !== true) {
        return {
          status: 'UNAVAILABLE',
          reason: response.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : 'PROVIDER_ERROR',
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
      const hasValue = (value) =>
        value !== null && value !== undefined && String(value).trim() !== '';

      let tags = null;
      let tagsStatus = accountId ? 'UNAVAILABLE' : 'NOT_CONFIGURED';
      let tagsReason = accountId ? 'PROVIDER_ERROR' : 'ACCOUNT_ID_MISSING';

      if (accountId) {
        try {
          const infoResponse = await fetchImpl('https://api.whotag.me/v1/gc/info', {
            method: 'POST',
            headers,
            body: JSON.stringify({ phoneNumber: phone, accountId }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
          const infoJson = await infoResponse.json().catch(() => null);
          if (infoResponse.ok && infoJson?.success === true) {
            const rawTags = infoJson?.data?.result?.tags;
            if (Array.isArray(rawTags)) {
              tags = rawTags
                .filter((item) => item && typeof item.tag === 'string' && item.tag.trim())
                .map((item) => ({
                  tag: item.tag.trim().slice(0, 120),
                  count: parseCount(item.count),
                }));
              tagsStatus = tags.length ? 'AVAILABLE' : 'NO_DATA';
              tagsReason = null;
            } else {
              tagsStatus = 'NO_DATA';
              tagsReason = null;
              tags = [];
            }
          } else {
            tagsReason = infoResponse.status === 429
              ? 'QUOTA_OR_RATE_LIMIT'
              : 'PROVIDER_ERROR';
          }
        } catch (error) {
          tagsReason = error?.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR';
        }
      }

      const tagCount = parseCount(profile.tagCount) ?? (Array.isArray(tags) ? tags.length : null);
      const commentCount = parseCount(comments.commentCount);
      const hasEvidence =
        hasValue(result.badge) ||
        hasValue(trust.level) ||
        hasValue(spam.degree) ||
        tagCount !== null ||
        commentCount !== null ||
        (Array.isArray(tags) && tags.length > 0);

      const noData = Boolean(data?.meta?.errorCode) || !hasEvidence;
      const value = {
        status: noData ? 'NO_DATA' : 'AVAILABLE',
        source: 'WhoTag.me / Getcontact',
        badge: result.badge ?? null,
        trustLevel: trust.level ?? null,
        spamDegree: spam.degree ?? null,
        tagCount,
        commentCount,
        tags,
        tagsStatus,
        ...(tagsReason ? { tagsReason } : {}),
        checkedAt: new Date(timestamp).toISOString(),
        caveat: 'Sinyal reputasi bukan bukti pasti penipuan atau keamanan.',
      };

      // Jangan cache kegagalan detail tag; percobaan berikutnya perlu bisa mencoba ulang.
      const cacheable = value.status === 'AVAILABLE' &&
        (!accountId || ['AVAILABLE', 'NO_DATA'].includes(tagsStatus));
      if (cacheable) {
        try {
          cacheStore.set(phone, value, timestamp);
        } catch (error) {
          console.error('WhoTag cache write error:', error.message);
        }
        return { ...value, cache: 'MISS' };
      }

      return value;
    } catch (error) {
      return {
        status: 'UNAVAILABLE',
        reason: error?.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR',
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
