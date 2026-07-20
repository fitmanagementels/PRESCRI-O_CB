# Migração para a planilha oficial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o App 1 ler e atualizar exclusivamente a planilha oficial da CB Fitness, inicializando `Monitoramento` quando estiver vazia e sem reutilizar o cache da base piloto.

**Architecture:** O backend continuará abrindo uma planilha por ID fixo em `PRESCRICAO_CONFIG`. A criação e validação da estrutura operacional ficará centralizada em `garantirEstruturaMonitoramento_`, inclusive no carregamento inicial; uma chave de cache nova isola a implantação oficial. O frontend e a aba `Complementar` permanecem fora do fluxo.

**Tech Stack:** Google Apps Script V8, Google Sheets, HTML/CSS/JavaScript e testes Node.js com `assert`/`vm`.

## Global Constraints

- Planilha oficial: `1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk`.
- Aba de entrada somente leitura: `Respostas`.
- Aba de escrita operacional: `Monitoramento`.
- A aba `Complementar` não pode ser lida nem modificada.
- Fuso do app: `America/Fortaleza`.
- Nenhuma alteração visual ou funcional no frontend.
- O workspace não possui repositório Git funcional; os passos de commit serão omitidos.

---

### Task 1: Fixar e proteger a configuração da base oficial

**Files:**
- Modify: `tests/backend.test.js`
- Modify: `Código.gs:1-18`

**Interfaces:**
- Consumes: `PRESCRICAO_CONFIG`, avaliada no contexto V8 dos testes.
- Produces: configuração com `spreadsheetId` oficial e `cachePayloadKey` exclusiva.

- [ ] **Step 1: Escrever o teste que exige a configuração oficial**

Adicionar a `tests/backend.test.js`:

```js
const config = vm.runInContext('PRESCRICAO_CONFIG', context);
assert.strictEqual(
  config.spreadsheetId,
  '1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk'
);
assert.strictEqual(config.abaRespostas, 'Respostas');
assert.strictEqual(config.abaMonitoramento, 'Monitoramento');
assert.strictEqual(config.cachePayloadKey, 'prescricoes_payload_oficial_v1');
assert(!backend.includes('1IcbgXe7qxmJ0B3_6a7_5EauY0_O7x5qhrm2FE8YZa8c'));
assert(!backend.includes("abaComplementar"));
```

- [ ] **Step 2: Confirmar que o teste falha pelo ID e cache antigos**

Executar: `node tests/backend.test.js`

Resultado esperado: falha de igualdade mostrando o ID piloto atual.

- [ ] **Step 3: Aplicar a configuração mínima**

Em `Código.gs`, substituir somente:

```js
spreadsheetId: '1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk',
cachePayloadKey: 'prescricoes_payload_oficial_v1',
```

- [ ] **Step 4: Confirmar o teste verde**

Executar: `node tests/backend.test.js`

Resultado esperado: `Backend: testes de regras e payload aprovados.`

### Task 2: Inicializar `Monitoramento` antes do primeiro payload

**Files:**
- Modify: `tests/backend.test.js`
- Modify: `Código.gs:331-336`

**Interfaces:**
- Consumes: `garantirEstruturaMonitoramento_(planilha): Sheet`.
- Produces: `montarPayloadPrescricoes_` capaz de trabalhar com a aba oficial vazia.

- [ ] **Step 1: Escrever o teste de contrato do carregamento inicial**

Adicionar a `tests/backend.test.js`:

```js
const fonteMontarPayload = vm.runInContext(
  'montarPayloadPrescricoes_.toString()',
  context
);
assert(
  fonteMontarPayload.includes('garantirEstruturaMonitoramento_(planilha)'),
  'O carregamento inicial deve preparar Monitoramento antes da leitura.'
);
assert(
  !fonteMontarPayload.includes(
    'obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaMonitoramento)'
  ),
  'Monitoramento vazia não pode impedir o primeiro carregamento.'
);
```

- [ ] **Step 2: Confirmar que o teste falha pela leitura obrigatória atual**

Executar: `node tests/backend.test.js`

Resultado esperado: falha com `O carregamento inicial deve preparar Monitoramento antes da leitura.`

- [ ] **Step 3: Usar o inicializador no payload**

Alterar o início de `montarPayloadPrescricoes_` para:

```js
const planilha = obterPlanilhaPrescricao_();
const abaRespostas = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
const abaMonitoramento = garantirEstruturaMonitoramento_(planilha);
```

- [ ] **Step 4: Confirmar o teste verde**

Executar: `node tests/backend.test.js`

Resultado esperado: `Backend: testes de regras e payload aprovados.`

### Task 3: Identificar a base na validação manual

**Files:**
- Modify: `tests/backend.test.js`
- Modify: `Código.gs:243-252`

**Interfaces:**
- Consumes: `PRESCRICAO_CONFIG` e o resultado de `atualizarMonitoramentoEObterDados()`.
- Produces: `validarBackendPrescricoes(): {ok, baseDados, totalRegistros, totais, atualizadoEm, sincronizacao}`.

- [ ] **Step 1: Escrever o teste para o relatório de validação**

Adicionar a `tests/backend.test.js`:

```js
const fonteValidacao = vm.runInContext(
  'validarBackendPrescricoes.toString()',
  context
);
assert(fonteValidacao.includes('baseDados'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.spreadsheetId'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.abaRespostas'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.abaMonitoramento'));
```

- [ ] **Step 2: Confirmar que o teste falha porque o relatório ainda não identifica a base**

Executar: `node tests/backend.test.js`

Resultado esperado: falha em `assert(fonteValidacao.includes('baseDados'))`.

- [ ] **Step 3: Acrescentar a identificação ao retorno**

Dentro do objeto retornado por `validarBackendPrescricoes`, adicionar:

```js
baseDados: {
  spreadsheetId: PRESCRICAO_CONFIG.spreadsheetId,
  abaRespostas: PRESCRICAO_CONFIG.abaRespostas,
  abaMonitoramento: PRESCRICAO_CONFIG.abaMonitoramento,
},
```

- [ ] **Step 4: Confirmar o teste verde**

Executar: `node tests/backend.test.js`

Resultado esperado: `Backend: testes de regras e payload aprovados.`

### Task 4: Verificação integrada e instruções de implantação

**Files:**
- Verify: `Código.gs`
- Verify: `tests/backend.test.js`
- Verify: `tests/frontend.test.js`
- Verify: `tests/responsive.test.js`
- Create: `docs/IMPLANTACAO_PLANILHA_OFICIAL.md`

**Interfaces:**
- Consumes: backend migrado e planilha oficial.
- Produces: checklist operacional reproduzível pelo proprietário do app.

- [ ] **Step 1: Escrever as instruções completas**

Criar `docs/IMPLANTACAO_PLANILHA_OFICIAL.md` com: confirmação do ID; ajuste do fuso da planilha para GMT-03:00; cópia dos arquivos para o projeto Apps Script; execução manual de `validarBackendPrescricoes`; concessão das permissões; conferência de `Monitoramento!A1:H`; edição da implantação existente com nova versão; teste do carregamento, atualização e salvamento; e procedimento de diagnóstico baseado nas mensagens de erro.

- [ ] **Step 2: Executar a suíte completa**

Executar, separadamente:

```bash
node tests/backend.test.js
node tests/frontend.test.js
node tests/responsive.test.js
```

Resultados esperados: backend aprovado, frontend aprovado e layout computado aprovado em 320, 360, 390, 412, 430 e 880 px.

- [ ] **Step 3: Conferir invariantes da migração**

Executar:

```bash
grep -n "1IcbgXe7qxmJ0B3_6a7_5EauY0_O7x5qhrm2FE8YZa8c\|abaComplementar" Código.gs
grep -n "1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk\|prescricoes_payload_oficial_v1" Código.gs
```

Resultados esperados: o primeiro comando não encontra referências; o segundo encontra o ID e a chave oficial na configuração.

- [ ] **Step 4: Revalidar a estrutura remota em modo somente leitura**

Ler novamente os metadados da planilha e os cabeçalhos de `Respostas!A1:AN1`. Confirmar as abas `Respostas`, `Monitoramento`, `Complementar` e os quatro cabeçalhos obrigatórios. Não escrever na planilha por conector; a primeira escrita será feita pelo próprio Apps Script após autorização explícita do usuário.
