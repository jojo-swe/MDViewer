#!/usr/bin/env node
// Verifies the app version is consistent and buildable on every release target.
//
// - package.json, src-tauri/tauri.conf.json and src-tauri/Cargo.toml must agree.
// - The Windows MSI (WiX) bundler only accepts numeric versions: major/minor <= 255,
//   patch <= 65535, and an optional pre-release that is a single number <= 65535
//   (e.g. 0.2.0-2 -> MSI 0.2.0.2). Text pre-releases like 0.2.0-beta.1 fail the build.
// - When run on a tag (GITHUB_REF_TYPE=tag), the tag must be `v<version>`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(fileURLToPath(new URL(p, root)), 'utf8');

const versions = {
  'package.json': JSON.parse(read('package.json')).version,
  'src-tauri/tauri.conf.json': JSON.parse(read('src-tauri/tauri.conf.json')).version,
  'src-tauri/Cargo.toml': read('src-tauri/Cargo.toml').match(/^version\s*=\s*"([^"]+)"/m)?.[1],
};

const errors = [];
const distinct = [...new Set(Object.values(versions))];
if (distinct.length !== 1) {
  errors.push(
    'Versions differ:\n' +
      Object.entries(versions).map(([file, v]) => `    ${file}: ${v}`).join('\n'),
  );
}

const version = versions['package.json'];
const m = /^(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(version ?? '');
if (!m) {
  errors.push(
    `Version "${version}" can't be built as a Windows MSI. Use MAJOR.MINOR.PATCH or ` +
      `MAJOR.MINOR.PATCH-N with a numeric pre-release (e.g. 0.2.0-2, not 0.2.0-beta.2).`,
  );
} else {
  const [, major, minor, patch, pre] = m.map(Number);
  if (major > 255 || minor > 255) errors.push(`MSI requires major and minor <= 255 (got ${version}).`);
  if (patch > 65535 || (pre ?? 0) > 65535) errors.push(`MSI requires patch and pre-release <= 65535 (got ${version}).`);
}

if (process.env.GITHUB_REF_TYPE === 'tag') {
  const tag = process.env.GITHUB_REF_NAME;
  if (tag !== `v${version}`) errors.push(`Tag "${tag}" does not match version "${version}" (expected v${version}).`);
}

if (errors.length) {
  console.error('Version check failed:\n  - ' + errors.join('\n  - '));
  process.exit(1);
}
console.log(`Version ${version} OK`);
