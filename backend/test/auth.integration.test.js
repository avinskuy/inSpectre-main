const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-auth-test-'));
process.env.INSPECTRE_DATA_DIR = tempDir;
process.env.INSPECTRE_DB_PATH = path.join(tempDir, 'auth.sqlite');
process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'numbers.json');

const { server } = require('../server');
const { logScan } = require('../db');
let baseUrl;
let aliceCookie;
let bobCookie;

test.before(async () => {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server.listening) await new Promise(resolve => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function register(email, displayName) {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName, password: 'SecurePass123!' }),
  });
  const body = await response.json();
  return { response, body, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

test('riwayat ditolak tanpa sesi', async () => {
  const response = await fetch(`${baseUrl}/api/recent`);
  assert.equal(response.status, 401);
});

test('registrasi membuat sesi HttpOnly dan akun unik', async () => {
  const result = await register('alice@example.test', 'Alice');
  assert.equal(result.response.status, 201);
  assert.equal(result.body.user.email, 'alice@example.test');
  assert.match(result.response.headers.get('set-cookie') || '', /HttpOnly/i);
  assert.match(result.response.headers.get('set-cookie') || '', /SameSite=Lax/i);
  aliceCookie = result.cookie;

  const duplicate = await register('ALICE@example.test', 'Alice Again');
  assert.equal(duplicate.response.status, 409);
});


test('dashboard stats tetap publik dan login membuat sesi baru', async () => {
  const stats = await fetch(`${baseUrl}/api/stats`);
  assert.equal(stats.status, 200);

  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@example.test', password: 'SecurePass123!' }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);

  const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  const body = await me.json();
  assert.equal(me.status, 200);
  assert.equal(body.user.email, 'alice@example.test');
});

test('riwayat hanya berisi scan milik akun yang sedang masuk', async () => {
  const bob = await register('bob@example.test', 'Bob');
  assert.equal(bob.response.status, 201);
  bobCookie = bob.cookie;

  const { getUserByEmail } = require('../db');
  const alice = getUserByEmail('alice@example.test');
  const bobUser = getUserByEmail('bob@example.test');
  logScan('link', 'https://alice.example.test/path', 12, 'AMAN', [], alice.id);
  logScan('link', 'https://bob.example.test/path', 82, 'PHISHING', [], bobUser.id);

  const aliceHistory = await fetch(`${baseUrl}/api/recent`, { headers: { Cookie: aliceCookie } });
  const bobHistory = await fetch(`${baseUrl}/api/recent`, { headers: { Cookie: bobCookie } });
  const aliceRows = await aliceHistory.json();
  const bobRows = await bobHistory.json();

  assert.equal(aliceRows.length, 1);
  assert.equal(aliceRows[0].riskLevel, 'AMAN');
  assert.equal(bobRows.length, 1);
  assert.equal(bobRows[0].riskLevel, 'PHISHING');
});

test('login gagal untuk kata sandi yang salah dan logout mengakhiri sesi', async () => {
  const bad = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@example.test', password: 'wrong-password' }),
  });
  assert.equal(bad.status, 401);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: aliceCookie },
  });
  assert.equal(logout.status, 200);

  const history = await fetch(`${baseUrl}/api/recent`, { headers: { Cookie: aliceCookie } });
  assert.equal(history.status, 401);
});
