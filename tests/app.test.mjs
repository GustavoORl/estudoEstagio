import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,validateLesson,validateGrade,publicConfig} from '../server.mjs';
import {lessons,modules,starterLesson} from '../public/course.js';
import {emptyState,passed,complete,unlocked,currentTask,mergeStates} from '../public/domain.js';

const grade = (score=9) => ({score,feedback:'Sua justificativa está coerente.',strengths:['Nomes claros.'],errors:[],review:[],recovery:score<8?'Modele um novo cadastro e justifique seus tipos.':null});
test('configuração pública nunca aceita chave administrativa do Supabase',()=>{
  assert.throws(()=>publicConfig({SUPABASE_PUBLISHABLE_KEY:'sb_secret_privada'}));
  const jwt=`header.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.sig`;
  assert.throws(()=>publicConfig({SUPABASE_PUBLISHABLE_KEY:jwt}));
  assert.equal(publicConfig({SUPABASE_PUBLISHABLE_KEY:'sb_publishable_publica'}).supabaseKey,'sb_publishable_publica');
  assert.throws(()=>publicConfig({SUPABASE_URL:'http://outro-host'}));
});
test('catálogo possui IDs únicos, módulos em ordem e aula inicial válida',()=>{
  assert.equal(modules.length,12);assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
  assert.deepEqual(validateLesson(starterLesson),starterLesson);
  assert.ok(lessons.length>40);
});
test('progressão exige exercícios e entrevista com nota 8, incluindo recuperação',()=>{
  const state=emptyState();assert.equal(unlocked(state,lessons,1),false);
  const add=(task,score)=>state.attempts.push({id:crypto.randomUUID(),lessonId:'1-1',task,result:grade(score)});
  add(0,5);assert.equal(passed(state,'1-1',0),false);assert.equal(currentTask(state,'1-1'),0);
  add(0,8);add(1,9);add(2,10);assert.equal(complete(state,'1-1'),false);assert.equal(currentTask(state,'1-1'),3);
  add(3,8);assert.equal(complete(state,'1-1'),true);assert.equal(unlocked(state,lessons,1),true);
});
test('avaliação rejeita nota fora do intervalo, campos ausentes e recuperação vazia',()=>{
  for(const score of [-1,11,NaN,'9']) assert.throws(()=>validateGrade(grade(score)));
  assert.throws(()=>validateGrade({...grade(4),recovery:''}));
  assert.throws(()=>validateGrade({...grade(),review:null}));
  assert.equal(validateGrade(grade(7)).score,7);
  assert.equal(validateGrade({...grade(9),recovery:'Não deve aparecer'}).recovery,null);
  assert.throws(()=>validateLesson({...starterLesson,exercises:['incompleto']}));
});
test('sincronização combina tentativas e preserva rascunho mais recente',()=>{
  const a=emptyState(),b=emptyState();a.attempts=[{id:'a',time:1},{id:'b',time:2}];b.attempts=[{id:'b',time:2},{id:'c',time:3}];
  a.drafts.x={code:'antigo',time:1};b.drafts.x={code:'novo',time:3};b.updated=3;b.selected='1-2';
  const result=mergeStates(a,b);assert.equal(result.attempts.length,3);assert.equal(result.drafts.x.code,'novo');assert.equal(result.selected,'1-2');
});
test('servidor: arquivos, segredo, origem, validação, erro e integração IA simulada',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`,originalFetch=globalThis.fetch,previous=process.env.GROQ_API_KEY;
  try {
    process.env.GROQ_API_KEY='test-secret';
    let providerRequest;
    globalThis.fetch=async(url,options)=>{
      if(!String(url).startsWith('https://api.groq.com/'))return originalFetch(url,options);
      providerRequest=JSON.parse(options.body);
      const lesson=JSON.parse(providerRequest.messages[1].content).previous;
      return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(lesson?starterLesson:grade())}}]}),{status:200});
    };
    const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/DevPath/);
    const mainPolicy=page.headers.get('content-security-policy');
    assert.ok(!mainPolicy.includes('unsafe-eval'));
    const runner=await fetch(origin+'/runner-frame.html');assert.equal(runner.status,200);
    const runnerPolicy=runner.headers.get('content-security-policy');
    assert.match(runnerPolicy,/connect-src 'none'/);assert.match(runnerPolicy,/worker-src blob:/);assert.match(runnerPolicy,/frame-ancestors 'self'/);
    const controller=await (await fetch(origin+'/code-runner.js')).text();assert.match(controller,/frame.sandbox='allow-scripts'/);assert.ok(!controller.includes('allow-same-origin'));
    assert.equal((await fetch(origin+'/node_modules/monaco-editor/package.json')).status,404);
    const cfg=await (await fetch(origin+'/api/config')).text();assert.ok(!cfg.includes('test-secret'));
    assert.equal((await fetch(origin+'/.env')).status,404);
    const payload={lessonId:'1-1',prompt:starterLesson.exercises[0],code:'const nome = "Ana";',reasoning:'Nome fixo.'};
    const post=(data,extra={})=>fetch(origin+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...extra},body:JSON.stringify(data)});
    assert.equal((await post(payload,{Origin:'http://evil.example'})).status,403);
    assert.equal((await post({...payload,code:'',reasoning:''})).status,400);
    const evaluated=await post(payload);assert.equal(evaluated.status,200);assert.equal((await evaluated.json()).score,9);
    assert.equal((await post(null)).status,400);
    const prepare=profile=>fetch(origin+'/api/lesson',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({lessonId:'1-2',...profile})});
    assert.equal((await prepare({profile:{recentAverage:6,recoveryCount:2,reviewPoints:['Tipos']}})).status,200);
    assert.equal(JSON.parse(providerRequest.messages[1].content).profile,null);
    assert.equal((await prepare({personalize:true,profile:{recentAverage:6,recoveryCount:2,reviewPoints:['Tipos']}})).status,200);
    assert.equal(JSON.parse(providerRequest.messages[1].content).profile.recentAverage,6);
    assert.equal(providerRequest.response_format.json_schema.strict,true);
    assert.equal(providerRequest.response_format.json_schema.name,'lesson');
    globalThis.fetch=async(url,opts)=>String(url).startsWith('https://api.groq.com/')?new Response('{}',{status:429}):originalFetch(url,opts);
    const limited=await post(payload);assert.equal(limited.status,502);assert.match((await limited.json()).error,/Limite gratuito/);
    delete process.env.GROQ_API_KEY;assert.equal((await post(payload)).status,503);
  } finally {globalThis.fetch=originalFetch;if(previous===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=previous;await new Promise(r=>server.close(r));}
});
