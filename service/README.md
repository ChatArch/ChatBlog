# ChatBlog editor service

The public Docusaurus site stays on GitHub Pages. This service supplies a separate editor UI and authenticated editorial state. It does not make an existing public Pages article private, automatically push GitHub commits, or change the public build immediately when an editor clicks Save.

## Scope and status

- Public `GET /api/articles` includes slugs, titles, dates, published status and edited selection/tags, but never private notes, password material or private body.
- Editor UI: `GET /editor` redirects anonymous readers to the ChatLogin login page; only admin role may view/save. `PUT /api/editor/articles/{slug}` requires a valid same-origin session and CSRF header. Writes are revision-checked in private SQLite.
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

When the real editor origin is live, set the GitHub Actions repository variable `CHATBLOG_EDITOR_ORIGIN` to that exact origin. `publish.yml` and `preview.yaml` pass it to Docusaurus at build time. Without the variable, Pages/Preview shows no inactive Edit link. Do not guess the host or put an API key in frontend config. Authentication runs on the editor's own origin; the public page links to it instead of sending cookies across origins.

## Publish an editorial decision

1. On the editor origin, log in manually and click Save for each article. Status and feedback are preserved across process restarts. The page shows whether the saved selection differs from the published static snapshot.
2. Download `/api/editor/export` while authenticated. The export excludes private notes and includes the SHA-256 of the source manifest used by the service. Store this export only in the task's private project space; review it before making public changes.
3. In a **fresh PR branch** from the matching ChatBlog main, inspect the dry run, then apply:

```bash
PYTHONPATH=service python -m chatblog_editor.publish /path/to/chatblog-curation.json --source .
PYTHONPATH=service python -m chatblog_editor.publish /path/to/chatblog-curation.json --source . --apply
npm run build
git diff --check
```

4. Review the `blog/` frontmatter, public `src/data/article-status.json`, and resulting Preview before merging. The script does not push, merge, deploy, or expose notes. It fails if the manifest changed after export. When a content file uses unsupported multiline tags, edit it deliberately rather than guessing a transform. Re-export after the service has been updated to the new manifest revision.

## Limits

- A selected article is not visible in the public `/blog` listing until the source sync PR is merged and Pages is rebuilt. This is shown in the UI rather than hidden.
- Tags saved in the editor are editorial metadata until the publish step writes them to post frontmatter. The public static blog tags/feed/search are not realtime.
- The HTML login/session interface is ChatLogin's same-origin adapter, not SSO or an authorization mechanism for GitHub Pages itself. There is no public registration, no arbitrary backend switcher, and no real editor credential in this repository.
- Private Markdown is intentionally rendered as escaped preformatted text, not MDX or remote HTML, to avoid script execution. Asset/link support and multiple readership roles need a separately reviewed extension.
