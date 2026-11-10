import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBackup,validState} from '../public/backup.js';
import {emptyState,mergeStates,learningProfile} from '../public/domain.js';
import {starterLesson} from '../public/course.js';

const sample=()=>({id:'one',lessonId:'1-1',task:0,time:1,prompt:'Declare uma variável',code:'const nome="Ana"',reasoning:'Nome é texto.',result:{score:6,feedback:'Explique melhor.',strengths:['Tipo correto.'],errors:['Faltou justificar.'],review:['let e const'],recovery:'Declare um novo cadastro e justifique as declarações.'}});
test('backup completo restaura rascunhos, aulas e notas, sem importar sessão',()=>{
  const s=emptyState();s.attempts.push(sample());s.lessons['1-2']=starterLesson;s.drafts['1-1:0:first']={code:'x',reasoning:'y',time:1};s.session={access_token:'segredo'};
  const restored=parseBackup(JSON.stringify(s));assert.ok(validState(restored));assert.equal(restored.session,undefined);assert.equal(restored.attempts[0].result.score,6);assert.equal(restored.lessons['1-2'].theory,starterLesson.theory);
  assert.equal(mergeStates(restored,restored).attempts.length,1);
});
test('backup inválido não é aceito: versão, notas, referências, JSON e propriedades perigosas',()=>{
  for(const mutate of [s=>s.version=2,s=>s.attempts.push({...sample(),result:{...sample().result,score:100}}),s=>s.attempts.push({...sample(),lessonId:'inexistente'}),s=>s.attempts.push(sample(),sample()),s=>s.drafts.x={code:9}]) {
    const s=emptyState();mutate(s);assert.throws(()=>parseBackup(JSON.stringify(s)));
  }
  assert.throws(()=>parseBackup('{'));assert.throws(()=>parseBackup('{"__proto__":{}}'));assert.throws(()=>parseBackup('x'.repeat(5*1024*1024+1)));
});
test('perfil para IA resume as últimas tentativas e pontos de revisão',()=>{
  const s=emptyState();assert.equal(learningProfile(s).recentAverage,null);s.attempts.push(sample());
  assert.deepEqual(learningProfile(s),{recentAverage:6,recoveryCount:1,reviewPoints:['let e const']});
  s.attempts=Array.from({length:15},(_,i)=>({...sample(),result:{...sample().result,score:i<3?0:10}}));
  assert.equal(learningProfile(s).recentAverage,10);assert.equal(learningProfile(s).recoveryCount,0);
});
