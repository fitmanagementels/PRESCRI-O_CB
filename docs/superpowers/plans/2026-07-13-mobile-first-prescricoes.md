# Mobile-first Prescriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a tela de acompanhamento confortável para leitura e toque em celulares sem remover informações nem alterar o fluxo funcional.

**Architecture:** Manter o HTML e o JavaScript funcional existentes e concentrar a mudança em uma camada CSS responsiva para telas de até 600 px. Usar testes de contrato para fixar escala tipográfica, dimensões mínimas, refluxo dos cards e comportamento do modal; regenerar o preview único após a alteração.

**Tech Stack:** Google Apps Script HTML Service, HTML5, CSS responsivo, JavaScript ES5 compatível, testes Node.js com `assert`.

## Global Constraints

- Preservar todas as informações, ações, filtros, regras de dados e comportamento do desktop.
- Texto funcional mobile nunca abaixo de 13 px; entradas e respostas com pelo menos 16 px.
- Controles principais com pelo menos 48 px de altura e alvos de toque nunca abaixo de 44 px.
- Margem lateral de 16 px, reduzida para 12 px apenas até 370 px.
- Espaçamento predominante de 12 a 16 px entre blocos relacionados e 20 a 24 px entre seções.
- Sem rolagem horizontal em 320, 360, 390, 412 e 430 px.
- Não alterar `Código.gs` nem o contrato de dados.
- O workspace não possui repositório Git funcional; etapas de commit são substituídas por checkpoints de arquivos e testes.

---

### Task 1: Fixar o contrato responsivo em teste

**Files:**
- Modify: `tests/frontend.test.js`
- Test: `tests/frontend.test.js`

**Interfaces:**
- Consumes: texto CSS carregado de `styles.html` na constante `styles`.
- Produces: contrato automatizado para o breakpoint `max-width: 600px`, token `--mobile-control-height`, refluxo do resumo e modal mobile.

- [x] **Step 1: Escrever o teste que inicialmente falha**

Adicionar antes do `console.log`:

```js
[
  '@media (max-width: 600px)',
  '--mobile-control-height: 52px',
  '.student-summary {',
  'grid-template-areas:',
  '.save-button {',
  '.modal-card {',
  'height: 100dvh',
].forEach((regra) => {
  assert(styles.includes(regra), `O contrato mobile deve conter: ${regra}`);
});

assert(
  styles.includes('font-size: 16px') && styles.includes('min-height: var(--mobile-control-height)'),
  'Entradas e controles mobile devem usar 16px e altura mínima padronizada.'
);
```

- [x] **Step 2: Executar o teste para comprovar a falha**

Run: `node tests/frontend.test.js`

Expected: FAIL contendo `O contrato mobile deve conter: @media (max-width: 600px)`.

- [x] **Step 3: Registrar checkpoint**

Run: `sed -n '1,220p' tests/frontend.test.js`

Expected: o novo bloco aparece antes da mensagem final de aprovação.

---

### Task 2: Implementar escala e refluxo mobile-first

**Files:**
- Modify: `styles.html`
- Test: `tests/frontend.test.js`

**Interfaces:**
- Consumes: classes atuais de `index.html` e `scripts.html`; nenhuma marcação nova.
- Produces: breakpoint único `@media (max-width: 600px)` com token `--mobile-control-height: 52px`, grid nomeado no resumo e modal em tela cheia.

- [x] **Step 1: Substituir o breakpoint estreito atual pela camada mobile-first**

Substituir `@media (max-width: 520px)` por `@media (max-width: 600px)` e incluir regras equivalentes a:

```css
@media (max-width: 600px) {
  :root {
    --mobile-control-height: 52px;
  }

  body {
    font-size: 16px;
    line-height: 1.5;
  }

  .app-shell {
    width: 100%;
    padding: max(16px, env(safe-area-inset-top)) 16px max(36px, env(safe-area-inset-bottom));
  }

  .topbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .brand-row { gap: 12px; }
  .brand-mark { width: 32px; font-size: 40px; }
  .brand-copy h1 { font-size: clamp(24px, 7vw, 28px); line-height: 1.08; }
  .brand-copy p { margin-top: 6px; font-size: 13px; line-height: 1.4; }
  .refresh-button { min-width: 48px; min-height: 48px; margin: 0; padding: 0 14px; font-size: 14px; }

  .notice { margin-bottom: 16px; padding: 13px 14px; font-size: 14px; }
  .filters-section { margin-bottom: 20px; }
  .filters-grid { gap: 12px; margin-top: 12px; }
  .field label, .process-label { margin-bottom: 7px; font-size: 12px; line-height: 1.3; }
  .field input, .field select, .date-input, .sort-select {
    min-height: var(--mobile-control-height);
    padding-right: 14px;
    padding-left: 14px;
    font-size: 16px;
  }
  .search-control input { padding-right: 50px; }

  .metrics-grid { gap: 12px; margin: 20px 0 24px; }
  .metric-card { min-height: 112px; padding: 18px 16px 15px; }
  .metric-value { font-size: 40px; }
  .metric-label { margin-top: 8px; font-size: 14px; }

  .list-heading { align-items: flex-start; gap: 12px; margin-bottom: 12px; }
  .list-heading h2 { font-size: 16px; }
  .list-tools { width: 100%; justify-content: space-between; gap: 12px; }
  .sort-select { width: auto; min-height: 44px; font-size: 14px; }
  .item-count { font-size: 14px; }
  .student-list { gap: 16px; }

  .student-summary {
    min-height: 116px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "main chevron" "days chevron";
    gap: 10px 12px;
    padding: 17px 14px 17px 22px;
  }
  .student-main { grid-area: main; }
  .student-name { overflow: visible; font-size: 20px; line-height: 1.2; text-overflow: clip; white-space: normal; }
  .student-subtitle { margin-top: 7px; font-size: 13px; line-height: 1.45; }
  .days-pill { grid-area: days; justify-self: start; min-height: 38px; padding: 0 11px; font-size: 13px; }
  .card-chevron { grid-area: chevron; align-self: center; font-size: 30px; }

  .card-body { padding: 18px 14px 20px 22px; }
  .section-kicker { margin-bottom: 12px; font-size: 13px; }
  .professional-box { padding: 14px; }
  .professional-box span { font-size: 12px; }
  .professional-box strong { font-size: 17px; }
  .process-grid { gap: 12px; }
  .toggle-control { min-height: 68px; padding: 12px; }
  .toggle-text strong { font-size: 16px; }
  .toggle-text small { font-size: 13px; line-height: 1.35; }
  .date-field { margin-top: 14px; }
  .card-actions { min-height: 0; display: grid; gap: 10px; margin-top: 14px; }
  .save-state { min-height: 20px; font-size: 13px; }
  .save-button { width: 100%; min-height: 52px; font-size: 16px; }
  .prescription-info-button { min-height: 52px; margin-top: 12px; font-size: 16px; }

  .prescription-modal { place-items: stretch; padding: 0; }
  .modal-card { width: 100%; height: 100dvh; max-height: none; border-width: 0; border-radius: 0; }
  .modal-header { padding: max(14px, env(safe-area-inset-top)) 14px 14px 16px; }
  .modal-heading h2 { font-size: 21px; }
  .modal-heading p { font-size: 13px; }
  .modal-close { width: 48px; height: 48px; }
  .modal-content { padding: 16px 16px max(24px, env(safe-area-inset-bottom)); }
  .modal-section-heading { font-size: 13px; }
  .anamnesis-section + .anamnesis-section { margin-top: 10px; }
  .anamnesis-title { min-height: 54px; padding: 13px 14px; font-size: 15px; }
  .answer-list { gap: 10px; padding: 10px; }
  .answer-item { padding: 13px; }
  .answer-label { font-size: 12px; line-height: 1.35; }
  .answer-value { margin-top: 6px; font-size: 16px; line-height: 1.5; }
  .chip { padding: 7px 10px; font-size: 13px; }
  .empty-state, .error-state, .loading-state { font-size: 14px; }
}
```

- [x] **Step 2: Ajustar o breakpoint de 370 px sem reduzir legibilidade**

Manter apenas ajustes de margem e largura no breakpoint estreito. Remover reduções de fonte e altura que contrariem o contrato:

```css
@media (max-width: 370px) {
  .app-shell {
    padding-right: 12px;
    padding-left: 12px;
  }

  .topbar { gap: 9px; }
  .brand-row { gap: 9px; }
  .brand-mark { width: 29px; font-size: 37px; }
  .brand-copy h1 { font-size: 23px; }
  .refresh-button { padding-right: 11px; padding-left: 11px; }
  .metric-card { padding-right: 13px; padding-left: 13px; }
  .student-summary { padding-left: 19px; }
  .card-body { padding-left: 19px; }
}
```

- [x] **Step 3: Executar o teste de frontend**

Run: `node tests/frontend.test.js`

Expected: `Frontend: estrutura, contrato e compilação aprovados.`

- [x] **Step 4: Executar toda a suíte**

Run: `node tests/backend.test.js && node tests/frontend.test.js`

Expected: mensagens de aprovação de backend e frontend, exit code 0.

- [x] **Step 5: Registrar checkpoint**

Run: `grep -n "@media (max-width: 600px)" styles.html`

Expected: uma ocorrência do breakpoint principal mobile.

---

### Task 3: Regenerar e validar o artefato de preview

**Files:**
- Modify: `preview.html` (gerado)
- Test: `tests/frontend.test.js`

**Interfaces:**
- Consumes: `index.html`, `styles.html` e `scripts.html`.
- Produces: `preview.html` autocontido e compatível com o mesmo contrato mobile.

- [x] **Step 1: Regenerar o preview**

Run: `node scripts/build-preview.js`

Expected: `Preview criado em .../preview.html`.

- [x] **Step 2: Confirmar que o preview contém a camada mobile**

Run: `grep -n "@media (max-width: 600px)" preview.html`

Expected: uma ocorrência do breakpoint mobile.

- [x] **Step 3: Reexecutar a suíte após a geração**

Run: `node tests/backend.test.js && node tests/frontend.test.js`

Expected: backend e frontend aprovados, exit code 0.

- [x] **Step 4: Validar visualmente em viewport mobile**

Abrir `preview.html` em 320 × 800, 360 × 800, 390 × 844, 412 × 915 e 430 × 932. Em cada largura, confirmar:

```text
- sem rolagem horizontal;
- busca, filtros e botões utilizáveis sem zoom;
- quatro métricas legíveis em grade 2 × 2;
- nome, estado, data e dias do aluno não se sobrepõem;
- card aberto usa fluxo vertical;
- modal ocupa a tela e possui rolagem interna;
- nenhum texto ou ação é cortado.
```

- [x] **Step 5: Revisar o desktop**

Abrir o preview em 880 × 900 e confirmar que filtros, quatro métricas, dois toggles e respostas em duas colunas continuam coerentes conforme o breakpoint `min-width: 680px`.

- [x] **Step 6: Registrar checkpoint final**

Run: `wc -l index.html styles.html scripts.html preview.html tests/frontend.test.js`

Expected: todos os cinco arquivos presentes e não vazios.

---

### Task 4: Suavizar os enunciados da anamnese

**Files:**
- Modify: `styles.html`
- Modify: `tests/frontend.test.js`
- Modify: `preview.html` (gerado)

**Interfaces:**
- Consumes: classe `.answer-label` usada pelos enunciados das perguntas.
- Produces: token `--question-text: #a9bd49` aplicado somente aos enunciados.

- [x] **Step 1: Criar teste de separação cromática**
- [x] **Step 2: Confirmar falha pela ausência do token**
- [x] **Step 3: Adicionar o token e aplicá-lo em `.answer-label`**
- [x] **Step 4: Regenerar o preview e executar a suíte**

---

### Task 5: Aplicar densidade compacta leve no mobile

**Files:**
- Modify: `styles.html`
- Modify: `tests/frontend.test.js`
- Modify: `tests/responsive.test.js`
- Modify: `preview.html` (gerado)

**Interfaces:**
- Consumes: breakpoint `@media (max-width: 600px)` e classes atuais.
- Produces: controles de 48 px, métricas de 96 px, resumos de 100 px e toggles de 60 px.

- [x] **Step 1: Atualizar os testes com o contrato compacto**
- [x] **Step 2: Confirmar a falha contra a escala confortável atual**
- [x] **Step 3: Implementar a compactação somente no breakpoint mobile**
- [x] **Step 4: Regenerar o preview e executar a suíte completa**
- [x] **Step 5: Comparar visualmente as viewports móveis e o desktop**
