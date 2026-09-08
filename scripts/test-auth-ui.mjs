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
assert.doesNotMatch(source,/signin-with-chatgpt|المتابعة بحساب ChatGPT/,'ChatGPT sign-in must not be exposed in the authentication UI');
assert.match(source,/minLength=\{mode==='login'\?1:9\}/,'Existing login credentials must not be blocked by the new creation policy');
assert.match(source,/mode==='reset'/,'Password reset action links need a dedicated screen');
assert.match(source,/\/api\/auth\/check-password-reset/,'Password reset links must be checked by the server before rendering the form');
assert.match(source,/resetState==='ready'/,'The new-password form must wait for a verified reset action code');
assert.match(source,/جارٍ التحقق من صلاحية رابط الاستعادة/,'Password reset verification needs an explicit Arabic loading state');
assert.match(source,/window\.location\.assign\(continuePath\)/,'Validated email-action continuation needs an explicit navigation path');
assert.match(source,/verifyEmail','recoverEmail/,'Firebase verification and email-recovery links need a dedicated handler');
assert.match(source,/emailActionStarted\.current/,'Email action links must be guarded against duplicate React effects');
assert.match(source,/\/api\/auth\/google\/start/,'Google sign-in must go through the server-owned flow');
assert.match(source,/\/api\/auth\/google\/complete/,'Google identity tokens must be exchanged through the server-owned flow');
assert.match(source,/requestGoogleIdToken/,'Google sign-in must use the Firebase hosted handler');
assert.match(source,/if\(mode!=='register'\|\|catalog\)return/,'Login must not depend on loading the academic catalog');
