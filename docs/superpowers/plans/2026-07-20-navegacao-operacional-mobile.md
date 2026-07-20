# Navegação operacional mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar os dois comandos da navegação operacional sem rolagem horizontal em celulares.

**Architecture:** Cada botão recebe dois spans de rótulo. A mídia mobile alterna para o texto curto e aplica uma grade de duas colunas em `.app-tabs`; fora do breakpoint, o texto completo e o flex atual prevalecem.

**Tech Stack:** HTML/CSS em Google Apps Script HTML Service, Node `assert`.

## Global Constraints

- Não modificar `scripts.html` ou o backend.
- Os alvos de toque mobile permanecem com no mínimo 48 px.
- O comportamento desktop não muda.

---

### Task 1: Grade de navegação sem rolagem no mobile

**Files:**
- Modify: `index.html`
- Modify: `styles.html`
- Modify: `tests/frontend.test.js`

**Interfaces:**
- Consumes: botões `[data-app-view]` existentes.
- Produces: spans `.tab-label-full` e `.tab-label-mobile`, além da grade mobile de duas colunas.

- [x] **Step 1: Write the failing test**

```js
assert(index.includes('class="tab-label-mobile"'));
assert(styles.includes('.app-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}'));
```

- [x] **Step 2: Run test to verify it fails**

Run: `node tests/frontend.test.js`

Expected: FAIL because the short labels and fixed mobile grid do not exist.

- [x] **Step 3: Write minimal implementation**

```html
<span class="tab-label-full">Acompanhar demandas</span>
<span class="tab-label-mobile">Acompanhar</span>
```

```css
@media (max-width:600px){
  .app-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}
  .app-tab{min-width:0;padding:0 8px;font-size:13px}
  .tab-label-full{display:none}.tab-label-mobile{display:inline}
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `node tests/frontend.test.js && node tests/backend.test.js`

Expected: `Frontend aprovado.` and `Backend aprovado.`

- [x] **Step 5: Commit**

```bash
git add index.html styles.html tests/frontend.test.js docs/superpowers/specs/2026-07-20-navegacao-operacional-mobile-design.md docs/superpowers/plans/2026-07-20-navegacao-operacional-mobile.md
git commit -m "style: compactar navegação operacional mobile"
```
