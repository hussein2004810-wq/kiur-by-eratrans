#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'data', 'public-apis.json');

if (!fs.existsSync(dataPath)) {
  console.error('Data file not found at:', dataPath);
  process.exit(1);
}

const categories = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log('Usage: node search.mjs "<query>" [--category "<name>"] [--no-auth] [--cors] [--max <N>] [--list-categories]');
  process.exit(0);
}

if (args.includes('--list-categories')) {
  console.log('Available Categories:');
  categories.forEach((c, idx) => console.log('  ' + (idx + 1) + '. ' + c.name + ' (' + c.apis.length + ' APIs)'));
  process.exit(0);
}

let query = '';
let targetCategory = null;
let onlyNoAuth = false;
let onlyCors = false;
let maxResults = 10;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) {
    targetCategory = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--no-auth') {
    onlyNoAuth = true;
  } else if (args[i] === '--cors') {
    onlyCors = true;
  } else if (args[i] === '--max' && args[i + 1]) {
    maxResults = parseInt(args[i + 1], 10);
    i++;
  } else if (!args[i].startsWith('-')) {
    query = args[i].toLowerCase();
  }
}

const terms = query.split(/\s+/).filter(Boolean);
const results = [];

for (const cat of categories) {
  if (targetCategory && !cat.name.toLowerCase().includes(targetCategory)) {
    continue;
  }

  for (const api of cat.apis) {
    if (onlyNoAuth && api.auth.toLowerCase() !== 'no') {
      continue;
    }
    if (onlyCors && api.cors.toLowerCase() !== 'yes') {
      continue;
    }

    const fullText = (api.name + ' ' + api.url + ' ' + api.description + ' ' + cat.name + ' ' + api.auth).toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (api.name.toLowerCase().includes(term)) score += 10;
      if (api.description.toLowerCase().includes(term)) score += 5;
      if (cat.name.toLowerCase().includes(term)) score += 3;
      if (api.url.toLowerCase().includes(term)) score += 2;
    }

    if (score > 0 || (terms.length === 0 && (targetCategory || onlyNoAuth || onlyCors))) {
      results.push({ ...api, category: cat.name, score });
    }
  }
}

results.sort((a, b) => b.score - a.score);
const displayed = results.slice(0, maxResults);

console.log('\nFound ' + results.length + ' APIs (showing top ' + displayed.length + '):\n');
displayed.forEach((r, idx) => {
  console.log('[' + (idx + 1) + '] ' + r.name + ' (' + r.category + ')');
  console.log('    URL: ' + r.url);
  console.log('    Description: ' + r.description);
  console.log('    Auth: ' + (r.auth === 'No' ? 'None (No API Key required)' : r.auth) + ' | HTTPS: ' + (r.https ? 'Yes' : 'No') + ' | CORS: ' + r.cors);
  console.log('');
});
