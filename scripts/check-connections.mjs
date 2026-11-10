import {createServer, publicConfig} from '../server.mjs';
import {starterLesson} from '../public/course.js';

// Usa as chaves apenas em memória; nunca imprime URLs, tokens ou respostas pessoais.
const config = publicConfig();
const checks = [];
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${origin}/api/evaluate`, {
    method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'},
    body: JSON.stringify({lessonId:'1-1', prompt:starterLesson.exercises[0], code:'const nome = "Aluno de teste";\nlet idade = 20;\nconst matriculaAtiva = true;', reasoning:'Nome é uma string e matrícula é um boolean. Ambos ficam constantes neste cadastro. Idade é number e pode ser atualizada, por isso usei let.'}), signal:AbortSignal.timeout(70000)
  });
  const data = await response.json();
  checks.push({service:'Groq', ok:response.ok, detail:response.ok?'Avaliação real recebida e validada; nenhuma tentativa foi salva.':data.error});
  if(config.supabaseUrl && config.supabaseKey) {
    const headers = {apikey:config.supabaseKey};
    const auth = await fetch(`${config.supabaseUrl.replace(/\/$/,'')}/auth/v1/settings`,{headers,signal:AbortSignal.timeout(15000)});
    checks.push({service:'Supabase Auth',ok:auth.ok,detail:auth.ok?'URL e chave pública aceitas.':`Resposta HTTP ${auth.status}.`});
    const table = await fetch(`${config.supabaseUrl.replace(/\/$/,'')}/rest/v1/study_progress?select=user_id&limit=0`,{headers,signal:AbortSignal.timeout(15000)});
    const body = await table.json().catch(()=>({}));
    const protectedTable = body?.code==='42501';
    checks.push({service:'Supabase tabela',ok:protectedTable || table.ok,detail:protectedTable?'Tabela encontrada; acesso sem login bloqueado.':table.ok?'Tabela acessível. Verifique as políticas RLS no painel.':body?.code==='PGRST205'?'Tabela study_progress ausente. Execute supabase/schema.sql.':`Resposta HTTP ${table.status}; confira o esquema e a chave pública.`});
  } else checks.push({service:'Supabase',ok:false,detail:'Configuração incompleta.'});
} catch {
  checks.push({service:'Conectividade',ok:false,detail:'Falha de conexão ou tempo limite. Nenhuma credencial foi exibida.'});
} finally {await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify(checks,null,2));
if(checks.some(c=>!c.ok)) process.exitCode=1;
