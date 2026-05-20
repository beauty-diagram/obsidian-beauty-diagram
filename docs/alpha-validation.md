# Alpha validation — 2026-05-21

Plugin at commit `<fill-in>` linked into `~/Documents/bd-test-vault/.obsidian/plugins/beauty-diagram/` via symlink.

**Setup:** the plugin is NOT yet on the Obsidian Community Plugins directory. Local install only.

1. Open Obsidian → "Open another vault" → choose `~/Documents/bd-test-vault/`
2. Settings → Community plugins → click **"Turn on community plugins"** (older versions: turn off "Restricted mode" / "Safe mode")
3. Scroll to **"Installed plugins"** section — `Beauty Diagram` appears there automatically (no Browse / search needed)
4. Toggle it on

**Iteration loop while debugging:** edit source → `npm run build` in the plugin repo → `Cmd+P` → "Reload app without saving" inside Obsidian. The symlink keeps `main.js` in sync.

Then run through each row.

| # | Scenario | Expected | Result | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open `01-simple-mermaid.md` | Renders as `<img>` from `/v1/beautify.svg` | | |
| 2 | Open `02-theme-override.md` | URL contains `theme=neon`; directive line hidden | | |
| 3 | Open `03-plantuml.md` | Renders as `<img>` with `sourceType=plantuml` | | |
| 4 | Disable "Replace built-in mermaid" → reload | Built-in mermaid renders again | | |
| 5 | Open `04-large-source.md` (no API key set) | Error UI: "Diagram exceeds 5 KB. Add an API key…" | | |
| 6 | Add API key → reload `04-large-source.md` | Renders via share path; second open uses cache | | |
| 7 | Disable network → reload note 1 | Fallback banner appears, mermaid renders locally | | |
| 7b | Same with note 3 (plantuml) | Shows error (no plantuml fallback) | | |
| 8 | Run command "Inject embed URLs in current note" on note 1 | Markdown gets `<!-- bd:inline-img hash=... -->` block | | |
| 9 | Re-run injection on note 1 | No diff (idempotent) | | |
| 10 | Delete the mermaid block, run "Clean orphan embed URLs" on the vault | Orphan marker removed from note 1 | | |
| 11 | Verify on Obsidian mobile (iOS/Android) | All renders work | | optional |
| 12 | Verify on a vault published via Obsidian Publish | Embed URLs survive and render | | optional |
| 13 | Toggle "Auto-inject on save" → edit note 1 | Injection runs on save | | |
| 14 | Settings → "Verify" with wrong key | Notice: verification failed | | |
| 15 | Settings → "Verify" with correct key | Notice: verified | | |

## Known issues found

(fill in during validation — bug + commit SHA of fix)

## Decisions deferred

(fill in)
