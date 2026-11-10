const LIMIT_MS=4000;
const outputs=new Map();
let active=null;
export function outputFor(key){return outputs.get(key)||{lines:[],status:'Pronto para executar'};}
export function isRunning(key){return active?.key===key;}
export function stopCode(reason='Execução interrompida.') {
  if(!active)return;
  const a=active;active=null;clearTimeout(a.timeout);clearTimeout(a.doneTimer);window.removeEventListener('message',a.listener);a.frame.remove();a.state.status=reason;a.onUpdate();
}
export function clearOutput(key){if(active?.key===key)stopCode();outputs.set(key,{lines:[],status:'Saída limpa'});}
export function runCode({key,code,onUpdate}) {
  stopCode();
  const state={lines:[],status:'Executando…'};outputs.set(key,state);
  const frame=document.createElement('iframe');frame.hidden=true;frame.sandbox='allow-scripts';frame.src='/runner-frame.html';frame.title='Execução isolada de JavaScript';
  const runId=crypto.randomUUID();
  const a={frame,key,state,onUpdate};
  const add=(level,text)=>{if(state.lines.length<101){state.lines.push({level,text:String(text).slice(0,12000)});onUpdate();}};
  a.listener=event=>{
    if(event.source!==frame.contentWindow||active!==a)return;
    const message=event.data;
    if(message?.type==='runner-ready'){frame.contentWindow.postMessage({type:'run',runId,code},'*');return;}
    if(message?.runId!==runId)return;
    if(message.type==='output'&&typeof message.text==='string')add(message.level,message.text);
    else if(message.type==='clear'){state.lines=[];onUpdate();}
    else if(message.type==='finished'){
      state.status=message.error?'Código encerrado com erro':'Código executado';onUpdate();
      // Janela curta para timers, callbacks e rejeições não aguardadas.
      a.doneTimer=setTimeout(()=>stopCode(message.error?'Código encerrado com erro':'Execução concluída'),350);
    }else if(message.type==='failure'){add('error','Não foi possível iniciar a execução isolada.');stopCode('Falha na execução');}
  };
  a.timeout=setTimeout(()=>{add('warn','Execução encerrada após 4 segundos. Confira loops ou operações que não terminam.');stopCode('Tempo limite atingido');},LIMIT_MS);
  active=a;window.addEventListener('message',a.listener);document.body.append(frame);onUpdate();
}
