"""ChatBlog's separate, same-origin editorial service.

Public articles remain static on Pages. This service never serves private article bodies.
"""
from __future__ import annotations

import json
import os
import stat
import hashlib
import re
import yaml
from html import escape
from pathlib import Path
from urllib.parse import quote, urlsplit

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from chatlogin import PasswordBackend, PasswordHash, Principal, Role, SessionManager
from chatlogin.fastapi import FastAPIAuth, CookieSettings
from chatlogin.sqlite import SQLiteSessionStore
from chatlogin.security import safe_next
from chatlogin.ui import LoginUI

from .store import EditorialStore


class Edit(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str
    tags: list[str] = Field(max_length=12)
    note: str = Field(max_length=4000)
    revision: int = Field(ge=0)
    content_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


def _private_account(path: Path) -> PasswordBackend:
    details = path.lstat()
    if (not stat.S_ISREG(details.st_mode) or details.st_nlink != 1
            or details.st_uid != os.geteuid() or stat.S_IMODE(details.st_mode) != 0o600):
        raise ValueError("Editor credential file must be service-owned, regular and mode 0600")
    record = json.loads(path.read_text(encoding="utf-8"))
    if set(record) != {"username", "salt_hex", "digest_hex", "iterations"}:
        raise ValueError("Editor credential file has invalid fields")
    username = record["username"]
    if not isinstance(username, str) or not username or len(username.encode("utf-8")) > 256:
        raise ValueError("Invalid editor account")
    password = PasswordHash(bytes.fromhex(record["salt_hex"]), bytes.fromhex(record["digest_hex"]), record["iterations"])
    return PasswordBackend({username: (Principal(username, username, Role.ADMIN), password)})


def create_app(*, origin: str | None = None, site_url: str | None = None,
               state_dir: Path | None = None, manifest_path: Path | None = None,
               backend: PasswordBackend | None = None) -> FastAPI:
    origin = origin or os.environ["CHATBLOG_EDITOR_ORIGIN"]
    site_url = site_url or os.environ["CHATBLOG_SITE_URL"]
    editor_url = urlsplit(origin)
    if editor_url.scheme != "https" and (editor_url.scheme != "http" or editor_url.hostname not in {"127.0.0.1", "localhost"}):
        raise ValueError("Editor must use HTTPS outside loopback")
    parsed = urlsplit(site_url)
    if parsed.scheme not in {"http", "https"} or (parsed.scheme == "http" and parsed.hostname not in {"127.0.0.1", "localhost"}):
        raise ValueError("Public site must use HTTPS outside loopback")
    if not parsed.netloc or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("Invalid public site URL")
    state_dir = Path(state_dir or os.environ.get("CHATBLOG_STATE_DIR") or
                     Path(os.environ.get("CHATARCH_HOME") or Path.home() / ".chatarch") / "chatblog-editor")
    manifest_path = Path(manifest_path or Path(__file__).resolve().parents[2] / "src/data/article-status.json")
    manifest_bytes = manifest_path.read_bytes()
    manifest_sha256 = hashlib.sha256(manifest_bytes).hexdigest()
    manifest = json.loads(manifest_bytes)
    if not isinstance(manifest, list) or any(not isinstance(row, dict) for row in manifest):
        raise ValueError("Invalid article inventory")
    articles = {row["slug"]: row for row in manifest}
    if len(articles) != len(manifest):
        raise ValueError("Duplicate article slugs")
    source_root = manifest_path.resolve().parents[2] if manifest_path.name == "article-status.json" else manifest_path.parent
    for row in manifest:
        path = (source_root / row["file"]).resolve()
        if not path.is_file() or not path.is_relative_to((source_root / "blog").resolve()):
            raise ValueError("Published article inventory is incomplete")
        source_bytes = path.read_bytes()
        row["_source_path"] = path
        row["_content_sha256"] = hashlib.sha256(source_bytes).hexdigest()
        frontmatter = source_bytes.decode("utf-8").split("---", 2)[1]
        fields = yaml.safe_load(frontmatter)
        tags = fields.get("tags", []) if isinstance(fields, dict) else []
        if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
            raise ValueError("Invalid published tags")
        row["_published_tags"] = tags
    if backend is None:
        backend = _private_account(state_dir / "editor.json")
    store = EditorialStore(state_dir / "editorial.sqlite3")
    sessions = SessionManager(SQLiteSessionStore.for_instance("chatblog", home=state_dir),
                              instance="chatblog", ttl=86400)
    auth = FastAPIAuth(backend, sessions, origin=origin, prefix="/auth",
                      ui=LoginUI(title="ChatBlog 编辑入口", subtitle="仅供授权编辑者使用。"),
                      cookie=CookieSettings(secure=urlsplit(origin).scheme == "https"))
    app = FastAPI(title="ChatBlog editor", docs_url=None, redoc_url=None, openapi_url=None)
    app.include_router(auth.router)
    app.state.auth = auth

    def ensure_snapshot(slugs):
        try:
            if hashlib.sha256(manifest_path.read_bytes()).hexdigest() != manifest_sha256:
                raise ValueError("Manifest changed")
            for slug in slugs:
                row = articles[slug]
                if hashlib.sha256(row["_source_path"].read_bytes()).hexdigest() != row["_content_sha256"]:
                    raise ValueError("Article changed")
        except (OSError, ValueError):
            raise HTTPException(status_code=409, detail="Source changed; reload the service and review again") from None

    def judgment(slug, row, overrides):
        result = {
            "status": row["status"], "tags": row["_published_tags"], "note": "", "revision": 0,
            "content_sha256": row["_content_sha256"], "needs_review": False,
        }
        stored = overrides.get(slug)
        if stored is not None:
            result["revision"] = stored["revision"]
            if stored.get("content_sha256") != row["_content_sha256"]:
                result.update(status="candidate", needs_review=True)
            else:
                result.update({key: stored[key] for key in ("status", "tags", "note")})
        return result

    @app.middleware("http")
    async def limit_editor_writes(request: Request, call_next):
        if request.method == "PUT" and request.url.path.startswith("/api/editor/articles/"):
            body = bytearray()
            async for chunk in request.stream():
                if len(body) + len(chunk) > 16_384:
                    return JSONResponse({"detail": "Request too large"}, status_code=413)
                body.extend(chunk)
            request._body = bytes(body)
        return await call_next(request)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/api/articles")
    def public_articles(request: Request):
        auth._check_host(request)
        overrides = store.read()
        states = {slug: judgment(slug, row, overrides) for slug, row in articles.items()}
        response = JSONResponse({"articles": [
            {"slug": slug, "title": row["title"], "date": row["date"],
             "published_status": row["status"],
             "status": states[slug]["status"], "tags": states[slug]["tags"]}
            for slug, row in articles.items()
        ]})
        response.headers["Cache-Control"] = "no-store"
        return response

    def editor_only(principal=Depends(auth.current_user)):
        if principal.role is not Role.ADMIN:
            raise HTTPException(status_code=403, detail="Editor required")
        return principal

    def editor_write(principal=Depends(auth.csrf_user)):
        if principal.role is not Role.ADMIN:
            raise HTTPException(status_code=403, detail="Editor required")
        return principal

    @app.get("/api/editor/articles", dependencies=[Depends(editor_only)])
    def editor_articles():
        overrides = store.read()
        return JSONResponse({"articles": [
            {"slug": slug, "title": row["title"], "published_status": row["status"],
             **judgment(slug, row, overrides)}
            for slug, row in articles.items()
        ]}, headers={"Cache-Control": "no-store"})

    @app.get("/api/editor/export", dependencies=[Depends(editor_only)])
    def export():
        ensure_snapshot(articles)
        overrides = store.read()
        return JSONResponse({
            "base_sha256": manifest_sha256,
            "changes": {slug: {"status": row["status"], "tags": row["tags"],
                               "content_sha256": row["content_sha256"]}
                        for slug, row in overrides.items()
                        if slug in articles and row["content_sha256"] == articles[slug]["_content_sha256"]},
        }, headers={"Cache-Control": "no-store", "Content-Disposition": "attachment; filename=chatblog-curation.json"})

    @app.put("/api/editor/articles/{slug:path}", dependencies=[Depends(editor_write)])
    def edit_article(slug: str, edit: Edit):
        if slug not in articles:
            raise HTTPException(status_code=404, detail="Unknown article")
        ensure_snapshot((slug,))
        if edit.content_sha256 != articles[slug]["_content_sha256"]:
            raise HTTPException(status_code=409, detail="Article version changed; review again")
        if edit.status not in {"keep", "candidate", "slop"}:
            raise HTTPException(status_code=422, detail="Invalid status")
        if any(not isinstance(tag, str) or not tag.strip() or len(tag) > 40 for tag in edit.tags):
            raise HTTPException(status_code=422, detail="Invalid tag")
        if len(set(edit.tags)) != len(edit.tags):
            raise HTTPException(status_code=422, detail="Duplicate tag")
        try:
            result = store.update(slug, status=edit.status, tags=edit.tags,
                                  note=edit.note, revision=edit.revision, content_sha256=edit.content_sha256)
        except ValueError:
            raise HTTPException(status_code=409, detail="Article changed; reload before editing") from None
        return JSONResponse({"slug": slug, **result, "published_status": articles[slug]["status"]},
                            headers={"Cache-Control": "no-store"})

    @app.get("/editor", response_class=HTMLResponse)
    async def editor(request: Request):
        try:
            principal = await auth.current_user(request)
        except HTTPException as exc:
            if exc.status_code != 401:
                raise
            destination = "/editor" + ("?" + request.url.query if request.url.query else "")
            destination = safe_next(destination, default="/editor")
            return RedirectResponse("/auth/?next=" + quote(destination, safe=""), status_code=303)
        if principal.role is not Role.ADMIN:
            raise HTTPException(status_code=403, detail="Editor required")
        return HTMLResponse(
            "<!doctype html><html lang='zh-Hans'><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            "<title>ChatBlog 编辑台</title><link rel='stylesheet' href='/editor.css'>"
            "<main><header><p>ChatBlog / EDITORIAL</p><h1>给每篇文章自己的判断</h1>"
            "<p>精选状态先由服务保存；公开博客列表在下一次发布后同步。"
            "目前不能靠这里的按钮保护公开文章正文。</p>"
            "<button id='logout' type='button'>退出登录</button>"
            "<a href='/api/editor/export'>下载审核状态（用于提交发布 PR）</a>"
            f"<a href='{escape(site_url, quote=True)}'>返回博客</a></header><p id='message' role='status'></p>"
            "<div id='articles'></div></main><script defer src='/editor.js'></script></html>",
            headers={"Cache-Control": "no-store", "Content-Security-Policy":
                     "default-src 'none'; script-src 'self'; style-src 'self'; "
                     "connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"},
        )

    assets = Path(__file__).parent

    @app.get("/editor.js")
    def editor_script(request: Request):
        auth._check_host(request)
        return Response((assets / "editor.js").read_text(encoding="utf-8"), media_type="application/javascript",
                        headers={"Cache-Control": "no-store"})

    @app.get("/editor.css")
    def editor_style(request: Request):
        auth._check_host(request)
        return Response((assets / "editor.css").read_text(encoding="utf-8"), media_type="text/css")

    @app.get("/private/{slug}", dependencies=[Depends(auth.current_user)], response_class=HTMLResponse)
    def private_article(slug: str):
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,99}", slug):
            raise HTTPException(status_code=404, detail="Not found")
        directory = state_dir / "private-content"
        path = directory / f"{slug}.md"
        try:
            directory_details = directory.lstat()
            if (not stat.S_ISDIR(directory_details.st_mode)
                    or directory_details.st_uid != os.geteuid()
                    or stat.S_IMODE(directory_details.st_mode) != 0o700):
                raise ValueError("Unsafe private content directory")
            details = path.lstat()
            if (not stat.S_ISREG(details.st_mode) or details.st_nlink != 1
                    or details.st_uid != os.geteuid() or stat.S_IMODE(details.st_mode) != 0o600
                    or not path.resolve().is_relative_to(directory.resolve())):
                raise ValueError("Unsafe private content path")
            content = path.read_text(encoding="utf-8")
        except (OSError, ValueError):
            raise HTTPException(status_code=404, detail="Not found") from None
        return HTMLResponse(
            "<!doctype html><html lang='zh-Hans'><meta charset='utf-8'>"
            "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{escape(slug)}</title><link rel='stylesheet' href='/editor.css'>"
            f"<main><a href='{escape(site_url, quote=True)}'>ChatBlog</a><h1>{escape(slug)}</h1>"
            f"<pre style='white-space:pre-wrap;overflow-wrap:anywhere'>{escape(content)}</pre></main></html>",
            headers={"Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow",
                     "Content-Security-Policy": "default-src 'none'; style-src 'self'"},
        )

    return app
