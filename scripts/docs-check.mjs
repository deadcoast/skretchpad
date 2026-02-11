import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getTrackedFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, '/'));
}

function collectMarkdownFiles(trackedFiles) {
  const docsFiles = trackedFiles.filter((f) => f.startsWith('Docs/') && f.endsWith('.md'));
  const rootReadme = trackedFiles.includes('README.md') ? ['README.md'] : [];
  return [...rootReadme, ...docsFiles];
}

function parseLinks(markdown) {
  const links = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function normalizeLinkTarget(rawTarget) {
  let target = rawTarget.trim();
  if (!target) return null;

  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1).trim();
  }

  // Links sometimes wrap file paths in backticks for readability.
  if (target.startsWith('`') && target.endsWith('`')) {
    target = target.slice(1, -1).trim();
  }

  if (/^(https?:|mailto:|#)/i.test(target)) return null;

  const firstToken = target.split(/\s+/)[0];
  const withoutHash = firstToken.split('#')[0];
  if (!withoutHash) return null;

  // Ignore glob-like references used in docs as patterns, not concrete links.
  if (withoutHash.includes('*')) return null;

  return withoutHash.replace(/\\/g, '/');
}

function resolveDocPath(fromFile, relTarget) {
  const rootPrefixes = [
    'Docs/',
    'src/',
    'src-tauri/',
    'plugins/',
    'themes/',
    'integrations/',
    '.github/',
    'scripts/',
  ];
  const rootFiles = new Set([
    'README.md',
    'package.json',
    'vite.config.ts',
    'svelte.config.js',
    'tsconfig.json',
    'tsconfig.node.json',
    'FUTURE-FEATURES.md',
    'AGENTS.md',
  ]);

  if (relTarget.startsWith('/')) {
    return relTarget.slice(1);
  }
  if (rootPrefixes.some((prefix) => relTarget.startsWith(prefix)) || rootFiles.has(relTarget)) {
    return path.posix.normalize(relTarget);
  }
  const fromDir = path.posix.dirname(fromFile);
  return path.posix.normalize(path.posix.join(fromDir, relTarget));
}

function makeLowercaseMap(paths) {
  const map = new Map();
  for (const p of paths) {
    const key = p.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return map;
}

function checkLinks(markdownFiles, trackedFiles) {
  const trackedSet = new Set(trackedFiles);
  const lowerMap = makeLowercaseMap(trackedFiles);
  const errors = [];

  for (const mdFile of markdownFiles) {
    const content = fs.readFileSync(mdFile, 'utf8');
    const links = parseLinks(content);

    for (const raw of links) {
      const target = normalizeLinkTarget(raw);
      if (!target) continue;

      const resolved = resolveDocPath(mdFile, target);
      if (trackedSet.has(resolved) || fs.existsSync(resolved)) continue;

      const candidates = lowerMap.get(resolved.toLowerCase()) || [];
      if (candidates.length > 0) {
        errors.push(
          `${mdFile}: link case mismatch '${target}' -> expected '${candidates[0]}'`,
        );
      } else {
        errors.push(`${mdFile}: broken link '${target}' -> '${resolved}' not found`);
      }
    }
  }

  return errors;
}

function checkVersions(trackedFiles) {
  const errors = [];
  const pkg = readJson('package.json');
  const tauri = readJson('src-tauri/tauri.conf.json');
  const version = String(pkg.version || '').trim();

  if (!version) {
    errors.push('package.json: missing version');
    return errors;
  }

  if (String(tauri.version || '').trim() !== version) {
    errors.push(
      `Version mismatch: package.json=${version} vs src-tauri/tauri.conf.json=${tauri.version}`,
    );
  }

  const requiredPatterns = [
    { file: 'README.md', pattern: `v${version}` },
    { file: 'Docs/TODO.md', pattern: `v${version}` },
    { file: 'Docs/reports/STATUS_2026-02-10.md', pattern: `v${version}` },
    { file: 'Docs/plans/shelved/FUTURE-FEATURES.md', pattern: `v${version}` },
    { file: 'Docs/CHANGELOG.md', pattern: `## [${version}]` },
  ];

  for (const item of requiredPatterns) {
    if (!fs.existsSync(item.file)) {
      errors.push(`Missing file for version check: ${item.file}`);
      continue;
    }
    const content = fs.readFileSync(item.file, 'utf8');
    if (!content.includes(item.pattern)) {
      errors.push(`${item.file}: expected to include '${item.pattern}'`);
    }
  }

  const specPath = `Docs/plans/spec/v${version}.md`;
  if (!trackedFiles.includes(specPath) && !fs.existsSync(specPath)) {
    errors.push(`Missing spec file for current version: ${specPath}`);
  }

  return errors;
}

function main() {
  const trackedFiles = getTrackedFiles();
  const markdownFiles = collectMarkdownFiles(trackedFiles);

  const linkErrors = checkLinks(markdownFiles, trackedFiles);
  const versionErrors = checkVersions(trackedFiles);
  const errors = [...linkErrors, ...versionErrors];

  if (errors.length > 0) {
    console.error('docs:check failed with the following issues:');
    for (const err of errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `docs:check passed (${markdownFiles.length} markdown files, version ${readJson('package.json').version})`,
  );
}

main();
