import hashlib
import json
from pathlib import Path

import pytest
from chatblog_editor.publish import prepare


def fixture(tmp_path: Path):
    (tmp_path / 'src/data').mkdir(parents=True)
    (tmp_path / 'blog').mkdir()
    article = tmp_path / 'blog/example.mdx'
    article.write_text('---\ntitle: Example\nslug: example\ntags: [old]\nunlisted: true\nai_slop: true\nai_slop_reason: "Needs review"\n---\n\nOriginal body.\n')
    manifest = tmp_path / 'src/data/article-status.json'
    manifest.write_text(json.dumps([{'file': 'blog/example.mdx', 'slug': 'example', 'date': '2026-10-08',
                                     'title': 'Example', 'status': 'slop', 'reason': 'Needs review'}]))
    return article, manifest


def test_export_changes_frontmatter_and_keeps_original_link_and_body(tmp_path):
    article, manifest = fixture(tmp_path)
    export = {'base_sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
              'changes': {'example': {'status': 'keep', 'tags': ['curated']}}}
    writes = prepare(tmp_path, export)
    assert len(writes) == 2
    assert 'slug: example' in writes[article] and 'Original body.' in writes[article]
    assert 'ai_slop:' not in writes[article] and 'unlisted:' not in writes[article]
    assert 'tags: ["curated"]' in writes[article]
    assert json.loads(writes[manifest])[0]['reason'] == '已人工精选。'
    assert article.read_text().find('ai_slop: true') > 0  # dry run does not write


def test_candidate_is_unlisted_but_not_negative(tmp_path):
    article, manifest = fixture(tmp_path)
    export = {'base_sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
              'changes': {'example': {'status': 'candidate', 'tags': []}}}
    writes = prepare(tmp_path, export)
    assert 'unlisted: true' in writes[article] and 'ai_slop:' not in writes[article]
    assert 'Original body.' in writes[article]


def test_clear_tags_is_a_real_edit(tmp_path):
    article, manifest = fixture(tmp_path)
    export = {'base_sha256': hashlib.sha256(manifest.read_bytes()).hexdigest(),
              'changes': {'example': {'status': 'slop', 'tags': []}}}
    writes = prepare(tmp_path, export)
    assert 'tags:' not in writes[article]
    assert 'ai_slop: true' in writes[article]


def test_stale_or_tampered_export_fails_closed(tmp_path):
    fixture(tmp_path)
    for bad in [
        {'base_sha256': 'no', 'changes': {}},
        {'base_sha256': hashlib.sha256((tmp_path / 'src/data/article-status.json').read_bytes()).hexdigest(),
         'changes': {'unknown': {'status': 'keep', 'tags': []}}},
    ]:
        with pytest.raises(ValueError):
            prepare(tmp_path, bad)
