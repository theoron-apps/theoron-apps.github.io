#!/usr/bin/env node
// Builds data/releases.json from the GitHub Releases API at deploy time,
// so visitors' browsers never have to call the GitHub API themselves.
// Node 20+, no dependencies.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPOS = [
  { app: 'NotchIsland', repo: 'theoron-apps/NotchIsland' },
  { app: 'Outputs', repo: 'theoron-apps/Outputs' },
  { app: 'Conversio', repo: 'theoron-apps/Conversio' },
];

const MAX_RELEASES = 12;
const SUMMARY_MAX = 180;
const OUTPUT_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'releases.json');

// ---------------------------------------------------------------- summary

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^\s{0,3}#{1,6}(\s|$)/;
const RULE = /^\s{0,3}([-*_=])(\s*\1){2,}\s*$/; // --- *** ___ and setext ===
const LINK_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s*\S/;
const FULL_CHANGELOG = /^\W*Full Changelog\W*:/i; // footer of GitHub's generated notes
const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.*)$/;
const ENDS_WITH_PUNCTUATION = /[.!?:;…]$/;

function cleanInline(line) {
  return line
    .replace(/^\s{0,3}>\s?/, '') // blockquote marker
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // ![alt](src)
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '') // ![alt][ref]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url)
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1') // [text][ref]
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ') // HTML tags
    .replace(/\*+|`+|~~/g, '')
    // `_` only as emphasis delimiter, so identifiers like snake_case survive.
    .replace(/(^|[^A-Za-z0-9_])_+|_+(?=[^A-Za-z0-9_]|$)/g, '$1')
    .trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  // Leave room for the ellipsis and cut at the last space that fits.
  const space = text.lastIndexOf(' ', max - 1);
  const cut = space > 0 ? text.slice(0, space) : text.slice(0, max - 1);
  return cut.replace(/[\s.,;:!?\-–—]+$/, '') + '…';
}

/** Turns a markdown release body into a short plain-text summary, or null. */
export function summarize(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) return null;

  const lines = markdown
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');

  // Each block is a paragraph or a bullet item; a blank line ends a block,
  // and a plain line right after a block continues it (soft wrap).
  const blocks = [];
  let current = null;
  let inFence = false;

  for (const raw of lines) {
    if (FENCE.test(raw)) {
      inFence = !inFence;
      current = null;
      continue;
    }
    if (inFence) continue;
    if (!raw.trim() || [HEADING, RULE, LINK_DEFINITION, FULL_CHANGELOG].some((re) => re.test(raw))) {
      current = null;
      continue;
    }

    const bullet = raw.match(BULLET);
    const text = cleanInline(bullet ? bullet[1] : raw);
    if (bullet || !current) {
      current = { text };
      blocks.push(current);
    } else {
      current.text = `${current.text} ${text}`;
    }
  }

  const sentences = blocks
    .map(({ text }) => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((text) => (ENDS_WITH_PUNCTUATION.test(text) ? text : `${text}.`));

  const summary = sentences.join(' ').replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  return summary ? truncate(summary, SUMMARY_MAX) : null;
}

// ---------------------------------------------------------------- data

function timeOf(entry) {
  const t = Date.parse(entry?.date ?? '');
  return Number.isNaN(t) ? -Infinity : t;
}

const newestFirst = (a, b) => timeOf(b) - timeOf(a) || 0; // undated pairs give NaN → 0

function toEntry(repo, release) {
  const tag = release.tag_name;
  const dmg = (release.assets ?? []).find((asset) => /\.dmg$/i.test(asset.name ?? ''));
  return {
    tag,
    name: release.name?.trim() || tag,
    date: release.published_at ?? null,
    url: release.html_url || `https://github.com/${repo}/releases/tag/${encodeURIComponent(tag)}`,
    dmg: dmg?.browser_download_url ?? null,
    summary: summarize(release.body),
    prerelease: Boolean(release.prerelease),
  };
}

/**
 * Builds the releases.json object.
 * fetchedByApp: { [app]: raw GitHub API release list }, with null/undefined
 * for an app whose fetch failed. previousData: the existing file, or null.
 * An app that failed (or returned no published release) keeps its previous entries.
 */
export function buildData(fetchedByApp, previousData = null, now = new Date()) {
  const apps = {};
  const releases = [];
  const keptApps = new Set();

  for (const { app, repo } of REPOS) {
    const raw = fetchedByApp?.[app];
    const entries = Array.isArray(raw)
      ? raw.filter((release) => !release.draft).map((release) => toEntry(repo, release)).sort(newestFirst)
      : [];

    if (entries.length) {
      const { tag, name, date, url, dmg, prerelease } = entries[0];
      apps[app] = { repo, latest: { tag, name, date, url, dmg, prerelease } };
      for (const { tag, name, date, url, summary, prerelease } of entries) {
        releases.push({ app, tag, name, date, url, summary, prerelease });
      }
    } else if (previousData?.apps?.[app]) {
      apps[app] = previousData.apps[app];
      keptApps.add(app);
    }
  }

  // Added in their previous order: Array#sort is stable, so undated entries keep it.
  releases.push(...(previousData?.releases ?? []).filter((release) => keptApps.has(release.app)));
  releases.sort(newestFirst);

  return { updated: now.toISOString(), apps, releases: releases.slice(0, MAX_RELEASES) };
}

// ---------------------------------------------------------------- network

async function fetchReleases(repo) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'theoron-site',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=10`, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const body = await response.json();
  if (!Array.isArray(body)) throw new Error('unexpected response (not an array)');
  return body;
}

async function readPrevious(file) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  try {
    const data = JSON.parse(text);
    if (data && typeof data.apps === 'object' && Array.isArray(data.releases)) return data;
  } catch {
    // fall through
  }
  console.warn(`::warning::${file} is not valid releases data; ignoring it.`);
  return null;
}

async function main() {
  const previous = await readPrevious(OUTPUT_FILE);
  const fetchedByApp = {};
  let failures = 0;

  for (const { app, repo } of REPOS) {
    try {
      fetchedByApp[app] = await fetchReleases(repo);
      console.log(`${repo}: ${fetchedByApp[app].length} releases`);
    } catch (error) {
      failures += 1;
      fetchedByApp[app] = null;
      console.warn(`::warning::Could not fetch ${repo} (${error.message}); keeping previous data.`);
    }
  }

  if (failures === REPOS.length) {
    if (!previous) {
      console.error('::error::Every repository failed and there is no existing data/releases.json.');
      process.exitCode = 1;
    } else {
      console.warn('::warning::Every repository failed; leaving data/releases.json unchanged.');
    }
    return;
  }

  const data = buildData(fetchedByApp, previous);
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_FILE} (${data.releases.length} releases).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
