const worker = (await import('../dist/server/index.js')).default;
const page = await worker.fetch(new Request('https://medexam.test/'));
const html = await page.text();
const assetPath = html.match(/src="([^"]+)/)?.[1];
if (!assetPath) throw new Error('JavaScript asset was not found in HTML');
const asset = await worker.fetch(new Request('https://medexam.test' + assetPath));
console.log('ROOT', page.status, html.includes('KIUR by ERATRANS'));
console.log('ASSET', asset.status, asset.headers.get('content-type'));
if (page.status !== 200 || asset.status !== 200) process.exitCode = 1;
