"""Decisions belong to the exact Markdown bytes reviewed, not just its slug."""
import hashlib
import json
import os
import sqlite3

import pytest
from fastapi.testclient import TestClient
from chatlogin import PasswordBackend, Principal, Role, hash_password
from chatblog_editor import create_app
from chatblog_editor.publish import prepare


@pytest.fixture
def catalog(tmp_path):
    (tmp_path / 'src/data').mkdir(parents=True)
    (tmp_path / 'blog').mkdir()
    post = tmp_path / 'blog/example.mdx'
    post.write_text('---\ntitle: Example\nslug: sample\ntags: [existing]\nunlisted: true\nai_slop: true\nai_slop_reason: "Needs review"\n---\nOriginal body.\n')
    manifest = tmp_path / 'src/data/article-status.json'
    manifest.write_text(json.dumps([{'slug': 'sample', 'file': 'blog/example.mdx',
                                    'title': 'Example', 'date': '2026-10-08',
                                    'status': 'slop', 'reason': 'Needs review'}]))
    backend = PasswordBackend({'editor': (Principal('editor', 'Editor', Role.ADMIN),
                                         hash_password('synthetic-test-password'))})
    return tmp_path, post, manifest, backend


def start(catalog):
    root, _, manifest, backend = catalog
    app = create_app(origin='https://edit.example.test', site_url='https://blog.example.test/Blog/',
                     state_dir=root / 'state', manifest_path=manifest, backend=backend)
    c = TestClient(app, base_url='https://edit.example.test')
    r = c.post('/auth/login', json={'username': 'editor', 'password': 'synthetic-test-password'},
               headers={'Origin': 'https://edit.example.test'})
    assert r.status_code == 200
    return c, {'Origin': 'https://edit.example.test', 'X-CSRF-Token': r.json()['csrf_token']}


def decision(c):
    row = c.get('/api/editor/articles').json()['articles'][0]
    payload = {'status': 'keep', 'tags': ['reviewed'], 'note': 'Private review', 'revision': row['revision']}
    if 'content_sha256' in row:
        payload['content_sha256'] = row['content_sha256']
    return payload


def test_rewritten_article_does_not_inherit_old_approval(catalog):
    _, post, _, _ = catalog
    c, headers = start(catalog)
    assert c.put('/api/editor/articles/sample', json=decision(c), headers=headers).status_code == 200
    post.write_text(post.read_text().replace('Original body.', 'New unreviewed body.'))
    newer, new_headers = start(catalog)
    public = newer.get('/api/articles').json()['articles'][0]
    assert public['status'] == 'candidate'
    private = newer.get('/api/editor/articles').json()['articles'][0]
    assert private['needs_review'] is True
    assert private['tags'] == ['existing'] and private['note'] == '' and private['revision'] == 1
    assert newer.get('/api/editor/export').json()['changes'] == {}
    assert newer.put('/api/editor/articles/sample', json=decision(newer), headers=new_headers).status_code == 200
    assert newer.get('/api/editor/export').json()['changes']['sample']['content_sha256'] == hashlib.sha256(post.read_bytes()).hexdigest()


def test_export_rejects_article_tag_change_even_if_manifest_unchanged(catalog):
    root, post, _, _ = catalog
    c, headers = start(catalog)
    assert c.put('/api/editor/articles/sample', json=decision(c), headers=headers).status_code == 200
    export = c.get('/api/editor/export').json()
    assert prepare(root, export)
    post.write_text(post.read_text().replace('tags: [existing]', 'tags: [changed-later]'))
    with pytest.raises(ValueError, match='Article differs'):
        prepare(root, export)
    assert 'tags: [changed-later]' in post.read_text()


def test_running_service_cannot_bless_new_manifest_with_old_decision(catalog):
    _, _, manifest, _ = catalog
    c, headers = start(catalog)
    assert c.put('/api/editor/articles/sample', json=decision(c), headers=headers).status_code == 200
    manifest.write_bytes(manifest.read_bytes() + b'\n')
    response = c.get('/api/editor/export')
    assert response.status_code == 409
    assert 'changes' not in response.json()


def test_running_service_rejects_save_against_mutated_post(catalog):
    _, post, _, _ = catalog
    c, headers = start(catalog)
    payload = decision(c)
    post.write_text(post.read_text() + 'Added after editor loaded.\n')
    assert c.put('/api/editor/articles/sample', json=payload, headers=headers).status_code == 409


def test_stale_browser_hash_cannot_approve_new_article_version(catalog):
    _, post, _, _ = catalog
    old, _ = start(catalog)
    old_payload = decision(old)
    post.write_text(post.read_text() + 'Revised content.\n')
    current, headers = start(catalog)
    assert current.put('/api/editor/articles/sample', json=old_payload, headers=headers).status_code == 409
    assert current.get('/api/editor/export').json()['changes'] == {}


def test_unversioned_database_migrates_without_approving_any_article(catalog):
    root, _, _, _ = catalog
    state = root / 'state'
    state.mkdir(mode=0o700)
    path = state / 'editorial.sqlite3'
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    with sqlite3.connect(path) as conn:
        conn.execute('CREATE TABLE articles (slug TEXT PRIMARY KEY, status TEXT NOT NULL, tags TEXT NOT NULL, note TEXT NOT NULL, revision INTEGER NOT NULL)')
        conn.execute('INSERT INTO articles VALUES (?, ?, ?, ?, ?)', ('sample', 'keep', '["legacy"]', 'Old private note', 7))
    c, _ = start(catalog)
    assert c.get('/api/articles').json()['articles'][0]['status'] == 'candidate'
    row = c.get('/api/editor/articles').json()['articles'][0]
    assert row['needs_review'] is True and row['revision'] == 7
    assert c.get('/api/editor/export').json()['changes'] == {}
    with sqlite3.connect(path) as conn:
        assert conn.execute('SELECT note FROM articles').fetchone()[0] == 'Old private note'
