import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

const source=await readFile('src/RealAppV2.tsx','utf8');
const css=await readFile('src/admin-shell.css','utf8');
assert(source.includes("import './admin-shell.css';"),'admin shell must load with the main application');
assert.equal((source.match(/role="tab" aria-selected=/g)||[]).length,10,'all admin destinations need tab semantics');
assert(source.includes("setAdminMenuOpen(false)"),'choosing a destination must close the phone menu');
assert(source.includes('aria-controls="admin-section-menu"')&&source.includes('aria-expanded={adminMenuOpen}'),'phone menu state must be announced');
for(const required of ['.adminWorkspace{display:grid','.app .adminTabs button{','@media(max-width:900px)','.adminRail{display:none','.adminRail.open{display:block','grid-template-columns:repeat(2,minmax(0,1fr))','@media(prefers-reduced-motion:reduce)'])assert(css.includes(required),`missing mobile admin invariant: ${required}`);

const html=await readFile('dist/index.html','utf8');
const styles=[...html.matchAll(/href="(\/assets\/[^\"]+\.css)"/g)].map(match=>match[1]);
assert(styles.length>0,'production HTML must preload a main stylesheet');
const assets=await readdir('dist/assets');
const main=styles.map(path=>path.split('/').pop()).find(name=>assets.includes(name));
assert(main,'main stylesheet referenced by production HTML was not found');
const productionCss=await readFile('dist/assets/'+main,'utf8');
assert(productionCss.includes('.adminWorkspace')&&productionCss.includes('.app .adminTabs'),'admin navigation CSS must be in the initial production stylesheet');
const catalogCss=assets.find(name=>name.startsWith('CatalogManagerV2-')&&name.endsWith('.css'));
assert(catalogCss,'lazy catalog stylesheet missing');
assert(productionCss.indexOf('.app .adminTabs')>=0,'specific global selector prevents late lazy CSS from replacing the shell');
console.log(JSON.stringify({ok:true,adminTabs:10,initialCss:main,mobileMenu:true,verticalRail:true,reducedMotion:true}));
