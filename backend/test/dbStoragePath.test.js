const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspectre-db-path-test-'));
const databasePath = path.join(tempDir, 'nested', 'custom', 'inspectre.sqlite');

process.env.INSPECTRE_DATA_DIR = path.join(tempDir, 'data');
process.env.INSPECTRE_DB_PATH = databasePath;
process.env.INSPECTRE_NUMBERS_FILE = path.join(tempDir, 'data', 'numbers.json');

const { createUser, getUserByEmail } = require('../services/storage/db');

test('membuat direktori untuk INSPECTRE_DB_PATH kustom', () => {
  const user = createUser({
    email: 'storage@example.test',
    displayName: 'Storage Test',
    passwordHash: 'test-hash',
  });

  assert.ok(user.id > 0);
  assert.ok(fs.existsSync(databasePath));
  assert.equal(getUserByEmail('storage@example.test').id, user.id);
});

test.after(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});
