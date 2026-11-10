export const modules = [
  ['Lógica de programação', 'A base para resolver problemas com autonomia.', [
    ['Variáveis e tipos', 'Variáveis e constantes; tipos de dados; var, let e const; tipos primitivos e por referência'],
    ['Operadores e decisões', 'Operadores aritméticos, lógicos e relacionais; condicionais; truthy e falsy; coerção; == e ===; &&, ||, ?? e ?.'],
    ['Repetição e raciocínio lógico', 'for; while; do while; resolução de problemas; validação de entradas'],
    ['Funções e organização', 'Funções tradicionais; arrow functions; parâmetros; retorno; escopo'],
    ['Arrays, matrizes e objetos', 'Arrays; matrizes; objetos; mutabilidade e imutabilidade']
  ]],
  ['JavaScript por dentro', 'Entenda o comportamento da linguagem.', [
    ['Escopo e closures', 'Escopo léxico; hoisting; Temporal Dead Zone; closures; callbacks'],
    ['Coleções no dia a dia', 'Destructuring; spread e rest; map, filter, reduce, find, some, every e forEach'],
    ['Objetos e orientação a objetos', 'this; protótipos; classes; encapsulamento; herança; composição'],
    ['JavaScript assíncrono', 'Call Stack; Event Loop; Promises; async e await; tratamento de erros'],
    ['Módulos e TypeScript', 'ES Modules; tipagem estática; interfaces; unions; narrowing; introdução a TypeScript']
  ]],
  ['Algoritmos e estruturas', 'Escolha soluções e explique seus custos.', [
    ['Recursividade', 'Caso base; passo recursivo; pilha de chamadas; iteração versus recursão'],
    ['Busca, ordenação e Big O', 'Busca linear e binária; algoritmos de ordenação; complexidade de tempo e espaço; Big O'],
    ['Estruturas de dados', 'Pilhas; filas; listas; mapas; conjuntos; aplicações práticas']
  ]],
  ['HTML e CSS', 'Construa interfaces que funcionam para todos.', [
    ['HTML semântico e formulários', 'HTML semântico; formulários e validação; acessibilidade; SEO básico'],
    ['Fundamentos de CSS', 'Box Model; seletores; especificidade; position; unidades relativas; organização e estilização'],
    ['Layouts responsivos', 'Flexbox; CSS Grid; responsividade; Media Queries; animações e transições']
  ]],
  ['JavaScript no navegador', 'Transforme páginas em aplicações.', [
    ['DOM e eventos', 'Manipulação do DOM; eventos; propagação; delegação; segurança básica no front-end'],
    ['APIs e armazenamento', 'Fetch API; HTTP e JSON; Local Storage; Session Storage; debounce e throttle']
  ]],
  ['React', 'Da primeira interface a um projeto organizado.', [
    ['Componentes e JSX', 'Componentes; JSX; props; renderização condicional; listas e keys; eventos'],
    ['Estado e formulários', 'State; useState; formulários controlados; renderização e reconciliação; Virtual DOM'],
    ['Efeitos e ciclo de vida', 'useEffect; useRef; ciclo de vida; consumo de APIs; limpeza e cancelamento'],
    ['Hooks e estado compartilhado', 'useContext; Context API; Custom Hooks; gerenciamento de estado'],
    ['Rotas e organização', 'React Router; organização de projetos; tratamento de erros; segurança básica no front-end'],
    ['Performance e testes', 'useMemo; useCallback; performance e otimização; testes de componentes']
  ]],
  ['Node.js e APIs', 'Crie um backend com regras claras.', [
    ['Runtime e servidor HTTP', 'O que é Node.js; runtime e arquitetura; Event Loop e programação assíncrona; CommonJS versus ES Modules; NPM e dependências; servidores HTTP'],
    ['Express e arquitetura em camadas', 'Express; rotas; Controllers, Services e Models; middlewares; MVC'],
    ['APIs REST e validação', 'REST; métodos HTTP; códigos de status; validação de dados; tratamento de erros; paginação e filtros'],
    ['Autenticação e segurança', 'Autenticação e autorização; JWT; cookies e sessões; hash de senhas; CORS; variáveis de ambiente; segurança de APIs'],
    ['APIs prontas para uso', 'Upload de arquivos; logs; testes de API; deploy e configuração de produção']
  ]],
  ['Banco de dados', 'Modele e consulte dados com confiança.', [
    ['Modelagem e relacionamentos', 'Bancos relacionais e não relacionais; modelagem de dados; MER e DER; chaves primárias e estrangeiras; relacionamentos; normalização'],
    ['SQL essencial', 'PostgreSQL e MySQL; SELECT, INSERT, UPDATE e DELETE; WHERE; ORDER BY; GROUP BY'],
    ['Consultas e integridade', 'JOINs; subqueries; índices; constraints; otimização de consultas'],
    ['Transações e concorrência', 'Transações; ACID; concorrência e locks'],
    ['Prisma ORM', 'Prisma ORM; migrations; consultas e relacionamentos com Prisma']
  ]],
  ['Ferramentas de trabalho', 'Pratique o fluxo de uma equipe de desenvolvimento.', [
    ['Git e colaboração', 'Git init, add, commit, push e pull; branches; merge e rebase; conflitos; Pull Requests; Git Flow; versionamento'],
    ['Ambiente e debugging', 'VS Code; terminal; Insomnia/Postman; debugging; noções de Linux'],
    ['Docker, CI/CD e nuvem', 'Docker básico; CI/CD básico; noções de computação em nuvem']
  ]],
  ['Engenharia de software', 'Escreva código que outras pessoas conseguem manter.', [
    ['Código e design', 'Programação orientada a objetos; SOLID; Clean Code; DRY, KISS e YAGNI; Design Patterns básicos'],
    ['Arquitetura e qualidade', 'Arquitetura em camadas; REST; monólitos e microsserviços; testes unitários e de integração; segurança básica de aplicações'],
    ['Trabalho em equipe', 'Metodologias ágeis; Scrum e Kanban; documentação técnica; requisitos funcionais e não funcionais']
  ]],
  ['IA aplicada ao desenvolvimento', 'Integre IA com critério e responsabilidade.', [
    ['Fundamentos de IA', 'Fundamentos de Inteligência Artificial; Machine Learning versus IA Generativa; Large Language Models (LLMs); limitações e alucinações'],
    ['Integrações e prompts', 'Engenharia de prompts; consumo de APIs de IA; integração de IA em aplicações web; segurança; uso responsável de IA no desenvolvimento; automação e produtividade']
  ]],
  ['Preparação para a primeira vaga', 'Transforme conhecimento em uma boa entrevista.', [
    ['Desafios e code review', 'Perguntas técnicas de JavaScript, React, Node.js e SQL; exercícios de lógica; desafios de programação; code review; identificação e correção de bugs'],
    ['Portfólio full stack', 'Projeto pessoal full stack; explicação de projetos pessoais; decisões de arquitetura; README; apresentação de resultados'],
    ['Entrevista comportamental', 'Perguntas comportamentais; metodologia STAR; trabalho em equipe; comunicação; resolução de conflitos; pensamento analítico; dinâmicas de grupo'],
    ['Simulação de entrevista', 'Simulações completas de entrevistas técnicas; revisão periódica de conteúdos anteriores; plano de revisão para estágio, trainee e júnior']
  ]]
].map(([title, description, items], index) => ({id: index + 1, title, description, lessons: items.map(([title, topics], n) => ({id: `${index + 1}-${n + 1}`, title, topics, module: index + 1}))}));
export const lessons = modules.flatMap(m => m.lessons);
export const starterLesson = {
  theory: 'Uma variável associa um nome a um valor. Use const quando não precisar reatribuir esse nome e let quando a reatribuição fizer parte do problema.\n\nOs tipos primitivos incluem string, number, boolean, undefined, null, bigint e symbol. Objetos são valores por referência: duas variáveis podem apontar para o mesmo objeto. const impede reatribuição, mas não congela objetos.\n\nvar tem escopo de função e permite redeclaração; prefira let e const no código moderno.',
  why: 'Em um cadastro, nomes, preços e permissões têm significados diferentes. Nomes claros e tipos adequados tornam regras de negócio compreensíveis e evitam erros como somar texto com número.',
  example: 'const nomeProduto = "Caderno";\nconst precoUnitario = 18.5;\nlet quantidadeEmEstoque = 12;\nquantidadeEmEstoque = 11;\nconst disponivel = quantidadeEmEstoque > 0;\nconsole.log(nomeProduto, disponivel);',
  walkthrough: 'O nome e o preço não são reatribuídos, por isso usam const. O estoque muda e usa let. A comparação produz um boolean. O exemplo modela um estoque, enquanto os exercícios trabalham outros contextos.',
  mistakes: ['Usar const e depois tentar reatribuir o nome.', 'Confundir o número 10 com a string "10".', 'Acreditar que const torna as propriedades de um objeto imutáveis.', 'Usar nomes vagos ou var sem entender seu escopo.'],
  exercises: [
    'Declare o nome de um aluno, sua idade e se a matrícula está ativa. Escolha let ou const para cada valor e justifique os tipos usados. Não é necessário criar funções.',
    'Um aplicativo registra a meta semanal de estudo e as horas já estudadas. Modele esses dados, simule duas atualizações das horas e explique por que cada declaração pode ou não ser reatribuída.',
    'Modele os dados de uma inscrição em uma vaga: cargo, empresa, salário estimado, status e dados de contato em um objeto. Atualize o status e uma propriedade do contato. Explique a diferença entre alterar uma propriedade e reatribuir uma variável const.'
  ],
  interview: 'Qual é a diferença entre let, const e var? Por que é possível alterar uma propriedade de um objeto declarado com const? Use um exemplo próprio para justificar.'
};
