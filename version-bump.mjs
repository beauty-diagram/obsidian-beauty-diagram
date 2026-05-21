#!/usr/bin/env node
// Sync manifest.json + versions.json to the new package.json version.
// Invoked by the `version` npm lifecycle script (see package.json).

import { readFileSync, writeFileSync } from 'node:fs'

const targetVersion = process.env.npm_package_version
if (!targetVersion) {
  console.error('version-bump: npm_package_version not set — run via `npm version`, not directly.')
  process.exit(1)
}

// manifest.json — write version, leave minAppVersion alone
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
const { minAppVersion } = manifest
manifest.version = targetVersion
writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n')

// versions.json — add new version → minAppVersion mapping if not present
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[targetVersion] = minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, 2) + '\n')

console.log(`version-bump: set manifest.json + versions.json to ${targetVersion} (minAppVersion=${minAppVersion})`)
