# Design mobile-first do acompanhamento de prescrições

## Objetivo

Transformar a experiência atual no celular em uma interface legível e confortável para toque, sem remover informações nem alterar a organização funcional existente.

A tarefa principal no celular é localizar um aluno e identificar rapidamente sua situação. A tarefa secundária é visualizar a demanda de prescrições de treino. A interface pode exigir mais rolagem vertical desde que os blocos permaneçam claramente separados, sem espaçamento excessivo.

## Diagnóstico

O documento já possui a meta `viewport` correta, mas conserva densidade de desktop em telas estreitas. Há textos auxiliares entre 10 e 13 px, controles e informações comprimidos lado a lado e ações pequenas diante da quantidade de conteúdo exibida. O resultado é uma página tecnicamente responsiva, mas visualmente reduzida, que exige zoom ou esforço de leitura.

## Direção escolhida

Será aplicado um refluxo mobile-first por CSS e, apenas onde necessário, pequenos ajustes semânticos no HTML gerado. O conteúdo, a ordem geral das seções e o fluxo de dados serão preservados. O desktop continuará usando a composição atual; as mudanças mais intensas serão aplicadas em telas de até 600 px.

Não será criada uma interface mobile separada, evitando duplicação de marcação e manutenção. Também não será usado simples escalonamento proporcional, pois isso não resolve a compressão horizontal.

## Hierarquia e fluxo mobile

1. O cabeçalho apresenta marca, título e atualização sem competir com a ação de busca.
2. A busca ocupa toda a largura e é o primeiro controle operacional.
3. Profissional e período são empilhados no celular.
4. As quatro métricas permanecem em grade 2 × 2 para comunicar a demanda sem criar rolagem horizontal.
5. Cada aluno é apresentado em um card recolhível. O resumo privilegia nome, situação, data e tempo de processo.
6. Ao abrir um aluno, profissional, etapas do processo, data e ações usam fluxo vertical.
7. As informações detalhadas de anamnese continuam em modal e em seções recolhíveis.

## Escala visual mobile

- Texto-base: 16 px, com altura de linha entre 1,45 e 1,55.
- Textos auxiliares: mínimo de 13 px.
- Rótulos: 12 a 13 px, com caixa alta apenas quando ajuda a identificação.
- Título principal: 24 a 28 px, adequado à largura disponível.
- Nome do aluno: 19 a 21 px, com quebra natural em vez de truncamento precoce.
- Valores das métricas: 34 a 40 px.
- Controles, botões e resumos clicáveis: mínimo de 48 px de altura.
- Botões principais: texto de 16 px e área de toque confortável.
- Espaçamento interno predominante: 12 px.
- Espaço entre blocos relacionados: 12 a 16 px.
- Espaço entre seções principais: 20 a 24 px.
- Margem lateral mobile: 16 px, reduzida para 12 px somente em telas muito estreitas.

## Componentes

### Cabeçalho

O cabeçalho será disposto em uma linha quando houver espaço, permitindo que o título quebre em até duas linhas. O botão Atualizar manterá área mínima de 48 px e poderá exibir apenas ícone e texto curto sem ficar comprimido. Em telas estreitas, ele permanecerá alinhado de forma previsível sem criar uma linha vazia desnecessária.

### Busca e filtros

A busca terá pelo menos 52 px de altura, texto de 16 px e ícone proporcional. Os dois filtros serão empilhados, também com pelo menos 52 px. Isso evita zoom automático em navegadores móveis e melhora a seleção por toque.

### Métricas

As métricas permanecerão em duas colunas. Cada cartão terá altura estável, valor dominante e rótulo legível. O estado selecionado será comunicado por borda, contraste e cor, não somente pelo filete decorativo.

### Lista de alunos

O resumo do card será reorganizado para evitar três elementos comprimidos na mesma linha. O nome ocupa a primeira linha; metadados e situação aparecem abaixo; a indicação de dias e o chevron permanecem visíveis em uma área lateral ou segunda linha, conforme a largura. O card aberto manterá separação clara entre resumo e conteúdo.

### Processo de prescrição

Profissional, toggles e data ocuparão a largura disponível. Cada toggle terá texto principal de pelo menos 16 px, ajuda de pelo menos 13 px e área clicável mínima de 56 px. Salvar será uma ação larga e evidente no mobile, colocada junto ao estado de salvamento. O botão de informações também ocupará a largura completa.

### Modal de anamnese

No celular, o modal se comportará como uma folha de tela quase completa, respeitando áreas seguras. O cabeçalho ficará estável, o botão Fechar terá 48 px e apenas o conteúdo interno rolará. Títulos de seção terão pelo menos 15 px; rótulos, 12 px; respostas, 16 px. Respostas não serão distribuídas em colunas no mobile.

## Estados e acessibilidade

- Estados de carregamento, sucesso, erro, vazio, foco e desabilitado serão preservados.
- Nenhuma ação dependerá exclusivamente de hover.
- O foco visível continuará com alto contraste.
- Não haverá rolagem horizontal em 320, 360, 390, 412 e 430 px.
- Conteúdo longo poderá quebrar linha sem ocultar ações.
- Áreas interativas terão no mínimo 44 px; o alvo preferencial será 48 px.
- A preferência por movimento reduzido continuará respeitada.

## Arquivos e limites da mudança

- `styles.html`: principal local da implementação responsiva.
- `scripts.html`: somente se for necessário adicionar classes ou ajustar a marcação dos cards.
- `index.html`: somente se o cabeçalho precisar de um agrupamento semântico adicional.
- `preview.html`: regenerado pelo script existente após as mudanças.
- `tests/frontend.test.js`: ampliado com verificações do contrato mobile.

O backend em `Código.gs`, a origem dos dados, filtros, salvamento e regras de situação não serão alterados.

## Validação

### Automatizada

- O JavaScript continuará compilando.
- O preview continuará resolvendo as inclusões do Apps Script.
- Os contratos funcionais atuais continuarão presentes.
- Testes verificarão a existência do breakpoint mobile, alturas mínimas, escala tipográfica essencial e ausência de padrões que comprimam o resumo do aluno.

### Visual e funcional

- Validar em larguras de 320, 360, 390, 412 e 430 px.
- Confirmar que busca, filtros, métricas, cards, toggles, data, Salvar e modal podem ser usados sem zoom.
- Confirmar ausência de rolagem horizontal e de sobreposição de textos.
- Confirmar que o nome do aluno e sua situação podem ser identificados rapidamente.
- Confirmar que a demanda das quatro categorias continua visível e comparável.
- Verificar que o layout desktop em 680 px ou mais permanece coerente.

## Critérios de aceite

1. O usuário consegue localizar um aluno e ler sua situação sem ampliar a tela.
2. Nenhum texto funcional importante no mobile fica abaixo de 13 px; entradas e respostas usam pelo menos 16 px.
3. Botões e controles importantes têm altura mínima de 48 px.
4. Blocos não ficam encostados e também não criam vazios excessivos.
5. A página não apresenta rolagem horizontal nas larguras móveis de referência.
6. Todas as informações e ações existentes permanecem disponíveis.
7. A experiência desktop continua funcional e visualmente consistente.

## Refinamento cromático da anamnese

Os enunciados das perguntas usam o verde de leitura `#A9BD49`, com contraste aproximado de 8,9:1 sobre a superfície `#0D1220`. O verde luminoso global permanece reservado a botões, ícones, indicadores e estados interativos. Essa separação reduz o cansaço visual sem enfraquecer a hierarquia ou a legibilidade das perguntas.

## Refinamento de densidade mobile

Após validação em aparelho real, a experiência confortável será compactada de forma leve para exibir aproximadamente 15–20% mais conteúdo por viewport. A organização permanece inalterada: filtros continuam empilhados, métricas em grade 2 × 2 e ações principais em largura total.

- Campos, ordenação e botões permanecem com no mínimo 48 px.
- Entradas mantêm texto de 16 px para evitar zoom automático.
- Cards de métricas passam de 112 para 96 px; valores passam de 40 para 35 px.
- Resumos de alunos passam de 116 para aproximadamente 100 px; nomes passam de 20 para 18 px.
- Toggles passam de 68 para 60 px, mantendo toda a área clicável.
- Cabeçalhos, paddings e intervalos verticais são reduzidos entre 8% e 15%.
- No modal, respostas passam para 15 px e os enunciados permanecem em 13 px.
- Controles de fechar e expandir permanecem com 48 px.
