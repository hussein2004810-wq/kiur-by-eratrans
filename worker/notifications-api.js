import {secureHeaders} from './security.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:secureHeaders({'content-type':'application/json; charset=utf-8','cache-control':'no-store'})})}

export async function handleNotificationsApi(request,env,url,user){
  if(!user||!url.pathname.startsWith('/api/notifications'))return null;
  if(url.pathname==='/api/notifications'&&request.method==='GET'){
    const rows=await env.DB.prepare(`SELECT id,notification_type AS type,title,message,link,read_at AS readAt,created_at AS createdAt FROM user_notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 40`).bind(user.id).all();
    return json({data:rows.results,unread:rows.results.filter(item=>!item.readAt).length});
  }
  if(url.pathname==='/api/notifications/read-all'&&request.method==='POST'){
    await env.DB.prepare(`UPDATE user_notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL`).bind(user.id).run();
    return json({updated:true});
  }
  return null;
}
