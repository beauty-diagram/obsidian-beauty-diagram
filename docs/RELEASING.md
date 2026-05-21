# Releasing

One-command release. Three files (`manifest.json`, `versions.json`, `package.json`) stay in sync, tests + build run before tagging, push triggers CI.

## Cut a release

```bash
# Pre-release (BRAT testers)
npm version 0.1.0-alpha.3

# Patch
npm version patch        # 0.1.0 → 0.1.1
npm version minor        # 0.1.0 → 0.2.0

# Explicit
npm version 0.2.0
```

What happens, in order:

1. **`preversion`** — `npm run typecheck && npm test && npm run build`. If any step fails, the release aborts before any file is modified.
2. **bump** — `package.json` version updated.
3. **`version`** — `version-bump.mjs` syncs `manifest.json` and `versions.json` to the new version. Files staged.
4. **commit + tag** — Single commit `release: 0.1.1` created, tag `0.1.1` placed on it.
5. **`postversion`** — `git push --follow-tags origin main`. Tag push triggers `.github/workflows/release.yml`.
6. **CI** — installs, tests, builds `main.js`, creates GitHub Release with `manifest.json` + `main.js` + `styles.css` attached. Takes ~15-30s.
7. **BRAT** — internal testers see the new release via BRAT's "Check for updates" within minutes.

## What if I want to release without pushing?

```bash
npm version 0.1.1 --no-git-tag-version  # bump files only, no commit/tag
# or
git push --no-follow-tags  # if you want to push commit but hold tag
```

Edit then resume manually with `git tag X.Y.Z && git push origin X.Y.Z`.

## Aborting a release after tag is pushed

```bash
# Locally
git tag -d X.Y.Z
git reset --hard HEAD~1

# Remote
git push origin :refs/tags/X.Y.Z
git push --force origin main   # only if no one else has pulled
```

## Backfilling versions.json for old releases

`versions.json` maps every released version → the minAppVersion it supported. New entries are auto-added by `version-bump.mjs`. For ancient releases you can edit the file directly and commit.

## Conventions

- Tag format: `MAJOR.MINOR.PATCH` or `MAJOR.MINOR.PATCH-pre.N` — no `v` prefix
- Pre-release tags (`-alpha`, `-beta`, `-rc`) are surfaced in BRAT but excluded from Obsidian Community Plugins listing
- Bump `minAppVersion` in `manifest.json` ONLY when the plugin starts depending on a new Obsidian API. Once bumped, every subsequent `versions.json` row inherits it automatically.
