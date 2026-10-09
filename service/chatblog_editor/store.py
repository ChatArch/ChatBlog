"""Private editorial state, separate from the public static site bundle."""
from __future__ import annotations

from pathlib import Path

from chatlogin.private_sqlite import PrivateSQLite


class EditorialStore:
    def __init__(self, database: Path):
        self._db = PrivateSQLite(database)
        with self._db.connect(immediate=True) as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS articles ("
                "slug TEXT PRIMARY KEY, status TEXT NOT NULL, "
                "tags TEXT NOT NULL, note TEXT NOT NULL, revision INTEGER NOT NULL, "
                "content_sha256 TEXT)"
            )
            columns = {row[1] for row in conn.execute("PRAGMA table_info(articles)")}
            if "content_sha256" not in columns:
                # Unversioned legacy judgments are retained, but never trusted for publication.
                conn.execute("ALTER TABLE articles ADD COLUMN content_sha256 TEXT")

    def read(self) -> dict[str, dict]:
        import json

        with self._db.connect() as conn:
            rows = conn.execute("SELECT slug, status, tags, note, revision, content_sha256 FROM articles").fetchall()
        return {
            slug: {"status": status, "tags": json.loads(tags), "note": note, "revision": revision,
                   "content_sha256": content_sha256}
            for slug, status, tags, note, revision, content_sha256 in rows
        }

    def update(self, slug: str, *, status: str, tags: list[str], note: str, revision: int,
               content_sha256: str) -> dict:
        import json

        with self._db.connect(immediate=True) as conn:
            row = conn.execute("SELECT revision FROM articles WHERE slug=?", (slug,)).fetchone()
            current = row[0] if row else 0
            if current != revision:
                raise ValueError("Revision conflict")
            conn.execute(
                "INSERT INTO articles (slug, status, tags, note, revision, content_sha256) VALUES (?, ?, ?, ?, ?, ?) "
                "ON CONFLICT(slug) DO UPDATE SET status=excluded.status, tags=excluded.tags, "
                "note=excluded.note, revision=excluded.revision, content_sha256=excluded.content_sha256",
                (slug, status, json.dumps(tags, ensure_ascii=False), note, current + 1, content_sha256),
            )
        return {"status": status, "tags": tags, "note": note, "revision": current + 1,
                "content_sha256": content_sha256}
