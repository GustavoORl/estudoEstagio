let library, current=null, generation=0;
const models=new Map();
export function disposeCodeEditor(){generation++;if(current){current.listener.dispose();models.get(current.key).viewState=current.editor.saveViewState();current.editor.dispose();current=null;}}
export async function mountCodeEditor({key,value,readonly,onChange,onRun}) {
  const host=document.getElementById('monaco-host'),fallback=document.getElementById('answer-code');
  if(!host||!fallback)return;
  const turn=generation;
  try {
    const {monaco}=await (library??=import('/vendor/editor.js'));
    if(turn!==generation||!host.isConnected)return;
    let item=models.get(key);
    if(!item){item={model:monaco.editor.createModel(fallback.value,'javascript',monaco.Uri.parse(`file:///estudo/${encodeURIComponent(key)}.js`))};models.set(key,item);}
    // O textarea continua editável enquanto o Monaco carrega.
    if(item.model.getValue()!==fallback.value)item.model.setValue(fallback.value);
    host.hidden=false;fallback.hidden=true;host.parentElement.classList.add('monaco-mounted');
    const editor=monaco.editor.create(host,{model:item.model,theme:'devpath',editContext:false,automaticLayout:true,readOnly:readonly,minimap:{enabled:false},fontSize:13,fontFamily:'Consolas, monospace',lineHeight:22,tabSize:2,insertSpaces:true,scrollBeyondLastLine:false,wordWrap:'on',padding:{top:12,bottom:12},quickSuggestions:true,suggestOnTriggerCharacters:true,parameterHints:{enabled:true},wordBasedSuggestions:'currentDocument',autoClosingBrackets:'always',autoClosingQuotes:'always',formatOnPaste:true,ariaLabel:'Editor de código JavaScript',accessibilitySupport:'auto',fixedOverflowWidgets:true});
    if(item.viewState)editor.restoreViewState(item.viewState);
    let previousValue=fallback.value,reverting=false;
    const listener=editor.onDidChangeModelContent(()=>{
      if(reverting)return;
      const value=editor.getValue();
      if(value.length>20000){reverting=true;item.model.setValue(previousValue);reverting=false;const hint=document.getElementById('code-editor-status');if(hint)hint.textContent='Limite de 20 mil caracteres. Reduza o código antes de colar.';return;}
      previousValue=value;fallback.value=value;onChange(value);
    });
    editor.addAction({id:'devpath-run',label:'Executar JavaScript',keybindings:[monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter],run:onRun});
    current={editor,listener,key};
  } catch {if(host.isConnected){host.hidden=true;fallback.hidden=false;const hint=document.getElementById('code-editor-status');if(hint)hint.textContent='Editor simples ativo. Execute npm run build:editor para habilitar autocomplete.';}}
}
