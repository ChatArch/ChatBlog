import json
from pathlib import Path

from fastapi.testclient import TestClient
from chatlogin import PasswordBackend, Principal, Role, hash_password
from chatblog_editor import create_app


def client(tmp_path: Path, *, role=Role.ADMIN):
    manifest = tmp_path / 'manifest.json'
    manifest.write_text(json.dumps([
        {'slug': 'sample', 'file': 'blog/example.mdx', 'title': 'Example', 'date': '2026-10-08',
         'status': 'slop', 'reason': 'Review needed'},
    ]))
    (tmp_path / 'blog').mkdir()
    (tmp_path / 'blog/example.mdx').write_text('---\ntitle: Example\ntags: [existing]\n---\nBody')
    backend = PasswordBackend({'editor': (Principal('editor', 'Editor', role), hash_password('synthetic-test-password'))})
    app = create_app(origin='https://edit.example.test', site_url='https://blog.example.test/Blog/',
                     state_dir=tmp_path / 'state', manifest_path=manifest, backend=backend)
    return TestClient(app, base_url='https://edit.example.test'), app


def login(c):
    response = c.post('/auth/login', json={'username': 'editor', 'password': 'synthetic-test-password'},
                      headers={'Origin': 'https://edit.example.test'})
    assert response.status_code == 200, response.text
    return response.json()['csrf_token']


def test_editor_auth_session_and_persistence(tmp_path):
    c, app = client(tmp_path)
    redirect = c.get('/editor?slug=sample', follow_redirects=False)
    assert redirect.status_code == 303
    assert redirect.headers['location'].startswith('/auth/?next=')
    assert c.get('/api/editor/articles').status_code == 401
    public = c.get('/api/articles').json()['articles'][0]
    assert public['status'] == 'slop' and public['tags'] == ['existing'] and 'note' not in public
    csrf = login(c)
    assert c.get('/editor').status_code == 200
    assert c.get('/api/editor/articles').json()['articles'][0]['tags'] == ['existing']
    payload = {'status': 'keep', 'tags': ['science'], 'note': 'Useful diagram', 'revision': 0}
    path = '/api/editor/articles/sample'
    assert c.put(path, json=payload).status_code == 403
    assert c.put(path, json=payload, headers={'Origin': 'https://evil.example.test', 'X-CSRF-Token': csrf}).status_code == 403
    assert c.put(path, json=payload, headers={'Origin': 'https://edit.example.test', 'X-CSRF-Token': 'wrong'}).status_code == 403
    response = c.put(path, json=payload, headers={'Origin': 'https://edit.example.test', 'X-CSRF-Token': csrf})
    assert response.status_code == 200, response.text
    assert response.json()['revision'] == 1
    assert response.json()['published_status'] == 'slop'
    assert c.put(path, json=payload, headers={'Origin': 'https://edit.example.test', 'X-CSRF-Token': csrf}).status_code == 409
    assert c.get('/api/articles').json()['articles'][0]['status'] == 'keep'
    assert 'note' not in c.get('/api/articles').text
    assert c.get('/api/editor/articles').json()['articles'][0]['note'] == 'Useful diagram'
    exported = c.get('/api/editor/export')
    assert exported.status_code == 200
    assert exported.json()['changes']['sample'] == {'status': 'keep', 'tags': ['science']}
    assert 'Useful diagram' not in exported.text
    other = create_app(origin='https://edit.example.test', site_url='https://blog.example.test/Blog/',
                       state_dir=tmp_path / 'state', manifest_path=tmp_path / 'manifest.json', backend=app.state.auth.backend)
    assert TestClient(other, base_url='https://edit.example.test').get('/api/articles').json()['articles'][0]['status'] == 'keep'
    assert c.post('/auth/logout', headers={'Origin': 'https://edit.example.test', 'X-CSRF-Token': csrf}).status_code == 200
    assert c.get('/api/editor/articles').status_code == 401


def test_roles_shapes_hosts_and_unknown_slug(tmp_path):
    c, _ = client(tmp_path, role=Role.USER)
    csrf = login(c)
    assert c.get('/api/editor/articles').status_code == 403
    assert c.put('/api/editor/articles/sample', json={'status': 'keep', 'tags': [], 'note': '', 'revision': 0},
                 headers={'Origin': 'https://edit.example.test', 'X-CSRF-Token': csrf}).status_code == 403
    assert c.get('/api/articles', headers={'Host': 'evil.example.test'}).status_code == 400
    (tmp_path / 'admin').mkdir()
    a, _ = client(tmp_path / 'admin')
    csrf = login(a)
    headers = {'Origin': 'https://edit.example.test', 'X-CSRF-Token': csrf}
    assert a.put('/api/editor/articles/missing', json={'status': 'keep', 'tags': [], 'note': '', 'revision': 0}, headers=headers).status_code == 404
    for bad in [
        {'status': 'custom', 'tags': [], 'note': '', 'revision': 0},
        {'status': 'keep', 'tags': ['a', 'a'], 'note': '', 'revision': 0},
        {'status': 'keep', 'tags': [], 'note': '', 'revision': 0, 'admin': True},
    ]:
        assert a.put('/api/editor/articles/sample', json=bad, headers=headers).status_code == 422
    assert a.get('/api/articles').json()['articles'][0]['status'] == 'slop'
    oversized = {'status': 'keep', 'tags': [], 'note': 'x' * 18000, 'revision': 0}
    assert a.put('/api/editor/articles/sample', json=oversized, headers=headers).status_code == 413
    assert a.get('/api/articles').json()['articles'][0]['status'] == 'slop'


def test_private_content_never_enters_public_inventory(tmp_path):
    c, _ = client(tmp_path, role=Role.USER)
    private = tmp_path / 'state/private-content'
    private.mkdir(mode=0o700)
    (private / 'note.md').write_text('Secret <script>alert(1)</script>')
    (private / 'note.md').chmod(0o600)
    assert c.get('/private/note').status_code == 401
    assert 'Secret' not in c.get('/api/articles').text
    login(c)
    response = c.get('/private/note')
    assert response.status_code == 200
    assert 'Secret &lt;script&gt;' in response.text
    assert 'no-store' in response.headers['cache-control']
    assert c.get('/private/../note').status_code in (404, 405)
    (private / 'note.md').chmod(0o644)
    assert c.get('/private/note').status_code == 404


def test_missing_account_is_fail_closed(tmp_path, monkeypatch):
    manifest = tmp_path / 'manifest.json'
    manifest.write_text('[]')
    monkeypatch.delenv('CHATBLOG_EDITOR_ORIGIN', raising=False)
    try:
        create_app(origin='https://edit.example.test', site_url='https://blog.example.test',
                   state_dir=tmp_path / 'missing', manifest_path=manifest)
    except FileNotFoundError:
        pass
    else:
        raise AssertionError('No default editor credentials may be generated')
