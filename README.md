# DevPath — seu espaço pessoal de estudo

Aplicação local em português para se preparar para estágio e desenvolvimento júnior. Requer Node.js 22+. O editor e suas dependências são instalados localmente; não é necessário hospedar a aplicação.

## Começar no Windows

Na pasta `C:\Users\gusta\Documents\estudo`, abra um terminal:

```powershell
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Para encerrar, pressione Ctrl+C no terminal. Também pode usar `iniciar.bat`. O servidor aceita conexões apenas na sua máquina.

## Configurar a IA gratuita

1. Crie sua chave na [Groq Console](https://console.groq.com/keys).
2. Abra `.env` e preencha `GROQ_API_KEY=sua_chave`.
3. Reinicie o servidor com `npm start` e recarregue a página.

O modelo padrão é `openai/gpt-oss-120b`, configurável em `GROQ_MODEL`. O [plano gratuito da Groq](https://console.groq.com/docs/rate-limits) tem limites e pode mudar; confira o painel antes de ativar qualquer cobrança. A aplicação não configura pagamentos, não repete automaticamente requisições recusadas e permite uma chamada de IA por vez. Quando o limite acaba, seu rascunho continua salvo.

A chave permanece no servidor, nunca é enviada ao navegador. Código, raciocínio e enunciado são enviados à Groq ao avaliar; o tópico é enviado ao preparar uma aula. O botão Executar roda JavaScript em um Worker dentro de um iframe isolado no navegador. A IA continua corrigindo por leitura e pode errar; analise o feedback com senso crítico.

## Configurar o Supabase

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. No SQL Editor do projeto, execute o conteúdo de `supabase/schema.sql`. O script pode ser executado novamente.
3. Nas configurações de API do projeto, copie a Project URL e a chave **publishable** (ou `anon` legada).
4. Preencha no `.env`:

```dotenv
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

5. Em Authentication → URL Configuration, configure Site URL como `http://127.0.0.1:3000` (ajuste se mudar a porta).
6. Reinicie o servidor, abra Configurações na plataforma e escolha **Criar conta**. Esse usuário de estudo é separado da conta de acesso ao painel Supabase. Se houver confirmação por e-mail, confirme e depois use **Entrar**.
7. Use **Importar estudo local** para combinar o progresso feito antes de entrar com a conta atual.

Nunca utilize `service_role` nem uma chave `sb_secret_`. A chave pública identifica a aplicação; o login identifica você, e as políticas RLS permitem ler e atualizar somente sua própria linha. O script revoga acesso de usuários não autenticados. Referências: [chaves de API](https://supabase.com/docs/guides/getting-started/api-keys), [segurança e RLS](https://supabase.com/docs/guides/database/secure-data).

## Como estudar

- A trilha cobre os temas do texto enviado em 12 módulos e 46 aulas agrupadas por assunto. Veja todos os tópicos em **Meu progresso → Ver tópicos do módulo**.
- A primeira aula tem conteúdo inicial escrito e funciona para leitura sem IA. As demais aulas são **geradas sob demanda**, usando um programa fixo e os pré-requisitos da trilha. Não são 46 aulas previamente revisadas por um professor. Você precisará da chave para prepará-las e avaliar respostas. Em Configurações, você pode ativar a personalização para enviar à Groq a média das últimas 12 tentativas, o número de recuperações e até seis pontos de revisão ao preparar uma aula. Esse envio é opcional e vem desativado.
- Cada aula contém teoria, motivo de uso, exemplo comentado, erros comuns, três exercícios e uma questão de entrevista. Somente uma questão é mostrada por vez, sem gabarito prévio.
- Escreva seu código e explique suas escolhas na aba Raciocínio. Para questões conceituais, basta a explicação.
- Cada etapa exige nota mínima 8. Uma nota inferior gera um novo exercício de recuperação direcionado ao erro. Passe na recuperação para continuar. O histórico preserva as tentativas originais.
- A correção prioriza compreensão do conceito (7 pontos), aplicação ou justificativa pedida (2) e clareza suficiente (1). Erros de português, digitação e singular/plural não descontam nota quando o sentido técnico está claro. Respostas curtas e corretas podem ser aprovadas; sugestões opcionais não bloqueiam o avanço. Recuperação é voltada a erros técnicos ou lacunas essenciais. Essa regra vale para novas avaliações; notas anteriores são preservadas.
- A próxima aula só é liberada quando os três exercícios e a entrevista estão aprovados. Você escolhe quando começar a próxima aula.
- A conclusão mostra a média das quatro etapas aprovadas, tópicos aprendidos, erros ao longo das tentativas e pontos a revisar. **Meu progresso** mostra também a média de todas as tentativas, incluindo recuperações.
- Faça revisões a cada três aulas pelo histórico. O módulo final inclui code review, projeto full stack, STAR e simulação de entrevista.

## Dados e limites

Sem Supabase, rascunhos, aulas e tentativas ficam no `localStorage` deste navegador. Limpar os dados do navegador apaga essa cópia. Use **Exportar backup** para baixar um JSON legível; use **Restaurar backup** em Configurações para importar um JSON de até 5 MB. O arquivo é validado e combinado com o histórico atual, sem duplicar tentativas ou importar sessões.

Com login, o progresso fica em `public.study_progress`, em uma linha JSON por usuário. Alterações são salvas localmente primeiro e sincronizadas após uma pausa de digitação. Falhas são exibidas; use **Sincronizar agora** ou volte a ficar online para tentar novamente. Tentativas são combinadas por identificador e rascunhos pelo horário. A sincronização foi pensada para uso pessoal em uma máquina; edições simultâneas em várias abas ou dispositivos não têm garantia transacional contra conflitos.

A sessão de login é persistida neste navegador e renovada antes das chamadas ao Supabase. Use Sair em uma máquina compartilhada. Dados locais de visitantes e contas ficam em espaços separados. O backup contém suas respostas, nunca a chave Groq nem a sessão.

O armazenamento de progresso depende da internet quando usa Supabase; geração e correção dependem da Groq. A primeira aula e materiais já preparados podem ser lidos localmente enquanto o servidor estiver aberto. A execução local aceita JavaScript puro: não executa React/JSX, TypeScript sem compilação, Node.js, SQL, DOM ou imports de pacotes. Não há certificado nem garantia de aprovação em entrevistas.

## Desenvolvimento e validação

```powershell
npm run dev
npm test
npm run check:connections
```

O frontend usa HTML/CSS e JavaScript em módulos nativos; o backend usa o servidor HTTP do Node. A escolha reduz a configuração para um uso local individual. O curso inclui React, Node, SQL e TypeScript independentemente da tecnologia da interface.

- `public/course.js`: currículo e primeira aula.
- `public/app.js`: interface, rascunhos, autenticação e sincronização.
- `public/domain.js`: regras de progressão e combinação de estados.
- `server.mjs`: servidor local, validação e proxy da Groq.
- `supabase/schema.sql`: tabela e políticas por usuário.
- `tests/app.test.mjs`: progressão, recuperação, combinação de dados, contrato da IA e integração HTTP com provedor simulado.

O Monaco é empacotado localmente por `npm run build:editor`. Esse passo roda automaticamente antes de `npm start` e `npm run dev`; todos os arquivos do editor são servidos pela própria aplicação, sem CDN. Mudou `.env`? Reinicie o servidor. Porta ocupada? Altere `PORT=3001` e use o novo endereço; ajuste a Site URL do Supabase.

## Preparar o banco pelo terminal (opcional)

Para aplicar o SQL via PostgreSQL, instale as dependências com `npm install`, baixe o certificado CA pelo painel Supabase → Database Settings → SSL Configuration e salve como `supabase/prod-ca-2021.crt`. Execute `npm run db:setup`: a senha do banco é lida no terminal sem eco, usada somente em memória e não é salva no projeto. O script verifica certificado e hostname e aplica o SQL em uma transação. Se a rede exigir Session pooler, configure `SUPABASE_DB_HOST` no .env com o hostname exato fornecido pelo painel. Um certificado alternativo pode ser informado em `SUPABASE_DB_CA_FILE`.

`npm run check:connections` faz uma correção real com resposta fictícia na Groq (consome a cota da API), verifica Supabase Auth e a existência da tabela, sem salvar tentativas ou exibir chaves. O teste sem login não substitui uma verificação de sincronização autenticada.

`npm run check:grading` verifica a calibração da correção com três respostas fictícias: conceito correto com erros de escrita, resposta curta suficiente e erro conceitual relevante. Consome três chamadas à Groq e não altera o progresso. Por se tratar de IA, o resultado pode variar entre execuções.

## Editor e saída de código

O painel de código usa Monaco, base do editor do VS Code, com autocomplete JavaScript, sugestões de variáveis, dicas de parâmetros, realce de sintaxe, fechamento de parênteses e numeração de linhas. Ctrl+Espaço abre sugestões; Ctrl+Enter executa. Não inclui extensões ou um ambiente Node.js completo. O rascunho e o histórico de desfazer são preservados ao alternar abas enquanto a página está aberta; o texto continua salvo após recarregar.

A seção Saída, abaixo do editor, mostra console.log, info, warn, error, objetos, valores retornados e erros. Há botões Executar, Parar e Limpar. Cada execução começa em um ambiente novo. Timers e promises são aceitos dentro do limite de 4 segundos; loops infinitos são interrompidos. A saída limita-se a 100 mensagens e não é salva no Supabase. Executar não consome Groq nem atribui nota.

O iframe usa sandbox sem acesso à origem da aplicação e um Worker para manter a interface responsiva. A política CSP desse ambiente bloqueia rede e recursos externos; ele não tem acesso ao DOM ou ao armazenamento da plataforma. O código nunca é executado pelo servidor Node.
