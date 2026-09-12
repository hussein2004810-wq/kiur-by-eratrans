import {useEffect,useMemo,useState} from 'react';
import AuthScreen from './AuthScreen';
import StitchPublicLanding from './stitch/components/StitchPublicLanding';


type Item={id:string;name:string;universityId?:string;collegeId?:string;departmentId?:string;phaseId?:string;subjectId?:string};
type Catalog={universities:Item[];colleges:Item[];departments:Item[];phases:Item[];sections:Item[];subjects:Item[];lectures:Item[]};
type Test={id:string;title:string;durationMinutes:number;questionCount:number;universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId?:string;subjectId:string;lectureId:string;subjectName:string;lectureName:string;departmentName:string;phaseName:string;examMode?:string};
type GuestPath={universityId:string;collegeId:string;departmentId:string;phaseId:string;sectionId:string;subjectId:string;lectureId:string};

const empty:GuestPath={universityId:'',collegeId:'',departmentId:'',phaseId:'',sectionId:'',subjectId:'',lectureId:''};
function saved():GuestPath{try{return {...empty,...JSON.parse(localStorage.getItem('kiur-guest-path')||'{}')}}catch{return empty}}

export default function GuestPortal(){
  const [auth,setAuth]=useState(false);
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [tests,setTests]=useState<Test[]>([]);
  const [path,setPath]=useState(saved);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    Promise.all([
      fetch('/api/public/catalog').then(r=>r.json()),
      fetch('/api/public/tests').then(r=>r.json())
    ]).then(([tree,result])=>{
      setCatalog(tree);
      setTests(result.data||[]);
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{try{localStorage.setItem('kiur-guest-path',JSON.stringify(path))}catch{}},[path]);

  const colleges=catalog?.colleges.filter(x=>x.universityId===path.universityId)||[];
  const departments=catalog?.departments.filter(x=>x.collegeId===path.collegeId)||[];
  const phases=catalog?.phases.filter(x=>x.departmentId===path.departmentId)||[];
  const sections=catalog?.sections.filter(x=>x.phaseId===path.phaseId)||[];
  const subjects=catalog?.subjects.filter(x=>x.phaseId===path.phaseId)||[];
  const lectures=catalog?.lectures.filter(x=>x.subjectId===path.subjectId)||[];

  const choose=(key:keyof typeof path,value:string)=>setPath(current=>{
    const next={...current,[key]:value};
    if(key==='universityId'){
      const collegeId=value?(catalog?.colleges.find(x=>x.universityId===value)?.id||''):'';
      const departmentId=collegeId?(catalog?.departments.find(x=>x.collegeId===collegeId)?.id||''):'';
      const phaseId=departmentId?(catalog?.phases.find(x=>x.departmentId===departmentId)?.id||''):'';
      Object.assign(next,{collegeId,departmentId,phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='collegeId'){
      const departmentId=value?(catalog?.departments.find(x=>x.collegeId===value)?.id||''):'';
      const phaseId=departmentId?(catalog?.phases.find(x=>x.departmentId===departmentId)?.id||''):'';
      Object.assign(next,{departmentId,phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='departmentId'){
      const phaseId=value?(catalog?.phases.find(x=>x.departmentId===value)?.id||''):'';
      Object.assign(next,{phaseId,sectionId:'',subjectId:'',lectureId:''});
    }
    if(key==='phaseId'){
      const subjectId=value?(catalog?.subjects.find(x=>x.phaseId===value)?.id||''):'';
      Object.assign(next,{sectionId:'',subjectId,lectureId:''});
    }
    if(key==='subjectId')next.lectureId=value?(catalog?.lectures.find(x=>x.subjectId===value)?.id||''):'';
    return next;
  });

  const visible=useMemo(()=>{
    const needle=search.trim().toLocaleLowerCase('ar');
    return tests.filter(t=>(!path.universityId||t.universityId===path.universityId)&&
      (!path.collegeId||t.collegeId===path.collegeId)&&
      (!path.departmentId||t.departmentId===path.departmentId)&&
      (!path.phaseId||t.phaseId===path.phaseId)&&
      (!path.sectionId||!t.sectionId||t.sectionId===path.sectionId)&&
      (!path.subjectId||t.subjectId===path.subjectId)&&
      (!path.lectureId||t.lectureId===path.lectureId)&&
      (!needle||[t.title,t.subjectName,t.lectureName,t.departmentName,t.phaseName].some(v=>v?.toLocaleLowerCase('ar').includes(needle)))
    );
  },[tests,path,search]);

  const start=(id:string)=>{
    try{localStorage.setItem('kiur-intended-test',id)}catch{}
    window.history.replaceState({},'',`/test/${encodeURIComponent(id)}`);
    setAuth(true);
  };

  if(auth)return <AuthScreen onBrowse={()=>{window.history.replaceState({},'', '/');setAuth(false)}}/>;

  return (
    <StitchPublicLanding
      onStartAuth={()=>setAuth(true)}
      catalog={catalog}
      tests={tests}
      path={path}
      onSelectPath={choose}
      search={search}
      onSearchChange={setSearch}
      visibleTests={visible}
      loading={loading}
      onStartTest={start}
    />
  );
}

