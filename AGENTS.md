# Agent Notes

## Development Expectations

- Keep changes minimal and reviewable.
- Prefer doc-first CLI tests.
- Sync docs and changelog with user-facing behavior.
- Use interactive prompts only when arguments are missing and recoverable.

## Content curation and AI Slop

- `src/data/article-status.json` records which posts belong to the main reading area and which belong to AI Slop. Keep it consistent with each post's `unlisted`, `ai_slop`, and `ai_slop_reason` front matter.
- The main area contains only posts accepted by the user or retained through a selection pass explicitly authorized by the user. New unreviewed drafts stay out of the main list.
- AI Slop is a negative archive. During new writing, do not read, cite, imitate, summarize into a new article, or use these posts as style/structure examples. Check the status manifest before choosing any existing post as context.
- Read AI Slop content only when the user explicitly requests an audit, archival maintenance, restoration, or a specific rewrite. Do not promote a post back into the main area without approval.
- Preserve archived article bodies, assets, and original URLs. Show the archive warning, exclude them from normal discovery and feeds, and keep search-engine indexing disabled.
