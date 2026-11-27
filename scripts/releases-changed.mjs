#!/usr/bin/env node
// Tells the scheduled workflow whether the site needs a new deploy: compares the freshly built
// data/releases.json with the one the live site serves, ignoring the timestamp. Writes
// changed=true|false to $GITHUB_OUTPUT. When the live file can't be read, it says "changed".
// Node 20+, no dependencies.

import { appendFile, readFile } from 'node:fs/promises';

const LIVE = 'https://theoron-apps.github.io/data/releases.json';
const comparable = ({ updated, ...rest }) => JSON.stringify(rest);

const fresh = JSON.parse(await readFile(new URL('../data/releases.json', import.meta.url), 'utf8'));
let changed = true;
try {
  // The query string gets past the CDN cache in front of GitHub Pages.
  const res = await fetch(`${LIVE}?t=${Date.now()}`, { cache: 'no-store' });
  if (res.ok) changed = comparable(await res.json()) !== comparable(fresh);
} catch (error) {
  console.warn(`Could not read the live data (${error.message}); deploying to be safe.`);
}

console.log(changed ? 'Releases changed: deploying.' : 'No new releases: nothing to deploy.');
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
