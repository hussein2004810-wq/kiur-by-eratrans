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
const weakReset=await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'1234567a'}});assert.equal(weakReset.response.status,400);assert.equal(consumed,false);
const reset=await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'87654321z'}});assert.equal(reset.response.status,200);
assert.equal((await call('/api/auth/session',{extraHeaders:{cookie:oldCookie}})).response.status,401);
assert.equal((await call('/api/auth/reset-password',{method:'POST',body:{oobCode:'one-use-reset-code',password:'87654321z'}})).response.status,410);

const studentUid=sqlite.prepare(`SELECT firebase_uid FROM users WHERE email='student@example.com'`).get().firebase_uid;
sqlite.prepare(`UPDATE users SET email_verified_at=NULL WHERE email='student@example.com'`).run();
let emailActionUsed=false;
env.FIREBASE_AUTH.update=async({oobCode})=>{
  if(oobCode!=='verify-email-code'||emailActionUsed)throw new FirebaseAuthError('INVALID_OOB_CODE');
  emailActionUsed=true;return {localId:studentUid,email:'student@example.com'};
};
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'resetPassword',oobCode:'verify-email-code'}})).response.status,400);
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'verifyEmail',oobCode:'verify-email-code'}})).response.status,200);
assert.ok(sqlite.prepare(`SELECT email_verified_at FROM users WHERE email='student@example.com'`).get().email_verified_at);
assert.equal((await call('/api/auth/apply-email-action',{method:'POST',body:{mode:'verifyEmail',oobCode:'verify-email-code'}})).response.status,410);

const base='https://example.test';const flows=new Map();let googleEmail='student@example.com';let googlePassword='87654321z';
env.FIREBASE_AUTH.createAuthUri=async(payload)=>{
  assert.equal(payload.providerId,'google.com');assert.equal(payload.authFlowType,'CODE_FLOW');assert.equal(payload.continueUri,base+'/api/auth/google/callback');
  const sessionId=crypto.randomUUID(),state=crypto.randomUUID();flows.set(sessionId,state);
  return {sessionId,providerId:'google.com',authUri:'https://accounts.google.com/o/oauth2/auth?state='+state};
};
env.FIREBASE_AUTH.signInWithIdp=async(payload)=>{
  const uri=new URL(payload.requestUri);assert.equal(uri.origin,base);assert.equal(uri.searchParams.get('state'),flows.get(payload.sessionId));
  assert.equal(payload.returnIdpCredential,false);
  return {...await firebase.api.signInWithPassword({email:googleEmail,password:googlePassword}),providerId:'google.com',displayName:'Google student'};
};
async function start(){const result=await call('/api/auth/google/start',{method:'POST',body:{role:'owner'}});assert.equal(result.response.status,200);const cookie=result.response.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly; Secure; SameSite=Lax'));return {cookie:cookie.split(';')[0],state:new URL(result.data.url).searchParams.get('state')}}
async function callback(flow,extra=''){return worker.fetch(new Request(base+'/api/auth/google/callback?state='+flow.state+extra,{headers:{cookie:flow.cookie}}),env)}
const good=await start();const login=await callback(good);assert.equal(login.status,303);assert.equal(login.headers.get('location'),'/');assert.ok(login.headers.get('set-cookie').includes('__Host-kiur_session='));
const replay=await callback(good);assert.ok(replay.headers.get('location').includes('google_expired'));
const missing=await start();assert.ok((await callback({...missing,cookie:''})).headers.get('location').includes('google_expired'));
const mismatch=await start();assert.ok((await callback({...mismatch,state:'forged'})).headers.get('location').includes('google_expired'));
const expired=await start();sqlite.prepare(`UPDATE google_auth_flows SET expires_at=0`).run();assert.ok((await callback(expired)).headers.get('location').includes('google_expired'));
googleEmail='new-google@example.com';googlePassword='some-test-password';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.verify(googleEmail);
const newLogin=await callback(await start());assert.ok(newLogin.headers.get('location').includes('google_pending'));const newUser=sqlite.prepare(`SELECT account_role,account_status FROM users WHERE email=?`).get(googleEmail);assert.equal(newUser.account_role,'student');assert.equal(newUser.account_status,'pending');
assert.ok((await callback(await start())).headers.get('location').includes('google_pending'));
sqlite.prepare(`UPDATE users SET account_status='suspended' WHERE email=?`).run(googleEmail);assert.ok((await callback(await start())).headers.get('location').includes('google_suspended'));
googleEmail='collision@example.com';await firebase.api.signUp({email:googleEmail,password:googlePassword});firebase.verify(googleEmail);sqlite.prepare(`INSERT INTO users(id,email,name,role,account_role) VALUES('collision',?,'Existing owner','admin','owner')`).run(googleEmail);
assert.ok((await callback(await start())).headers.get('location').includes('google_link_required'));
googleEmail='unverified-google@example.com';await firebase.api.signUp({email:googleEmail,password:googlePassword});assert.ok((await callback(await start())).headers.get('location').includes('google_retry'));
const csrf=await worker.fetch(new Request(base+'/api/auth/google/start',{method:'POST',headers:{'content-type':'application/json','origin':'https://evil.test'},body:'{}'}),env);assert.equal(csrf.status,403);
console.log(JSON.stringify({ok:true,passwordPolicy:true,baghdadTime:true,resetRevokesSessions:true,oneUseReset:true,emailActions:true,google:{session:true,replayRejected:true,stateBound:true,expiredRejected:true,pending:true,suspended:true,noEmailTakeover:true,noUnverifiedLogin:true,csrf:true}}));
