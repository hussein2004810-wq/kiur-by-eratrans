const FIREBASE_ENDPOINT='https://identitytoolkit.googleapis.com/v1/accounts';

export class FirebaseAuthError extends Error{
  constructor(code){super(code);this.name='FirebaseAuthError';this.code=code}
}

export function firebaseAuthConfigured(env){
  return Boolean(env?.FIREBASE_AUTH||env?.FIREBASE_WEB_API_KEY);
}

function normalizedFirebaseCode(value){
  return String(value||'FIREBASE_REQUEST_FAILED').split(':')[0].trim().replace(/\s+/g,'_');
}

async function firebaseRequest(env,method,payload){
  const injected=env?.FIREBASE_AUTH?.[method];
  if(typeof injected==='function')return injected(payload);
  const apiKey=String(env?.FIREBASE_WEB_API_KEY||'');
  if(!apiKey)throw new FirebaseAuthError('FIREBASE_NOT_CONFIGURED');
  let response;
  try{
    response=await fetch(`${FIREBASE_ENDPOINT}:${method}?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'content-type':'application/json','accept':'application/json',...(method==='sendOobCode'?{'x-firebase-locale':'ar'}:{})},body:JSON.stringify(payload)});
  }catch{throw new FirebaseAuthError('FIREBASE_UNAVAILABLE')}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new FirebaseAuthError(normalizedFirebaseCode(data?.error?.message));
  return data;
}

export async function firebaseSignUp(env,email,password){
  const result=await firebaseRequest(env,'signUp',{email,password,returnSecureToken:true});
  return {uid:String(result.localId||''),idToken:String(result.idToken||''),email:String(result.email||email)};
}

export async function firebaseSignIn(env,email,password){
  const result=await firebaseRequest(env,'signInWithPassword',{email,password,returnSecureToken:true});
  return {uid:String(result.localId||''),idToken:String(result.idToken||''),email:String(result.email||email)};
}

export async function firebaseLookup(env,idToken){
  const result=await firebaseRequest(env,'lookup',{idToken});const user=result?.users?.[0];
  if(!user)throw new FirebaseAuthError('USER_NOT_FOUND');
  return {uid:String(user.localId||''),email:String(user.email||''),emailVerified:Boolean(user.emailVerified),disabled:Boolean(user.disabled)};
}

export async function firebaseSendVerification(env,idToken){
  await firebaseRequest(env,'sendOobCode',{requestType:'VERIFY_EMAIL',idToken});
}

export async function firebaseSendPasswordReset(env,email){
  await firebaseRequest(env,'sendOobCode',{requestType:'PASSWORD_RESET',email});
}

export async function firebaseDeleteAccount(env,idToken){
  if(!idToken)return;
  try{await firebaseRequest(env,'delete',{idToken})}catch{}
}

export function firebaseTemporaryPassword(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);let value='';for(const byte of bytes)value+=String.fromCharCode(byte);
  return `${btoa(value).replace(/\+/g,'A').replace(/\//g,'b').replace(/=+$/,'')}Aa9!`;
}

export function isFirebaseError(error,code){
  return error instanceof FirebaseAuthError&&(!code||error.code===code);
}
