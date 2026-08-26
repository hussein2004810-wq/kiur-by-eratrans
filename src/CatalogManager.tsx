import {useEffect,useMemo,useState} from 'react';
import {BookOpen,Building2,GraduationCap,Plus,Save,Trash2} from 'lucide-react';
import './catalog.css';

type Department={id:string;name:string;sortOrder:number};
type Phase={id:string;departmentId:string;name:string;sortOrder:number};
type Subject={id:string;phaseId:string;name:string;sortOrder:number};
type Lecture={id:string;subjectId:string;name:string;sortOrder:number};
export type Catalog={departments:Department[];phases:Phase[];subjects:Subject[];lectures:Lecture[]};

async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  const response=await fetch(path,{...options,credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})}});
  if(response.status===204)return undefined as T;const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.error?.message||'تعذر إكمال العملية');return data;
}

function EditableRow({name,active,badge,onSelect,onSave,onDelete}:{name:string;active?:boolean;badge?:string;onSelect?:()=>void;onSave:(name:string)=>Promise<void>;onDelete:()=>Promise<void>}){
  const [draft,setDraft]=useState(name);const [busy,setBusy]=useState(false);useEffect(()=>setDraft(name),[name]);
  const save=async()=>{if(draft.trim()===name||draft.trim().length<2)return;setBusy(true);try{await onSave(draft.trim())}finally{setBusy(false)}};
  const remove=async()=>{if(!confirm(`هل تريد حذف «${name}»؟`))return;setBusy(true);try{await onDelete()}finally{setBusy(false)}};
  return <div className={'catalogRow '+(active?'active':'')} onClick={onSelect}><input aria-label={'اسم '+name} value={draft} onClick={event=>event.stopPropagation()} onChange={event=>setDraft(event.target.value)}/>{badge&&<span className="countBadge">{badge}</span>}<button type="button" className="saveMini" title="حفظ الاسم" disabled={busy||draft.trim()===name||draft.trim().length<2} onClick={event=>{event.stopPropagation();void save()}}><Save/></button><button type="button" className="deleteMini" title="حذف" disabled={busy} onClick={event=>{event.stopPropagation();void remove()}}><Trash2/></button></div>
}

function AddRow({placeholder,onAdd}:{placeholder:string;onAdd:(name:string)=>Promise<void>}){
  const [name,setName]=useState('');const [busy,setBusy]=useState(false);const add=async()=>{if(name.trim().length<2)return;setBusy(true);try{await onAdd(name.trim());setName('')}finally{setBusy(false)}};
  return <div className="catalogAdd"><input value={name} onChange={event=>setName(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void add()}}} placeholder={placeholder}/><button type="button" disabled={busy||name.trim().length<2} onClick={()=>void add()}><Plus/>{busy?'...':'إضافة'}</button></div>
}

export default function CatalogManager({catalog,reload,notify}:{catalog:Catalog;reload:()=>Promise<Catalog>;notify:(message:string)=>void}){
  const [departmentId,setDepartmentId]=useState(catalog.departments[0]?.id||'');const [phaseId,setPhaseId]=useState('');const [subjectId,setSubjectId]=useState('');
  const phases=useMemo(()=>catalog.phases.filter(item=>item.departmentId===departmentId),[catalog,departmentId]);
  const subjects=useMemo(()=>catalog.subjects.filter(item=>item.phaseId===phaseId),[catalog,phaseId]);
  const lectures=useMemo(()=>catalog.lectures.filter(item=>item.subjectId===subjectId),[catalog,subjectId]);
  useEffect(()=>{if(!catalog.departments.some(item=>item.id===departmentId))setDepartmentId(catalog.departments[0]?.id||'')},[catalog]);
  useEffect(()=>{if(!phases.some(item=>item.id===phaseId))setPhaseId(phases[0]?.id||'')},[departmentId,phases]);
  useEffect(()=>{if(!subjects.some(item=>item.id===subjectId))setSubjectId(subjects[0]?.id||'')},[phaseId,subjects]);
  const mutate=async(path:string,method:string,body:unknown,message:string)=>{try{const result=await request<{id?:string}>(path,{method,body:body===undefined?undefined:JSON.stringify(body)});await reload();notify(message);return result}catch(error){notify((error as Error).message);return null}};
  return <section className="catalogManager"><div className="catalogSummary"><article><span><Building2/></span><b>{catalog.departments.length}</b><small>أقسام</small></article><article><span><GraduationCap/></span><b>{catalog.phases.length}</b><small>مراحل</small></article><article><span><BookOpen/></span><b>{catalog.subjects.length}</b><small>مواد</small></article><article><span><BookOpen/></span><b>{catalog.lectures.length}</b><small>محاضرات</small></article></div><div className="catalogColumns"><section className="catalogBox"><header><div><b>الأقسام</b><small>اختر قسمًا لإدارة مراحله</small></div></header><AddRow placeholder="اسم قسم جديد" onAdd={async name=>{const result=await mutate('/api/admin/departments','POST',{name},'تمت إضافة القسم');if(result?.id)setDepartmentId(result.id)}}/>
  <div className="catalogList">{catalog.departments.map(item=><EditableRow key={item.id} name={item.name} active={item.id===departmentId} badge={`${catalog.phases.filter(phase=>phase.departmentId===item.id).length} مراحل`} onSelect={()=>setDepartmentId(item.id)} onSave={name=>mutate(`/api/admin/departments/${item.id}`,'PATCH',{name},'تم تعديل اسم القسم').then(()=>undefined)} onDelete={()=>mutate(`/api/admin/departments/${item.id}`,'DELETE',undefined,'تم حذف القسم').then(()=>undefined)}/>)}</div><div className="catalogDivider"><b>مراحل القسم المحدد</b></div>{departmentId&&<AddRow placeholder="اسم مرحلة جديدة" onAdd={async name=>{const result=await mutate('/api/admin/phases','POST',{name,departmentId},'تمت إضافة المرحلة');if(result?.id)setPhaseId(result.id)}}/>}<div className="catalogList compact">{phases.map(item=><EditableRow key={item.id} name={item.name} active={item.id===phaseId} badge={`${catalog.subjects.filter(subject=>subject.phaseId===item.id).length} مواد`} onSelect={()=>setPhaseId(item.id)} onSave={name=>mutate(`/api/admin/phases/${item.id}`,'PATCH',{name},'تم تعديل المرحلة').then(()=>undefined)} onDelete={()=>mutate(`/api/admin/phases/${item.id}`,'DELETE',undefined,'تم حذف المرحلة').then(()=>undefined)}/>)}</div></section>
  <section className="catalogBox"><header><div><b>مواد المرحلة</b><small>{phases.find(item=>item.id===phaseId)?.name||'اختر مرحلة أولًا'}</small></div></header>{phaseId&&<AddRow placeholder="اسم مادة جديدة" onAdd={async name=>{const result=await mutate('/api/admin/subjects','POST',{name,phaseId},'تمت إضافة المادة');if(result?.id)setSubjectId(result.id)}}/>}<div className="catalogList">{subjects.map(item=><EditableRow key={item.id} name={item.name} active={item.id===subjectId} badge={`${catalog.lectures.filter(lecture=>lecture.subjectId===item.id).length} محاضرات`} onSelect={()=>setSubjectId(item.id)} onSave={name=>mutate(`/api/admin/subjects/${item.id}`,'PATCH',{name},'تم تعديل اسم المادة').then(()=>undefined)} onDelete={()=>mutate(`/api/admin/subjects/${item.id}`,'DELETE',undefined,'تم حذف المادة').then(()=>undefined)}/>)}</div>{!subjects.length&&<div className="catalogEmpty">لا توجد مواد في هذه المرحلة بعد.</div>}</section>
  <section className="catalogBox"><header><div><b>محاضرات المادة</b><small>{subjects.find(item=>item.id===subjectId)?.name||'اختر مادة أولًا'}</small></div><span className="largeCount">{lectures.length}</span></header>{subjectId&&<AddRow placeholder="اسم المحاضرة الجديدة" onAdd={name=>mutate('/api/admin/lectures','POST',{name,subjectId},'تمت إضافة المحاضرة').then(()=>undefined)}/>}<div className="catalogList">{lectures.map((item,index)=><EditableRow key={item.id} name={item.name} badge={`#${index+1}`} onSave={name=>mutate(`/api/admin/lectures/${item.id}`,'PATCH',{name},'تم تعديل المحاضرة').then(()=>undefined)} onDelete={()=>mutate(`/api/admin/lectures/${item.id}`,'DELETE',undefined,'تم حذف المحاضرة').then(()=>undefined)}/>)}</div>{!lectures.length&&<div className="catalogEmpty">لا توجد محاضرات لهذه المادة بعد.</div>}</section></div><p className="catalogNote">لحماية بيانات الطلاب، لن يسمح النظام بحذف قسم أو مرحلة أو مادة أو محاضرة ما دامت مرتبطة بحساب أو اختبار. يمكنك تعديل الاسم في أي وقت.</p></section>
}
