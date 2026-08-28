function bytesToBase64Url(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function digest(value){return bytesToBase64Url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value||'')))))}
async function keyedDigest(value,pepper){
  if(typeof pepper!=='string'||pepper.length<32)return digest(`${crypto.randomUUID()}|${value}`);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(String(value||'')))));
}

export async function accountDeviceHash(request,env={}){
  const fingerprint=[request.headers.get('user-agent')||'unknown',request.headers.get('accept-language')||'',request.headers.get('cf-connecting-ip')||'unknown'].join('|');
  return keyedDigest(fingerprint,env.DEVICE_HASH_PEPPER);
}

export async function recordAccountEvent(env,request,{userId=null,accountCode=null,email=null,eventType,outcome='success',details={}}){
  const deviceHash=await accountDeviceHash(request,env);const emailHash=email?await keyedDigest(String(email).trim().toLowerCase(),env.DEVICE_HASH_PEPPER):null;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO account_events(user_id,account_code,email_hash,event_type,outcome,device_hash,details_json) VALUES(?,?,?,?,?,?,?)`).bind(userId,accountCode||userId,emailHash,eventType,outcome,deviceHash,JSON.stringify(details||{})),
    env.DB.prepare(`DELETE FROM account_events WHERE at<datetime('now','-12 months')`)
  ]);
}
