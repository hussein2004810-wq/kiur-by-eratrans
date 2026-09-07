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

export async function requestGoogleIdToken(){
  const auth=await prepareGoogleAuth();
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    const result=await signInWithPopup(auth,provider);
    return await result.user.getIdToken(true);
  }catch(error){
    const code=String((error as {code?:unknown})?.code||'');
    if(code.includes('popup-closed-by-user')||code.includes('cancelled-popup-request'))throw new Error('تم إلغاء دخول Google');
    if(code.includes('popup-blocked'))throw new Error('اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مجددًا');
    if(code.includes('unauthorized-domain'))throw new Error('نطاق KIUR غير مصرح له في Firebase');
    throw new Error('تعذر فتح تسجيل Google؛ حاول مجددًا');
  }finally{
    await signOut(auth).catch(()=>undefined);
  }
}
