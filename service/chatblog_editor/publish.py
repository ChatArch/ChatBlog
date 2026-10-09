"""Apply a reviewed editor export to public Markdown in a PR checkout.

No network, Git mutation, or site deployment is performed by this command.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


FRONTMATTER = re.compile(r"\A---\r?\n([\s\S]*?)\r?\n---(\r?\n)")


def _frontmatter(source: str, status: str, reason: str, tags: list[str]) -> str:
    match = FRONTMATTER.match(source)
    if not match:
        raise ValueError("Article has no YAML frontmatter")
    lines = match.group(1).splitlines()
    lines = [line for line in lines if not re.match(r"^(unlisted|ai_slop|ai_slop_reason):", line)]
    if tags:
        # Existing tag lines are inline in ChatBlog. Refuse unsupported mappings/lists.
        if any(line.startswith("tags:") and line.strip() == "tags:" for line in lines):
            raise ValueError("Multiline tags require manual editing")
        lines = [line for line in lines if not line.startswith("tags:")]
        lines.append("tags: " + json.dumps(tags, ensure_ascii=False))
    if status != "keep":
        lines.append("unlisted: true")
    if status == "slop":
        lines.append("ai_slop: true")
        lines.append("ai_slop_reason: " + json.dumps(reason, ensure_ascii=False))
    return "---\n" + "\n".join(lines) + "\n---" + match.group(2) + source[match.end():]


def prepare(source_root: Path, export: dict) -> dict[Path, str]:
    manifest_path = source_root / "src/data/article-status.json"
    raw = manifest_path.read_bytes()
    if export.get("base_sha256") != hashlib.sha256(raw).hexdigest():
        raise ValueError("Manifest differs from the editor snapshot; resync first")
    manifest = json.loads(raw)
    by_slug = {row["slug"]: row for row in manifest}
    changes = export.get("changes")
    if not isinstance(changes, dict) or set(changes) - set(by_slug):
        raise ValueError("Unknown article in editor export")
    writes: dict[Path, str] = {}
    for slug, change in changes.items():
        if not isinstance(change, dict) or set(change) != {"status", "tags"}:
            raise ValueError("Invalid editor export row")
        status, tags = change["status"], change["tags"]
        if status not in {"keep", "candidate", "slop"} or not isinstance(tags, list) or len(tags) > 12 or any(
            not isinstance(tag, str) or not tag.strip() or len(tag) > 40 for tag in tags
        ) or len(set(tags)) != len(tags):
            raise ValueError("Invalid status or tags")
        row = by_slug[slug]
        filepath = (source_root / row["file"]).resolve()
        if not filepath.is_relative_to((source_root / "blog").resolve()) or not filepath.is_file():
            raise ValueError("Invalid article path")
        reason = row["reason"] if status == "slop" else ("待人工精选。" if status == "candidate" else "已人工精选。")
        content = filepath.read_text(encoding="utf-8")
        new_content = _frontmatter(content, status, reason, tags)
        if new_content != content:
            writes[filepath] = new_content
        row.update(status=status, reason=reason)
    new_manifest = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    if new_manifest != raw.decode("utf-8"):
        writes[manifest_path] = new_manifest
    return writes


def main() -> None:
    parser = argparse.ArgumentParser(description="Preview or apply a reviewed ChatBlog editor export")
    parser.add_argument("export", type=Path)
    parser.add_argument("--source", type=Path, default=Path.cwd())
    parser.add_argument("--apply", action="store_true", help="Write sources; use only in a reviewable branch")
    args = parser.parse_args()
    changes = prepare(args.source.resolve(), json.loads(args.export.read_text(encoding="utf-8")))
    print(json.dumps({"changed_files": [str(p.relative_to(args.source.resolve())) for p in changes], "applied": args.apply}, ensure_ascii=False))
    if args.apply:
        for path, content in changes.items():
            path.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main()
