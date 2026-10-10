# ChatBlog editor service

The public Docusaurus site stays on GitHub Pages. This service supplies a separate editor UI and authenticated editorial state. It does not make an existing public Pages article private, automatically push GitHub commits, or change the public build immediately when an editor clicks Save.

## Scope and status

- Public `GET /api/articles` includes slugs, titles, dates, published status and edited selection/tags, but never private notes, password material or private body.
- Editor UI: `GET /editor` redirects anonymous readers to the ChatLogin login page; only admin role may view/save. `PUT /api/editor/articles/{slug}` requires a valid same-origin session, CSRF header, current revision and the exact Markdown `content_sha256` shown by the editor. Writes are revision-checked in private SQLite and bind the judgment to that content version.
- Article bytes include frontmatter and body. If a post changes, an older judgment no longer applies: the editor shows it as needing review, displays the current source tags, and excludes the stale judgment from exports. Schema migration retains legacy rows and private notes, but unversioned judgments cannot approve any article until reviewed again.
- Source checkpoints re-resolve the original inventory path and validate its frozen destination, blog boundary and bytes. Retargeted or broken article links cause save/export to return 409 even when the previously resolved file still exists.
- One-click Save updates editorial state, not the GitHub Pages build. Export a reviewed snapshot and apply it in a feature branch, then build and publish through PR. This separates publication validation from editorial choice.
- `GET /private/{slug}` serves only owner-mode `0600` Markdown beneath the service-owned `0700` private-content directory, after login. Private files never live in `blog/`, `static/`, build output or Preview.
- The current site has two different non-featured states: `candidate` is waiting for human selection; `slop` is the historical negative archive. Do not treat them as synonyms.

## Initial setup (on a selected host)

Run this only after choosing and registering an actual HTTPS origin and a service host. There is deliberately no preconfigured public backend URL or editor account. The service should run under a dedicated user or trusted service account behind a TLS reverse proxy; bind uvicorn to loopback, not a public interface.

```bash
python3 -m venv ~/.chatarch/chatblog-editor/venv
~/.chatarch/chatblog-editor/venv/bin/python -m pip install -r service/requirements.txt
export CHATBLOG_STATE_DIR="$HOME/.chatarch/chatblog-editor/state"
export CHATBLOG_EDITOR_ORIGIN='https://YOUR-EDITOR-HOST.example'
export CHATBLOG_SITE_URL='https://arch.gh.wzhecnu.cn/ChatBlog/'
PYTHONPATH=service ~/.chatarch/chatblog-editor/venv/bin/python -m chatblog_editor.provision
PYTHONPATH=service ~/.chatarch/chatblog-editor/venv/bin/python -m uvicorn chatblog_editor.app:create_app --factory --host 127.0.0.1 --port 10087
```

`provision` prompts the operator for a new password (never a command-line argument) and creates only a mode-0600 PBKDF2 hash file. It refuses to overwrite an existing account. Do not run it via an agent that types or stores real credentials. Use a supervisor and TLS/Host-aware proxy for durable service operation. Proxy headers must preserve the configured public Host; the service itself verifies Host and write Origin. Keep the state directory under `~/.chatarch`; never commit it or copy it to Pages. Use a service-specific nonconflicting port selected after inspecting the host (the port above is illustrative).

For local loopback smoke only, `http://127.0.0.1:<port>` is accepted for the editor origin; HTTPS is mandatory elsewhere. The source checkout must match the deployed version; a code update does not automatically migrate private editorial state.

The public navbar always exposes `/login`. Without `CHATBLOG_EDITOR_ORIGIN`, that page honestly states that account login is not configured and collects no password. When the real editor origin is live, set the GitHub Actions repository variable `CHATBLOG_EDITOR_ORIGIN` to that exact origin; `publish.yml` and `preview.yaml` pass it to Docusaurus at build time. The status page then hands off to the backend's fixed `/auth/?next=/editor` login route. Configuration is not a liveness or authorization check. Do not guess the host or put an API key in frontend config. Authentication runs on the editor's own origin; Pages does not receive credentials or cookies.

## Publish an editorial decision

1. On the editor origin, log in manually and click Save for each article. Status and feedback are preserved across process restarts. The page shows whether the saved selection differs from the published static snapshot.
2. Download `/api/editor/export` while authenticated. The export excludes private notes and includes the frozen source-manifest SHA-256 plus the reviewed Markdown SHA-256 for each change. Running services refuse to save/export if those source files changed beneath the loaded snapshot; reload the service against the intended immutable checkout first. Store this export only in the task's private project space; review it before making public changes.
3. In a **fresh PR branch** from the matching ChatBlog main, inspect the dry run, then apply:

```bash
PYTHONPATH=service python -m chatblog_editor.publish /path/to/chatblog-curation.json --source .
PYTHONPATH=service python -m chatblog_editor.publish /path/to/chatblog-curation.json --source . --apply
npm run build
git diff --check
```

4. Review the `blog/` frontmatter, public `src/data/article-status.json`, and resulting Preview before merging. The script does not push, merge, deploy, or expose notes. It fails if the manifest or any affected article bytes changed after review, including changes to source tags. Exports without per-article hashes are rejected. When a content file uses unsupported multiline tags, edit it deliberately rather than guessing a transform. After any source update, including published frontmatter edits, reload the service and explicitly review changed versions before re-exporting.

When moving a previously selected/candidate article into negative archival, no positive retention reason or private feedback is repurposed as a public criticism. Without an explicit public reason, the sync records that no public reason was provided; existing negative-archive reasons may be preserved.

## Limits

- A selected article is not visible in the public `/blog` listing until the source sync PR is merged and Pages is rebuilt. This is shown in the UI rather than hidden.
- Tags saved in the editor are editorial metadata until the publish step writes them to post frontmatter. The public static blog tags/feed/search are not realtime.
- The editor stores the latest judgment/note per article, not a feedback-history archive. A stale note is retained in the database during migration/reload but is not used for a newer version; saving the next judgment replaces that stored note.
- Publish apply must run in an isolated checkout with no concurrent writers. Hash validation precedes writes, but there is no filesystem transaction or lock against another process changing source between preparation and disk writes.
- The HTML login/session interface is ChatLogin's same-origin adapter, not SSO or an authorization mechanism for GitHub Pages itself. There is no public registration, no arbitrary backend switcher, and no real editor credential in this repository.
- Private Markdown is intentionally rendered as escaped preformatted text, not MDX or remote HTML, to avoid script execution. Asset/link support and multiple readership roles need a separately reviewed extension.
