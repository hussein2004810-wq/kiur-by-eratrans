import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const source=await readFile(new URL('../src/AuthScreen.tsx',import.meta.url),'utf8');
const css=await readFile(new URL('../src/auth.css',import.meta.url),'utf8');
const security=await readFile(new URL('../worker/security.js',import.meta.url),'utf8');

assert.match(source,/backgroundVideoUrl\?:string\|null/,'Auth background must remain configurable');
assert.match(source,/onAuthenticated\?:\(\)=>void\|Promise<void>/,'Successful authentication needs a reusable callback');
assert.match(source,/autoPlay=\{!reduceMotion\}/,'Video motion must respect the operating-system preference');
assert.match(source,/playsInline/,'Background video must stay inline on mobile');
assert.match(source,/type=\{showPassword\?'text':'password'\}/,'Password visibility toggle is missing');
assert.match(source,/if\(busy\)return/,'Repeated form submission must be blocked');
assert.match(source,/kiur-remembered-email/,'Remember-me must store the email only');
assert.doesNotMatch(source,/localStorage\.setItem\([^\n]*password/,'Passwords must never be persisted in localStorage');
assert.match(source,/role="alert"/,'Authentication errors need an accessible live announcement');
assert.match(css,/min-height:100svh/,'The auth experience must fill the mobile viewport');
assert.match(css,/object-fit:cover/,'Video must cover the viewport');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/,'Reduced-motion styling is required');
assert.match(css,/:focus-visible/,'Keyboard focus styling is required');
assert.match(source,/DEFAULT_BACKGROUND_VIDEO='\/media\/kiur-auth-background\.mp4'/,'The default video must be served from KIUR itself');
assert.match(security,/media-src 'self'/,'CSP must restrict login media to KIUR assets');
assert.doesNotMatch(security,/media-src[^;]*pexels/,'The production CSP must not expose an unnecessary third-party media origin');

console.log('Auth UI contract checks passed');
