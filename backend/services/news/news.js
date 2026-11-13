// Threat Intelligence: agregasi RSS Google News untuk berita penipuan/phishing.
// Tidak memerlukan API key; judul, tanggal, dan tautan mengarah ke sumber asli.
const FEEDS = [
  { query: 'phishing OR penipuan online Indonesia', category: 'Phishing & Penipuan' },
  { query: 'penipuan digital modus rekening Indonesia', category: 'Penipuan Digital' },
  { query: 'OJK scam investasi ilegal penipuan', category: 'Scam Keuangan' },
  { query: 'kebocoran data keamanan siber Indonesia', category: 'Keamanan Siber' },
];
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
let cache = { articles: [], updatedAt: null, lastAttemptAt: 0, error: null };
let inFlight = null;

function decodeEntities(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()) : '';
}
function categoryFor(text, fallback) {
  const t = text.toLowerCase();
  if (/investasi|pinjol|ojk|rekening|perbankan|keuangan/.test(t)) return 'Scam Keuangan';
  if (/phishing|phising|situs palsu|tautan palsu|domain palsu/.test(t)) return 'Phishing';
  if (/kebocoran data|ransomware|malware|serangan siber|keamanan siber/.test(t)) return 'Keamanan Siber';
  if (/scam|penipuan|penipu|judi online|modus/.test(t)) return 'Penipuan Digital';
  return fallback;
}
function parseFeed(xml, feedCategory) {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

  return blocks.map((item) => {
    const title = tagValue(item, 'title');
    const link = tagValue(item, 'link') ||
      (item.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] || '';

    const publishedRaw =
      tagValue(item, 'pubDate') ||
      tagValue(item, 'published') ||
      tagValue(item, 'updated');

    const rawDescription =
      tagValue(item, 'description') || tagValue(item, 'summary');

    const sourceMatch = item.match(
      /<source\b[^>]*\burl=["']([^"']+)["'][^>]*>([\s\S]*?)<\/source>/i
    );

    const sourceUrl = sourceMatch
      ? decodeEntities(sourceMatch[1]).trim()
      : '';

    const sourceName = sourceMatch
      ? decodeEntities(sourceMatch[2].replace(/<[^>]*>/g, '')).trim()
      : '';

    const description = rawDescription
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const source = sourceName || (() => {
      try {
        return new URL(link).hostname.replace(/^www\./, '');
      } catch {
        return 'Sumber berita';
      }
    })();

    const publishedAt =
      publishedRaw && !Number.isNaN(Date.parse(publishedRaw))
        ? new Date(publishedRaw).toISOString()
        : null;

    if (!title || !/^https?:\/\//i.test(link)) return null;

    let publisherUrl = '';
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        publisherUrl = parsed.href;
      }
    } catch {}

    return {
      id: link,
      title,
      link,
      publisherUrl,
      description: description.slice(0, 360),
      source: source.slice(0, 100),
      publishedAt,
      category: categoryFor(`${title} ${description}`, feedCategory),
    };
  }).filter(Boolean);
}
async function fetchFeed(feed) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=id&gl=ID&ceid=ID:id`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'inSpectre-ThreatIntelligence/1.0 (RSS reader)' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`RSS membalas HTTP ${response.status}`);
  return parseFeed(await response.text(), feed.category);
}
async function getNews({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.articles.length && now - cache.lastAttemptAt < CACHE_TTL_MS) return cache;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    cache.lastAttemptAt = Date.now();
    const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
    const articles = settled.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
    const failedCount = settled.filter((r) => r.status === 'rejected').length;
    if (articles.length) {
      const unique = new Map();
      for (const article of articles) if (!unique.has(article.link)) unique.set(article.link, article);
      cache = {
        articles: [...unique.values()].sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0)).slice(0, 60),
        updatedAt: new Date().toISOString(), lastAttemptAt: Date.now(),
        error: failedCount ? 'Sebagian sumber berita tidak dapat diakses; hasil yang tersedia tetap ditampilkan.' : null,
      };
    } else {
      cache = { ...cache, lastAttemptAt: Date.now(), error: 'Sumber berita belum dapat dijangkau. Periksa koneksi internet backend lalu coba muat ulang.' };
    }
    return cache;
  })().finally(() => { inFlight = null; });
  return inFlight;
}
module.exports = { getNews };
