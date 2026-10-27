const test = require('node:test');
const assert = require('node:assert/strict');
const { getWarnings } = require('../weather');

test('feed peringatan memetakan judul, tautan, deskripsi, dan tanggal', async () => {
  const originalFetch = global.fetch;
  const xml = `<?xml version="1.0"?>
    <rss version="2.0"><channel><title>BMKG</title>
      <item>
        <title>Hujan &amp; Petir di Bengkulu</title>
        <link>https://www.bmkg.go.id/alerts/nowcast/id/CNB123.xml</link>
        <description>Hujan lebat &amp; petir</description>
        <pubDate>Tue, 27 Oct 2026 18:32:00 +0700</pubDate>
      </item>
    </channel></rss>`;

  global.fetch = async () => ({
    ok: true, status: 200, text: async () => xml,
  });

  try {
    const result = await getWarnings();
    assert.equal(result.status, 'ok');
    assert.equal(result.source, 'BMKG');
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].title, 'Hujan & Petir di Bengkulu');
    assert.equal(result.warnings[0].description, 'Hujan lebat & petir');
    assert.equal(
      result.warnings[0].url,
      'https://www.bmkg.go.id/alerts/nowcast/id/CNB123.xml'
    );
    assert.match(result.warnings[0].publishedAt, /Tue, 27 Oct 2026/);
  } finally {
    global.fetch = originalFetch;
  }
});
