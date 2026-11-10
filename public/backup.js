import {lessons} from './course.js';
import {emptyState} from './domain.js';
const ids = new Set(lessons.map(l=>l.id));
const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
const string = (v,max=20000) => typeof v==='string' && v.length<=max;
const strings = v => Array.isArray(v) && v.length<=50 && v.every(s=>string(s,12000));
const timestamp = v => Number.isSafeInteger(v) && v>=0;
export function validState(s) {
  if(!object(s)||s.version!==1||!ids.has(s.selected)||!timestamp(s.updated)||!Array.isArray(s.attempts)||s.attempts.length>20000||!object(s.drafts)||!object(s.lessons)) return false;
  const seen=new Set();
  for(const a of s.attempts) {
    const r=a?.result;
    if(!object(a)||!string(a.id,100)||!a.id||seen.has(a.id)||!ids.has(a.lessonId)||![0,1,2,3].includes(a.task)||!timestamp(a.time)||!string(a.prompt,8000)||!string(a.code)||!string(a.reasoning,10000)||!object(r)||!Number.isFinite(r.score)||r.score<0||r.score>10||!string(r.feedback,8000)||!strings(r.strengths)||!strings(r.errors)||!strings(r.review)||(r.score<8 && (!string(r.recovery,4000)||!r.recovery.trim())))return false;
    seen.add(a.id);
  }
  for(const [key,d] of Object.entries(s.drafts)) if(!ids.has(key.split(':')[0])||![0,1,2,3].includes(Number(key.split(':')[1]))||!object(d)||!timestamp(d.time)||!string(d.code)||!string(d.reasoning,10000))return false;
  for(const [id,l] of Object.entries(s.lessons)) if(!ids.has(id)||!object(l)||!['theory','why','example','walkthrough','interview'].every(k=>string(l[k],12000)&&l[k].trim())||!strings(l.mistakes)||!Array.isArray(l.exercises)||l.exercises.length!==3||!l.exercises.every(s=>string(s,4000)&&s.trim()))return false;
  return true;
}
export function parseBackup(raw) {
  if(typeof raw!=='string'||raw.length>5*1024*1024) throw new Error('O backup deve ser um JSON de até 5 MB.');
  let s;
  try {s=JSON.parse(raw,(key,value)=>{if(['__proto__','constructor','prototype'].includes(key))throw new Error();return value;});}
  catch {throw new Error('Arquivo JSON inválido. Escolha um backup exportado pelo DevPath.');}
  if(!validState(s))throw new Error('O arquivo não tem um histórico DevPath válido. Nenhum dado foi alterado.');
  // Reconstrói somente os campos de estudo. Sessões e credenciais não são importadas.
  const clean=emptyState();
  clean.selected=s.selected;clean.updated=s.updated;
  clean.attempts=s.attempts.map(a=>({id:a.id,lessonId:a.lessonId,task:a.task,time:a.time,prompt:a.prompt,code:a.code,reasoning:a.reasoning,recovery:!!a.recovery,result:{score:a.result.score,feedback:a.result.feedback,strengths:a.result.strengths,errors:a.result.errors,review:a.result.review,recovery:a.result.score<8?a.result.recovery:null}}));
  clean.drafts=Object.fromEntries(Object.entries(s.drafts).map(([k,d])=>[k,{code:d.code,reasoning:d.reasoning,time:d.time}]));
  clean.lessons=Object.fromEntries(Object.entries(s.lessons).map(([id,l])=>[id,Object.fromEntries(['theory','why','example','walkthrough','interview','mistakes','exercises'].map(k=>[k,l[k]]))]));
  return clean;
}
