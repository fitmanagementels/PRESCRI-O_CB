# Editor de questionário no gestor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o PWA do gestor crie, edite, salve e publique versões do questionário, mantendo uma única versão ativa e fazendo o PWA dos prescritores consumir a versão publicada.

**Architecture:** A aba `Questionário` deixa de ser somente um catálogo estático e passa a armazenar versões, etapas e perguntas, preservando as colunas já existentes. O PWA do gestor mantém o editor em memória e no `localStorage`, chamando Apps Script somente para carregar, salvar um rascunho ou publicar. O PWA dos prescritores lê a versão ativa do catálogo e envia respostas usando os códigos estáveis das perguntas; as colunas necessárias são materializadas em `Respostas` antes da publicação.

**Tech Stack:** Google Apps Script, Google Sheets, HTML/CSS/JavaScript sem frameworks, `LockService`, `CacheService`, `localStorage`, testes Node com `assert` e `vm`.

## Global Constraints

- Planilha oficial: `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`.
- Fonte oficial de versões: aba `Questionário`; respostas históricas em `Respostas` nunca são modificadas.
- Uma única versão pode ter o estado `Ativa`; a versão anterior vira `Arquivada` na mesma transação de publicação.
- Sem regras condicionais e sem arrastar e soltar.
- A versão `v2` e todas as versões futuras mostram todas as perguntas; as condicionais legadas de dor e assimetria serão removidas do PWA dos prescritores.
- Edições do editor só chamam o backend em `Salvar rascunho` ou `Publicar versão`.
- Ações de escrita ficam bloqueadas durante a chamada e preservam o rascunho em erro.
- Códigos internos são estáveis e não ficam editáveis na interface.
- Os campos operacionais `profissional`, `nomeCompleto` e `whatsapp` devem existir exatamente uma vez na versão ativa; o editor pode alterar seus rótulos e etapas, mas não os remover nem alterar seus tipos especiais. Os três são obrigatórios: os dois primeiros criam `Monitoramento`, e o WhatsApp permite contato pelo gestor.
- O cartão de demanda do dashboard oferece um link secundário `WhatsApp` para `https://wa.me/<numero-normalizado>` apenas quando houver número válido; não há envio automático ou mensagem pré-preenchida.

---

## File Structure

| Caminho | Responsabilidade |
| --- | --- |
| `Questionario.gs` (raiz) | Contrato, migração, leitura da versão ativa, validação, persistência e publicação do questionário para o PWA dos prescritores. |
| `Código.gs` (raiz) | Passar a usar o contrato dinâmico ao carregar, validar e gravar uma demanda. Manter o catálogo estático apenas como semente de migração. |
| `dashboard-analytics/Questionario.gs` | API administrativa do gestor para consultar, salvar e publicar o catálogo, isolada das métricas analíticas. |
| `dashboard-analytics/Config.gs` | Declarar a aba `Questionário` e aumentar a versão da chave de cache. |
| `dashboard-analytics/Código.gs` | Expor as funções públicas usadas pela nova aba e validar a fonte adicional sem afetar as leituras analíticas. |
| `dashboard-analytics/index.html` | Adicionar a quarta aba `Questionário`, lista de versões, editor e diálogos de confirmação. |
| `dashboard-analytics/styles.html` | Componentes visuais do editor, estados de rascunho, validação, modal e botões pendentes, responsivos. |
| `dashboard-analytics/scripts.html` | Estado local, `localStorage`, renderização, edição deliberada, chamadas Apps Script e bloqueio de ações. |
| `tests/backend.test.js` | Regressões do contrato de configuração e APIs públicas do gestor. |
| `tests/sheets.test.js` | Migração, validação, salvamento e publicação atômica usando planilha simulada. |
| `tests/frontend.test.js` | Estrutura da quarta aba, ausência de drag-and-drop, persistência local e estados de botão. |
| `tests/backend.test.js` (raiz) | PWA dos prescritores consome versão ativa dinâmica e preserva o vínculo de demanda. |
| `tests/frontend.test.js` (raiz) | Formulário por etapas monta a versão dinâmica e bloqueia o envio durante a chamada. |
| `dashboard-analytics/README_DEPLOY.md` | Publicação coordenada dos dois projetos Apps Script e procedimento de primeira migração. |

## Task 1: Criar o contrato versionado e a migração segura da aba Questionário

**Files:**
- Create: `Questionario.gs`
- Modify: `Código.gs`
- Modify: `tests/backend.test.js`

**Interfaces:**
- Produces `garantirCatalogoVersionadoPrescricao_()`, `obterQuestionarioAtivoPrescricao_()`, `validarRascunhoQuestionarioPrescricao_(rascunho)`, `salvarRascunhoQuestionarioPrescricao_(rascunho, revisaoEsperada)` e `publicarRascunhoQuestionarioPrescricao_(rascunho, revisaoEsperada)`.
- Consumes `PRESCRICAO_CONFIG`, `PRESCRICAO_QUESTIONARIOS.v2` como semente, `obterPlanilhaPrescricao_()` e `executarComLockPrescricao_()`.

- [ ] **Step 1: Escrever testes que falham para a migração e as regras de versão**

```js
const catalogo = context.garantirCatalogoVersionadoPrescricao_(spreadsheet);
assert.strictEqual(catalogo.versaoAtiva, 'v2');
assert.strictEqual(context.obterQuestionarioAtivoPrescricao_(spreadsheet).etapas.length, 6);

const invalido = context.validarRascunhoQuestionarioPrescricao_({
  questionarioId: 'anamnese_inicial', versao: 'v3', etapas: []
});
assert.strictEqual(invalido.ok, false);
assert(invalido.erros.some((erro) => /etapa/i.test(erro.mensagem)));
```

- [ ] **Step 2: Executar o teste e confirmar falha por funções ausentes**

Run: `node tests/backend.test.js`  
Expected: falha com `garantirCatalogoVersionadoPrescricao_ is not a function`.

- [ ] **Step 3: Implementar o contrato em `Questionario.gs`**

Criar as colunas de extensão, sem reordenar as oito colunas legadas: `Questionário ID`, `Nome do questionário`, `Tipo de registro`, `ID da etapa`, `Etapa`, `Ordem da etapa`, `Ordem da pergunta`, `Publicado em`, `Atualizado em`, `Revisão`.

Usar linhas `Tipo de registro = etapa` para cada etapa e `pergunta` para cada pergunta. Para `v2`, gerar seis etapas a partir do `etapa` numérico da semente existente e preencher os novos metadados nas perguntas já existentes; para `v1`, preservar linhas arquivadas sem alterar suas perguntas históricas. Cada pergunta deve conservar `Código` como chave estável e usar `Pergunta`, `Tipo`, `Obrigatória` e `Opções` como conteúdo editável.

Implementar validação que exige: uma ou mais etapas, uma ou mais perguntas em cada etapa, código único, texto/tipo válido, duas opções distintas para `unica`/`multipla`, e exatamente um `profissional` do tipo `profissional` e um `nomeCompleto` do tipo `texto`.

- [ ] **Step 4: Implementar transações de salvar e publicar**

`salvarRascunhoQuestionarioPrescricao_` deve exigir a revisão esperada, gravar somente linhas da versão rascunho e incrementar `Revisão`. `publicarRascunhoQuestionarioPrescricao_` deve executar sob `LockService`, validar, acrescentar colunas ausentes de perguntas em `Respostas`, arquivar a versão ativa, ativar o rascunho e limpar o cache de formulários. Ambas retornam `{ ok, questionario, revisao }`; conflito de revisão retorna erro explícito e não sobrescreve dados.

- [ ] **Step 5: Executar testes de backend e manter os existentes verdes**

Run: `node tests/backend.test.js`  
Expected: saída `Backend de prescrições aprovado.` e exit code 0.

## Task 2: Fazer o PWA dos prescritores consumir a versão ativa publicada

**Files:**
- Modify: `Código.gs`
- Modify: `scripts.html`
- Modify: `tests/backend.test.js`
- Modify: `tests/frontend.test.js`

**Interfaces:**
- Consumes `obterQuestionarioAtivoPrescricao_()` da Task 1.
- Produces `getQuestionarioPwaPrescricao()` dinâmico e `enviarDemandaPwaPrescricao()` validado contra a versão enviada.

- [ ] **Step 1: Escrever testes que falham para o formulário dinâmico**

```js
const questionario = context.getQuestionarioPwaPrescricao();
assert.strictEqual(questionario.versao, 'v2');
assert.strictEqual(questionario.etapas[0].titulo, 'Consentimento e responsável');
assert.strictEqual(questionario.campos.nomeCompleto.tipo, 'texto');
assert.strictEqual(questionario.campos.profissional.tipo, 'profissional');
```

Adicionar um teste de envio com `versao: 'v3'` e rascunho publicado, confirmando que o registro recebe `Versão do questionário = v3`, que a linha de `Monitoramento` usa o nome/profissional mapeados pelos códigos protegidos e que o envio sem `whatsapp` é recusado.

- [ ] **Step 2: Executar o teste e confirmar que ele falha com o contrato estático atual**

Run: `node tests/backend.test.js`  
Expected: falha porque `getQuestionarioPwaPrescricao()` ainda devolve etapas como strings e aceita somente `v2`.

- [ ] **Step 3: Substituir leituras estáticas pelas funções de contrato**

Em `Código.gs`, fazer `getQuestionarioPwaPrescricao()` retornar `versao`, `etapas` como `{ id, titulo, ordem, campos }`, `campos` indexados pelo código e profissionais ativos. Em `validarDemandaPwaPrescricao_`, carregar a versão ativa, comparar `formulario.versao`, validar apenas seus códigos e tipos, e usar os campos protegidos para construir `Monitoramento`. Em `prepararRegistroDemandaPwaPrescricao_`, gravar a versão realmente publicada e mapear cada resposta ao cabeçalho materializado.

- [ ] **Step 4: Ajustar o wizard sem alterar sua experiência mobile**

Em `scripts.html`, renderizar cada etapa pela lista `etapa.campos`, sem filtros condicionais por dor ou assimetria, manter a tela fixa `Revisar e enviar` após a última etapa editável e preservar rascunhos por `versao`. O botão de envio deve definir `state.demandSubmitting = true`, trocar o texto para `Enviando…`, ficar desabilitado e voltar ao normal em erro; somente remove o rascunho depois da confirmação do backend.

- [ ] **Step 5: Executar os testes do PWA operacional e gerar o preview**

Run: `node tests/backend.test.js && node tests/frontend.test.js && node scripts/build-preview.js`  
Expected: ambas as suítes aprovadas e `Preview gerado.`

## Task 3: Expor API administrativa do questionário no dashboard

**Files:**
- Create: `dashboard-analytics/Questionario.gs`
- Modify: `dashboard-analytics/Config.gs`
- Modify: `dashboard-analytics/Código.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`
- Modify: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Produces `getQuestionarioGestorAnalytics()`, `salvarRascunhoQuestionarioGestorAnalytics(rascunho, revisaoEsperada)` e `publicarQuestionarioGestorAnalytics(rascunho, revisaoEsperada)`.
- Consumes o mesmo esquema de `Questionário` da Task 1 e abre exclusivamente `ANALYTICS_CONFIG.spreadsheetId`.

- [ ] **Step 1: Escrever testes que falham para a API do gestor**

```js
assert.strictEqual(typeof context.getQuestionarioGestorAnalytics, 'function');
const gerenciamento = context.getQuestionarioGestorAnalytics();
assert.strictEqual(gerenciamento.ativa.versao, 'v2');
assert.strictEqual(gerenciamento.rascunho, null);

assert.throws(
  () => context.publicarQuestionarioGestorAnalytics({ versao: 'v3', etapas: [] }, 0),
  /etapa/i
);
```

- [ ] **Step 2: Executar os testes e confirmar falha por API inexistente**

Run: `node dashboard-analytics/tests/backend.test.js && node dashboard-analytics/tests/sheets.test.js`  
Expected: falha mencionando `getQuestionarioGestorAnalytics` ausente.

- [ ] **Step 3: Implementar a camada isolada `dashboard-analytics/Questionario.gs`**

Duplicar somente as funções de leitura, normalização, validação e persistência necessárias ao projeto independente. Não ler `Respostas` para construir a interface. A leitura retorna `{ ativa, rascunho, arquivadas, atualizadoEm }`; cada versão retorna `{ questionarioId, nome, versao, status, revisao, etapas }`, e cada etapa retorna suas perguntas em ordem. As operações de escrita usam `LockService`, `Revisão` esperada e mensagens de conflito claras.

- [ ] **Step 4: Conectar Config e Código ao novo contrato**

Adicionar `abaQuestionario: 'Questionário'` em `ANALYTICS_CONFIG`, aumentar a chave de cache para `dashboard_analytics_payload_pwa_v3`, incluir a verificação não destrutiva da aba em `validarDashboardAnalytics()` e expor as três funções globais para `google.script.run`. O cálculo de métricas continua lendo apenas `Respostas` e `Monitoramento`.

- [ ] **Step 5: Executar testes de integração da planilha simulada**

Run: `node dashboard-analytics/tests/backend.test.js && node dashboard-analytics/tests/sheets.test.js`  
Expected: `Backend analytics aprovado.` e `Integração segura com planilhas aprovada.`

## Task 4: Construir a aba Questionário e o editor local no PWA do gestor

**Files:**
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes APIs públicas da Task 3 por `executarAppsScript`.
- Produces o estado `questionarioGestor`, o rascunho local `dashboard-questionario-rascunho-v1`, e os handlers `criarNovaVersaoQuestionario`, `salvarRascunhoQuestionario` e `publicarQuestionario`.

- [ ] **Step 1: Escrever testes que falham para a quarta aba e a segurança de interação**

```js
assert(index.includes('data-tab="questionario"'));
assert(index.includes('data-view="questionario"'));
assert(scripts.includes("dashboard-questionario-rascunho-v1"));
assert(scripts.includes('function moverPerguntaParaEtapa'));
assert(!/draggable\s*=|dragstart|drop\b/.test(index + styles + scripts));
assert(scripts.includes("'Salvando…'"));
assert(scripts.includes("'Publicando…'"));
assert(scripts.includes('normalizarWhatsappGestor'));
assert(scripts.includes('https://wa.me/'));
```

- [ ] **Step 2: Executar o teste e confirmar falha por elementos e handlers ausentes**

Run: `node dashboard-analytics/tests/frontend.test.js`  
Expected: falha em `data-tab="questionario"`.

- [ ] **Step 3: Adicionar a estrutura HTML e os componentes CSS**

Inserir a quarta view e a quarta ação na navegação: `Questionário`. Criar área de versão ativa, rascunho e histórico; editor com cartões de etapa e pergunta; menu explícito `Mover para etapa…`; modal de confirmação para exclusão de etapa; modal de edição de pergunta; resumo de validação. Usar os mesmos tokens de cor, foco, tipografia e tamanhos de toque já usados pelo dashboard, com layout de uma coluna no mobile.

No cartão de cada demanda, acrescentar `WhatsApp` como ação secundária somente para número normalizável. O link abre em nova aba e usa `rel="noopener"`; nenhum número é incluído em preview, documentação ou teste de interface.

- [ ] **Step 4: Implementar estado local e edição sem chamadas de rede**

Carregar a resposta de `getQuestionarioGestorAnalytics()` apenas ao abrir a aba. `Criar nova versão` clona a versão ativa em memória como próxima versão; criar/editar/excluir/mover/reordenar atualiza `state.questionarioGestor.rascunho`, recalcula validação e grava uma cópia JSON em `localStorage`. Não usar `google.script.run` nessas ações. A exclusão de etapa deve mostrar a quantidade exata de perguntas e só remover após confirmação explícita.

- [ ] **Step 5: Implementar salvar/publicar com estado pendente e resolução de conflito**

Centralizar em `executarAcaoQuestionario(botao, textoPendente, chamada)`: definir `disabled`, `aria-busy`, rótulo pendente e restaurar estado em `finally`. `Salvar rascunho` e `Publicar versão` mandam a revisão esperada e atualizam a cópia local apenas após sucesso. Falha de rede mantém o `localStorage`; conflito de revisão mostra a opção de recarregar o rascunho oficial, sem sobrescrever automaticamente.

- [ ] **Step 6: Executar testes de frontend e gerar o preview**

Run: `node dashboard-analytics/tests/frontend.test.js && node dashboard-analytics/scripts/build-preview.js`  
Expected: `Frontend analytics aprovado.` e `Preview analytics gerado.`

## Task 5: Validar a integração, documentar a publicação e inspecionar visualmente

**Files:**
- Modify: `dashboard-analytics/README_DEPLOY.md`
- Modify: `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`
- Modify: `Contexto/CONTEXTO_DO_PROJETO.md`

**Interfaces:**
- Consumes as APIs, o contrato de abas e os fluxos das Tasks 1 a 4.
- Produces instruções de implantação coordenada e checklist de aceite.

- [ ] **Step 1: Atualizar documentação de implantação**

Documentar a ordem segura: publicar primeiro o PWA dos prescritores com o leitor dinâmico e a migração disponível; executar a migração uma vez; publicar o dashboard com o editor; criar uma versão de teste; validar o formulário; então ativar a versão. Informar explicitamente que atualizar a versão ativa só ocorre em `Publicar versão` e que não se deve editar linhas de `Questionário` manualmente.

- [ ] **Step 2: Executar a suíte completa e a geração dos dois previews**

Run: `node tests/backend.test.js && node tests/frontend.test.js && node tests/responsive.test.js && node scripts/build-preview.js && node dashboard-analytics/tests/backend.test.js && node dashboard-analytics/tests/sheets.test.js && node dashboard-analytics/tests/frontend.test.js && node dashboard-analytics/scripts/build-preview.js`  
Expected: todas as suítes aprovadas e ambos os previews gerados.

- [ ] **Step 3: Fazer inspeção visual de desktop e mobile do dashboard**

Run: `google-chrome --headless --disable-gpu --screenshot=/tmp/dashboard-questionario-desktop.png --window-size=1440,1100 file://$PWD/dashboard-analytics/preview.html` e `google-chrome --headless --disable-gpu --screenshot=/tmp/dashboard-questionario-mobile.png --window-size=412,915 file://$PWD/dashboard-analytics/preview.html`  
Expected: capturas criadas; verificar visualmente navegação, cards, modal de confirmação, botões pendentes e ausência de controles de arraste.

- [ ] **Step 4: Registrar resultado e limite de publicação**

Atualizar `Contexto/CONTEXTO_DO_PROJETO.md` com a decisão de versão única ativa, rascunho local e ausência de condicionais/drag-and-drop. Informar que a publicação efetiva exige copiar os arquivos alterados para os dois projetos Apps Script e criar nova versão em cada implantação.
