const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const compiled = mkdtempSync(join(tmpdir(), 'vnstat-tests-'));
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--outDir', compiled, '--module', 'commonjs', '--target', 'ES2020', '--lib', 'ES2020,DOM', '--skipLibCheck', 'src/lib/api.ts', 'src/lib/format.ts', 'src/lib/export.ts']);
after(() => rmSync(compiled, { recursive: true, force: true }));
const format = require(join(compiled, 'lib/format.js'));
const api = require(join(compiled, 'lib/api.js'));
const { buildTrafficCsv } = require(join(compiled, 'lib/export.js'));
const storage = new Map();
global.window = { localStorage: { getItem: (key) => storage.get(key) ?? null }, setTimeout, clearTimeout };
const bootstrap = {
  request: { iface: 'eth0', page: 'h', style: 'light' },
  options: { ifaces: [{ id: 'eth0' }, { id: 'sixxs' }], pages: [{ id: 'h' }, { id: 'd' }], styles: [{ id: 'light' }, { id: 'dark' }] },
  endpoints: { data: '/api/traffic.php' },
  labels: { requestFailed: 'Request failed', requestTimeout: 'Timed out' }
};

test('forced TB formatting terminates and preserves the selected unit', () => {
  const script = `const {formatKbytes} = require(${JSON.stringify(join(compiled, 'lib/format.js'))}); process.stdout.write(formatKbytes(1073741824, 'en', 'TB'));`;
  assert.equal(execFileSync(process.execPath, ['-e', script], { timeout: 3000, encoding: 'utf8' }), '1.00 TB');
});
test('unit boundaries, zero, and invalid preferred units', () => {
  assert.equal(format.formatKbytes(0, 'en', null), '0.00 KB');
  assert.equal(format.formatKbytes(1024, 'en', null), '1.00 MB');
  assert.equal(format.formatKbytes(1048576, 'en', null), '1.00 GB');
  assert.equal(format.formatKbytes(1024, 'en', 'GB'), '0.00 GB');
  assert.equal(format.formatKbytes(1024, 'en', 'invalid'), '1.00 MB');
  assert.equal(format.formatKbytes(Infinity, 'en', null), '0.00 KB');
});
test('language aliases and invalid locales format safely', () => {
  assert.equal(format.resolveLocale('cn'), 'zh-CN');
  assert.equal(format.resolveLocale('br'), 'pt-BR');
  assert.equal(format.resolveLocale('bad_locale'), 'en');
  assert.equal(format.formatAxisKbytes(1024, 'cn', null), '1MB');
});
test('route parsing validates options and preserves explicit theme over storage', () => {
  storage.set('vnstat-theme', 'dark');
  assert.deepEqual(api.parseRoute('?if=unknown&page=unknown', bootstrap), { iface: 'eth0', page: 'h', style: 'dark' });
  assert.deepEqual(api.parseRoute('?if=sixxs&page=d&style=light', bootstrap), { iface: 'sixxs', page: 'd', style: 'light' });
  assert.equal(api.parseRoute('?style=invalid', bootstrap).style, 'light');
  storage.clear();
});
test('route URLs round-trip encoded interface names', () => {
  const route = { iface: 'eth 0&1', page: 'd', style: 'dark' };
  const query = new URLSearchParams(api.buildSearch(route));
  assert.equal(query.get('if'), route.iface);
  assert.equal(query.get('page'), 'd');
});
test('API errors use server messages and never cache traffic', async () => {
  const original = global.fetch;
  global.fetch = async (_, options) => {
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ error: 'vnStat unavailable' }), { status: 503 });
  };
  try {
    await assert.rejects(api.fetchAppPayload(bootstrap, bootstrap.request), /vnStat unavailable/);
  } finally { global.fetch = original; }
});
test('wrong-route and malformed payloads are rejected', async () => {
  const original = global.fetch;
  try {
    for (const body of [{ meta: { iface: 'sixxs', page: 'h' } }, {}]) {
      global.fetch = async () => new Response(JSON.stringify(body));
      await assert.rejects(api.fetchAppPayload(bootstrap, bootstrap.request), /Request failed/);
    }
    global.fetch = async () => new Response('<html>PHP error</html>');
    await assert.rejects(api.fetchAppPayload(bootstrap, bootstrap.request), /Request failed/);
  } finally { global.fetch = original; }
});
test('request timeout aborts the request with a recoverable error', async () => {
  const original = global.fetch;
  window.setTimeout = (fn) => setTimeout(fn, 5);
  global.fetch = async (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  try { await assert.rejects(api.fetchJson('/api', bootstrap.labels), /Timed out/); }
  finally { global.fetch = original; window.setTimeout = setTimeout; }
});
test('caller cancellation aborts pending requests', async () => {
  const original = global.fetch;
  const controller = new AbortController();
  global.fetch = async (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  try {
    const request = api.fetchJson('/api', bootstrap.labels, controller.signal);
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  } finally { global.fetch = original; }
});
test('CSV exports exact counters, escaped cells, and spreadsheet-safe labels', () => {
  const csv = buildTrafficCsv([{ label: '=SUM(1,2)"', rx: 1024.5, tx: 2, total: 1026.5 }], { period: '时间', in: '流入', out: '流出', total: '总流量' });
  assert.ok(csv.startsWith('\uFEFF"时间","流入 (KB)"'));
  assert.ok(csv.includes('"\'=SUM(1,2)""","1024.5","2","1026.5"'));
});
