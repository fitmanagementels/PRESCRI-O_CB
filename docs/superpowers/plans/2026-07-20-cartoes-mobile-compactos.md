# Cartões compactos no mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir responsável, etapa/prazo e selo de SLA na mesma faixa dos cartões mobile.

**Architecture:** A grade do cartão passa a ter três colunas somente até 760 px. O bloco `.stage` usa `display:contents`, tornando seu rótulo, prazo e selo itens posicionáveis na grade sem alterar o HTML gerado pelo JavaScript.

**Tech Stack:** CSS responsivo em HTML Service, Node `assert`.

## Global Constraints

- Alterar apenas o CSS de `dashboard-analytics`.
- Manter os três comandos em uma linha abaixo das informações.
- Não alterar o layout acima de 760 px.

---

### Task 1: Compactar a grade do cartão em mobile

**Files:**
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: a estrutura atual `.demand-card`, `.owner`, `.stage` e `.badge`.
- Produces: regra `@media (max-width:760px)` com posições explícitas para a faixa operacional.

- [x] **Step 1: Write the failing test**

```js
assert(styles.includes('.demand-card .stage{display:contents}'));
assert(styles.includes('.demand-card .stage .badge{grid-column:3;grid-row:2/4;align-self:center}'));
```

- [x] **Step 2: Run test to verify it fails**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL because the compact mobile layout does not exist.

- [x] **Step 3: Write minimal implementation**

```css
@media (max-width:760px){
  .demand-card{grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto}
  .demand-card .owner{grid-column:1;grid-row:2/4}
  .demand-card .stage{display:contents}
  .demand-card .stage span{grid-column:2;grid-row:2}
  .demand-card .stage strong{grid-column:2;grid-row:3}
  .demand-card .stage .badge{grid-column:3;grid-row:2/4;align-self:center}
  .demand-actions{grid-column:1/-1;grid-row:4}
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `node dashboard-analytics/tests/frontend.test.js && node dashboard-analytics/tests/backend.test.js`

Expected: `Frontend analytics aprovado.` and `Backend analytics aprovado.`

- [x] **Step 5: Commit**

```bash
git add dashboard-analytics/styles.html dashboard-analytics/tests/frontend.test.js docs/superpowers/specs/2026-07-20-cartoes-mobile-compactos-design.md docs/superpowers/plans/2026-07-20-cartoes-mobile-compactos.md
git commit -m "style: compactar cartões no mobile"
```
