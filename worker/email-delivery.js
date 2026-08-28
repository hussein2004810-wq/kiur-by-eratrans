export function emailDeliveryConfigured(env){
  return Boolean(env?.EMAIL_SENDER?.send||(env?.EMAIL_VERIFICATION_WEBHOOK_URL&&env?.EMAIL_VERIFICATION_SECRET));
}

export async function deliverSecurityEmail(env,message){
  if(env?.EMAIL_SENDER?.send){await env.EMAIL_SENDER.send(message);return}
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
