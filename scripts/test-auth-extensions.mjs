import assert from 'node:assert/strict';
import {env,sqlite,firebase,call} from './test-auth.mjs';
import worker from '../worker/site-worker.js';
import {validatePassword} from '../worker/password-auth.js';
import {fromExamIso,toExamIso} from '../src/exam-time.ts';
import {FirebaseAuthError} from '../worker/firebase-auth.js';

assert.equal(validatePassword('12345678a'),null);
for(const password of ['12345678','1234567a','abcdefgh2026','a'.repeat(129)])assert.ok(validatePassword(password));
assert.equal(validatePassword('12345678ح'),null);
const baseParts={year:'2028',month:'2',day:'29',hour:'12',minute:'05',period:'AM'};
assert.equal(toExamIso(baseParts),'2028-02-28T21:05:00.000Z');
assert.equal(toExamIso({...baseParts,period:'PM'}),'2028-02-29T09:05:00.000Z');
for(const patch of [{year:'2027'},{day:'30'},{hour:'0'},{minute:'60'},{month:''},{year:'2028.5'}])assert.equal(toExamIso({...baseParts,...patch}),'');
for(const hour of ['1','11','12'])for(const period of ['AM','PM']){const parts={...baseParts,hour,period};assert.deepEqual(fromExamIso(toExamIso(parts)),parts)}
assert.equal(fromExamIso('').year,'');

const session=await call('/api/auth/login',{method:'POST',body:{email:'student@example.com',password:'12345678a'}});
assert.equal(session.response.status,200);const oldCookie=session.response.headers.get('set-cookie').split(';')[0];
let consumed=false;
env.FIREBASE_AUTH.resetPassword=async({oobCode,newPassword})=>{
  if(oobCode!=='one-use-reset-code'||consumed)throw new FirebaseAuthError('INVALID_OOB_CODE');
  if(newPassword){firebase.resetPassword('student@example.com',newPassword);consumed=true}
  return {requestType:'PASSWORD_RESET',email:'student@example.com'};
};
const externalContinue=await call('/api/auth/check-password-reset',{method:'POST',body:{mode:'resetPassword',oobCode:'one-use-reset-code',continueUrl:'https://evil.example/steal'}});assert.equal(externalContinue.response.status,400);assert.equal(consumed,false);
const checkedReset=await call('/api/auth/check-password-reset',{method:'POST',body:{mode:'resetPassword',oobCode:'one-use-reset-code',continueUrl:'/tests?from=reset'}});assert.equal(checkedReset.response.status,200);assert.equal(checkedReset.data.valid,true);assert.equal(checkedReset.data.continuePath,'/tests?from=reset');assert.match(checkedReset.data.maskedEmail,/\*+@example\.com$/);assert.equal(consumed,false);
const weakReset=await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'1234567a'}});assert.equal(weakReset.response.status,400);assert.equal(consumed,false);
const originalBatch=env.DB.batch.bind(env.DB);env.DB.batch=async()=>{throw new Error('simulated D1 outage')};const unsafeReset=await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'87654321z'}});env.DB.batch=originalBatch;assert.equal(unsafeReset.response.status,503);assert.equal(unsafeReset.data.error.code,'SESSION_REVOCATION_FAILED');assert.equal(consumed,false);assert.equal((await call('/api/auth/session',{extraHeaders:{cookie:oldCookie}})).response.status,200);
const reset=await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'87654321z'}});assert.equal(reset.response.status,200);
assert.equal(reset.data.email,'student@example.com');
assert.equal((await call('/api/auth/session',{extraHeaders:{cookie:oldCookie}})).response.status,401);
assert.equal((await call('/api/auth/login',{method:'POST',body:{email:reset.data.email,password:'87654321z'}})).response.status,200);
assert.equal((await call('/api/auth/login',{method:'POST',body:{email:reset.data.email,password:'12345678a'}})).response.status,401);
assert.equal((await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'87654321z'}})).response.status,410);
assert.equal((await call('/api/auth/check-password-reset',{method:'POST',body:{mode:'resetPassword',oobCode:'one-use-reset-code'}})).response.status,410);

const studentUid=sqlite.prepare(`SELECT firebase_uid FROM users WHERE email='student@example.com'`).get().firebase_uid;
sqlite.prepare(`UPDATE users SET email_verified_at=NULL WHERE email='student@example.com'`).run();
let emailActionUsed=false;
env.FIREBASE_AUTH.update=async({oobCode})=>{
  if(oobCode!=='verify-email-code'||emailActionUsed)throw new FirebaseAuthError('INVALID_OOB_CODE');
  emailActionUsed=true;return {localId:studentUid,email:'student@example.com'};
};
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'resetPassword',oobCode:'verify-email-code'}})).response.status,400);
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'verifyEmail',oobCode:'verify-email-code',continueUrl:'//evil.example'}})).response.status,400);
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'verifyEmail',oobCode:'verify-email-code'}})).response.status,200);
assert.ok(sqlite.prepare(`SELECT email_verified_at FROM users WHERE email='student@example.com'`).get().email_verified_at);
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'verifyEmail',oobCode:'verify-email-code'}})).response.status,410);

const base='https://example.test';env.FIREBASE_WEB_API_KEY='firebase-web-test-key-1234567890';env.FIREBASE_AUTH_PROJECT_ID='kiur-test-project';
async function googleToken(email,password='87654321z'){return (await firebase.api.signInWithPassword({email,password})).idToken}
async function start(body={role:'owner'}){const result=await call('/api/auth/google/start',{method:'POST',body});assert.equal(result.response.status,200);assert.equal(result.data.ready,true);const cookie=result.response.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly; Secure; SameSite=Lax'));return {cookie:cookie.split(';')[0]}}
async function complete(flow,idToken){return call('/api/auth/google/complete',{method:'POST',extraHeaders:{cookie:flow.cookie},body:{idToken}})}
const config=await call('/api/auth/google/config');assert.equal(config.response.status,200);assert.deepEqual(config.data.config,{apiKey:env.FIREBASE_WEB_API_KEY,projectId:env.FIREBASE_AUTH_PROJECT_ID,authDomain:env.FIREBASE_AUTH_PROJECT_ID+'.firebaseapp.com'});
firebase.markGoogle('student@example.com');
const good=await start();const login=await complete(good,await googleToken('student@example.com'));assert.equal(login.response.status,200);assert.equal(login.data.authenticated,true);assert.ok(login.response.headers.get('set-cookie').includes('__Host-kiur_session='));
const replay=await complete(good,await googleToken('student@example.com'));assert.equal(replay.response.status,401);
const missing=await start();assert.equal((await complete({...missing,cookie:''},await googleToken('student@example.com'))).response.status,401);
const expired=await start();sqlite.prepare(`UPDATE google_auth_flows SET expires_at=0`).run();assert.equal((await complete(expired,await googleToken('student@example.com'))).response.status,401);
let googleEmail='new-google@example.com',googlePassword='some-test-password';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.verify(googleEmail);firebase.markGoogle(googleEmail);
const newLogin=await complete(await start(),await googleToken(googleEmail,googlePassword));assert.equal(newLogin.response.status,200);assert.equal(newLogin.data.authenticated,true);const newUser=sqlite.prepare(`SELECT account_role,account_status FROM users WHERE email=?`).get(googleEmail);assert.equal(newUser.account_role,'student');assert.equal(newUser.account_status,'active');
assert.equal((await complete(await start(),await googleToken(googleEmail,googlePassword))).response.status,200);
sqlite.prepare(`UPDATE users SET account_status='suspended' WHERE email=?`).run(googleEmail);assert.equal((await complete(await start(),await googleToken(googleEmail,googlePassword))).response.status,403);
googleEmail='collision@example.com';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.verify(googleEmail);firebase.markGoogle(googleEmail);sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES('collision',?,'Existing owner','admin','owner')`).run(googleEmail);
assert.equal((await complete(await start(),await googleToken(googleEmail,googlePassword))).response.status,409);
googleEmail='unverified-google@example.com';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.markGoogle(googleEmail);assert.equal((await complete(await start(),await googleToken(googleEmail,googlePassword))).response.status,401);
googleEmail='password-only@example.com';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.verify(googleEmail);assert.equal((await complete(await start(),await googleToken(googleEmail,googlePassword))).response.status,401);
const csrf=await worker.fetch(new Request(base+'/api/auth/google/start',{method:'POST',headers:{'content-type':'application/json','origin':'https://evil.test'},body:'{}'}),env);assert.equal(csrf.status,403);
console.log(JSON.stringify({ok:true,passwordPolicy:true,baghdadTime:true,resetRevokesSessions:true,oneUseReset:true,emailActions:true,google:{firebaseHandler:true,session:true,replayRejected:true,expiredRejected:true,autoActivated:true,suspended:true,noEmailTakeover:true,noUnverifiedLogin:true,providerVerified:true,csrf:true}}));
