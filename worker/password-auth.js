const SESSION_COOKIE='__Host-kiur_session';
const SESSION_SECONDS=7*24*60*60;
const SESSION_IDLE_SECONDS=30*60;
// workerd rejects PBKDF2 iteration counts above 100,000 with
// NotSupportedError. Keep the platform maximum and rely on the existing
// password policy plus login throttling to make online guessing impractical.
const PASSWORD_ITERATIONS=100000;

function bytesToBase64Url(bytes){
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlToBytes(value){
  const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);const binary=atob(padded);const bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);return bytes;
}
function randomToken(size=32){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return bytesToBase64Url(bytes)}
async function sha256(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))}
async function passwordMaterial(password,pepper,usePepper){
  if(!usePepper)return new TextEncoder().encode(password);
  if(typeof pepper!=='string'||pepper.length<32)throw new Error('PASSWORD_PEPPER_MISSING');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(password)));
}

export function normalizeEmail(value){return String(value||'').trim().toLowerCase()}
export function validatePassword(value){
  if(typeof value!=='string'||value.length<12||value.length>128)return 'كلمة المرور يجب أن تكون بين 12 و128 حرفًا';
  if(!/\p{L}/u.test(value)||!/\p{N}/u.test(value))return 'كلمة المرور يجب أن تحتوي حروفًا وأرقامًا';
  return null;
}

async function derivePassword(password,salt,iterations,pepper,usePepper){
  const key=await crypto.subtle.importKey('raw',await passwordMaterial(password,pepper,usePepper),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
  return new Uint8Array(bits);
}
export async function createPasswordRecord(password,env){
  const salt=new Uint8Array(16);crypto.getRandomValues(salt);const hash=await derivePassword(password,salt,PASSWORD_ITERATIONS,env?.PASSWORD_PEPPER,true);
  return {hash:bytesToBase64Url(hash),salt:bytesToBase64Url(salt),iterations:PASSWORD_ITERATIONS,peppered:1};
}
export async function verifyPassword(password,record,env){
  try{
    const expected=base64UrlToBytes(record.password_salt);const candidate=await derivePassword(password,expected,Number(record.password_iterations),env?.PASSWORD_PEPPER,Number(record.password_peppered)===1);const stored=base64UrlToBytes(record.password_hash);
    if(candidate.length!==stored.length)return false;let difference=0;for(let index=0;index<candidate.length;index++)difference|=candidate[index]^stored[index];return difference===0;
  }catch{return false}
}

export function newOneTimeToken(){return randomToken(32)}
export async function hashToken(value){return sha256(value)}

function cookieValue(request,name){
  const cookie=request.headers.get('cookie')||'';for(const part of cookie.split(';')){const separator=part.indexOf('=');if(separator<0)continue;if(part.slice(0,separator).trim()===name)return decodeURIComponent(part.slice(separator+1).trim())}return null;
}
export function clearSessionCookie(){return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
export async function createSession(env,userId,request){
  const token=randomToken();const tokenHash=await sha256(token);const userAgentHash=await sha256(request.headers.get('user-agent')||'unknown');const expiresAt=new Date(Date.now()+SESSION_SECONDS*1000).toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO auth_sessions(id,user_id,token_hash,expires_at,user_agent_hash) VALUES(?,?,?,?,?)`).bind(crypto.randomUUID(),userId,tokenHash,expiresAt,userAgentHash),
    env.DB.prepare(`DELETE FROM auth_sessions WHERE unixepoch(expires_at)<=unixepoch('now') OR revoked_at IS NOT NULL`)
  ]);
  return {cookie:`${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`,expiresAt};
}
export async function revokeSession(env,request){const token=cookieValue(request,SESSION_COOKIE);if(!token)return;await env.DB.prepare(`UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL`).bind(await sha256(token)).run()}
export async function revokeUserSessions(env,userId){await env.DB.prepare(`UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL`).bind(userId).run()}
export async function resolvePasswordSession(env,request){
  const token=cookieValue(request,SESSION_COOKIE);if(!token)return null;const tokenHash=await sha256(token);
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.name,u.account_role AS role,u.staff_title AS staffTitle,u.account_status AS accountStatus,u.auth_provider AS authProvider,u.department_id AS departmentId,u.phase_id AS phaseId,u.university_id AS universityId,u.college_id AS collegeId,u.section_id AS sectionId,u.ban_status AS banStatus,u.ban_until AS banUntil,u.active_ban_request_id AS activeBanRequestId,u.active_ban_id AS activeBanId,s.last_used_at AS lastUsedAt,s.user_agent_hash AS userAgentHash FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND unixepoch(s.expires_at)>unixepoch('now') AND unixepoch(s.last_used_at)>unixepoch('now',?) AND u.account_status='active'`).bind(tokenHash,`-${SESSION_IDLE_SECONDS} seconds`).first();
  if(!row)return null;const currentAgent=await sha256(request.headers.get('user-agent')||'unknown');if(row.userAgentHash&&row.userAgentHash!==currentAgent){await env.DB.prepare(`UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=?`).bind(tokenHash).run();return null}
  const rawLastUsed=String(row.lastUsedAt);const lastUsed=Date.parse(rawLastUsed.includes('T')?rawLastUsed:rawLastUsed.replace(' ','T')+'Z');if(!Number.isFinite(lastUsed)||Date.now()-lastUsed>5*60*1000)await env.DB.prepare(`UPDATE auth_sessions SET last_used_at=CURRENT_TIMESTAMP WHERE token_hash=?`).bind(tokenHash).run();
  return row;
}

export async function authRateKey(value){return sha256(normalizeEmail(value))}
