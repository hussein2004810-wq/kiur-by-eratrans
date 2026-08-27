import {loadGrants} from './access-control.js';
import {secureHeaders} from './security.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}
function fail(code,message,status=400){return json({error:{code,message}},status)}
function canUse(user,grants=[]){return user?.role==='owner'||grants.some(grant=>grant.permissions.includes('use_media'))}
function canUpload(user,grants=[]){return ['owner','admin'].includes(user?.role)&&canUse(user,grants)}
function base64Url(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function safeFileName(value){return String(value||'image').replace(/[\r\n"\\/]/g,'_').slice(0,180)}

export async function handleMediaApi(request,env,url,user){
  const asset=url.pathname.match(/^\/api\/media\/([^/]+)$/);
  if(asset&&request.method==='GET'){
    if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);if(!env.FILES)return fail('STORAGE_UNAVAILABLE','مخزن الصور غير مهيأ',503);
    const row=await env.DB.prepare(`SELECT object_key AS objectKey,original_name AS originalName,content_type AS contentType FROM media_assets WHERE id=? AND deleted_at IS NULL`).bind(asset[1]).first();if(!row)return fail('NOT_FOUND','الصورة غير موجودة',404);const object=await env.FILES.get(row.objectKey);if(!object)return fail('NOT_FOUND','ملف الصورة غير موجود',404);
    return new Response(object.body,{headers:secureHeaders({'content-type':row.contentType,'content-disposition':`inline; filename="${safeFileName(row.originalName)}"`,'cache-control':'private, max-age=3600','x-content-type-options':'nosniff'})});
  }
  if(!url.pathname.startsWith('/api/admin/media'))return null;if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);const grants=user.role==='owner'?[]:await loadGrants(env,user.id);
  if(url.pathname==='/api/admin/media'&&request.method==='GET'){
    if(!canUse(user,grants))return fail('FORBIDDEN','لا تملك صلاحية استخدام مكتبة الصور',403);const rows=await env.DB.prepare(`SELECT id,original_name AS originalName,content_type AS contentType,byte_size AS byteSize,alt_text AS altText,uploaded_by AS uploadedBy,created_at AS createdAt FROM media_assets WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`).all();return json({data:rows.results});
  }
  if(url.pathname==='/api/admin/media'&&request.method==='POST'){
    if(!canUpload(user,grants))return fail('FORBIDDEN','رفع الصور متاح للمشرفين المخولين فقط',403);if(!env.FILES)return fail('STORAGE_UNAVAILABLE','مخزن الملفات غير مهيأ',503);
    const contentType=String(request.headers.get('content-type')||'').split(';')[0].toLowerCase();if(!['image/jpeg','image/png','image/webp'].includes(contentType))return fail('VALIDATION','يسمح بصور JPG وPNG وWebP فقط');const declared=Number(request.headers.get('content-length')||0);if(declared>5242880)return fail('PAYLOAD_TOO_LARGE','حجم الصورة يجب ألا يتجاوز 5MB',413);
    const bytes=new Uint8Array(await request.arrayBuffer());if(!bytes.length||bytes.length>5242880)return fail('PAYLOAD_TOO_LARGE','حجم الصورة غير صالح أو يتجاوز 5MB',413);const digest=base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));const duplicate=await env.DB.prepare(`SELECT id FROM media_assets WHERE sha256=? AND deleted_at IS NULL`).bind(digest).first();if(duplicate)return json({id:duplicate.id,duplicate:true},200);
    const id=crypto.randomUUID();const objectKey=`medical-images/${new Date().toISOString().slice(0,10)}/${id}`;const originalName=safeFileName(decodeURIComponent(request.headers.get('x-file-name')||'clinical-image'));const altText=decodeURIComponent(request.headers.get('x-alt-text')||'').trim().slice(0,500)||null;
    await env.FILES.put(objectKey,bytes,{httpMetadata:{contentType},customMetadata:{uploadedBy:user.id}});try{await env.DB.batch([env.DB.prepare(`INSERT INTO media_assets(id,object_key,original_name,content_type,byte_size,sha256,alt_text,uploaded_by) VALUES(?,?,?,?,?,?,?,?)`).bind(id,objectKey,originalName,contentType,bytes.length,digest,altText,user.id),env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id,details_json) VALUES('media',?,'upload',?,?)`).bind(id,user.id,JSON.stringify({contentType,byteSize:bytes.length}))])}catch(error){await env.FILES.delete(objectKey);throw error}return json({id},201);
  }
  const adminAsset=url.pathname.match(/^\/api\/admin\/media\/([^/]+)$/);if(adminAsset&&request.method==='DELETE'){
    if(!canUpload(user,grants))return fail('FORBIDDEN','حذف الصور متاح للمشرفين المخولين فقط',403);const row=await env.DB.prepare(`SELECT object_key AS objectKey FROM media_assets WHERE id=? AND deleted_at IS NULL`).bind(adminAsset[1]).first();if(!row)return fail('NOT_FOUND','الصورة غير موجودة',404);await env.DB.batch([env.DB.prepare(`UPDATE media_assets SET deleted_at=CURRENT_TIMESTAMP WHERE id=?`).bind(adminAsset[1]),env.DB.prepare(`INSERT INTO audit_logs(entity,entity_id,action,by_user_id) VALUES('media',?,'delete',?)`).bind(adminAsset[1],user.id)]);await env.FILES?.delete(row.objectKey);return new Response(null,{status:204,headers:secureHeaders()});
  }
  return null;
}
