import {createServer} from '../server.mjs';

// Casos fictícios: não lê nem altera respostas, notas ou progresso do estudante.
const cases = [
  {name:'Conceito correto com erros de escrita',prompt:'Qual a diferença entre let e const em JavaScript?',reasoning:'let deixa reatribuir o valor da variavel. const nao deixa reatribuir. Mas se for um objeto com const da pra mudar suas propriedade, porque isso nao e reatribuir a variavel.',approved:true},
  {name:'Resposta curta que atende ao enunciado',prompt:'O que é uma variável? Responda com suas palavras.',reasoning:'É um nome que a gente usa para guardar e acessar um valor no programa.',approved:true},
  {name:'Erro conceitual relevante continua exigindo recuperação',prompt:'Qual a diferença entre let e const em JavaScript?',reasoning:'let nunca pode mudar de valor e const permite reatribuir qualquer valor quantas vezes eu quiser.',approved:false}
];
const server=createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const example of cases) {
    const response=await fetch(`${origin}/api/evaluate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({lessonId:'1-1',prompt:example.prompt,code:'',reasoning:example.reasoning}),signal:AbortSignal.timeout(70000)});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error);
    const ok=(result.score>=8)===example.approved && (example.approved?result.recovery===null:!!result.recovery);
    console.log(JSON.stringify({case:example.name,score:result.score,passed:ok}));
    if(!ok)process.exitCode=1;
  }
} catch(e) {console.error(e.message);process.exitCode=1;}
finally {await new Promise(resolve=>server.close(resolve));}
