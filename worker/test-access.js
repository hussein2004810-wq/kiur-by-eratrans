export function studentProfileComplete(user){return Boolean(user?.universityId&&user?.collegeId&&user?.departmentId&&user?.phaseId)}

export function studentCanAccessTest(user,test){
  if(user?.role!=='student')return true;
  if(!studentProfileComplete(user))return false;
  return String(test.universityId||'')===String(user.universityId)&&String(test.collegeId||'')===String(user.collegeId)&&String(test.departmentId||'')===String(user.departmentId)&&String(test.phaseId||'')===String(user.phaseId)&&(!test.sectionId||String(test.sectionId)===String(user.sectionId||''));
}

export function computeAttemptDeadline(test,startedAt=Date.now()){
  const durationDeadline=startedAt+Number(test.durationMinutes)*60*1000;
  const windowDeadline=test.examMode==='formal'&&test.availableUntil?Date.parse(test.availableUntil):Number.POSITIVE_INFINITY;
  return new Date(Math.min(durationDeadline,Number.isFinite(windowDeadline)?windowDeadline:durationDeadline)).toISOString();
}

export function deadlineSql(alias='a'){
  return `COALESCE(${alias}.deadline_at,CASE WHEN t.exam_mode='formal' AND t.available_until IS NOT NULL THEN min(datetime(${alias}.started_at,'+' || (t.duration_minutes*60) || ' seconds'),datetime(t.available_until)) ELSE datetime(${alias}.started_at,'+' || (t.duration_minutes*60) || ' seconds') END)`;
}
