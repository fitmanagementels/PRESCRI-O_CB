# Consulta de Anamnese no Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir a ficha categorizada de anamnese a partir de um cartão da aba Acompanhamento, carregando somente o registro solicitado.

**Architecture:** O backend localizará uma única linha de `Respostas` por `Submission ID` e devolverá perguntas e respostas não técnicas. O frontend manterá um cache em memória, organizará as respostas em cinco categorias e exibirá um modal somente leitura; o payload principal e o histórico analítico continuarão sem respostas clínicas.

**Tech Stack:** Google Apps Script V8, Google Sheets, HTML5, CSS3, JavaScript ES2020 e testes Node.js com `assert`/`vm`.

## Global Constraints

- Ler `Respostas` somente após ação explícita do gestor.
- Nunca escrever, formatar ou reordenar `Respostas` e `Monitoramento`.
- Nunca gravar a anamnese em `Analytics_Historico` ou CacheService.
- Excluir cabeçalhos técnicos, consentimentos e respostas vazias.
- Manter dados reais fora de testes, preview e documentação.
- Modal somente leitura, responsivo e navegável por teclado.

---

### Task 1: Leitura pontual e segura da anamnese

**Files:**
- Modify: `dashboard-analytics/tests/sheets.test.js`
- Modify: `dashboard-analytics/Dados.gs`

**Interfaces:**
- Produces: `getAnamneseDashboardAnalytics(submissionId)` e `montarAnamneseDashboardAnalytics_(cabecalhos, valores, exibidos)`.
- Consumes: `obterPlanilhaAnalytics_`, `normalizarCabecalhoAnalytics_`, `limparTextoAnalytics_` e `normalizarDataAnalytics_`.

- [ ] **Step 1: Escrever testes inicialmente falhos**

Testar transformação, exclusão e busca:

```javascript
const ficha = context.montarAnamneseDashboardAnalytics_(
  ['Submission ID', 'Submitted at', 'Nome completo', 'Consentimento', 'Objetivo principal'],
  ['SYN-001', new Date(2026, 6, 13), 'Pessoa Alfa', true, 'Saúde'],
  ['SYN-001', '13/07/2026 10:00', 'Pessoa Alfa', 'Sim', 'Saúde']
);
assert.strictEqual(ficha.respostas.length, 1);
assert.strictEqual(ficha.respostas[0].campo, 'Objetivo principal');
```

Também testar ID vazio, ID inexistente e garantir que os mocks de escrita não sejam chamados.

- [ ] **Step 2: Executar e confirmar falha**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: FAIL com `montarAnamneseDashboardAnalytics_ is not a function`.

- [ ] **Step 3: Implementar leitura mínima**

O retorno público terá o contrato:

```javascript
{
  submissionId: 'SYN-001',
  aluno: 'Pessoa Alfa',
  profissional: 'Profissional A',
  dataResposta: '2026-07-13',
  respostas: [{ campo: 'Objetivo principal', valor: 'Saúde', tipo: 'texto' }]
}
```

Ler primeiro apenas a coluna de IDs para localizar a linha e, depois, apenas essa linha completa. A lista técnica deve excluir `Submission ID`, `Respondent ID`, `Submitted at`, `Nome do Profissional` e `Nome completo`; qualquer cabeçalho contendo `consentimento` também será excluído.

- [ ] **Step 4: Executar o teste**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: `Integração segura com planilhas aprovada.`

---

### Task 2: Cartão acionável e modal categorizado

**Files:**
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/scripts.html`
- Regenerate: `dashboard-analytics/preview.html`

**Interfaces:**
- Consumes: `getAnamneseDashboardAnalytics(submissionId)`.
- Produces: `abrirAnamnese`, `fecharAnamnese`, `carregarAnamnese`, `agruparAnamnese`, `renderizarAnamnese`.

- [ ] **Step 1: Escrever teste estrutural e de categorização inicialmente falho**

```javascript
assert(index.includes('id="anamnesisModal"'));
assert(scripts.includes('getAnamneseDashboardAnalytics'));
assert.strictEqual(typeof sandbox.agruparAnamnese, 'function');
assert.strictEqual(typeof sandbox.renderizarAnamnese, 'function');
```

Testar que consentimentos somem, `perfil_rotina` abre por padrão e datas ISO são convertidas para `dd/MM/aaaa`.

- [ ] **Step 2: Executar e confirmar falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL porque o modal e os renderizadores ainda não existem.

- [ ] **Step 3: Implementar modal e acionamento**

- Incluir um único modal com título, subtítulo, expandir/recolher, fechar e conteúdo rolável.
- Tornar `.demand-card` focável com `tabindex="0"`, `role="button"` e `data-open-anamnesis`.
- Inserir botão explícito `Ver anamnese` no cartão.
- Evitar dupla abertura quando o clique partir do botão.
- Carregar via ponte Apps Script somente após abertura e armazenar em `state.anamneses[submissionId]` durante a sessão.
- Renderizar Identificação retraída, Perfil físico/objetivo/rotina expandida e demais categorias retraídas.
- Fechar por fundo, `×` e `Esc`, restaurando foco.

- [ ] **Step 4: Implementar estados**

Carregamento: spinner e `Carregando anamnese`. Erro: mensagem, detalhe seguro e botão `Tentar novamente`. Vazio: `Nenhuma resposta disponível para esta anamnese.`

- [ ] **Step 5: Regenerar e verificar**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: todas as suítes encerram com código 0.

- [ ] **Step 6: Revisar visualmente**

Renderizar o preview em 430×932 e 1280×900. Confirmar cartão acionável, modal sem overflow horizontal, rolagem interna e controles acessíveis.
