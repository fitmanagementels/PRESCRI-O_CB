# Ações nos cartões de demanda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir WhatsApp, exclusão e abertura da anamnese diretamente no cartão de cada demanda do dashboard.

**Architecture:** A renderização de `renderizarAcompanhamento()` produzirá cartões sem semântica de botão e adicionará três controles independentes, todos associados ao `submissionId`. O modal manterá somente navegação e leitura. A delegação de eventos impedirá que botões/links iniciem a abertura por acidente.

**Tech Stack:** HTML, CSS, JavaScript sem dependências, Google Apps Script e testes Node.js.

## Global Constraints

- Alterar somente `dashboard-analytics/`.
- O PWA dos prescritores não recebe essas ações.
- WhatsApp e exclusão reutilizam seus backends existentes e sempre usam `ID da demanda`.
- Nenhum clique no espaço livre do cartão pode abrir a anamnese.
- Os controles devem manter toque mínimo de 44 px em celular.

---

### Task 1: Contrato de interface dos cartões

**Files:**
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes `renderizarAcompanhamento()`.
- Produces testes para `data-open-anamnesis`, `data-whatsapp-link` e `data-delete-demand` nos cartões.

- [x] **Step 1: Escrever o teste que falha**

```js
assert(scripts.includes('data-card-delete-demand'));
assert(!/demand-card[^>]*data-open-anamnesis/.test(scripts));
assert(!index.includes('id="anamnesisWhatsapp"'));
assert(!index.includes('id="anamnesisDelete"'));
```

- [x] **Step 2: Executar o teste vermelho**

Run: `node dashboard-analytics/tests/frontend.test.js`
Expected: falha porque os controles ainda estão no modal e o cartão ainda abre a anamnese.

- [x] **Step 3: Implementar o contrato mínimo**

```js
return '<article class="demand-card">...<button data-open-anamnesis="' + id + '">Ver anamnese</button><a data-whatsapp-link>…</a><button data-card-delete-demand="' + id + '">…</button></article>';
```

- [x] **Step 4: Executar o teste verde**

Run: `node dashboard-analytics/tests/frontend.test.js`
Expected: `Frontend analytics aprovado.`

### Task 2: Eventos e layout responsivo

**Files:**
- Modify: `dashboard-analytics/scripts.html`, `dashboard-analytics/index.html`, `dashboard-analytics/styles.html`
- Test: `dashboard-analytics/tests/frontend.test.js`, `tests/responsive.test.js`

**Interfaces:**
- Consumes `abrirAnamnese(submissionId, elementoFoco)` e `excluirDemandaAtual(submissionId)`.
- Produces cartões com ações independentes e modal exclusivamente de leitura.

- [x] **Step 1: Usar o ID do botão de exclusão**

```js
const apagar = evento.target.closest('[data-card-delete-demand]');
if (apagar) { excluirDemandaAtual(apagar.dataset.cardDeleteDemand); return; }
```

- [x] **Step 2: Ajustar a função de exclusão**

```js
function excluirDemandaAtual(submissionId) {
  const id = submissionId || state.anamneseAtual;
  // mantém confirmação EXCLUIR e chamada excluirDemandaAnalytics
}
```

- [x] **Step 3: Remover controles do cabeçalho do modal**

```html
<div class="anamnesis-actions">
  <button id="anamnesisExpandToggle">↕</button>
  <button id="anamnesisClose">×</button>
</div>
```

- [x] **Step 4: Aplicar layout de ações do cartão**

```css
.demand-actions { display:flex; gap:8px; align-items:center; }
@media (max-width:760px) { .demand-actions { grid-column:1/-1; justify-content:flex-end; } }
```

- [x] **Step 5: Verificar em desktop e celular**

Run: `node dashboard-analytics/scripts/build-preview.js && node dashboard-analytics/tests/frontend.test.js && node tests/responsive.test.js`
Expected: testes aprovados, sem área de toque menor que 44 px.

### Task 3: Documentação e regressão

**Files:**
- Modify: `dashboard-analytics/README_DEPLOY.md`, `Contexto/CONTEXTO_DO_PROJETO.md`, `Contexto/CONTEXTO_DO_PROJETO.html`

- [x] **Step 1: Atualizar documentação**

```text
O modal é leitura; WhatsApp, exclusão e abertura ficam no cartão da demanda.
```

- [x] **Step 2: Executar suíte completa**

Run: `node scripts/build-preview.js && node dashboard-analytics/scripts/build-preview.js && node tests/backend.test.js && node tests/frontend.test.js && node dashboard-analytics/tests/backend.test.js && node dashboard-analytics/tests/sheets.test.js && node dashboard-analytics/tests/frontend.test.js`
Expected: todos os comandos terminam sem falhas.
