import {readFile,stat} from 'node:fs/promises';
import {basename,dirname,join,normalize,resolve} from 'node:path';

const dist=resolve('dist');
const html=await readFile(join(dist,'index.html'),'utf8');
const entryMatch=html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i)||html.match(/<script[^>]+src=["']([^"']+)["'][^>]+type=["']module["']/i);
if(!entryMatch)throw new Error('Performance budget: production module entry was not found');

const toFile=value=>normalize(join(dist,value.replace(/^\//,'')));
const entry=toFile(entryMatch[1]);
const initialJs=new Set();
async function collectStaticImports(file){
  const normalized=normalize(file);if(initialJs.has(normalized))return;initialJs.add(normalized);
  const source=await readFile(normalized,'utf8');
  const pattern=/(?:^|[;\n])\s*import(?!\s*\()(?:(?:.|\n)*?from\s*)?["'](\.\/[^"']+)["']/g;
  for(const match of source.matchAll(pattern))await collectStaticImports(resolve(dirname(normalized),match[1]));
}
await collectStaticImports(entry);

const cssFiles=[...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)].map(match=>toFile(match[1]));
const sizeOf=async files=>(await Promise.all([...files].map(async file=>(await stat(file)).size))).reduce((sum,size)=>sum+size,0);
const initialJsBytes=await sizeOf(initialJs);const initialCssBytes=await sizeOf(cssFiles);
const budgets={initialJsBytes:620*1024,initialCssBytes:220*1024,totalInitialBytes:800*1024};
if(initialJsBytes>budgets.initialJsBytes)throw new Error(`Performance budget: initial JS ${initialJsBytes} exceeds ${budgets.initialJsBytes}`);
if(initialCssBytes>budgets.initialCssBytes)throw new Error(`Performance budget: initial CSS ${initialCssBytes} exceeds ${budgets.initialCssBytes}`);
if(initialJsBytes+initialCssBytes>budgets.totalInitialBytes)throw new Error(`Performance budget: initial assets ${initialJsBytes+initialCssBytes} exceed ${budgets.totalInitialBytes}`);

const forbidden=['exceljs','mammoth','jspdf','html2canvas'];
for(const file of initialJs){const name=basename(file).toLowerCase();if(forbidden.some(item=>name.includes(item)))throw new Error(`Performance budget: admin-only dependency entered the initial graph: ${name}`)}
if(!forbidden.every(item=>html.includes(item)===false))throw new Error('Performance budget: heavy admin asset was preloaded by index.html');

console.log(JSON.stringify({ok:true,initialJsBytes,initialCssBytes,initialJsChunks:initialJs.size,adminToolsDeferred:forbidden}));
