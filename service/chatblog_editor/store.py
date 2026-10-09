"""Private editorial state, separate from the public static site bundle."""
from __future__ import annotations

from pathlib import Path

from chatlogin.private_sqlite import PrivateSQLite


class EditorialStore:
    def __init__(self, database: Path):
        self._db = PrivateSQLite(database)
        with self._db.connect() as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS articles ("
                "slug TEXT PRIMARY KEY, status TEXT NOT NULL, "
                "tags TEXT NOT NULL, note TEXT NOT NULL, revision INTEGER NOT NULL)"
            )

    def read(self) -> dict[str, dict]:
        import json

        with self._db.connect() as conn:
            rows = conn.execute("SELECT slug, status, tags, note, revision FROM articles").fetchall()
        return {
            slug: {"status": status, "tags": json.loads(tags), "note": note, "revision": revision}
            for slug, status, tags, note, revision in rows
        }

    def update(self, slug: str, *, status: str, tags: list[str], note: str, revision: int) -> dict:
        import json

        with self._db.connect(immediate=True) as conn:
            row = conn.execute("SELECT revision FROM articles WHERE slug=?", (slug,)).fetchone()
            current = row[0] if row else 0
            if current != revision:
                raise ValueError("Revision conflict")
            conn.execute(
                "INSERT INTO articles (slug, status, tags, note, revision) VALUES (?, ?, ?, ?, ?) "
                "ON CONFLICT(slug) DO UPDATE SET status=excluded.status, tags=excluded.tags, "
                "note=excluded.note, revision=excluded.revision",
                (slug, status, json.dumps(tags, ensure_ascii=False), note, current + 1),
            )
        return {"status": status, "tags": tags, "note": note, "revision": current + 1}
