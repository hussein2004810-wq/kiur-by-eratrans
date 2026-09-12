#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '..', 'data', 'free-for-dev.json');

if (!fs.existsSync(dataPath)) {
  console.error('Data file not found at:', dataPath);
  process.exit(1);
}

const categories = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log('Usage: node search.mjs "<query>" [--category "<name>"] [--max <N>] [--list-categories]');
  process.exit(0);
}

if (args.includes('--list-categories')) {
  console.log('Available Categories:');
  categories.forEach((c, idx) => console.log('  ' + (idx + 1) + '. ' + c.name + ' (' + c.services.length + ' services)'));
  process.exit(0);
}

let query = '';
let targetCategory = null;
let maxResults = 10;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) {
    targetCategory = args[i + 1].toLowerCase();
    i++;
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

  for (const s of cat.services) {
    const fullText = (s.name + ' ' + s.url + ' ' + s.description + ' ' + s.details.join(' ') + ' ' + cat.name).toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (s.name.toLowerCase().includes(term)) score += 10;
      if (s.description.toLowerCase().includes(term)) score += 5;
      if (s.details.some(d => d.toLowerCase().includes(term))) score += 4;
      if (cat.name.toLowerCase().includes(term)) score += 3;
      if (s.url.toLowerCase().includes(term)) score += 2;
    }

    if (score > 0 || (terms.length === 0 && targetCategory)) {
      results.push({ ...s, category: cat.name, score });
    }
  }
}

results.sort((a, b) => b.score - a.score);
const displayed = results.slice(0, maxResults);

console.log('\nFound ' + results.length + ' results (showing top ' + displayed.length + '):\n');
displayed.forEach((r, idx) => {
  console.log('[' + (idx + 1) + '] ' + r.name + ' (' + r.category + ')');
  console.log('    URL: ' + r.url);
  if (r.description) console.log('    Summary: ' + r.description);
  if (r.details.length > 0) {
    console.log('    Free Tier Limits:');
    r.details.forEach(d => console.log('      - ' + d));
  }
  console.log('');
});
