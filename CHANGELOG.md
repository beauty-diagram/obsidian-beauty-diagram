# Changelog

## 0.1.0-alpha.6 — 2026-05-21

### Features

- **command**: force preview rerender after share-mode toggle

## 0.1.0-alpha.5 — 2026-05-21

### Fixes

- **command**: show toggle-share-mode in Reading View too

## 0.1.0-alpha.4 — 2026-05-21

### Features

- **settings-tab**: share mode section + plan+quota in Verify notice
- **command**: toggle share mode for this page (with plan gating)
- **handler**: drive share path from page frontmatter bd-share
- **usage-cache**: 5-min cache for /v1/usage + typed UsageResponse
- **share-mode**: pure module for front-matter bd-share marker

### Refactors

- **url-composer**: replace hasApiKey with explicit PageMode

### Docs

- **readme**: share mode section + alpha.3 → alpha.4 migration callout
- **changelog**: backfill 3 tag sections (0.1.0-alpha → alpha.3)

### Chores

- **changelog**: escape literal \<img\>/\<svg\> tags in generated CHANGELOG
- auto-generate CHANGELOG.md from conventional commits on npm version

All notable changes are documented here. Generated from conventional
commits via `scripts/update-changelog.mjs` on each `npm version` bump.

## 0.1.0-alpha.3 — 2026-05-21

### Features

- source-level directives (theme + bg), default theme classic

### Fixes

- **docs**: use classic in directive examples (was memphis); user prefers conservative example value

### Docs

- discoverability pass — manifest copy, README hero, theme gallery

### Chores

- pre-launch cleanup for Community Plugins submission
- one-command release flow

## 0.1.0-alpha.2 — 2026-05-21

### Fixes

- **api-client**: match real /v1/share response shape (shareToken, not id)

## 0.1.0-alpha — 2026-05-21

### Features

- **ui**: replace anchor-wrap with hover-reveal overlay badge
- **codeblock-handler**: wrap rendered img in anchor linking to bd editor
- **main**: wire processors, commands, settings tab, save hook
- **settings-tab**: four-section settings UI with Verify button
- **fallback-renderer**: dynamic mermaid import on API failure
- **codeblock-handler**: M1 render-time replacement with error UI
- **settings**: plugin settings type, defaults, load/save
- **api-client**: share / themes / usage with X-Bd-Client header
- **share-cache**: IndexedDB-backed LRU cache for share ids
- **injection**: idempotent M2 markdown rewrite matching CLI bd extract format
- **hash**: sha256 prefix helper for cache keys and markers
- **directives**: parse first-line theme override for mermaid/plantuml
- **url-composer**: pure URL composition with anonymous + share routing

### Fixes

- **api-client**: translate sourceType → sourceFormat at /v1/share boundary
- **api-client**: use obsidian.requestUrl to bypass renderer CORS
- **editor-link**: URI-encode plaintext source, not base64
- **styles**: .bd-link must be display:block so SVG \<img\> has a sized parent
- **main**: stronger mermaid override (sortOrder -10000) + .mermaid div fallback path
- **main**: use markdown post-processor for mermaid to override built-in
- **api-client test**: type vi.fn with fetch signature so mock.calls is typed
- **tsconfig**: drop node types to keep mobile-incompatible APIs out of source

### Refactors

- rename sourceType → sourceFormat to match server wire contract

### Docs

- **alpha-validation**: clarify local-install flow vs Community Plugins directory
- alpha validation log template
- add README and MIT license

### Tests

- **url-composer**: drop Buffer usage for cross-runtime consistency

### CI

- tag-triggered release workflow

### Chores

- gitignore Obsidian plugin runtime data.json
- scaffold obsidian plugin repo

