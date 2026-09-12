const DEFAULT_PUBLIC_ORIGIN='https://kiur-iraq.pages.dev';
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))}

export async function serveSharePage(request,env,url,indexResponse){
  if(!['GET','HEAD'].includes(request.method))return null;
  const match=url.pathname.match(/^\/(test|lecture)\/([^/]+)$/);if(!match)return null;
  let id;try{id=decodeURIComponent(match[2])}catch{return indexResponse}
  let title='KIUR by ERATRANS — منصة الاختبارات الطبية';let description='منصة اختبارات طبية تفاعلية تابعة لقناة ERATRANS، مع حفظ النتائج ومراجعة الإجابات.';
  if(match[1]==='test'){
    const test=await env.DB.prepare(`SELECT t.title,COALESCE(s.name,t.subject) AS subjectName,COALESCE(l.name,t.lecture) AS lectureName,t.duration_minutes AS durationMinutes,count(q.id) AS questionCount FROM tests t LEFT JOIN subjects s ON s.id=t.subject_id LEFT JOIN lectures l ON l.id=t.lecture_id LEFT JOIN questions q ON q.test_id=t.id WHERE t.id=? AND t.status='published' GROUP BY t.id`).bind(id).first();
    if(test){title=`${test.title} | KIUR by ERATRANS`;description=`اختبار ${test.subjectName} — ${test.lectureName}. ${test.questionCount} أسئلة خلال ${test.durationMinutes} دقيقة.`}
  }else{
    const lecture=await env.DB.prepare(`SELECT l.name AS lectureName,s.name AS subjectName,p.name AS phaseName,COALESCE(d.display_name,d.name) AS departmentName,count(t.id) AS testCount FROM lectures l JOIN subjects s ON s.id=l.subject_id JOIN phases p ON p.id=s.phase_id JOIN departments d ON d.id=p.department_id LEFT JOIN tests t ON t.lecture_id=l.id AND t.status='published' WHERE l.id=? GROUP BY l.id`).bind(id).first();
    if(lecture){title=`${lecture.lectureName} | KIUR by ERATRANS`;description=`${lecture.subjectName} — ${lecture.departmentName}، ${lecture.phaseName}. ${lecture.testCount} اختبارات متاحة.`}
  }
  let publicOrigin=DEFAULT_PUBLIC_ORIGIN;try{const configured=new URL(env.PUBLIC_ORIGIN||DEFAULT_PUBLIC_ORIGIN);if(configured.protocol==='https:')publicOrigin=configured.origin}catch{}const canonical=`${publicOrigin}/${match[1]}/${encodeURIComponent(id)}`;const imageUrl=`${publicOrigin}/og.png`;const safeTitle=escapeHtml(title);const safeDescription=escapeHtml(description);const safeCanonical=escapeHtml(canonical);const safeImage=escapeHtml(imageUrl);
  let html='';let baseHeaders={};
  if(indexResponse&&typeof indexResponse.text==='function'){
    html=await indexResponse.text();baseHeaders=indexResponse.headers;
  }else{
    html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${safeTitle}</title></head><body><div id="root"></div></body></html>`;
  }
  html=html.replace(/<title>[^<]*<\/title>/i,`<title>${safeTitle}</title>`).replace(/<meta name="description"[^>]*>/i,`<meta name="description" content="${safeDescription}"/>`).replace(/<meta property="og:[^>]*>/gi,'').replace(/<meta name="twitter:[^>]*>/gi,'').replace(/<link rel="canonical"[^>]*>/gi,'');
  const social=`<link rel="canonical" href="${safeCanonical}"/><meta property="og:type" content="website"/><meta property="og:title" content="${safeTitle}"/><meta property="og:description" content="${safeDescription}"/><meta property="og:url" content="${safeCanonical}"/><meta property="og:image" content="${safeImage}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${safeTitle}"/><meta name="twitter:description" content="${safeDescription}"/><meta name="twitter:image" content="${safeImage}"/>`;
  html=html.includes('</head>')?html.replace('</head>',`${social}</head>`):`<head>${social}</head>${html}`;const headers=new Headers(baseHeaders);headers.set('content-type','text/html; charset=utf-8');headers.set('cache-control','public, max-age=300');headers.delete('content-length');return new Response(request.method==='HEAD'?null:html,{status:200,headers});
}
