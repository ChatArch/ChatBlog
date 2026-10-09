const state = {csrf: ''};
const message = document.querySelector('#message');
const container = document.querySelector('#articles');

function element(name, text, attributes = {}) {
  const node = document.createElement(name);
  node.textContent = text;
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

async function request(path, options = {}) {
  const response = await fetch(path, {credentials: 'same-origin', cache: 'no-store', ...options});
  if (!response.ok) throw new Error(`请求失败（${response.status}）`);
  return response.json();
}

async function load() {
  try {
    const session = await request('/auth/session');
    if (!session.authenticated || session.user?.role !== 'admin') {
      location.assign('/auth/?next=/editor');
      return;
    }
    state.csrf = session.csrf_token;
    const data = await request('/api/editor/articles');
    container.replaceChildren();
    const requestedSlug = new URLSearchParams(location.search).get('slug');
    for (const article of data.articles) {
      const card = element('article', '', {class: 'card'});
      const heading = element('h2', article.title);
      const slug = element('code', article.slug);
      const source = element('p', `已发布：${article.published_status} · 当前选择：${article.status}`);
      const select = document.createElement('select');
      for (const [value, label] of [['keep', '正式'], ['candidate', '待精选'], ['slop', '负面归档']]) {
        const option = element('option', label, {value});
        option.selected = article.status === value;
        select.append(option);
      }
      const tags = element('input', '', {type: 'text', 'aria-label': '主题标签，逗号分隔', placeholder: '标签，逗号分隔'});
      tags.value = article.tags.join(', ');
      const note = element('textarea', '', {'aria-label': '逐篇反馈', placeholder: '这篇文章哪里帮助了理解？哪里仍需修改？'});
      note.value = article.note;
      const button = element('button', '保存判断', {type: 'button'});
      button.addEventListener('click', async () => {
        button.disabled = true;
        message.textContent = '正在保存…';
        try {
          const uniqueTags = tags.value.split(',').map(t => t.trim()).filter(Boolean);
          const result = await request('/api/editor/articles/' + encodeURIComponent(article.slug), {
            method: 'PUT', headers: {'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf},
            body: JSON.stringify({status: select.value, tags: uniqueTags, note: note.value, revision: article.revision}),
          });
          article.revision = result.revision;
          article.status = result.status;
          source.textContent = `已发布：${result.published_status} · 当前选择：${result.status}`;
          message.textContent = result.published_status === result.status
            ? '已保存。' : '已保存编辑状态；公开博客需同步发布后才会改变。';
        } catch (error) {
          message.textContent = `${error.message}。请刷新文章状态后重试。`;
        } finally {
          button.disabled = false;
        }
      });
      card.append(heading, slug, source, select, tags, note, button);
      container.append(card);
      if (article.slug === requestedSlug) card.scrollIntoView({block: 'center'});
    }
  } catch (error) {
    message.textContent = error.message;
  }
}

document.querySelector('#logout').addEventListener('click', async () => {
  try {
    await request('/auth/logout', {method: 'POST', headers: {'X-CSRF-Token': state.csrf}});
    location.assign('/auth/');
  } catch (error) { message.textContent = error.message; }
});
load();
