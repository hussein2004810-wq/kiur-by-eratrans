import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const main=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');
const theme=await readFile(new URL('../src/theme.css',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

assert.ok(main.indexOf("import './styles.css'")<main.indexOf("import './theme.css'"),'Theme layer must load after the legacy styles');
for(const token of ['--kiur-bg','--kiur-surface','--kiur-purple','--kiur-blue','--kiur-focus','--text','--z-modal','--z-critical'])assert.ok(theme.includes(token),`Missing theme token ${token}`);
for(const surface of ['.app .sidebar','.app .panel','.app .shelfSubject','.app .modalCard','.app .adminRail','.app .catalogBox','.app .mediaGrid article','.app .banSummary article','.app .logsManager nav button.active'])assert.ok(theme.includes(surface),`Missing themed surface ${surface}`);
assert.match(theme,/\.app input:not\(\[type=checkbox\]\)/,'Form controls must have a scoped dark treatment');
assert.match(theme,/@media\(max-width:720px\)[\s\S]*safe-area-inset-bottom/,'Mobile safe areas must be respected');
assert.match(theme,/@media\(prefers-reduced-motion:reduce\)/,'Reduced motion support is required');
assert.match(theme,/@media\(forced-colors:active\)/,'Forced-colors support is required');
assert.match(theme,/@media print[\s\S]*background:#fff!important/,'Printable outputs must stay light');
assert.match(html,/viewport-fit=cover/,'Viewport metadata must support phone safe areas');
assert.match(html,/theme-color" content="#080b1a"/,'Browser chrome must match the KIUR dark theme');
assert.match(html,/og:image[^>]*\/og\.png/,'The root page must expose the KIUR social preview');
assert.match(html,/twitter:card" content="summary_large_image"/,'The social preview must use a large image card');

console.log('KIUR full-theme contract checks passed');
