#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsPath = path.join(__dirname, '..', 'data', 'icons.json');
const categoriesPath = path.join(__dirname, '..', 'data', 'categories.json');

if (!fs.existsSync(iconsPath)) {
  console.error('Icons data file not found at:', iconsPath);
  process.exit(1);
}

const icons = JSON.parse(fs.readFileSync(iconsPath, 'utf-8'));
const categories = fs.existsSync(categoriesPath) ? JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')) : [];

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log('Usage: node search.mjs "<query>" [--category "<name>"] [--react] [--svg] [--max <N>] [--list-categories]');
  process.exit(0);
}

if (args.includes('--list-categories')) {
  console.log('Available Icon Categories:');
  categories.forEach((c, idx) => console.log('  ' + (idx + 1) + '. ' + c.title + ' (' + c.id + ')'));
  process.exit(0);
}

let query = '';
let targetCategory = null;
let showReact = false;
let showSvg = false;
let maxResults = 8;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--category' && args[i + 1]) {
    targetCategory = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--react') {
    showReact = true;
  } else if (args[i] === '--svg') {
    showSvg = true;
  } else if (args[i] === '--max' && args[i + 1]) {
    maxResults = parseInt(args[i + 1], 10);
    i++;
  } else if (!args[i].startsWith('-')) {
    query = args[i].toLowerCase();
  }
}

const terms = query.split(/\s+/).filter(Boolean);
const results = [];

for (const icon of icons) {
  if (targetCategory && !icon.categories.some(c => c.toLowerCase().includes(targetCategory))) {
    continue;
  }

  let score = 0;
  const nameLower = icon.name.toLowerCase();
  const tagsText = icon.tags.join(' ').toLowerCase();

  for (const term of terms) {
    if (nameLower === term) score += 30;
    else if (nameLower.startsWith(term)) score += 20;
    else if (nameLower.includes(term)) score += 10;

    if (icon.tags.some(t => t.toLowerCase() === term)) score += 15;
    else if (tagsText.includes(term)) score += 5;

    if (icon.categories.some(c => c.toLowerCase().includes(term))) score += 4;
  }

  if (score > 0 || (terms.length === 0 && targetCategory)) {
    results.push({ ...icon, score });
  }
}

results.sort((a, b) => b.score - a.score);
const displayed = results.slice(0, maxResults);

console.log('\nFound ' + results.length + ' Lucide icons (showing top ' + displayed.length + '):\n');
displayed.forEach((r, idx) => {
  console.log('[' + (idx + 1) + '] ' + r.name + ' -> <' + r.component + ' />');
  console.log('    Categories: ' + r.categories.join(', '));
  if (r.tags.length > 0) {
    console.log('    Tags: ' + r.tags.slice(0, 8).join(', '));
  }
  if (showReact) {
    console.log('    React import: import { ' + r.component + ' } from "lucide-react";');
  }
  if (showSvg) {
    console.log('    SVG markup:');
    console.log(r.svg.split('\n').map(l => '      ' + l).join('\n'));
  }
  console.log('');
});
