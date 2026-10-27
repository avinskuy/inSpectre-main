const test = require('node:test');
const assert = require('node:assert/strict');
const { getWarnings } = require('../weather');

test('feed rusak ditolak; feed valid tanpa item berarti daftar kosong', async () => {
  const originalFetch = global.fetch;
  let calls = 0;

  global.fetch = async () => {
    calls += 1;
    const body = calls === 1
      ? '<html>temporary upstream error</html>'
      : '<rss version="2.0"><channel><title>BMKG</title></channel></rss>';
    return { ok: true, status: 200, text: async () => body };
  };

  try {
    await assert.rejects(
      getWarnings(),
      (error) => error.statusCode === 502
    );

    const result = await getWarnings();
    assert.equal(result.status, 'ok');
    assert.deepEqual(result.warnings, []);
    assert.equal(calls, 2);
  } finally {
    global.fetch = originalFetch;
  }
});
