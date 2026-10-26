'use strict';

const ENDPOINT =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find';

async function checkUrlReputation(url, options = {}) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return { status: 'unavailable', reason: 'API_KEY_MISSING' };
  }

  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { status: 'unavailable', reason: 'UNSUPPORTED_URL' };
    }
  } catch {
    return { status: 'unavailable', reason: 'INVALID_URL' };
  }

  const controller = new AbortController();
  const timeoutMs = Math.min(
    Math.max(Number(options.timeoutMs) || 6000, 1000),
    10000
  );
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await (options.fetch || fetch)(
      `${ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          client: {
            clientId: 'inspectre',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url: parsed.href }]
          }
        })
      }
    );

    if (!response.ok) {
      return {
        status: 'unavailable',
        reason: `HTTP_${response.status}`
      };
    }

    const data = await response.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];

    if (matches.length > 0) {
      return {
        status: 'threat',
        threats: [...new Set(matches.map((item) => item.threatType))]
      };
    }

    return { status: 'no_match' };
  } catch (error) {
    return {
      status: 'unavailable',
      reason: error && error.name === 'AbortError'
        ? 'TIMEOUT'
        : 'NETWORK_ERROR'
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { checkUrlReputation };
