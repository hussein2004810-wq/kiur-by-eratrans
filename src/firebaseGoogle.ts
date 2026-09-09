import {getApp,getApps,initializeApp,type FirebaseOptions} from 'firebase/app';
import {GoogleAuthProvider,getAuth,inMemoryPersistence,setPersistence,signInWithPopup,signOut,type Auth} from 'firebase/auth';

type PublicFirebaseConfig=Pick<FirebaseOptions,'apiKey'|'authDomain'|'projectId'>;

let authPromise:Promise<Auth>|null=null;

function validConfig(value:unknown):value is PublicFirebaseConfig{
  if(!value||typeof value!=='object')return false;
  const config=value as Record<string,unknown>;
  return typeof config.apiKey==='string'&&config.apiKey.length>=20&&typeof config.projectId==='string'&&/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId)&&config.authDomain===`${config.projectId}.firebaseapp.com`;
}

export function prepareGoogleAuth(){
  if(authPromise)return authPromise;
  authPromise=fetch('/api/auth/google/config',{credentials:'same-origin',headers:{accept:'application/json'}}).then(async response=>{
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!validConfig(data?.config))throw new Error('دخول Google غير متاح حاليًا');
    const name='kiur-google-auth';
    const app=getApps().some(item=>item.name===name)?getApp(name):initializeApp(data.config,name);
    const auth=getAuth(app);
    await setPersistence(auth,inMemoryPersistence);
    return auth;
  }).catch(error=>{authPromise=null;throw error});
  return authPromise;
}

export type GoogleBrowserContext={embedded:boolean;ios:boolean;mobile:boolean};
export function googleBrowserContext(userAgent=window.navigator.userAgent):GoogleBrowserContext{
  const ios=/iPad|iPhone|iPod/i.test(userAgent);
  const mobile=ios||/Android|Mobile/i.test(userAgent);
  const namedEmbedded=/FBAN|FBAV|Instagram|Line\/|Telegram|Twitter|Snapchat/i.test(userAgent);
  const iosWebView=ios&&!/Safari\//i.test(userAgent);
  const androidWebView=/; wv\)|\bwv\b/i.test(userAgent);
  return {embedded:namedEmbedded||iosWebView||androidWebView,ios,mobile};
}

export async function requestGoogleIdToken(){
  const auth=await prepareGoogleAuth();
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    const result=await signInWithPopup(auth,provider);
    return await result.user.getIdToken(true);
  }catch(error){
    const code=String((error as {code?:unknown})?.code||'');
    if(code.includes('popup-closed-by-user')||code.includes('cancelled-popup-request'))throw new Error('أُغلقت نافذة Google قبل اكتمال الدخول. أعد المحاولة ولا تغلقها');
    if(code.includes('popup-blocked'))throw new Error('اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مجددًا');
    if(code.includes('unauthorized-domain'))throw new Error('نطاق KIUR غير مصرح له في Firebase');
    if(code.includes('operation-not-allowed'))throw new Error('تسجيل Google غير مفعّل في Firebase');
    if(code.includes('network-request-failed'))throw new Error('تعذر الاتصال بخدمة Google؛ تحقق من الاتصال أو مانع الإعلانات');
    if(code.includes('web-storage-unsupported'))throw new Error('المتصفح يمنع التخزين المطلوب لتسجيل Google');
    throw new Error('تعذر فتح تسجيل Google؛ حاول مجددًا');
  }finally{
    await signOut(auth).catch(()=>undefined);
  }
}
