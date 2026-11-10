// Este documento é carregado com sandbox sem allow-same-origin.
// Seu Worker herda a política que bloqueia rede e outros recursos.
(() => {
  function workerMain() {
    const send=self.postMessage.bind(self);
    const stringify=value=>{
      const seen=new WeakSet();
      try{if(typeof value==='string')return value.slice(0,6000);if(value===undefined)return 'undefined';if(typeof value==='function')return `[Function ${value.name||'anônima'}]`;return JSON.stringify(value,(_key,item)=>{if(typeof item==='bigint')return `${item}n`;if(typeof item==='function')return '[Function]';if(item instanceof Error)return `${item.name}: ${item.message}`;if(item&&typeof item==='object'){if(seen.has(item))return '[Circular]';seen.add(item);}return item;},2)?.slice(0,6000)??String(value);}catch{return '[Valor não serializável]';}
    };
    let lines=0;
    const nativeTimeout=self.setTimeout.bind(self),nativeClearTimeout=self.clearTimeout.bind(self),nativeInterval=self.setInterval.bind(self),nativeClearInterval=self.clearInterval.bind(self);
    const pending=new Set();let mainDone=false,finished=false;
    const finish=()=>nativeTimeout(()=>{if(mainDone&&!pending.size&&!finished){finished=true;send({type:'finished'});}},0);
    self.setTimeout=(callback,delay,...args)=>{const id=nativeTimeout(()=>{pending.delete(id);try{callback(...args);}finally{finish();}},delay);pending.add(id);return id;};
    self.clearTimeout=id=>{nativeClearTimeout(id);pending.delete(id);finish();};
    self.setInterval=(callback,delay,...args)=>{const id=nativeInterval(callback,delay,...args);pending.add(id);return id;};
    self.clearInterval=id=>{nativeClearInterval(id);pending.delete(id);finish();};
    const output=(level,args)=>{if(lines++<100)send({type:'output',level,text:args.map(stringify).join(' ').slice(0,12000)});else if(lines===101)send({type:'output',level:'warn',text:'Limite de 100 mensagens atingido.'});};
    const safeConsole=Object.fromEntries(['log','info','warn','error','debug','table','dir'].map(level=>[level,(...args)=>output(level,args)]));
    const counts=new Map(),times=new Map();
    safeConsole.assert=(condition,...args)=>{if(!condition)output('error',['Assertion failed:',...args]);};
    safeConsole.count=(label='default')=>{const n=(counts.get(label)||0)+1;counts.set(label,n);output('log',[`${label}: ${n}`]);};
    safeConsole.countReset=(label='default')=>counts.delete(label);
    safeConsole.time=(label='default')=>times.set(label,performance.now());
    safeConsole.timeLog=(label='default',...args)=>{if(times.has(label))output('log',[`${label}: ${(performance.now()-times.get(label)).toFixed(2)} ms`,...args]);};
    safeConsole.timeEnd=(label='default')=>{safeConsole.timeLog(label);times.delete(label);};
    safeConsole.group=safeConsole.groupCollapsed=(...args)=>output('log',args);
    safeConsole.groupEnd=()=>{};
    safeConsole.dirxml=safeConsole.dir;
    safeConsole.trace=(...args)=>output('log',[...args,new Error().stack]);
    safeConsole.clear=()=>send({type:'clear'});
    self.console=safeConsole;
    self.addEventListener('error',event=>{output('error',[`${event.error?.name||'Erro'}: ${event.message}`]);event.preventDefault();});
    self.addEventListener('unhandledrejection',event=>{output('error',[event.reason]);event.preventDefault();});
    self.onmessage=async event=>{
      try{
        const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
        const result=await new AsyncFunction('console','"use strict";\n'+event.data+'\n//# sourceURL=meu-exercicio.js')(safeConsole);
        if(result!==undefined)output('result',[result]);
        mainDone=true;finish();
      }catch(error){output('error',[`${error.name}: ${error.message}`]);send({type:'finished',error:true});}
    };
  }
  let worker,blobUrl;
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.data?.type!=='run'||typeof event.data.code!=='string')return;
    worker?.terminate();if(blobUrl)URL.revokeObjectURL(blobUrl);
    const runId=event.data.runId;
    blobUrl=URL.createObjectURL(new Blob([`(${workerMain.toString()})()`],{type:'text/javascript'}));
    worker=new Worker(blobUrl);
    worker.onmessage=message=>parent.postMessage({...message.data,runId},'*');
    worker.onerror=()=>parent.postMessage({type:'failure',runId},'*');
    worker.postMessage(event.data.code);
  });
  parent.postMessage({type:'runner-ready'},'*');
})();
