# Produtividade e Comparativos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar Produtividade e Comparativos para mostrar a saúde da operação e os pontos de ação com menos gráficos, métricas semanticamente claras e leitura mobile prioritária.

**Architecture:** O backend mantém o payload único filtrado por período e profissional, mas passa a expor bases de SLA, amostras de prazo e um insight operacional derivado. O frontend substitui grupos de métricas e seis gráficos por resumo operacional, insight, ranking selecionável e o gráfico focal Entradas × Conclusões; a ajuda contextual acompanha todos os novos elementos.

**Tech Stack:** Google Apps Script (V8), Google Sheets, HTML/CSS/JavaScript sem dependências externas, Node `assert` e Chrome headless para testes responsivos.

**Spec:** `docs/superpowers/specs/2026-09-08-produtividade-comparativos-design.md` e `docs/superpowers/specs/brand-visual-contract.md`

## Global Constraints

- Usar somente `Respostas` e `Monitoramento`; não criar abas ou colunas.
- Manter os filtros globais de período e profissional como fonte comum de todos os blocos.
- Tratar backlog como estoque atual e entradas menos conclusões como variação no período.
- Exibir prazo individual e SLA com aviso de amostra pequena abaixo de cinco conclusões.
- Não expor dados pessoais de alunos em métricas, ranking, gráficos, dicas ou tabelas.
- Manter tema dark e reservar `#E2FF42` para foco, destaque e métrica prioritária.
- Toda métrica, insight, seletor e visual novo ou renomeado precisa de dica “?” atualizada.
- A composição mobile não pode depender de rolagem horizontal para entendimento da operação.

---

### Task 1: Enriquecer métricas operacionais e insight de gestão

**Files:**
- Modify: `dashboard-analytics/Metricas.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`

**Interfaces:**
- Consumes: `agregarProdutividadeAnalytics_(fatos, inicio, fim, profissional)` e fatos normalizados com `status`, `sla`, `tempoConclusaoDias`.
- Produces: `amostraConclusoes`, `conclusoesNoPrazo`, `conclusoesComSla`, `tempoMediano`, `tempoP75Seguro`, `variacaoFila` e `insightOperacional` no payload de produtividade.

- [ ] **Step 1: Write the failing backend tests**

Adicionar ao teste uma amostra com seis conclusões e duas demandas abertas. Exigir que o agregado exponha base de SLA, prazo no SLA, P75 apenas com amostra suficiente e variação da fila:

```js
assert.strictEqual(agregado.amostraConclusoes, 6);
assert.strictEqual(agregado.conclusoesComSla, 6);
assert.strictEqual(agregado.conclusoesNoPrazo, 5);
assert.strictEqual(agregado.variacaoFila, agregado.recebidas - agregado.concluidas);
assert.strictEqual(agregado.tempoP75Seguro, agregado.tempoP75);
assert.strictEqual(amostraPequena.tempoP75Seguro, null);
assert.strictEqual(insight.tipo, 'atrasos');
assert(insight.detalhe.includes('atrasada'));
```

- [ ] **Step 2: Run the backend test to verify it fails**

Run: `node dashboard-analytics/tests/backend.test.js`  
Expected: falha porque as propriedades e `gerarInsightOperacionalAnalytics_` ainda não existem.

- [ ] **Step 3: Implement the minimal metric contract**

Em `agregarProdutividadeAnalytics_`, calcular a amostra a partir de conclusões no período e SLA válido. Manter a fórmula existente de `taxaSla`, mas adicionar as bases explícitas:

```js
const conclusoesNoPrazo = slaValidas.filter(function (f) { return f.sla === 'dentro_prazo'; }).length;
const amostraConclusoes = concluidas.length;
return {
  // campos existentes
  variacaoFila: recebidas.length - concluidas.length,
  amostraConclusoes: amostraConclusoes,
  conclusoesComSla: slaValidas.length,
  conclusoesNoPrazo: conclusoesNoPrazo,
  tempoP75Seguro: amostraConclusoes >= 5 ? arredondarAnalytics_(percentilAnalytics_(tempos, 0.75), 1) : null,
  amostraInsuficiente: amostraConclusoes < 5,
};
```

Criar `gerarInsightOperacionalAnalytics_(equipe, porProfissional)` com precedência: atrasadas, variação positiva da fila, ausência de conclusões, situação estável. A função retorna somente `{ tipo, titulo, detalhe, profissional }`; usa contagens agregadas e nunca nomes de alunos. Inserir o resultado em `produtividade.insightOperacional` dentro de `montarPayloadDashboardAnalytics_`.

- [ ] **Step 4: Run the backend test to verify it passes**

Run: `node dashboard-analytics/tests/backend.test.js`  
Expected: `Backend analytics aprovado.`

- [ ] **Step 5: Commit**

```bash
git add dashboard-analytics/Metricas.gs dashboard-analytics/tests/backend.test.js
git commit -m "feat: enriquecer métricas operacionais"
```

### Task 2: Substituir a leitura visual por resumo, insight e ranking único

**Files:**
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/charts.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: o contrato de Task 1 em `payload.produtividade.equipe`, `payload.produtividade.porProfissional`, `payload.produtividade.insightOperacional` e `payload.comparativos.serieFluxo`.
- Produces: `renderizarResumoOperacional`, `renderizarInsightOperacional`, `renderizarRankingOperacional`, seletor `rankingMetric` e um único gráfico focal em Comparativos.

- [ ] **Step 1: Write failing frontend tests**

Exigir os novos contêineres, seletor e ausência dos painéis visuais removidos:

```js
['operationalSummary', 'operationalInsight', 'attentionRanking', 'comparisonRanking', 'rankingMetric'].forEach((id) => {
  assert(index.includes(`id="${id}"`));
});
['backlogChart', 'professionalChart', 'backlogStageChart', 'slaChart', 'timeChart'].forEach((id) => {
  assert(!index.includes(`id="${id}"`));
});
assert(scripts.includes('function renderizarRankingOperacional'));
assert(scripts.includes("['rankingMetric','change'"));
assert(scripts.includes('Entradas × Conclusões'));
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run: `node dashboard-analytics/tests/frontend.test.js`  
Expected: falha porque os IDs, renderizadores e seletor ainda não existem.

- [ ] **Step 3: Implement the focused content hierarchy**

Em `index.html`:

- substituir grupos extensos de métricas por `#operationalSummary`, `#operationalInsight` e `#attentionRanking` na aba Produtividade;
- manter `#flowChart` como único gráfico da aba Comparativos;
- remover os cinco contêineres de gráficos secundários;
- incluir `#comparisonRanking` e `<select id="rankingMetric">` com `atrasadas`, `taxaSla`, `tempoMediano` e `concluidas`.

Em `scripts.html`, criar os renderizadores:

```js
function renderizarResumoOperacional(p) {
  return [
    resumoItem(p.backlog, 'Estoque atual', 'resumo_estoque'),
    resumoItem(p.atrasadas, 'Atrasadas', 'resumo_atrasadas'),
    resumoItem(sinalizar(p.variacaoFila), 'Variação da fila', 'resumo_variacao'),
    resumoItem(dias(p.tempoMediano), 'Tempo mediano', 'resumo_mediana')
  ].join('');
}

function renderizarRankingOperacional(profissionais, campo) {
  // Ordenar somente pela dimensão escolhida; apresentar uma linha por profissional.
  // Exibir “Amostra pequena” para SLA/prazo com menos de cinco conclusões.
}
```

`renderizarProdutividade` usa resumo, insight e ranking de atrasadas. `renderizarComparativos` renderiza apenas os três deltas, `flowChart` e o ranking cuja dimensão vem de `state.rankingMetric`. O gráfico de linha continua acessível e usa título `Entradas × Conclusões`.

- [ ] **Step 4: Run frontend test to verify it passes**

Run: `node dashboard-analytics/tests/frontend.test.js`  
Expected: `Frontend analytics aprovado.`

- [ ] **Step 5: Commit**

```bash
git add dashboard-analytics/index.html dashboard-analytics/scripts.html dashboard-analytics/charts.html dashboard-analytics/tests/frontend.test.js
git commit -m "feat: simplificar leitura de produtividade"
```

### Task 3: Aplicar layout mobile confortável e renovar as dicas “?”

**Files:**
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Modify: `dashboard-analytics/scripts/build-preview.js` only if o preview precisar de campos agregados novos
- Modify: `dashboard-analytics/preview.html` via `node dashboard-analytics/scripts/build-preview.js`

**Interfaces:**
- Consumes: IDs e renderizadores de Task 2, além do catálogo `GUIAS_AJUDA` em `scripts.html`.
- Produces: layout 2 × 2 de resumo, ranking em linhas compactas, detalhe progressivo no mobile e dicas atualizadas para todos os elementos novos.

- [ ] **Step 1: Write failing style and help tests**

Adicionar verificações para a cobertura das novas dicas e regras mobile:

```js
['resumo_estoque', 'resumo_atrasadas', 'resumo_variacao', 'resumo_mediana',
 'insight_operacional', 'ranking_atencao', 'ranking_metric_atrasadas',
 'ranking_metric_sla', 'ranking_metric_tempo', 'ranking_metric_conclusoes',
 'comparacao_variacao', 'grafico_fluxo'].forEach((chave) => assert(guiasAjuda[chave]));
assert(styles.includes('.operational-summary{display:grid'));
assert(styles.includes('.ranking-row'));
assert(styles.includes('@media (max-width: 640px)'));
assert(!styles.includes('.chart-wide{grid-column:1/-1}'));
```

- [ ] **Step 2: Run frontend test to verify it fails**

Run: `node dashboard-analytics/tests/frontend.test.js`  
Expected: falha pelas chaves de ajuda e classes ainda ausentes.

- [ ] **Step 3: Implement style and help coverage**

Criar superfícies discretas para `.operational-summary`, `.operational-insight`, `.ranking-list` e `.ranking-row`. No mobile, manter resumo 2 × 2; alinhar valor e rótulo numa única linha de ranking; mostrar o detalhe da tabela somente após ação explícita. Não usar barras como substituto do ranking.

Atualizar `GUIAS_AJUDA` com textos de cálculo, período, limitações e ação:

```js
resumo_variacao: {
  titulo: 'Variação da fila',
  texto: 'Entradas menos conclusões no período. Valor positivo indica que a fila cresceu; valor negativo indica redução.'
},
resumo_mediana: {
  titulo: 'Tempo mediano',
  texto: 'Metade das conclusões levou até este tempo e metade levou mais. É menos afetado por casos muito atrasados que a média.'
},
ranking_metric_sla: {
  titulo: 'Ranking por SLA',
  texto: 'Mostra a proporção de conclusões dentro de 2 dias e a quantidade usada no cálculo. Menos de cinco conclusões é amostra pequena.'
}
```

Manter a dica `grafico_fluxo` coerente com o único gráfico focal e ajustar quaisquer referências antigas a gráficos removidos.

- [ ] **Step 4: Build preview and run verification**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
node tests/responsive.test.js
```

Expected: todos retornam sucesso; a captura mobile não contém sequência de gráficos de barras por profissional.

- [ ] **Step 5: Commit**

```bash
git add dashboard-analytics/styles.html dashboard-analytics/scripts.html dashboard-analytics/tests/frontend.test.js dashboard-analytics/preview.html
git commit -m "style: priorizar saúde operacional no mobile"
```

### Task 4: Atualizar documentação e publicar o dashboard de gestão

**Files:**
- Modify: `dashboard-analytics/README_DEPLOY.md`
- Modify: `Contexto/CONTEXTO_DO_PROJETO.md`
- Modify: `Contexto/CONTEXTO_DO_PROJETO.html`

**Interfaces:**
- Consumes: implementação validada de Tasks 1–3 e implantação Apps Script `1ZQuF5AlX-z8clgLe2R00EoRHNK7Olmcz0JzKSXkHN7ktU8-SJDoHq0XZ`.
- Produces: documentação de uso coerente, contexto atualizado e implantação pública que preserva a URL existente.

- [ ] **Step 1: Update documentation**

Documentar que Produtividade prioriza estoque, atrasadas, variação e mediana; Comparativos usa um gráfico focal e ranking selecionável; explicar a amostra pequena e as dicas “?”. Atualizar o contexto com data, decisões e versão publicada.

- [ ] **Step 2: Verify documentation and source state**

Run:

```bash
git diff --check
git status --short
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: sem whitespace inválido, testes aprovados e somente arquivos previstos modificados.

- [ ] **Step 3: Push and deploy**

Run no diretório `dashboard-analytics`:

```bash
npx @google/clasp@latest push --force
VERSAO=$(npx @google/clasp@latest version "Dashboard CB — saúde operacional" | sed -n 's/^Created version \([0-9][0-9]*\)$/\1/p')
test -n "$VERSAO"
npx @google/clasp@latest update-deployment AKfycbwRhix0vU92_RGeTdTi00DSqIbWEaryOvT6vXokHp8gl7at7GO0Kd_BV8_kO6bneoxu --versionNumber "$VERSAO" --description "Dashboard CB — saúde operacional"
npx @google/clasp@latest deployments
```

Expected: a implantação pública existente aponta para a versão criada, mantendo a URL.

- [ ] **Step 4: Commit and send source to GitHub**

```bash
git add dashboard-analytics/README_DEPLOY.md Contexto/CONTEXTO_DO_PROJETO.md Contexto/CONTEXTO_DO_PROJETO.html
git commit -m "docs: registrar visão operacional do dashboard"
git push
```

## Self-review

- Cobertura da especificação: Tasks 1–3 implementam métricas, hierarquia, gráfico focal, ranking, mobile e dicas; Task 4 documenta e publica.
- Sem placeholders: a versão Apps Script é capturada pelo comando `clasp version` antes de `update-deployment`.
- Consistência: Task 1 cria os campos consumidos pela Task 2; Task 2 cria IDs e renderizadores estilizados/testados pela Task 3; Task 4 só publica após a verificação completa.
