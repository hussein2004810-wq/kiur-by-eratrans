export const MAX_JSON_BODY_BYTES=1024*1024;

const SECURITY_HEADERS={
  'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'cross-origin-opener-policy':'same-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'referrer-policy':'strict-origin-when-cross-origin',
  'strict-transport-security':'max-age=31536000',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY'
};

export function secureHeaders(initial={}){
  const headers=new Headers(initial);
  for(const [name,value] of Object.entries(SECURITY_HEADERS))headers.set(name,value);
  return headers;
}

export async function readJsonBody(request,maxBytes=MAX_JSON_BODY_BYTES){
  const contentType=(request.headers.get('content-type')||'').split(';',1)[0].trim().toLowerCase();
  if(contentType!=='application/json')return {error:{code:'UNSUPPORTED_MEDIA_TYPE',message:'يجب إرسال البيانات بصيغة JSON',status:415}};
  const declaredLength=Number(request.headers.get('content-length')||0);
  if(Number.isFinite(declaredLength)&&declaredLength>maxBytes)return {error:{code:'PAYLOAD_TOO_LARGE',message:'حجم الطلب يتجاوز الحد المسموح',status:413}};
  try{
    const buffer=await request.arrayBuffer();
    if(buffer.byteLength>maxBytes)return {error:{code:'PAYLOAD_TOO_LARGE',message:'حجم الطلب يتجاوز الحد المسموح',status:413}};
    return {value:JSON.parse(new TextDecoder().decode(buffer))};
  }catch{
    return {error:{code:'INVALID_JSON',message:'بيانات JSON غير صالحة',status:400}};
  }
}

export async function enforceRateLimit(env,key,limit,windowSeconds=60){
  const now=Math.floor(Date.now()/1000);const windowStart=Math.floor(now/windowSeconds)*windowSeconds;
  const row=await env.DB.prepare(`INSERT INTO api_rate_limits(bucket_key,window_start,count) VALUES(?,?,1) ON CONFLICT(bucket_key,window_start) DO UPDATE SET count=count+1 RETURNING count`).bind(key,windowStart).first();
  if(Math.random()<0.01)await env.DB.prepare(`DELETE FROM api_rate_limits WHERE window_start<?`).bind(now-3600).run();
  return {allowed:Number(row?.count||0)<=limit,retryAfter:Math.max(1,windowStart+windowSeconds-now)};
}
