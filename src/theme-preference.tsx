import {Moon,Sun} from 'lucide-react';
import {useEffect,useState} from 'react';

export type KiurTheme='light'|'dark';
const STORAGE_KEY='kiur-theme';
const CHANGE_EVENT='kiur-theme-change';
let lightStylesLoaded=false;
let lightStylesRequest:Promise<unknown>|null=null;
function ensureLightStyles(){if(lightStylesLoaded)return Promise.resolve();if(!lightStylesRequest)lightStylesRequest=import('./light-theme.css').then(()=>{lightStylesLoaded=true});return lightStylesRequest}

function storedTheme():KiurTheme|null{
  try{const value=localStorage.getItem(STORAGE_KEY);return value==='light'||value==='dark'?value:null}catch{return null}
}

function systemTheme():KiurTheme{return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}

export function currentTheme():KiurTheme{
  const value=document.documentElement.dataset.kiurTheme;
  return value==='light'||value==='dark'?value:storedTheme()||systemTheme();
}

export function applyTheme(theme:KiurTheme,{persist=false}:{persist?:boolean}={}){
  if(theme==='light'&&!lightStylesLoaded){void ensureLightStyles().then(()=>applyTheme(theme,{persist}));return}
  const animate=persist&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(animate){document.documentElement.classList.add('kiur-theme-transition');window.setTimeout(()=>document.documentElement.classList.remove('kiur-theme-transition'),220)}
  document.documentElement.dataset.kiurTheme=theme;
  document.documentElement.style.colorScheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#080b1a':'#f8fafc');
  if(persist){try{localStorage.setItem(STORAGE_KEY,theme)}catch{}}
  window.dispatchEvent(new CustomEvent<KiurTheme>(CHANGE_EVENT,{detail:theme}));
}

if(currentTheme()==='light')void ensureLightStyles();

export function useKiurTheme(){
  const [theme,setTheme]=useState<KiurTheme>(()=>currentTheme());
  useEffect(()=>{
    const onChange=(event:Event)=>setTheme((event as CustomEvent<KiurTheme>).detail||currentTheme());
    const media=matchMedia('(prefers-color-scheme: dark)');
    const onSystem=()=>{if(!storedTheme())applyTheme(systemTheme())};
    window.addEventListener(CHANGE_EVENT,onChange);media.addEventListener?.('change',onSystem);
    return()=>{window.removeEventListener(CHANGE_EVENT,onChange);media.removeEventListener?.('change',onSystem)};
  },[]);
  const choose=(next:KiurTheme)=>{applyTheme(next,{persist:true});setTheme(next);void syncThemePreference(next)};
  return {theme,choose,toggle:()=>choose(theme==='dark'?'light':'dark')};
}

export async function hydrateAccountTheme(){
  try{
    const response=await fetch('/api/me/ui-preferences',{credentials:'include'});
    if(!response.ok)return;
    const data=await response.json() as {themePreference?:KiurTheme|null};
    const local=storedTheme();
    if(local){if(data.themePreference!==local)void syncThemePreference(local);return}
    if(data.themePreference==='light'||data.themePreference==='dark')applyTheme(data.themePreference,{persist:true});
  }catch{/* يبقى اختيار الجهاز فعالًا عند تعذر المزامنة. */}
}

async function syncThemePreference(theme:KiurTheme){
  try{await fetch('/api/me/ui-preferences',{method:'PATCH',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({themePreference:theme})})}catch{/* التفضيل المحلي كافٍ للعمل دون اتصال. */}
}

export function ThemeToggle({compact=false}:{compact?:boolean}){
  const {theme,toggle}=useKiurTheme();const dark=theme==='dark';
  const action=dark?'تفعيل الوضع الصباحي':'تفعيل الوضع الليلي';
  return <button type="button" className={'themeToggle '+(compact?'compact':'')} role="switch" aria-checked={dark} aria-label={action} title={action} onClick={toggle}>{dark?<Sun aria-hidden="true"/>:<Moon aria-hidden="true"/>}<span>{dark?'صباحي':'ليلي'}</span></button>;
}
