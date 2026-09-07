export type ExamDateParts={year:string;month:string;day:string;hour:string;minute:string;period:string};
const offset=3*60*60*1000;
export function fromExamIso(iso:string):ExamDateParts{
  const date=new Date(new Date(iso).getTime()+offset);
  if(!iso||Number.isNaN(date.getTime()))return {year:'',month:'',day:'',hour:'',minute:'',period:'AM'};
  const hour=date.getUTCHours();
  return {year:String(date.getUTCFullYear()),month:String(date.getUTCMonth()+1),day:String(date.getUTCDate()),hour:String(hour%12||12),minute:String(date.getUTCMinutes()).padStart(2,'0'),period:hour<12?'AM':'PM'};
}
export function toExamIso(parts:ExamDateParts):string{
  if(Object.values(parts).some(value=>!value)||!['AM','PM'].includes(parts.period))return '';
  const {year,month,day,hour,minute}=Object.fromEntries(Object.entries(parts).map(([key,value])=>[key,Number(value)]));
  if(![year,month,day,hour,minute].every(Number.isInteger)||year<2000||year>2100||month<1||month>12||day<1||day>31||hour<1||hour>12||minute<0||minute>59)return '';
  const date=new Date(Date.UTC(year,month-1,day,hour%12+(parts.period==='PM'?12:0),minute));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return '';
  return new Date(date.getTime()-offset).toISOString();
}
