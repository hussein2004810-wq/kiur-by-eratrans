import {Share2} from 'lucide-react';

export type ShareKind='test'|'lecture';

export function shareUrl(kind:ShareKind,id:string){return `${window.location.origin}/${kind}/${encodeURIComponent(id)}`}

export default function ShareButton({kind,id,title,label='مشاركة',notify,className='shareButton'}:{kind:ShareKind;id:string;title:string;label?:string;notify:(message:string)=>void;className?:string}){
  const share=async(event:React.MouseEvent)=>{event.stopPropagation();const url=shareUrl(kind,id);const text=kind==='test'?`اختبر معلوماتك في: ${title}`:`اختبارات محاضرة: ${title}`;try{if(navigator.share){await navigator.share({title:`KIUR by ERATRANS — ${title}`,text,url});return}await navigator.clipboard.writeText(url);notify('تم نسخ رابط المشاركة')}catch(error){if((error as Error).name!=='AbortError'){try{await navigator.clipboard.writeText(url);notify('تم نسخ رابط المشاركة')}catch{notify('تعذر نسخ الرابط')}}}};
  return <button type="button" className={className} onClick={event=>void share(event)} aria-label={`${label}: ${title}`} title={label}><Share2/>{label}</button>
}
