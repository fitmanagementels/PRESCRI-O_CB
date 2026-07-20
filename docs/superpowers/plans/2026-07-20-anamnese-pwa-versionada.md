# Anamnese versionada no PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o PWA criar demandas de anamnese `v2` diretamente na nova planilha e continuar exibindo o histórico `v1` importado do Tally.

**Architecture:** A nova `Respostas` será uma tabela de uma linha por demanda, identificada por códigos de campo estáveis e pela versão do questionário. O Apps Script valida e grava a demanda com lock e chave de idempotência; o frontend contém um wizard mobile-first e salva rascunho por seis horas no navegador. O dashboard lê o novo contrato por aliases de cabeçalho.

**Tech Stack:** Google Apps Script, Google Sheets, HTML Service, JavaScript ES5/ES6 compatível com Apps Script, CSS, Node `assert` para testes estáticos.

## Global Constraints

- A nova base é uma cópia integral da planilha atual; a base do Tally é somente arquivo histórico.
- Não escrever anamneses incompletas em planilha; rascunhos ficam no navegador por 6 horas.
- Publicação do PWA: qualquer usuário com conta Google; profissional escolhido manualmente entre linhas `Ativo` em `Complementar`.
- `Respostas` tem uma linha por demanda, usa `ID da demanda`, `Origem`, `Criado em` e `Versão do questionário`.
- Tally importado é `v1`; formulário PWA é `v2`; perguntas futuras não removem colunas nem alteram versões anteriores.
- `Frequência pretendida (dias/semana)` é obrigatória em `v2` e limitada aos inteiros 1–7.
- Não alterar o visual ou fluxo do acompanhamento de gestor fora da compatibilidade necessária.
- O diretório local não possui repositório Git funcional; registrar verificações, mas não tentar commits.

---

## File structure

- `Código.gs`: contratos de planilha, catálogo `v2`, migração, gravação idempotente e payloads do PWA.
- `index.html`: navegação entre acompanhamento existente e `Adicionar demanda`; estrutura semântica do wizard.
- `scripts.html`: estado do wizard, rascunho local, renderização de etapas, validação cliente e chamadas Apps Script.
- `styles.html`: layout mobile-first do wizard, seletor de etapas, revisão e estados de erro/sucesso.
- `tests/backend.test.js`: contratos de campo, validação, geração de IDs e idempotência sem serviços Google.
- `tests/frontend.test.js`: presença estrutural do formulário e compilação do JavaScript.
- `dashboard-analytics/Config.gs` e `dashboard-analytics/Dados.gs`: aliases do novo contrato e novo ID da base após a cópia existir.
- `dashboard-analytics/tests/backend.test.js`, `dashboard-analytics/tests/sheets.test.js`: cobertura do novo contrato de leitura.
- `docs/IMPLANTACAO_PLANILHA_OFICIAL.md` e `Contexto/CONTEXTO_DO_PROJETO.md`: instruções da nova base e transição.

### Task 1: Definir contratos versionados e testes de backend

**Files:**
- Modify: `tests/backend.test.js`
- Modify: `Código.gs`

**Interfaces:**
- Produces `PRESCRICAO_CABECALHOS_RESPOSTAS`, `PRESCRICAO_QUESTIONARIOS`, `validarDemandaPwaPrescricao_`, `criarIdDemandaPrescricao_`.
- Consumes objetos de formulário no formato `{ versao, tentativaId, respostas }`.

- [ ] **Step 1: Adicionar testes que falham para o contrato `v2`**

```js
assert.strictEqual(PRESCRICAO_CABECALHOS_RESPOSTAS[0], 'ID da demanda');
assert.strictEqual(PRESCRICAO_QUESTIONARIOS.v2.campos.frequenciaPretendida.opcoes.length, 7);
assert.throws(() => validarDemandaPwaPrescricao_({
  versao: 'v2', respostas: { profissional: 'Elias', frequenciaPretendida: '8' }
}), /Frequência pretendida/);
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node tests/backend.test.js`  
Expected: falha por contrato `v2` ausente.

- [ ] **Step 3: Implementar o catálogo de campos e validação mínima**

```js
const PRESCRICAO_QUESTIONARIOS = Object.freeze({
  v2: Object.freeze({
    campos: Object.freeze({
      frequenciaPretendida: Object.freeze({
        cabecalho: 'Frequência pretendida (dias/semana)', tipo: 'select',
        obrigatorio: true, opcoes: ['1', '2', '3', '4', '5', '6', '7'], etapa: 4,
      }),
    }),
  }),
});
```

`validarDemandaPwaPrescricao_` deve rejeitar versão diferente de `v2`, profissional vazio, tentativa sem UUID e qualquer valor fora das opções de frequência.

- [ ] **Step 4: Executar o teste e confirmar aprovação**

Run: `node tests/backend.test.js`  
Expected: `Backend: testes de regras e payload aprovados.`

### Task 2: Reestruturar a leitura e a escrita de demandas

**Files:**
- Modify: `Código.gs`
- Modify: `tests/backend.test.js`

**Interfaces:**
- Consumes a tabela `Respostas` com os cabeçalhos canônicos.
- Produces `enviarDemandaPwaPrescricao(formulario)`, `getQuestionarioPwaPrescricao()` e `getProfissionaisAtivosPrescricao()`.

- [ ] **Step 1: Adicionar testes para idempotência e linha de monitoramento**

```js
const primeiro = prepararRegistroDemandaPwaPrescricao_(formulario, new Date(2026, 6, 20));
assert.strictEqual(primeiro.resposta['Versão do questionário'], 'v2');
assert.strictEqual(primeiro.monitoramento[4], false);
assert.strictEqual(primeiro.monitoramento[5], false);
assert.strictEqual(primeiro.resposta['Frequência pretendida (dias/semana)'], '3');
```

- [ ] **Step 2: Executar os testes e confirmar a falha**

Run: `node tests/backend.test.js`  
Expected: falha porque `prepararRegistroDemandaPwaPrescricao_` não existe.

- [ ] **Step 3: Implementar escrita segura**

Implementar `enviarDemandaPwaPrescricao` dentro de `executarComLockPrescricao_`:

1. validar `v2`;
2. procurar `tentativaId` em coluna técnica `ID da tentativa`; se existir, devolver o mesmo resultado;
3. gerar `DEM-AAAAMMDD-<UUID curto>`;
4. montar valores pela ordem dos cabeçalhos, sem usar índices fixos;
5. acrescentar a linha em `Respostas` e uma linha correspondente em `Monitoramento`;
6. limpar o cache de payload e devolver `{ ok, demandaId, criadoEm }`.

Atualizar os leitores para mapear `ID da demanda`, `Criado em`, `Profissional` e `Nome completo`, mantendo aliases temporários para os cabeçalhos `v1` durante a migração.

- [ ] **Step 4: Executar testes de backend**

Run: `node tests/backend.test.js`  
Expected: todos os testes passam, incluindo dados `v1` e `v2`.

### Task 3: Criar a rotina de nova base e migração de `v1`

**Files:**
- Modify: `Código.gs`
- Modify: `tests/backend.test.js`
- Modify: `docs/IMPLANTACAO_PLANILHA_OFICIAL.md`

**Interfaces:**
- Consumes a cópia da planilha original.
- Produces `prepararBaseAnamneseVersionadaPrescricao_()` e `validarBaseAnamneseVersionadaPrescricao()`.

- [ ] **Step 1: Testar mapeamento de uma linha exportada pelo Tally para `v1`**

```js
const legado = mapearLinhaLegadaTallyPrescricao_(cabecalhosTally, linhaTally);
assert.strictEqual(legado['Origem'], 'Tally');
assert.strictEqual(legado['Versão do questionário'], 'v1');
assert.strictEqual(legado['ID da demanda'], '5Xq0NVQ');
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node tests/backend.test.js`  
Expected: falha porque o mapeador legado não existe.

- [ ] **Step 3: Implementar migração não destrutiva**

`prepararBaseAnamneseVersionadaPrescricao_` deve:

1. confirmar que `Respostas` contém a estrutura Tally antes de alterar qualquer aba;
2. renomear a origem para `Respostas – legado Tally`;
3. criar a nova `Respostas` com cabeçalhos canônicos e importar cada linha como `v1`;
4. criar/atualizar `Questionário` com o catálogo `v1` e `v2`;
5. atualizar os cabeçalhos de `Monitoramento` para `ID da demanda`, preservando integralmente os IDs existentes;
6. aplicar congelamento, filtro, formatos de data e validação 1–7 na coluna de frequência;
7. abortar com mensagem explícita se a base já estiver migrada ou se houver IDs duplicados.

- [ ] **Step 4: Executar os testes e validar em cópia de planilha**

Run: `node tests/backend.test.js`  
Expected: testes passam.  
Manual: executar a rotina somente na planilha copiada, conferir contagem de demandas, IDs e linhas de `Monitoramento`.

### Task 4: Adicionar a aba e o wizard mobile-first

**Files:**
- Modify: `index.html`
- Modify: `scripts.html`
- Modify: `styles.html`
- Modify: `tests/frontend.test.js`

**Interfaces:**
- Consumes `getQuestionarioPwaPrescricao`, `getProfissionaisAtivosPrescricao` e `enviarDemandaPwaPrescricao`.
- Produces controle de tela `abrirAbaPrescricoes()`/`abrirAbaNovaDemanda()` e formulário de seis etapas.

- [ ] **Step 1: Escrever asserts de interface que falham**

```js
['Adicionar demanda', 'demandWizard', 'wizardProgress', 'Frequência pretendida',
 'Salvar rascunho', 'enviarDemandaPwaPrescricao'].forEach((texto) => {
  assert(index.includes(texto) || scriptsHtml.includes(texto));
});
assert(styles.includes('.demand-wizard'));
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node tests/frontend.test.js`  
Expected: falha por marcador de wizard ausente.

- [ ] **Step 3: Implementar markup, estado e acessibilidade**

Adicionar duas abas no topo; a aba existente mantém seu conteúdo. A nova usa um único `<form>` com seis painéis e `fieldset`/`legend`, um controle de progresso com `aria-valuenow`, mensagens com `role="status"` e botões de 48px mínimos.

No `scripts.html`, manter `state.demandDraft`, `state.demandStep` e `state.demandSubmitting`; carregar catálogo e profissionais ativos na abertura; validar apenas os campos da etapa; mostrar revisão; enviar pela chamada assíncrona Apps Script.

- [ ] **Step 4: Executar o teste de frontend**

Run: `node tests/frontend.test.js`  
Expected: `Frontend: estrutura, contrato e compilação aprovados.`

### Task 5: Implementar rascunho de seis horas e prevenção de duplicidade no cliente

**Files:**
- Modify: `scripts.html`
- Modify: `tests/frontend.test.js`

**Interfaces:**
- Consumes formulário `v2` e `sessionStorage`/`localStorage` do navegador.
- Produces `carregarRascunhoDemanda`, `salvarRascunhoDemanda`, `limparRascunhoDemanda`.

- [ ] **Step 1: Adicionar asserts do contrato de rascunho**

```js
assert(scriptsHtml.includes('DEMAND_DRAFT_MAX_AGE'));
assert(scriptsHtml.includes('6 * 60 * 60 * 1000'));
assert(scriptsHtml.includes('tentativaId'));
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node tests/frontend.test.js`  
Expected: falha por constante de rascunho ausente.

- [ ] **Step 3: Implementar persistência local**

Salvar `{ versao: 'v2', salvoEm, etapa, tentativaId, respostas }` após cada alteração com TTL de 21.600.000 ms. Ao abrir, descartar JSON inválido ou expirado e oferecer retomada. Manter a mesma `tentativaId` em cada nova tentativa de envio; apagar o rascunho apenas após resposta `ok`.

- [ ] **Step 4: Executar o teste de frontend**

Run: `node tests/frontend.test.js`  
Expected: compilação e todos os asserts passam.

### Task 6: Adaptar o dashboard e finalizar a nova base

**Files:**
- Modify: `dashboard-analytics/Config.gs`
- Modify: `dashboard-analytics/Dados.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`
- Modify: `dashboard-analytics/tests/sheets.test.js`
- Modify: `Contexto/CONTEXTO_DO_PROJETO.md`

**Interfaces:**
- Consumes os cabeçalhos canônicos `ID da demanda`, `Criado em`, `Profissional`, `Nome completo` e `Monitoramento!ID da demanda`.
- Produces leitura unificada de registros `v1`/`v2` e configuração para o ID da nova planilha.

- [ ] **Step 1: Adicionar testes de aliases canônicos**

```js
const respostas = sheet('Respostas', [
  ['ID da demanda', 'Criado em', 'Profissional', 'Nome completo'],
  ['DEM-20260720-abc', new Date(2026, 6, 20), 'Elias', 'Aluno de teste'],
]);
assert.strictEqual(context.lerRespostasAnalytics_(respostas)[0].submissionId, 'DEM-20260720-abc');
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node dashboard-analytics/tests/sheets.test.js`  
Expected: falha por aliases ausentes.

- [ ] **Step 3: Implementar aliases e configurar a nova base**

Acrescentar aliases canônicos antes dos legados em `ANALYTICS_HEADERS`; renomear a chave interna gradualmente, mantendo `submissionId` no payload para não quebrar o frontend do dashboard. Depois da cópia criada, trocar somente `spreadsheetId` pelos ID observado da nova base e atualizar o teste associado.

- [ ] **Step 4: Executar toda a verificação local e a verificação manual**

Run: `node tests/backend.test.js && node tests/frontend.test.js && node tests/responsive.test.js && node dashboard-analytics/tests/backend.test.js && node dashboard-analytics/tests/sheets.test.js`  
Expected: todos passam.

Manual: abrir a nova implantação em celular, retomar rascunho, enviar demanda de teste, conferir `Respostas`, `Monitoramento`, PWA existente e dashboard.

## Self-review

- Cobertura: migração `v1`, formulário `v2`, frequência 1–7, profissionais ativos, rascunho de 6 horas, idempotência, dashboard e nova base possuem tarefas próprias.
- Placeholders: não há marcadores pendentes; as decisões funcionais foram fixadas pela especificação aprovada.
- Consistência: o identificador externo do frontend continua `submissionId` durante a transição, mas sua fonte canônica passa a ser `ID da demanda`.
