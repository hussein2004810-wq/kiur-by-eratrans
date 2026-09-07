import {useEffect,useState} from 'react';
import {fromExamIso,toExamIso,type ExamDateParts} from './exam-time';
import './exam-time.css';

/** All exam schedules are entered in Baghdad time, independent of device timezone. */
export default function ExamDateTime({label,value,onChange}:{label:string;value?:string;onChange:(iso:string)=>void}){
  const [parts,setParts]=useState<ExamDateParts>(()=>fromExamIso(value||''));
  useEffect(()=>{if(value)setParts(fromExamIso(value))},[value]);
  const update=(key:keyof ExamDateParts,value:string)=>{const next={...parts,[key]:value};setParts(next);onChange(toExamIso(next))};
  const number=(key:keyof ExamDateParts,title:string,min:number,max:number)=><label><span>{title}</span><input aria-label={`${label} — ${title}`} type="number" inputMode="numeric" required min={min} max={max} value={parts[key]} onChange={event=>update(key,event.target.value)}/></label>;
  const dayLimit=parts.year&&parts.month?new Date(Date.UTC(Number(parts.year),Number(parts.month),0)).getUTCDate():31;
  return <fieldset className="examDateTime"><legend>{label}</legend><small>بتوقيت بغداد (UTC+3)</small><div className="examDateFields">
    {number('year','السنة',2000,2100)}{number('month','الشهر',1,12)}{number('day','اليوم',1,dayLimit)}{number('hour','الساعة',1,12)}{number('minute','الدقيقة',0,59)}
    <label><span>الفترة</span><select aria-label={`${label} — الفترة`} required value={parts.period} onChange={event=>update('period',event.target.value)}><option value="AM">AM — صباحًا</option><option value="PM">PM — مساءً</option></select></label>
  </div></fieldset>;
}
