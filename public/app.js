import {modules, lessons, starterLesson} from './course.js';
import {emptyState, latest, passed, complete, unlocked, currentTask, mergeStates, learningProfile} from './domain.js';

import {validState, parseBackup} from './backup.js';
import {mountCodeEditor,disposeCodeEditor} from './code-editor.js';
import {runCode,stopCode,clearOutput,outputFor,isRunning} from './code-runner.js';

const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name) => ({code:'⌘',path:'▦',history:'◷',chart:'◴',settings:'⚙',arrow:'↗',check:'✓',lock:'·'}[name] || name);
let config = {}, session = null, state, view = 'study', tab = 'theory', editor = 'code', task = 0, busy = false, syncTimer, syncRunning = false, syncAgain = false, syncLabel = 'Salvo neste navegador', moduleOpen = 1;
let localWarning = false;
let personalizeAI = read('devpath-personalize-ai',false) === true;
function notice(message) { $('#notice').textContent = message; $('#notice').classList.add('show'); clearTimeout(notice.timer); notice.timer=setTimeout(()=>$('#notice').classList.remove('show'),6500); }
function read(key, fallback) { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { if (!localWarning) {localWarning=true;notice('Armazenamento do navegador indisponível ou cheio. Exporte seu histórico para não perder dados.');} } }
const isState = validState;
function key() {return `devpath-state-${session?.user?.id || 'local'}`;}
function load() { const v = read(key(),emptyState()); state = isState(v) ? v : emptyState(); if (!lessons.some(l=>l.id===state.selected)) state.selected='1-1'; task=currentTask(state,state.selected); moduleOpen=lessons.find(l=>l.id===state.selected).module; }
function persist() {state.updated=Date.now();write(key(),state); if(session) {syncLabel='Alterações salvas localmente · sincronização pendente';clearTimeout(syncTimer);syncTimer=setTimeout(sync,1500);} updateStatus();}
function updateStatus() { const el=$('#save-status'); if(el) el.textContent=syncLabel; }
async function api(route, data) {
  const res = await fetch(route,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(70000)});
  const body = await res.json(); if(!res.ok) throw new Error(body.error || 'Não foi possível concluir a solicitação.'); return body;
}
async function sb(route, options={}, retry=true) {
  if(session && session.expires_at*1000 < Date.now()+60000 && retry) {
    const r=await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:config.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(15000)});
    if(!r.ok) throw new Error('Sessão expirada. Entre novamente para sincronizar. Seu progresso continua salvo localmente.');
    session=await r.json();write('devpath-session',session);
  }
  const r=await fetch(`${config.supabaseUrl}${route}`,{...options,signal:AbortSignal.timeout(15000),headers:{apikey:config.supabaseKey,...(session?{Authorization:`Bearer ${session.access_token}`} : {}),'Content-Type':'application/json',...options.headers}});
  const data = await r.json().catch(()=>null);
  if(!r.ok) throw new Error(data?.msg || data?.error_description || data?.message || 'Falha ao acessar o Supabase. Confira o SQL e as configurações.');
  return data;
}
async function sync() {
  if(!session) return;
  if(syncRunning) {syncAgain=true;return;}
  syncRunning=true; const userId=session.user.id;
  try {
    syncLabel='Sincronizando…';updateStatus();
    const rows=await sb(`/rest/v1/study_progress?user_id=eq.${encodeURIComponent(userId)}&select=state`);
    if(session?.user.id!==userId) return;
    if(rows?.[0] && !isState(rows[0].state)) throw new Error('O progresso na nuvem tem um formato inesperado. Nenhum dado remoto foi substituído.');
    if(rows?.[0]?.state && isState(rows[0].state)) state=mergeStates(rows[0].state,state);
    write(key(),state);
    const snapshot=structuredClone(state);
    await sb('/rest/v1/study_progress?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:userId,state:snapshot,updated_at:new Date().toISOString()})});
    syncLabel=state.updated===snapshot.updated?'Sincronizado com Supabase':'Alterações pendentes';
    if(state.updated!==snapshot.updated) syncAgain=true;
  } catch(e) {syncLabel='Salvo localmente · falha ao sincronizar';notice(e.message);}
  finally {syncRunning=false;updateStatus();if(syncAgain){syncAgain=false;clearTimeout(syncTimer);syncTimer=setTimeout(sync,1000);}}
}
const selected = () => lessons.find(l=>l.id===state.selected);
const material = () => state.selected==='1-1'?starterLesson:state.lessons[state.selected];
const countDone = () => lessons.filter(l=>complete(state,l.id)).length;
const draftKey = () => `${state.selected}:${task}:${latest(state,state.selected,task)?.id || 'first'}`;
function currentPrompt() { const a=latest(state,state.selected,task); return a?.result.score<8 ? a.result.recovery : task===3?material()?.interview:material()?.exercises[task]; }
function shell() {
  const done=countDone(), percent=Math.round(done/lessons.length*100);
  return `<aside class="sidebar"><a class="brand" href="#" data-action="home"><span class="brand-icon">&lt;/&gt;</span>devpath<span class="brand-dot">.</span></a><div class="personal-label">SEU ESPAÇO DE APRENDIZADO</div><nav class="main-nav" aria-label="Navegação principal">${[['study','path','Minha trilha'],['progress','chart','Meu progresso'],['history','history','Histórico']].map(([v,i,t])=>`<button class="nav-item ${view===v?'active':''}" data-view="${v}"><span>${icon(i)}</span>${t}${v==='study'?'<span class="tiny-dot"></span>':''}</button>`).join('')}</nav><div class="sidebar-heading">TRILHA FULL STACK <span>${modules.length} módulos</span></div><div class="module-list">${modules.map(m=>`<section class="module"><button class="module-title ${selected().module===m.id?'current':''}" data-module="${m.id}" aria-expanded="${moduleOpen===m.id}"><span class="module-number">${String(m.id).padStart(2,'0')}</span><span>${esc(m.title)}</span><span class="chevron">${moduleOpen===m.id?'−':'+'}</span></button>${moduleOpen===m.id?`<div class="lesson-list">${m.lessons.map(l=>{const idx=lessons.indexOf(l),locked=!unlocked(state,lessons,idx);return `<button class="lesson-link ${l.id===state.selected?'selected':''}" data-lesson="${l.id}" ${locked?'disabled':''}><span>${complete(state,l.id)?'✓':locked?'·':'○'}</span>${esc(l.title)}${locked?'<span class="sr-only"> bloqueada</span>':''}</button>`;}).join('')}</div>`:''}</section>`).join('')}</div><div class="sidebar-bottom"><div class="mini-progress"><span>Sua jornada</span><b>${percent}%</b></div><progress value="${done}" max="${lessons.length}"></progress><small>${done} de ${lessons.length} aulas concluídas</small><button class="settings-link" data-action="settings">⚙ <span>Configurações e conexões</span></button><div class="profile"><span class="avatar">${session?'EU':'G'}</span><div><b>${session?'Minha conta':'Olá, futuro dev'}</b><small>${session?'Supabase conectado':'Um passo de cada vez'}</small></div><span class="online-dot"></span></div></div></aside><div class="workspace"><header class="topbar"><span>Workspace pessoal <span class="topbar-slash">/</span> <b>${view==='study'?'Minha trilha':view==='progress'?'Meu progresso':'Histórico'}</b></span><div class="topbar-right"><span class="local-tag"><i></i> Ambiente local</span><button class="icon-button" data-action="settings" aria-label="Abrir configurações">⚙</button></div></header><main id="main">${view==='study'?studyView():view==='progress'?progressView():historyView()}</main><footer><span>Feito para o seu próximo passo.</span><span id="save-status">${esc(syncLabel)}</span></footer></div>`;
}
function studyView() {
  const l=selected(), content=material(), finished=complete(state,l.id), previous=latest(state,l.id,task), recovery=previous?.result.score<8;
  const d=state.drafts[draftKey()] || (passed(state,l.id,task)?previous:{code:'',reasoning:''});
  return `<div class="page-heading"><div><div class="eyebrow">APRENDA. PRATIQUE. EVOLUA.</div><h1>Seu próximo passo começa aqui<span>.</span></h1><p>Construa a base para sua primeira vaga, uma conquista por vez.</p></div><div class="goal-tag">↗ <span>Objetivo<br><b>Primeira vaga dev</b></span></div></div><div class="study-stats"><div><span class="stat-icon green">▦</span><span><small>SUA TRILHA</small><b>Desenvolvimento full stack</b></span></div><div><span class="stat-icon purple">✓</span><span><small>AULAS CONCLUÍDAS</small><b>${countDone()} <em>/ ${lessons.length}</em></b></span></div><div><span class="stat-icon amber">◎</span><span><small>FOCO ATUAL</small><b>${esc(modules[l.module-1].title)}</b></span></div></div><div class="lesson-heading"><div><span class="pill">MÓDULO ${String(l.module).padStart(2,'0')}</span><span class="lesson-number">Aula ${lessons.indexOf(l)+1} de ${lessons.length}</span><h2>${esc(l.title)}</h2></div><span class="status-pill ${finished?'done':''}"><i></i>${finished?'Concluída':'Em aprendizado'}</span></div><label class="mobile-lesson-picker" for="lesson-select">Escolher aula<select id="lesson-select">${modules.map(m=>`<optgroup label="${esc(m.title)}">${m.lessons.map(l=>`<option value="${l.id}" ${l.id===state.selected?'selected':''} ${!unlocked(state,lessons,lessons.indexOf(l))?'disabled':''}>${complete(state,l.id)?'✓ ':''}${esc(l.title)}</option>`).join('')}</optgroup>`).join('')}</select></label><div class="learning-layout"><section class="lesson-panel card"><div class="tabs" role="tablist" aria-label="Conteúdo da aula">${[['theory','01','Teoria'],['example','02','Exemplo'],['practice','03','Prática']].map(([v,n,label])=>`<button role="tab" aria-selected="${tab===v}" class="tab ${tab===v?'active':''}" data-tab="${v}"><span>${n}</span>${label}</button>`).join('')}</div><div class="lesson-content">${!content?`<div class="empty-lesson"><span class="large-symbol">✦</span><h3>Uma aula preparada para você</h3><p>A IA vai criar teoria, exemplo comentado, três exercícios progressivos e uma pergunta de entrevista sobre:</p><p class="topics">${esc(l.topics)}</p><button class="button primary" data-action="generate" ${busy?'disabled':''}>${busy?'Preparando sua aula…':'Preparar aula com IA ↗'}</button><small>A aula será salva para você revisitar.</small></div>`:tab==='theory'?`<div class="section-kicker">ENTENDA O CONCEITO</div><h3>${esc(l.title)}</h3><p class="prose">${esc(content.theory)}</p><div class="why-box"><span>↗</span><div><h4>Por que isso importa?</h4><p>${esc(content.why)}</p></div></div><h4 class="mistakes-title">Fique de olho</h4><ul class="tips">${content.mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="button secondary next-reading" data-tab="example">Ver exemplo prático <span>→</span></button>`:tab==='example'?`<div class="section-kicker">CONECTE COM A PRÁTICA</div><h3>Um exemplo do mundo real</h3><div class="code-window"><div><span></span><span></span><span></span><small>exemplo</small></div><pre><code>${esc(content.example)}</code></pre></div><p class="prose">${esc(content.walkthrough)}</p><button class="button secondary next-reading" data-tab="practice">Hora de praticar <span>→</span></button>`:`<div class="section-kicker">DO CONCEITO À SOLUÇÃO</div><h3>${finished?'Você concluiu esta aula!':'Uma questão por vez'}</h3><p>${finished?'Você demonstrou compreensão nos três exercícios e na entrevista. Revise sua conclusão abaixo.':'Resolva os três exercícios e depois responda à entrevista. Cada etapa pede nota mínima 8. Se precisar, você fará uma recuperação antes de avançar.'}</p><div class="task-list">${['Fundamentos','Aplicação do conceito','Desafio prático','Entrevista técnica'].map((label,n)=>`<button data-task="${n}" ${n>currentTask(state,l.id)&&!finished?'disabled':''} class="task-item ${n===task?'active':''}"><span>${passed(state,l.id,n)?'✓':String(n+1).padStart(2,'0')}</span><div><b>${label}</b><small>${passed(state,l.id,n)?`Nota ${latest(state,l.id,n).result.score.toFixed(1)}`:n===3?'Explique como em uma entrevista':'Código + raciocínio'}</small></div><span>→</span></button>`).join('')}</div>${finished?conclusion():`<div class="note">✦ Você aprende resolvendo. As soluções não aparecem antes da sua tentativa.</div>`}`}</div></section><section class="exercise-panel card"><div class="exercise-bar"><span><i class="online-dot"></i> SEU LABORATÓRIO</span><span>${content?`${task+1} / 4`:'— / 4'}</span></div><div class="exercise-body"><div class="exercise-tags"><span class="pill ${recovery?'recovery':''}">${recovery?'RECUPERAÇÃO':task===3?'ENTREVISTA':['BÁSICO','INTERMEDIÁRIO','DESAFIO PRÁTICO'][task]}</span><span>JavaScript · Full stack</span></div><h3>${recovery?'Vamos reforçar esse ponto':task===3?'Explique com suas palavras':['Sua primeira solução','Aplique o que aprendeu','Um problema do dia a dia'][task]}</h3><p class="prompt">${esc(content?currentPrompt():'Prepare a aula ao lado para começar os exercícios.')}</p>${content?`<div class="editor"><div class="editor-tabs"><button data-editor="code" class="${editor==='code'?'active':''}">&lt;/&gt; Código</button><button data-editor="reasoning" class="${editor==='reasoning'?'active':''}">≡ Raciocínio</button><span>Rascunho salvo</span></div><div class="editor-area"><div id="monaco-host" hidden></div><label for="answer-code" class="sr-only">Seu código</label><textarea id="answer-code" maxlength="20000" ${passed(state,l.id,task)?'readonly':''} spellcheck="false" ${editor!=='code'?'hidden':''} placeholder="// Escreva sua solução aqui…\n// Use console.log para ver o resultado abaixo.">${esc(d.code)}</textarea><label for="answer-reasoning" class="sr-only">Explique seu raciocínio</label><textarea id="answer-reasoning" maxlength="10000" ${passed(state,l.id,task)?'readonly':''} ${editor!=='reasoning'?'hidden':''} placeholder="Explique suas escolhas e como chegou à solução.\nConsidere também possíveis casos de erro.">${esc(d.reasoning)}</textarea></div></div><div class="editor-hint" id="code-editor-status">Ctrl+Espaço: sugestões · Ctrl+Enter: executar</div>${outputPanel()}<div class="editor-hint">↳ Explique suas escolhas na aba Raciocínio.</div><button class="button primary submit" data-action="evaluate" ${busy||passed(state,l.id,task)?'disabled':''}>${busy?'A IA está analisando…':passed(state,l.id,task)?'✓ Etapa concluída':'Enviar para avaliação'} <span>↗</span></button><div class="ai-note">✦ ${config.aiReady?'Avaliado por IA · Meta de aprovação: 8/10':'Conecte a Groq em Configurações para avaliar'}</div>${previous?feedback(previous):''}${passed(state,l.id,task)&&task<3?`<button class="button secondary full" data-action="next-task">${task===2?'Ir para entrevista':'Próximo exercício'} →</button>`:''}`:`<div class="editor-placeholder">&lt;/&gt;<span>Seu espaço para experimentar.</span></div>`}</div></section></div><div class="bottom-note"><span>◈</span><div><b>Consistência vale mais que pressa.</b><p>Entenda o porquê, pratique e construa seu próprio caminho.</p></div><span class="bottom-note-right">UM PASSO DE CADA VEZ →</span></div>`;
}
function feedback(a) { const r=a.result;return `<div class="feedback ${r.score>=8?'approved':'needs-review'}"><div class="feedback-heading"><h4>${r.score>=8?'Bom trabalho. Continue assim!':'Você está construindo a base.'}</h4><b>${r.score.toFixed(1)}<small>/10</small></b></div><p class="prose">${esc(r.feedback)}</p>${[['O que você fez bem',r.strengths],['Pontos para corrigir',r.errors],['O que revisar',r.review]].filter(([,items])=>items.length).map(([title,items])=>`<h5>${title}</h5><ul>${items.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`).join('')}${r.score<8?'<p class="recovery-hint">O enunciado acima agora é sua recuperação. Resolva para liberar a próxima etapa.</p>':''}<small>Avaliação por IA pode conter erros. Revise os argumentos apresentados.</small></div>`;}
function conclusion() {
  const final=[0,1,2,3].map(t=>latest(state,state.selected,t));const avg=final.reduce((s,a)=>s+a.result.score,0)/4;
  const all=state.attempts.filter(a=>a.lessonId===state.selected); const next=lessons[lessons.indexOf(selected())+1];
  return `<div class="conclusion"><h4>Sua conclusão · ${avg.toFixed(1)}/10</h4><p><b>O que aprendeu:</b> ${esc(selected().topics)}.</p><p><b>Erros ao longo da aula:</b> ${esc([...new Set(all.flatMap(a=>a.result.errors))].join(' • ') || 'Nenhum erro apontado nas avaliações.')}</p><p><b>Revisar:</b> ${esc([...new Set(all.flatMap(a=>a.result.review))].join(' • ') || 'Revisite os exemplos para consolidar.')}</p>${next?`<p><b>Próximo assunto:</b> ${esc(next.title)}</p><button class="button primary" data-lesson="${next.id}">Começar próxima aula →</button>`:'<p>Trilha concluída! Use o histórico para revisar seus pontos de dificuldade e apresentar seu projeto full stack.</p>'}</div>`;
}
function progressView() { const average=state.attempts.length?state.attempts.reduce((s,a)=>s+a.result.score,0)/state.attempts.length:0;return `<div class="page-heading"><div><div class="eyebrow">CADA TENTATIVA CONTA</div><h1>Veja o quanto você evoluiu<span>.</span></h1><p>Seu histórico mostra o caminho e os pontos que merecem atenção.</p></div><button class="button secondary" data-action="export">Exportar histórico ↓</button></div><div class="progress-stats"><div class="card"><small>Aulas concluídas</small><strong>${countDone()}<em> / ${lessons.length}</em></strong></div><div class="card"><small>Tentativas avaliadas</small><strong>${state.attempts.length}</strong></div><div class="card"><small>Média de todas as tentativas</small><strong>${average.toFixed(1)}<em> / 10</em></strong></div></div><div class="module-grid">${modules.map(m=>{const done=m.lessons.filter(l=>complete(state,l.id)).length;return `<article class="card module-card"><span class="section-kicker">MÓDULO ${String(m.id).padStart(2,'0')}</span><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><progress max="${m.lessons.length}" value="${done}"></progress><small>${done} / ${m.lessons.length} aulas concluídas</small><details><summary>Ver tópicos do módulo</summary>${m.lessons.map(l=>`<div class="syllabus-entry"><b>${esc(l.title)}</b><p>${esc(l.topics)}</p></div>`).join('')}</details></article>`;}).join('')}</div><div class="card review-card"><h3>Revisões recomendadas</h3><p>A cada três aulas, volte a uma aula concluída, releia sua explicação e compare suas escolhas com a avaliação. Use os erros do histórico para refazer exercícios no seu editor.</p>${[...new Set(state.attempts.flatMap(a=>a.result.review))].slice(-12).map(x=>`<p>↳ ${esc(x)}</p>`).join('') || '<p>Seus pontos de revisão aparecerão após as primeiras avaliações.</p>'}</div>`;}
function historyView() {return `<div class="page-heading"><div><div class="eyebrow">SEU DIÁRIO DE APRENDIZADO</div><h1>O caminho até aqui<span>.</span></h1><p>Respostas, raciocínios e feedbacks guardados para você revisitar.</p></div><button class="button secondary" data-action="export">Exportar histórico ↓</button></div>${!state.attempts.length?'<div class="card empty-history"><span class="large-symbol">◷</span><h3>Todo caminho tem uma primeira tentativa.</h3><p>Envie uma resposta na sua trilha para começar seu histórico.</p><button class="button primary" data-view="study">Voltar para minha aula →</button></div>':`<div class="history-list">${[...state.attempts].reverse().map(a=>`<details class="card history-entry"><summary><span class="history-score ${a.result.score>=8?'good':''}">${a.result.score.toFixed(1)}</span><span><b>${esc(lessons.find(l=>l.id===a.lessonId)?.title || a.lessonId)}</b><small>${a.recovery?'Recuperação · ':''}${a.task===3?'Entrevista':`Exercício ${a.task+1}`} · ${new Date(a.time).toLocaleString('pt-BR')}</small></span><span>⌄</span></summary><div class="history-content"><h4>Enunciado</h4><p class="prose">${esc(a.prompt)}</p><h4>Seu código</h4><pre>${esc(a.code || '(Sem código)')}</pre><h4>Seu raciocínio</h4><p class="prose">${esc(a.reasoning || '(Sem explicação)')}</p>${feedback(a)}</div></details>`).join('')}</div>`}`;}
function openLesson(id) {
  if(busy)return notice('Aguarde a IA concluir a solicitação.');
  const index=lessons.findIndex(l=>l.id===id);if(index<0||!unlocked(state,lessons,index))return;
  state.selected=id;task=currentTask(state,id);moduleOpen=selected().module;tab='theory';editor='code';view='study';persist();render();window.scrollTo(0,0);
}
function render() {
  disposeCodeEditor();stopCode('Execução interrompida ao mudar de tela.');
  $('#app').innerHTML=shell();
  if(view==='study'&&editor==='code'&&material()) {
    const k=draftKey();
    mountCodeEditor({key:k,value:$('#answer-code').value,readonly:passed(state,state.selected,task),onRun:executeCode,onChange:code=>{
      if(passed(state,state.selected,task)||k!==draftKey())return;
      const draft=state.drafts[k]||{code:'',reasoning:''};draft.code=code;draft.time=Date.now();state.drafts[k]=draft;persist();
    }});
  }
}
function outputPanel() {
  return '<section class="output-panel" aria-label="Saída do código"><div class="output-toolbar"><b>Saída</b><span id="execution-status">'+esc(outputFor(draftKey()).status)+'</span><button class="button secondary" data-action="run-code">▶ Executar</button><button class="button secondary" data-action="stop-code" '+(!isRunning(draftKey())?'disabled':'')+'>■ Parar</button><button class="button secondary" data-action="clear-output">Limpar</button></div><div id="code-output" class="code-output" role="log" aria-label="Console JavaScript" aria-live="polite">'+outputLines()+'</div><small>JavaScript puro · limite de 4 s · sem DOM, Node.js ou acesso à rede.</small></section>';
}
function outputLines() {const result=outputFor(draftKey());return result.lines.length?result.lines.map(line=>'<pre class="console-line console-'+(['error','warn','result'].includes(line.level)?line.level:'log')+'">'+esc(line.text)+'</pre>').join(''):'<p class="console-empty">Use console.log(...) para mostrar um resultado aqui.</p>';}
function refreshOutput() {
  const output=$('#code-output');if(!output)return;output.innerHTML=outputLines();output.scrollTop=output.scrollHeight;
  $('#execution-status').textContent=outputFor(draftKey()).status;
  const stop=document.querySelector('[data-action="stop-code"]');if(stop)stop.disabled=!isRunning(draftKey());
}
function executeCode() {
  const code=$('#answer-code')?.value||'';if(!code.trim())return notice('Escreva algum código para executar.');
  runCode({key:draftKey(),code,onUpdate:refreshOutput});
}
function settings() {
  $('#settings-content').innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">DO SEU JEITO</span><h2>Configurações</h2></div><button class="icon-button" data-action="close-settings" aria-label="Fechar configurações">×</button></div><section class="connection-section"><h3><span class="connection-dot ${config.aiReady?'ready':''}"></span> Seu professor de IA</h3><p>${config.aiReady?'Chave Groq configurada. Modelo: '+esc(config.model):'A correção e a geração de novas aulas precisam de uma chave gratuita da Groq.'}</p><ol><li>Crie uma chave em <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com/keys ↗</a>.</li><li>Copie <code>.env.example</code> para <code>.env</code> na pasta do projeto.</li><li>Preencha <code>GROQ_API_KEY</code> e reinicie com <code>npm start</code>.</li></ol><small>Plano gratuito sujeito a limites e disponibilidade do provedor. Suas respostas são enviadas à Groq para correção. A avaliação da IA é por leitura. O botão Executar roda JavaScript isolado no navegador.</small></section><section class="connection-section"><h3><span class="connection-dot ${session?'ready':''}"></span> Progresso no Supabase</h3>${!config.supabaseUrl||!config.supabaseKey?`<p>O progresso já é salvo neste navegador. Para guardar na nuvem:</p><ol><li>Crie um projeto em <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Supabase ↗</a>.</li><li>Execute <code>supabase/schema.sql</code> no SQL Editor.</li><li>Preencha <code>SUPABASE_URL</code> e <code>SUPABASE_PUBLISHABLE_KEY</code> no <code>.env</code>. Reinicie o servidor.</li><li>Volte aqui para criar sua conta de estudo e entrar.</li></ol><p>Use a chave publishable ou anon. Nunca use service_role ou uma chave secret.</p>`:session?`<p>Conectado como <b>${esc(session.user.email)}</b>.</p><p>${esc(syncLabel)}</p><div class="button-row"><button class="button secondary" data-action="sync">Sincronizar agora</button><button class="button secondary" data-action="import-local">Importar estudo local</button><button class="button secondary" data-action="logout">Sair</button></div><small>A importação combina suas tentativas locais com a conta atual.</small>`:`<p>Entre na sua conta de estudo para sincronizar com segurança. Ela é separada do login do painel Supabase.</p><form id="auth-form"><label for="email">E-mail</label><input id="email" type="email" autocomplete="username" required><label for="password">Senha</label><input id="password" type="password" minlength="8" autocomplete="current-password" required><div class="button-row"><button class="button primary" type="submit">Entrar</button><button class="button secondary" type="submit" name="signup" value="yes">Criar conta</button></div></form><small>Se a confirmação de e-mail estiver ativa, confirme o cadastro e volte para entrar. Configure a Site URL do Supabase para http://127.0.0.1:3000.</small>`}</section><section class="connection-section"><h3>Ritmo das próximas aulas</h3><label class="personalization-option"><input id="personalize-ai" type="checkbox" ${personalizeAI?'checked':''}> Personalizar aulas com meu desempenho</label><p>Ao ativar, você autoriza o envio à Groq da média das últimas 12 tentativas, da quantidade de recuperações e de até seis pontos de revisão, somente ao preparar uma nova aula. Desativado, a aula usa apenas o conteúdo e os pré-requisitos da trilha.</p></section><section class="connection-section"><h3>Uma cópia com você</h3><p>Exporte ou restaure aulas, respostas e notas em JSON. A restauração combina o backup com seu histórico atual, sem apagar tentativas.</p><div class="button-row"><button class="button secondary" data-action="export">Exportar backup ↓</button><button class="button secondary" data-action="restore">Restaurar backup ↑</button></div><input id="backup-file" type="file" accept=".json,application/json" hidden></section><p id="settings-message" role="status"></p>`;
  if(!$('#settings').open) $('#settings').showModal();
}
async function generate() {
  if(busy) return; if(!config.aiReady) return settings();busy=true;render();
  try {const id=state.selected;const lesson=await api('/api/lesson',{lessonId:id,...(personalizeAI?{personalize:true,profile:learningProfile(state)}:{})});state.lessons[id]=lesson;persist();notice('Aula preparada e salva. Bons estudos!');}catch(e){notice(e.message);}finally{busy=false;render();}
}
async function evaluate() {
  if(busy||!material()||passed(state,state.selected,task)) return;
  if(!config.aiReady) return settings();
  const d=state.drafts[draftKey()] || {code:'',reasoning:''};if(!d.code.trim()&&!d.reasoning.trim()) return notice('Escreva uma solução ou explique seu raciocínio antes de enviar.');
  const id=state.selected,t=task,prompt=currentPrompt(),recovery=(latest(state,id,t)?.result.score??10)<8;
  busy=true;render();
  try {const result=await api('/api/evaluate',{lessonId:id,prompt,code:d.code,reasoning:d.reasoning});state.attempts.push({id:crypto.randomUUID(),time:Date.now(),lessonId:id,task:t,prompt,code:d.code,reasoning:d.reasoning,recovery,result});persist();tab='practice';notice(result.score>=8?'Etapa concluída! Você decide quando continuar.':'Feedback recebido. Prepare sua recuperação no novo enunciado.');}catch(e){notice(e.message);}finally{busy=false;render();}
}
function exportData() {const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`devpath-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,a[data-action]');if(!b||b.disabled) return;
  if(b.dataset.action==='close-settings') return $('#settings').close();
  if(b.dataset.action==='settings') return settings();
  if(b.dataset.action==='export') return exportData();
  if(b.dataset.action==='restore') {if(busy||syncRunning)return notice('Aguarde a operação em andamento.');return $('#backup-file').click();}
  if(b.dataset.action==='generate') return generate();
  if(b.dataset.action==='evaluate') return evaluate();
  if(b.dataset.action==='run-code')return executeCode();
  if(b.dataset.action==='stop-code')return stopCode();
  if(b.dataset.action==='clear-output'){clearOutput(draftKey());refreshOutput();return;}
  if(b.dataset.action==='sync') {await sync();return settings();}
  if(b.dataset.action==='import-local') {if(busy)return notice('Aguarde a avaliação terminar.');const local=read('devpath-state-local',emptyState());if(isState(local)){state=mergeStates(local,state);persist();await sync();render();settings();}return;}
  if(b.dataset.action==='logout') {if(syncRunning||busy) return notice('Aguarde a operação em andamento antes de sair.');clearTimeout(syncTimer);try{await sb('/auth/v1/logout',{method:'POST'});}catch{}session=null;localStorage.removeItem('devpath-session');load();syncLabel='Salvo neste navegador';render();return settings();}
  if(b.dataset.action==='home'){e.preventDefault();view='study';render();return;}
  if(b.dataset.action==='next-task'){task=Math.min(task+1,3);editor='code';render();return;}
  if(b.dataset.view){view=b.dataset.view;render();return;}
  if(b.dataset.module){moduleOpen=moduleOpen===Number(b.dataset.module)?0:Number(b.dataset.module);render();return;}
  if(b.dataset.lesson)return openLesson(b.dataset.lesson);
  if(b.dataset.tab){tab=b.dataset.tab;render();return;}
  if(b.dataset.editor){editor=b.dataset.editor;render();return;}
  if(b.dataset.task!==undefined){const n=Number(b.dataset.task);if(n<=currentTask(state,state.selected)||complete(state,state.selected)){task=n;editor='code';render();}}
});
document.addEventListener('change',async e=>{
  if(e.target.id==='personalize-ai'){personalizeAI=e.target.checked;write('devpath-personalize-ai',personalizeAI);return;}
  if(e.target.id==='backup-file'){
    const file=e.target.files?.[0]; if(!file)return;
    try {if(busy||syncRunning)throw new Error('Aguarde a operação em andamento.');if(file.size>5*1024*1024)throw new Error('O limite do backup é 5 MB.');const restored=parseBackup(await file.text());state=mergeStates(restored,state);persist();task=currentTask(state,state.selected);moduleOpen=selected().module;render();settings();notice('Backup restaurado e combinado com seu histórico.');}catch(err){notice(err.message);}finally{e.target.value='';}
    return;
  }
  if(e.target.id==='lesson-select')openLesson(e.target.value);
});
document.addEventListener('input',e=>{
  if(!['answer-code','answer-reasoning'].includes(e.target.id)||passed(state,state.selected,task))return;
  const k=draftKey();const d=state.drafts[k]||{code:'',reasoning:''};d[e.target.id==='answer-code'?'code':'reasoning']=e.target.value;d.time=Date.now();state.drafts[k]=d;persist();
});
document.addEventListener('keydown',e=>{if(e.target.id==='answer-code'&&!e.target.readOnly&&e.key==='Tab'){e.preventDefault();const el=e.target,start=el.selectionStart;el.setRangeText('  ',start,el.selectionEnd,'end');el.dispatchEvent(new Event('input',{bubbles:true}));}});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='auth-form') return;e.preventDefault();if(busy||syncRunning)return notice('Aguarde a operação em andamento.');
  const email=$('#email').value,password=$('#password').value,signup=e.submitter?.name==='signup';
  const buttons=[...e.target.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);$('#settings-message').textContent=signup?'Criando conta…':'Entrando…';
  try {const data=await sb(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});if(!data.access_token){$('#settings-message').textContent='Cadastro solicitado. Confira o e-mail para confirmar a conta e depois entre aqui.';return;}session=data;write('devpath-session',session);load();await sync();load();render();settings();notice('Conta conectada. Use “Importar estudo local” para trazer suas tentativas anteriores.');}catch(err){$('#settings-message').textContent=err.message;}finally{buttons.forEach(b=>b.disabled=false);}
});
window.addEventListener('online',()=>{if(session)sync();});
async function init() {try{config=await api('/api/config');personalizeAI=read('devpath-personalize-ai',config.personalizationDefault)===true;config.supabaseUrl=config.supabaseUrl.replace(/\/$/,'');session=read('devpath-session',null);load();render();if(session){await sync();load();render();}}catch(e){$('#app').innerHTML=`<div class="startup-error"><h1>Não foi possível iniciar.</h1><p>${esc(e.message)}</p><p>Confirme se o servidor está rodando com npm start e recarregue a página.</p></div>`;}}
init();
