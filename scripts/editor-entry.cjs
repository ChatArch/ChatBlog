// A public handoff URL, never an authentication credential or session.
function editorLoginUrl(origin) {
  if (origin === undefined || origin === null || origin === '') return null;
  if (typeof origin !== 'string') throw new Error('Invalid editor origin');
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('Invalid editor origin');
  }
  if (parsed.origin !== origin ||
      (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1'))) {
    throw new Error('Invalid editor origin');
  }
  const login = new URL('/auth/', origin);
  login.searchParams.set('next', '/editor');
  return login.toString();
}

module.exports = {editorLoginUrl};
