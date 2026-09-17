// Shared by the archive page and dependency-free node:test checks.
// No filesystem access here: this module is also bundled for the browser.
function validRelativePath(value) {
  return typeof value === 'string' && value.length > 0 &&
    !/[\s\\?#:%]/u.test(value) &&
    value.split('/').every((part) => part && part !== '.' && part !== '..');
}

function articleUrl(slug) {
  if (!validRelativePath(slug)) throw new Error(`Invalid slug: ${slug}`);
  // Docusaurus Link supplies baseUrl; never rewrite the original article slug.
  return `/blog/${slug}`;
}

function validateArticleStatus(manifest, expectedFiles) {
  if (!Array.isArray(manifest)) throw new Error('Manifest must be an array');
  const files = new Set();
  const slugs = new Set();
  for (const record of manifest) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error('Manifest entry must be a record');
    }
    for (const field of ['file', 'title', 'slug', 'date', 'status', 'reason']) {
      if (typeof record[field] !== 'string' || !record[field].trim()) {
        throw new Error(`Missing or invalid ${field}`);
      }
    }
    if (!validRelativePath(record.file) || !/^blog\/.+\.mdx?$/.test(record.file)) {
      throw new Error(`Invalid file: ${record.file}`);
    }
    articleUrl(record.slug);
    if (!['keep', 'slop'].includes(record.status)) throw new Error(`Invalid status: ${record.status}`);
    const date = new Date(`${record.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== record.date) {
      throw new Error(`Invalid date: ${record.date}`);
    }
    if (files.has(record.file)) throw new Error(`Manifest duplicate file: ${record.file}`);
    if (slugs.has(record.slug)) throw new Error(`Manifest duplicate slug: ${record.slug}`);
    files.add(record.file);
    slugs.add(record.slug);
  }
  if (expectedFiles !== undefined &&
      (files.size !== expectedFiles.length || expectedFiles.some((file) => !files.has(file)))) {
    throw new Error('Manifest does not match the blog file inventory');
  }
  return manifest;
}

function getSlopArticles(manifest) {
  return validateArticleStatus(manifest)
    .filter(({status}) => status === 'slop')
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function isSlopPath(pathname, manifest) {
  if (typeof pathname !== 'string') return false;
  let path;
  try {
    path = decodeURIComponent(pathname.split(/[?#]/, 1)[0]).replace(/\/$/, '').replace(/\.html$/, '');
  } catch {
    return false;
  }
  return getSlopArticles(manifest).some(({slug}) => path.endsWith(articleUrl(slug)));
}

function filterSidebarItems(items, manifest) {
  return items.filter(({permalink}) => !isSlopPath(permalink, manifest));
}

module.exports = {articleUrl, validateArticleStatus, getSlopArticles, isSlopPath, filterSidebarItems};
