# Launch checklist — submitting to Obsidian Community Plugins

Operational SOP. Tick each box before opening a PR to `obsidianmd/obsidian-releases`.

## T-2 weeks: BRAT internal testing

- [ ] Plugin at `0.1.0-alpha.<N>` with all known bugs fixed
- [ ] Distributed via BRAT to ≥ 10 testers across mixed setups (desktop + mobile, light + dark, varied vault sizes)
- [ ] At least one full week of no new bug reports

## T-1 week: Pre-submission audit

### Manifest + repo metadata
- [ ] `manifest.json` `id` is unique — check https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json
- [ ] `manifest.json` `version` matches the latest GitHub release tag exactly (no `v` prefix)
- [ ] `manifest.json` `minAppVersion` is supported by recent Obsidian
- [ ] `manifest.json` `isDesktopOnly` is `false` (and mobile has been tested) OR `true` (and feature parity is genuinely impossible on mobile)
- [ ] `versions.json` maps every released version to its `minAppVersion`
- [ ] `README.md` exists, includes purpose, install, usage, privacy, license
- [ ] `LICENSE` exists at repo root

### Code quality red flags
- [ ] No `console.log` / `console.warn` / `console.error` left in production code (debug logs scrubbed)
- [ ] No `innerHTML` assignment with untrusted content (DOMParser + appendChild preferred)
- [ ] No external script loading at runtime (CDN imports, `<script>` tag injection)
- [ ] No vault file operations bypassing `app.vault.*` API (e.g. raw `fs` usage)
- [ ] All custom CSS classes prefixed (we use `bd-` ✓)
- [ ] Settings persist via `plugin.saveData()` / `loadData()` (no localStorage abuse)

### Privacy + external requests
- [ ] README has a Privacy section explicitly mentioning external network requests
- [ ] Opt-out path documented (disable plugin / per-format toggle)
- [ ] Self-host path documented (apiBase setting)
- [ ] Sent data is documented (what fields go to where, what's persisted)

### Mobile parity
- [ ] iOS Obsidian: install via BRAT, verify mermaid renders, settings work, source injection command works
- [ ] Android Obsidian: same
- [ ] Note any mobile-only quirks in README

### Cross-platform
- [ ] macOS: tested (primary dev env ✓)
- [ ] Windows: tested or at least sanity-checked via Obsidian web Discord users
- [ ] Linux: tested or sanity-checked

## T-0: Submission

1. Bump to stable: `npm version 0.1.0` (drops the `-alpha.N` suffix)
2. Verify CI builds + tags + release artifacts are attached
3. Fork `obsidianmd/obsidian-releases`
4. Edit `community-plugins.json`, insert entry alphabetically:
   ```json
   {
     "id": "beauty-diagram",
     "name": "Beauty Diagram",
     "author": "Beauty Diagram",
     "description": "Beautify Mermaid and PlantUML diagrams with 9 polished themes — Modern, Slate, Blueprint, Memphis, and more. Dark-mode friendly. One-click polish, no setup.",
     "repo": "beauty-diagram/obsidian-beauty-diagram"
   }
   ```
5. Open PR with title `Add Beauty Diagram plugin`
6. In PR body, tick every checkbox in the Obsidian template (don't skip; reviewers check this)

## T+1 week: review iteration

Common reviewer questions, drafted answers ready:

- **"Why does this plugin make external HTTP requests?"**
  > Beauty Diagram renders diagrams server-side to keep the plugin small (no bundled renderer engine) and to provide 9 themes that would otherwise require ~MB of theme assets bundled. Anonymous usage is the default; users can self-host (apiBase setting) or disable network calls entirely (toggle off per-format).

- **"Why is the plugin id 'beauty-diagram'?"**
  > Brand-aligned with the public domain www.beauty-diagram.com. id is lowercase + hyphen, conforming to Obsidian's id pattern.

- **"What happens when offline?"**
  > Error UI in the rendered position, with a one-click button to disable Beauty Diagram for mermaid blocks (Obsidian's built-in handles those). PlantUML has no built-in fallback so shows an error message. See README → Privacy → Opt-out.

## Post-merge

- [ ] First Browse install verified (download counter starts ticking)
- [ ] Issue template + Code of Conduct in place on the repo
- [ ] CHANGELOG.md updated for 0.1.0
- [ ] Tweet / Reddit post / blog launch
