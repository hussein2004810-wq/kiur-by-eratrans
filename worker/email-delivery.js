export function emailDeliveryConfigured(env){
  return Boolean(env?.EMAIL_SENDER?.send||(env?.RESEND_API_KEY&&env?.EMAIL_FROM)||(env?.EMAIL_VERIFICATION_WEBHOOK_URL&&env?.EMAIL_VERIFICATION_SECRET));
}

function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))}
function emailContent(message){
  const verification=message.kind==='verify_email';const subject=verification?'توثيق بريدك في منصة KIUR':'تفعيل حساب الكادر في منصة KIUR';const heading=verification?'أكمل توثيق بريدك':'فعّل حساب الكادر';const action=verification?'توثيق البريد الإلكتروني':'اختيار كلمة المرور وتفعيل الحساب';const expiry=verification?'30 دقيقة':'24 ساعة';
  const text=`مرحبًا ${message.name||''}\n\n${action}: ${message.actionUrl}\n\nالرابط صالح لمدة ${expiry}. إذا لم تطلب ذلك فتجاهل الرسالة.`;
  const html=`<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#f3f7f6;font-family:Arial,sans-serif;color:#153b36"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #dce8e5;border-radius:16px;padding:32px"><p style="font-weight:700;color:#147766">KIUR <span style="font-size:12px">BY ERATRANS</span></p><h1 style="font-size:24px">${heading}</h1><p>مرحبًا ${escapeHtml(message.name)}</p><p>اضغط الزر لإكمال العملية بأمان. الرابط صالح لمدة ${expiry} ويعمل مرة واحدة فقط.</p><p style="margin:28px 0"><a href="${escapeHtml(message.actionUrl)}" style="background:#147766;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;display:inline-block">${action}</a></p><p style="font-size:13px;color:#60736f">إذا لم تطلب ذلك فتجاهل الرسالة ولا تشارك الرابط مع أي شخص.</p></div></body></html>`;
  return {subject,text,html};
}

export async function deliverSecurityEmail(env,message){
  if(env?.EMAIL_SENDER?.send){await env.EMAIL_SENDER.send(message);return}
  if(env?.RESEND_API_KEY&&env?.EMAIL_FROM){
    const content=emailContent(message);const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${env.RESEND_API_KEY}`},body:JSON.stringify({from:String(env.EMAIL_FROM),to:[message.to],subject:content.subject,text:content.text,html:content.html})});
    if(!response.ok)throw new Error('EMAIL_DELIVERY_FAILED');return;
  }
  if(!emailDeliveryConfigured(env))throw new Error('EMAIL_DELIVERY_UNAVAILABLE');
  const response=await fetch(String(env.EMAIL_VERIFICATION_WEBHOOK_URL),{
    method:'POST',
    headers:{'content-type':'application/json','authorization':`Bearer ${env.EMAIL_VERIFICATION_SECRET}`},
    body:JSON.stringify(message)
  });
  if(!response.ok)throw new Error('EMAIL_DELIVERY_FAILED');
}

export function absoluteActionUrl(request,path,token){
  const origin=new URL(request.url).origin;
  return `${origin}${path}?token=${encodeURIComponent(token)}`;
}
