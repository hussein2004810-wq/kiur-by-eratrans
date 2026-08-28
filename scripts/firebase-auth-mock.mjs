import {FirebaseAuthError} from '../worker/firebase-auth.js';

export function createFirebaseAuthMock(){
  const users=new Map();const tokens=new Map();const messages=[];
  const normalize=value=>String(value||'').trim().toLowerCase();
  const issue=user=>{const idToken=`firebase-test:${user.uid}:${crypto.randomUUID()}`;tokens.set(idToken,user);return {localId:user.uid,idToken,email:user.email}};
  const api={
    async signUp({email,password}){const key=normalize(email);if(users.has(key))throw new FirebaseAuthError('EMAIL_EXISTS');const user={uid:`fb-${crypto.randomUUID()}`,email:key,password,emailVerified:false,disabled:false};users.set(key,user);return issue(user)},
    async signInWithPassword({email,password}){const user=users.get(normalize(email));if(!user||user.password!==password)throw new FirebaseAuthError('INVALID_LOGIN_CREDENTIALS');if(user.disabled)throw new FirebaseAuthError('USER_DISABLED');return issue(user)},
    async lookup({idToken}){const user=tokens.get(idToken);if(!user)throw new FirebaseAuthError('INVALID_ID_TOKEN');return {users:[{localId:user.uid,email:user.email,emailVerified:user.emailVerified,disabled:user.disabled}]}},
    async sendOobCode(payload){if(payload.requestType==='VERIFY_EMAIL'){const user=tokens.get(payload.idToken);if(!user)throw new FirebaseAuthError('INVALID_ID_TOKEN');messages.push({kind:'verify_email',email:user.email});return {email:user.email}}if(payload.requestType==='PASSWORD_RESET'){const user=users.get(normalize(payload.email));if(!user)throw new FirebaseAuthError('EMAIL_NOT_FOUND');messages.push({kind:'password_reset',email:user.email});return {email:user.email}}throw new FirebaseAuthError('INVALID_OOB_CODE_REQUEST')},
    async delete({idToken}){const user=tokens.get(idToken);if(user)users.delete(user.email);return {}}
  };
  return {
    api,messages,
    verify(email){const user=users.get(normalize(email));if(!user)throw new Error('Firebase mock user not found');user.emailVerified=true},
    resetPassword(email,password){const user=users.get(normalize(email));if(!user)throw new Error('Firebase mock user not found');user.password=password},
    user(email){return users.get(normalize(email))||null}
  };
}
