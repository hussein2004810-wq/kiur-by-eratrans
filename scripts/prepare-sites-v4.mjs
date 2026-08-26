import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = join(project, 'dist');
const serverDir = join(root, 'server');
const mime = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'
};
const entries=[];
async function collect(directory){
  for(const item of await readdir(directory,{withFileTypes:true})){
    const absolute=join(directory,item.name);
    if(absolute.startsWith(serverDir))continue;
    if(item.isDirectory()){await collect(absolute);continue}
    entries.push([
      '/'+relative(root,absolute).split(sep).join('/'),
      {body:(await readFile(absolute)).toString('base64'),type:mime[extname(item.name).toLowerCase()]||'application/octet-stream'}
    ]);
  }
}
await collect(root);
const template=await readFile(join(project,'worker','site-worker.js'),'utf8');
const worker=template.replace('/*__STATIC_FILES__*/',JSON.stringify(entries));
await mkdir(serverDir,{recursive:true});
await writeFile(join(serverDir,'index.js'),worker,'utf8');
await copyFile(join(project,'worker','hierarchy-api.js'),join(serverDir,'hierarchy-api.js'));
