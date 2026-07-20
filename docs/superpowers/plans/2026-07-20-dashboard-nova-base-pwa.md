# Compatibilidade do dashboard com a nova base PWA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vincular o dashboard exclusivamente à nova base PWA, isolar seu cache e alinhar a linguagem de identificação à expressão “ID da demanda”.

**Architecture:** A leitura continua centrada em `Respostas` e `Monitoramento`; os aliases atuais preservam suporte a estruturas legadas sem ler as abas legadas. A chave de cache recebe uma versão exclusiva da nova origem e as mensagens visíveis passam a usar a terminologia do novo PWA.

**Tech Stack:** Google Apps Script V8, Google Sheets, HTML/CSS/JavaScript e testes Node.js com `assert`/`vm`.

## Global Constraints

- Planilha oficial: `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`.
- Fontes do dashboard: somente `Respostas` e `Monitoramento`.
- Histórico: `Analytics_Historico`, sem reescrita ou migração.
- Abas fora do escopo: `Respostas – legado Tally`, `Complementar` e `Questionário`.
- O workspace não possui repositório Git funcional; não haverá commits.

---

### Task 1: Isolar o cache da nova planilha oficial

**Files:**
- Modify: `dashboard-analytics/tests/backend.test.js`
- Modify: `dashboard-analytics/Config.gs`

**Interfaces:**
- Consumes: `ANALYTICS_CONFIG`.
- Produces: `cacheKey: 'dashboard_analytics_payload_pwa_v2'` para a nova base.

- [ ] **Step 1: Escrever o teste vermelho**

Em `tests/backend.test.js`, adicionar:

```js
assert.strictEqual(
  vm.runInContext('ANALYTICS_CONFIG.cacheKey', context),
  'dashboard_analytics_payload_pwa_v2'
);
```

- [ ] **Step 2: Executar o teste**

Executar `node dashboard-analytics/tests/backend.test.js`.

Resultado esperado: falha porque a chave atual é `dashboard_analytics_payload_v1`.

- [ ] **Step 3: Trocar a chave de cache**

Em `Config.gs`, substituir:

```js
cacheKey: 'dashboard_analytics_payload_pwa_v2',
```

- [ ] **Step 4: Executar o teste verde**

Executar `node dashboard-analytics/tests/backend.test.js`.

Resultado esperado: `Backend analytics aprovado.`

### Task 2: Cobrir o contrato da nova fonte PWA

**Files:**
- Modify: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Consumes: `validarFontesAnalytics_`, `lerRespostasAnalytics_` e `lerMonitoramentoAnalytics_`.
- Produces: cobertura do contrato `ID da demanda`/`Criado em`/`Profissional`/`Nome completo` e monitoramento correspondente.

- [ ] **Step 1: Adicionar a fonte de monitoramento PWA ao teste**

Criar uma aba de teste com:

```js
const monitoramentoPwa = sheet('Monitoramento', [
  ['ID da demanda', 'Data da anamnese', 'Aluno', 'Profissional', 'Anamnese transferida?', 'Treino prescrito?', 'Data da prescrição'],
  ['DEM-20260720-abc', new Date(2026, 6, 20), 'Pessoa Beta', 'Profissional A', true, false, ''],
]);
```

Validar que as duas fontes PWA retornam `ok: true`, o ID da demanda e o estado `transferida: true`, `prescrita: false`.

- [ ] **Step 2: Executar o teste de planilha**

Executar `node dashboard-analytics/tests/sheets.test.js`.

Resultado esperado: `Integração segura com planilhas aprovada.`

### Task 3: Atualizar terminologia e documentação operacional

**Files:**
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/Dados.gs`
- Modify: `dashboard-analytics/README_DEPLOY.md`
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Modify: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Consumes: o identificador já chamado internamente de `submissionId` para compatibilidade de código.
- Produces: cópia exibida ao usuário usando `ID da demanda`, sem renomear o campo técnico interno.

- [ ] **Step 1: Escrever o teste vermelho de cópia**

Em `tests/frontend.test.js`, afirmar:

```js
assert(index.includes('placeholder="Nome ou ID da demanda"'));
assert(!index.includes('Submission ID'));
```

Em `tests/sheets.test.js`, trocar a expectativa de erro vazio por `/ID da demanda/`.

- [ ] **Step 2: Executar os testes**

Executar:

```bash
node dashboard-analytics/tests/frontend.test.js
node dashboard-analytics/tests/sheets.test.js
```

Resultado esperado: falha pela cópia ainda antiga.

- [ ] **Step 3: Alterar somente textos visíveis**

Substituir o placeholder, as duas mensagens de `Dados.gs` e as referências descritivas em `README_DEPLOY.md` por `ID da demanda`. Manter `submissionId` como nome técnico interno e manter aliases legados em `Config.gs`.

- [ ] **Step 4: Regenerar o preview e verificar tudo**

Executar:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Resultado esperado: os quatro comandos encerram com código 0.
