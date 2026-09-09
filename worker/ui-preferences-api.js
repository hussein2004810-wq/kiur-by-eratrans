import {readJsonBody,secureHeaders} from './security.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})});
const fail=(code,message,status=400)=>json({error:{code,message}},status);

export async function handleUiPreferencesApi(request,env,url,user){
  if(url.pathname!=='/api/me/ui-preferences')return null;
  if(!user)return fail('UNAUTHENTICATED','سجّل الدخول للمتابعة',401);
  if(request.method==='GET'){
    const row=await env.DB.prepare(`SELECT theme_preference AS themePreference FROM user_ui_preferences WHERE user_id=?`).bind(user.id).first();
    return json({themePreference:row?.themePreference||null});
  }
  if(request.method==='PATCH'){
    const parsed=await readJsonBody(request);if(parsed.error)return fail(parsed.error.code,parsed.error.message,parsed.error.status);
    const theme=parsed.value?.themePreference;
    if(!['light','dark'].includes(theme))return fail('VALIDATION','اختيار المظهر غير صالح');
    await env.DB.prepare(`INSERT INTO user_ui_preferences(user_id,theme_preference) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET theme_preference=excluded.theme_preference,updated_at=CURRENT_TIMESTAMP`).bind(user.id,theme).run();
    return json({saved:true,themePreference:theme});
  }
  return fail('METHOD_NOT_ALLOWED','الطريقة غير مسموحة',405);
}
