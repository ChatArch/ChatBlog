const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {articleUrl, validateArticleStatus, getSlopArticles, isSlopPath, filterSidebarItems} = require('../article-status.cjs');

const entry = (overrides = {}) => ({
  file: 'blog/2026-08-01-example.mdx', title: '示例文章', slug: 'example',
  date: '2026-08-01', status: 'slop', reason: '缺少可核验的实践证据。', ...overrides,
});

test('article links retain the existing blog slug without adding deployment baseUrl', () => {
  assert.equal(articleUrl('original-slug'), '/blog/original-slug');
  assert.equal(articleUrl('nested/原文'), '/blog/nested/原文');
});
test('invalid slugs fail rather than being silently repaired', () => {
  for (const slug of ['', '/leading', 'trailing/', '../escape', 'a/../b', 'a//b', 'a?x=1', 'a#b', 'https://example.com', 'a b', 'a\\b', '%2e%2e']) {
    assert.throws(() => articleUrl(slug), /slug/);
  }
});
test('only slop entries are shown, newest first, without mutating the manifest', () => {
  const manifest = [entry(), entry({file: 'blog/keep.md', slug: 'keep', status: 'keep'}), entry({file: 'blog/new.md', slug: 'new', date: '2026-09-01'})];
  const before = JSON.stringify(manifest);
  assert.deepEqual(getSlopArticles(manifest).map(({slug}) => slug), ['new', 'example']);
  assert.equal(JSON.stringify(manifest), before);
});
test('same-date entries have deterministic slug ordering', () => {
  assert.deepEqual(getSlopArticles([entry({file: 'blog/z.md', slug: 'z'}), entry({file: 'blog/a.md', slug: 'a'})]).map(({slug}) => slug), ['a', 'z']);
});
test('an empty or all-keep manifest has no quarantine entries', () => {
  assert.deepEqual(getSlopArticles([]), []);
  assert.deepEqual(getSlopArticles([entry({status: 'keep'})]), []);
});
test('the manifest requires an array of complete records', () => {
  assert.throws(() => validateArticleStatus({}), /array/);
  for (const field of ['file', 'title', 'slug', 'date', 'status', 'reason']) {
    const invalid = entry(); delete invalid[field];
    assert.throws(() => validateArticleStatus([invalid]), new RegExp(field));
  }
  assert.throws(() => validateArticleStatus([null]), /record/);
  assert.throws(() => validateArticleStatus([entry({status: 'draft'})]), /status/);
  assert.throws(() => validateArticleStatus([entry({reason: '  '})]), /reason/);
});
test('manifest dates must be real ISO calendar dates', () => {
  for (const date of ['2026-02-30', '2026-13-01', '2026-08-01T00:00:00Z', 'yesterday']) {
    assert.throws(() => validateArticleStatus([entry({date})]), /date/);
  }
  assert.doesNotThrow(() => validateArticleStatus([entry({date: '2024-02-29'})]));
});
test('manifest file paths stay inside blog and refer to Markdown', () => {
  for (const file of ['/blog/x.mdx', 'blog/../x.md', 'blog/x.png', 'blog//x.md', 'blog/a\\b.md']) {
    assert.throws(() => validateArticleStatus([entry({file})]), /file/);
  }
  assert.doesNotThrow(() => validateArticleStatus([entry({file: 'blog/folder/index.mdx'})]));
});
test('duplicate source files and duplicate URLs are rejected', () => {
  assert.throws(() => validateArticleStatus([entry(), entry({slug: 'other'})]), /duplicate file/);
  assert.throws(() => validateArticleStatus([entry(), entry({file: 'blog/other.mdx'})]), /duplicate slug/);
});
test('optional inventory validation rejects missing and extra articles', () => {
  assert.doesNotThrow(() => validateArticleStatus([entry()], [entry().file]));
  assert.throws(() => validateArticleStatus([entry()], [entry().file, 'blog/missing.md']), /inventory/);
  assert.throws(() => validateArticleStatus([entry()], []), /inventory/);
});

test('quarantine paths match production and preview bases without matching sibling slugs', () => {
  assert.equal(typeof isSlopPath, 'function');
  const manifest = [entry(), entry({file: 'blog/keep.md', slug: 'keep', status: 'keep'})];
  assert.equal(isSlopPath('/ChatBlog/blog/example', manifest), true);
  assert.equal(isSlopPath('/ChatBlog/dev/blog/example.html#section', manifest), true);
  assert.equal(isSlopPath('/ChatBlog/blog/keep', manifest), false);
  assert.equal(isSlopPath('/ChatBlog/blog/example-other', manifest), false);
});
test('sidebar excludes the current archived article as well as other archived entries', () => {
  assert.equal(typeof filterSidebarItems, 'function');
  const manifest = [entry()];
  const items = [{permalink: '/ChatBlog/dev/blog/example'}, {permalink: '/ChatBlog/dev/blog/keep'}];
  const before = JSON.stringify(items);
  assert.deepEqual(filterSidebarItems(items, manifest), [items[1]]);
  assert.equal(JSON.stringify(items), before);
});

const root = path.resolve(__dirname, '../..');
const manifestPath = path.join(root, 'src/data/article-status.json');
test('real manifest covers every blog source and matches quarantine frontmatter', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const files = fs.readdirSync(path.join(root, 'blog'), {recursive: true})
    .filter((file) => /\.mdx?$/.test(file)).map((file) => `blog/${file.split(path.sep).join('/')}`);
  validateArticleStatus(manifest, files);
  for (const record of manifest) {
    const source = fs.readFileSync(path.join(root, record.file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    assert.ok(frontmatter, `${record.file}: missing frontmatter`);
    const scalar = (key) => {
      const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1]?.trim();
      if (raw?.startsWith('"')) return JSON.parse(raw);
      if (raw?.startsWith("'")) return raw.slice(1, -1).replaceAll("''", "'");
      return raw;
    };
    assert.equal(scalar('slug'), record.slug, `${record.file}: URL changed`);
    assert.notEqual(scalar('draft'), 'true', `${record.file}: draft would remove the old URL`);
    if (record.status === 'slop') {
      assert.equal(scalar('unlisted'), 'true', record.file);
      assert.equal(scalar('ai_slop'), 'true', record.file);
      assert.equal(scalar('ai_slop_reason'), record.reason, record.file);
    } else {
      assert.notEqual(scalar('unlisted'), 'true', record.file);
      assert.notEqual(scalar('ai_slop'), 'true', record.file);
    }
  }
});
