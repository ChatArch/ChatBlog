const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function helper() {
  const p = path.join(root, 'scripts/editor-entry.cjs');
  assert.ok(fs.existsSync(p), 'The login entry contract must exist');
  return require(p).editorLoginUrl;
}

test('login remains discoverable in navbar without a configured backend', () => {
  const previous = process.env.CHATBLOG_EDITOR_ORIGIN;
  delete process.env.CHATBLOG_EDITOR_ORIGIN;
  try {
    const p = require.resolve('../../docusaurus.config.js');
    delete require.cache[p];
    const config = require(p);
    assert.ok(config.themeConfig.navbar.items.some(item => item.to === '/login' && item.label === '登录'));
    assert.equal(config.customFields.editorOrigin, '');
  } finally {
    if (previous === undefined) delete process.env.CHATBLOG_EDITOR_ORIGIN;
    else process.env.CHATBLOG_EDITOR_ORIGIN = previous;
  }
});

test('missing backend has an honest status page, not a dummy password form', () => {
  const p = path.join(root, 'src/pages/login.tsx');
  assert.ok(fs.existsSync(p), 'A reachable login/status route must exist');
  const source = fs.readFileSync(p, 'utf8');
  assert.match(source, /登录入口尚未配置/);
  assert.match(source, /前往编辑服务登录/);
  assert.doesNotMatch(source, /<input\b/);
});

test('entry resolves only the fixed ChatLogin auth path and safe editor return', () => {
  const loginUrl = helper();
  for (const empty of ['', undefined, null]) assert.equal(loginUrl(empty), null);
  const u = new URL(loginUrl('https://editor.example.invalid'));
  assert.equal(u.origin, 'https://editor.example.invalid');
  assert.equal(u.pathname, '/auth/');
  assert.equal(u.searchParams.get('next'), '/editor');
  assert.equal(new URL(loginUrl('http://127.0.0.1:10087')).protocol, 'http:');
});

test('unsafe origins cannot become login links or leak input in errors', () => {
  const loginUrl = helper();
  for (const value of ['javascript:alert(1)', '/relative', 'http://editor.example.invalid',
    'ftp://127.0.0.1', 'https://editor.example.invalid/path', 'https://editor.example.invalid?key=canary',
    'https://user:canary@editor.example.invalid', 'https://editor.example.invalid#fragment', {}, false]) {
    assert.throws(() => loginUrl(value), error => error.message === 'Invalid editor origin');
  }
});
