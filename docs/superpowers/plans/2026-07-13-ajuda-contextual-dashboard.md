# Ajuda Contextual do Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar mini guias neutros e rápidos aos indicadores e análises do dashboard por meio de um pop-up contextual leve.

**Architecture:** Um catálogo local em `scripts.html` relacionará chaves curtas a títulos e explicações. Um único pop-up presente em `index.html` será preenchido e posicionado pelo frontend; botões gerados e estáticos apenas apontarão para uma chave com `data-help`.

**Tech Stack:** HTML5, CSS3, JavaScript ES2020, preview local e testes Node.js com `assert`/`vm`.

## Global Constraints

- Não adicionar bibliotecas, chamadas ao backend ou acessos à planilha.
- Não interpretar os valores atuais nem classificar o desempenho.
- Manter apenas um pop-up no DOM e um aberto por vez.
- Suportar clique/toque, fechamento externo, botão fechar e tecla `Esc`.
- Preservar navegação por teclado, foco visível e layout mobile-first.

---

### Task 1: Componente reutilizável de ajuda

**Files:**
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/scripts.html`

**Interfaces:**
- Produces: `GUIAS_AJUDA`, `botaoAjuda(chave)`, `abrirAjuda(chave, ancora)`, `fecharAjuda()`.
- Consumes: atributos `data-help` e os elementos `helpPopover`, `helpTitle`, `helpText`.

- [ ] **Step 1: Escrever o teste estrutural e funcional inicialmente falho**

Adicionar asserções para o pop-up único, catálogo local, gerador de botão, fechamento e cobertura mínima das três abas:

```javascript
assert(index.includes('id="helpPopover"'));
assert(styles.includes('.help-button'));
assert.strictEqual(typeof sandbox.botaoAjuda, 'function');
assert(sandbox.botaoAjuda('kpi_a_fazer').includes('data-help="kpi_a_fazer"'));
['kpi_a_fazer', 'grupo_producao', 'grafico_fluxo'].forEach((chave) => {
  assert(scripts.includes(chave));
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL porque `helpPopover`, `.help-button` ou `botaoAjuda` ainda não existem.

- [ ] **Step 3: Implementar o pop-up e o catálogo**

Adicionar ao HTML um único `aside` com `role="dialog"`, título, texto e botão fechar. Implementar:

```javascript
function botaoAjuda(chave) {
  return '<button class="help-button" type="button" data-help="' + esc(chave) + '" aria-label="Entender este indicador" aria-expanded="false">?</button>';
}

function abrirAjuda(chave, ancora) {
  const guia = GUIAS_AJUDA[chave];
  if (!guia) return;
  // Preenche, exibe, posiciona dentro da viewport e atualiza aria-expanded.
}

function fecharAjuda() {
  // Oculta o pop-up e devolve aria-expanded=false ao botão ativo.
}
```

Delegar cliques por `data-help`, fechar por clique externo e `Escape`. Posicionar com `getBoundingClientRect()` e limitar `left/top` à viewport; em até 640px usar posição fixa próxima à parte inferior.

- [ ] **Step 4: Executar o teste**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: `Frontend analytics aprovado.`

---

### Task 2: Cobertura didática dos blocos e revisão visual

**Files:**
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Regenerate: `dashboard-analytics/preview.html`

**Interfaces:**
- Consumes: `botaoAjuda(chave)` e `GUIAS_AJUDA` da Task 1.
- Produces: ajuda nos KPIs, lista operacional, quatro grupos de produtividade, gargalos, tabelas, quatro comparações e seis gráficos.

- [ ] **Step 1: Adicionar teste de cobertura que deve falhar**

Exigir chaves representativas de todos os tipos e ao menos 20 referências `data-help` no preview:

```javascript
['kpi_atrasadas', 'metrica_mediana', 'comparacao_periodo', 'grafico_sla', 'tabela_comparativa'].forEach((chave) => {
  assert(scripts.includes(chave));
});
assert((preview.match(/data-help=/g) || []).length >= 20);
```

- [ ] **Step 2: Executar e confirmar falha**

Run: `node dashboard-analytics/scripts/build-preview.js && node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL por cobertura insuficiente.

- [ ] **Step 3: Integrar os guias aos blocos**

- KPIs: inserir `botaoAjuda` dentro de `kpi()`.
- Métricas: inserir `botaoAjuda` dentro de `metricItem()` e no cabeçalho de `metricGroup()`.
- Comparações: inserir `botaoAjuda` dentro de `deltaCard()`.
- Blocos estáticos: inserir botões nos títulos da lista, gargalos, tabelas e gráficos.
- Textos devem definir cálculo/base e cuidado de leitura sem comentar o valor atual.

- [ ] **Step 4: Regenerar e testar**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: todas as suítes encerram com código 0.

- [ ] **Step 5: Revisar mobile e desktop**

Renderizar `preview.html` em 430×932 e 1280×900. Confirmar que os ícones não cobrem valores, o pop-up não sai da tela e a lista continua fácil de escanear.
