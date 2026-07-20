# Dashboard Gerencial de Prescrições Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um segundo web app Google Apps Script, independente do app operacional, com três abas para acompanhamento, produtividade e comparativos das prescrições na planilha oficial.

**Architecture:** O app usará arquitetura híbrida: o backend normaliza e agrega `Respostas` e `Monitoramento`, grava somente snapshots anônimos em `Analytics_Historico` e entrega payloads prontos para um frontend mobile-first. O projeto ficará integralmente em `dashboard-analytics/`, terá cache, manifesto, gatilho, testes e implantação próprios, sem alterar os arquivos operacionais da raiz.

**Tech Stack:** Google Apps Script V8, Google Sheets, HtmlService, CacheService, ScriptApp, HTML5, CSS3, JavaScript ES2020, SVG local e testes Node.js com `assert`/`vm`.

## Global Constraints

- Planilha oficial: `1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk`.
- Abas de origem: `Respostas` e `Monitoramento`; junção exclusiva por `Submission ID`.
- Aba de destino exclusiva do dashboard: `Analytics_Historico`.
- O dashboard nunca escreve, formata, limpa ou reordena `Respostas` ou `Monitoramento`.
- O app operacional da raiz deve permanecer byte a byte inalterado durante esta implementação.
- SLA: 2 dias corridos no fuso `America/Fortaleza`.
- Profissional do Tally é o responsável/prescritor.
- Nenhum dado pessoal real em documentação, fixtures, previews ou testes.
- Nenhuma resposta clínica da anamnese no payload analítico.
- Cache analítico nominal: 10 minutos, com namespace exclusivo.
- Snapshot diário: janela entre 23:00 e 00:00 em `America/Fortaleza`.
- Não há repositório Git funcional no workspace; não inicializar Git. Cada tarefa termina com testes e um checkpoint documentado, sem comandos de commit.

---

## File Map

Arquivos a criar:

```text
dashboard-analytics/
├── Código.gs                 # Entradas públicas, doGet e orquestração
├── Config.gs                 # Constantes, cabeçalhos e contrato
├── Dados.gs                  # Leitura, validação, normalização e junção
├── Metricas.gs               # Coorte, fluxo, SLA, percentis e diagnósticos
├── Historico.gs              # Analytics_Historico, upsert e gatilho
├── Cache.gs                  # CacheService e versionamento do payload
├── appsscript.json           # Manifesto independente
├── index.html                # Shell, logo e três views
├── styles.html               # Tema e responsividade
├── scripts.html              # Estado, filtros, navegação e renderização
├── charts.html               # Gráficos SVG e tabela comparativa
├── preview.html              # Gerado localmente, sem dados reais
├── README_DEPLOY.md          # Configuração e implantação manual
├── scripts/
│   └── build-preview.js      # Resolve includes para preview local
└── tests/
    ├── backend.test.js       # Regras puras e contratos
    ├── sheets.test.js        # Mocks de planilha, histórico e não escrita
    └── frontend.test.js      # Compilação e contrato visual
```

Interfaces de domínio compartilhadas:

```javascript
// Fato operacional normalizado.
{
  submissionId: 'ID_SINTETICO',
  aluno: 'Pessoa Exemplo',
  profissional: 'Profissional A',
  dataEntrada: '2026-07-01',
  transferida: false,
  prescrita: false,
  dataConclusao: '',
  status: 'nao_transferida',
  idadeDias: 3,
  tempoConclusaoDias: null,
  sla: 'atrasada',
  periodoEntrada: '2026-07'
}

// Payload público.
{
  meta: { atualizadoEm, slaDias, spreadsheetId, cache, versao },
  filtros: { profissionais, periodos },
  acompanhamento: [],
  produtividade: { equipe, porProfissional, diagnosticos },
  comparativos: { serieFluxo, serieBacklog, porProfissional, tabela },
  qualidade: []
}
```

---

### Task 1: Scaffold independente e contrato de configuração

**Files:**
- Create: `dashboard-analytics/Config.gs`
- Create: `dashboard-analytics/Código.gs`
- Create: `dashboard-analytics/appsscript.json`
- Create: `dashboard-analytics/tests/backend.test.js`

**Interfaces:**
- Produces: `ANALYTICS_CONFIG`, `doGet()`, `include(nomeArquivo)`, `validarDashboardAnalytics()`.
- Consumes: nenhum arquivo do app operacional em tempo de execução.

- [ ] **Step 1: Registrar hashes dos arquivos operacionais**

Run:

```bash
sha256sum Código.gs appsscript.json index.html styles.html scripts.html > /tmp/prescricao-root-before.sha256
```

Expected: cinco hashes gravados; nenhum arquivo alterado.

- [ ] **Step 2: Escrever o teste de configuração que deve falhar**

Criar `dashboard-analytics/tests/backend.test.js` com:

```javascript
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, Object, Array, String, Number, Boolean, Date, Math, Set, JSON });
const config = fs.readFileSync('dashboard-analytics/Config.gs', 'utf8');
vm.runInContext(config, context, { filename: 'Config.gs' });

assert.strictEqual(
  vm.runInContext('ANALYTICS_CONFIG.spreadsheetId', context),
  '1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk'
);
assert.strictEqual(vm.runInContext('ANALYTICS_CONFIG.slaDias', context), 2);
assert.strictEqual(vm.runInContext('ANALYTICS_CONFIG.abaHistorico', context), 'Analytics_Historico');
console.log('Configuração analytics aprovada.');
```

- [ ] **Step 3: Executar o teste e confirmar falha**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: FAIL porque `Config.gs` ainda não existe ou `ANALYTICS_CONFIG` não está definido.

- [ ] **Step 4: Criar configuração e manifesto mínimos**

Implementar em `Config.gs`:

```javascript
const ANALYTICS_CONFIG = Object.freeze({
  spreadsheetId: '1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk',
  abaRespostas: 'Respostas',
  abaMonitoramento: 'Monitoramento',
  abaHistorico: 'Analytics_Historico',
  timeZone: 'America/Fortaleza',
  slaDias: 2,
  cacheSeconds: 600,
  cacheKey: 'dashboard_analytics_payload_v1',
  versao: 1,
  equipeId: '__EQUIPE__',
});
```

Criar `appsscript.json`:

```json
{
  "timeZone": "America/Fortaleza",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Criar em `Código.gs`:

```javascript
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Dashboard gerencial de prescrições')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}
```

- [ ] **Step 5: Executar testes de configuração**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: `Configuração analytics aprovada.`

- [ ] **Step 6: Checkpoint**

Confirmar que apenas `dashboard-analytics/` e documentos do projeto foram criados.

---

### Task 2: Normalização, junção e regras operacionais

**Files:**
- Create: `dashboard-analytics/Dados.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`

**Interfaces:**
- Consumes: `ANALYTICS_CONFIG`.
- Produces: `normalizarDataAnalytics_`, `normalizarBooleanoAnalytics_`, `juntarFontesAnalytics_`, `derivarStatusAnalytics_`, `calcularDiasCivisAnalytics_`, `classificarSlaAnalytics_`.

- [ ] **Step 1: Adicionar fixtures sintéticas e testes de falha**

Adicionar ao teste:

```javascript
const dados = fs.readFileSync('dashboard-analytics/Dados.gs', 'utf8');
vm.runInContext(dados, context, { filename: 'Dados.gs' });

const respostas = [
  { submissionId: 'SYN-001', aluno: 'Pessoa Alfa', profissional: 'Profissional A', dataEntrada: '2026-07-01' },
  { submissionId: 'SYN-002', aluno: 'Pessoa Beta', profissional: 'Profissional B', dataEntrada: '2026-07-02' },
];
const monitoramento = [
  { submissionId: 'SYN-002', transferida: true, prescrita: false, dataConclusao: '' },
];
const fatos = context.juntarFontesAnalytics_(respostas, monitoramento, new Date(2026, 6, 4));
assert.strictEqual(fatos.length, 2);
assert.strictEqual(fatos[0].status, 'nao_transferida');
assert.strictEqual(fatos[0].sla, 'atrasada');
assert.strictEqual(fatos[1].status, 'pendente');
assert.strictEqual(context.calcularDiasCivisAnalytics_('2026-07-01', '2026-07-03'), 2);
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: FAIL com função de normalização/junção ausente.

- [ ] **Step 3: Implementar regras puras**

Implementar `Dados.gs` com as assinaturas:

```javascript
function pad2Analytics_(valor) {
  return String(valor).padStart(2, '0');
}

function normalizarBooleanoAnalytics_(valor) {
  if (valor === true || valor === false) return valor;
  const texto = String(valor == null ? '' : valor).trim().toLowerCase();
  return ['true', 'sim', '1', 'yes'].indexOf(texto) !== -1;
}

function normalizarDataAnalytics_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor.getFullYear() + '-' + pad2Analytics_(valor.getMonth() + 1) + '-' + pad2Analytics_(valor.getDate());
  }
  const texto = String(valor == null ? '' : valor).trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return br ? br[3] + '-' + pad2Analytics_(br[2]) + '-' + pad2Analytics_(br[1]) : '';
}

function calcularDiasCivisAnalytics_(inicio, fim) {
  const a = String(inicio).split('-').map(Number);
  const b = String(fim).split('-').map(Number);
  if (a.length !== 3 || b.length !== 3 || a.some(isNaN) || b.some(isNaN)) return null;
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

function derivarStatusAnalytics_(registro) {
  if (registro.prescrita && !registro.dataConclusao) return 'inconsistente';
  if (registro.prescrita) return 'prescrita';
  if (registro.transferida) return 'pendente';
  return 'nao_transferida';
}

function classificarSlaAnalytics_(registro, hoje) {
  const fim = registro.dataConclusao || hoje;
  const dias = calcularDiasCivisAnalytics_(registro.dataEntrada, fim);
  if (dias == null || dias < 0) return 'sem_data';
  if (registro.dataConclusao) return dias <= ANALYTICS_CONFIG.slaDias ? 'dentro_prazo' : 'atrasada';
  if (dias < ANALYTICS_CONFIG.slaDias) return 'dentro_prazo';
  if (dias === ANALYTICS_CONFIG.slaDias) return 'vence_hoje';
  return 'atrasada';
}

function juntarFontesAnalytics_(respostas, monitoramento, hoje) {
  const porId = {};
  const hojeIso = normalizarDataAnalytics_(hoje);
  monitoramento.forEach(function (item) { porId[item.submissionId] = item; });
  return respostas.map(function (resposta) {
    const acompanhamento = porId[resposta.submissionId] || {};
    const fato = Object.assign({}, resposta, {
      transferida: normalizarBooleanoAnalytics_(acompanhamento.transferida),
      prescrita: normalizarBooleanoAnalytics_(acompanhamento.prescrita),
      dataConclusao: normalizarDataAnalytics_(acompanhamento.dataConclusao),
    });
    fato.status = derivarStatusAnalytics_(fato);
    fato.idadeDias = calcularDiasCivisAnalytics_(fato.dataEntrada, hojeIso);
    fato.tempoConclusaoDias = fato.dataConclusao
      ? calcularDiasCivisAnalytics_(fato.dataEntrada, fato.dataConclusao)
      : null;
    fato.sla = classificarSlaAnalytics_(fato, hojeIso);
    fato.periodoEntrada = fato.dataEntrada.slice(0, 7);
    return fato;
  });
}
```

Regras obrigatórias:

```javascript
// Monitoramento ausente não bloqueia a demanda.
const acompanhamento = monitoramentoPorId[resposta.submissionId] || {
  transferida: false,
  prescrita: false,
  dataConclusao: '',
};

// Nunca inventar data de transferência.
// Prescrita sem data => inconsistente.
// Prescrita implica transferida somente para leitura estatística; registrar aviso de qualidade.
```

- [ ] **Step 4: Rodar testes**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: todas as asserções de normalização, status e SLA passam.

- [ ] **Step 5: Checkpoint**

Revisar que `Dados.gs` não contém chamadas de escrita (`setValue`, `setValues`, `clear`, `deleteRow`) para `Respostas` ou `Monitoramento`.

---

### Task 3: Motor de métricas, coorte, fluxo e diagnósticos

**Files:**
- Create: `dashboard-analytics/Metricas.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`

**Interfaces:**
- Consumes: fatos de `juntarFontesAnalytics_`.
- Produces: `mediaAnalytics_`, `medianaAnalytics_`, `percentilAnalytics_`, `calcularProdutividadeAnalytics_`, `calcularFluxoAnalytics_`, `calcularBacklogHistoricoAnalytics_`, `compararPeriodosAnalytics_`, `diagnosticarGargalosAnalytics_`.

- [ ] **Step 1: Adicionar testes estatísticos que falham**

Adicionar:

```javascript
const metricas = fs.readFileSync('dashboard-analytics/Metricas.gs', 'utf8');
vm.runInContext(metricas, context, { filename: 'Metricas.gs' });

assert.strictEqual(context.mediaAnalytics_([1, 2, 6]), 3);
assert.strictEqual(context.medianaAnalytics_([1, 2, 9, 10]), 5.5);
assert.strictEqual(context.percentilAnalytics_([1, 2, 3, 4], 0.75), 3.25);

const amostra = [
  { submissionId: 'A1', profissional: 'Profissional A', dataEntrada: '2026-07-01', dataConclusao: '2026-07-02', status: 'prescrita', tempoConclusaoDias: 1, sla: 'dentro_prazo' },
  { submissionId: 'A2', profissional: 'Profissional A', dataEntrada: '2026-07-02', dataConclusao: '', status: 'pendente', idadeDias: 3, sla: 'atrasada' },
  { submissionId: 'B1', profissional: 'Profissional B', dataEntrada: '2026-07-03', dataConclusao: '', status: 'nao_transferida', idadeDias: 2, sla: 'vence_hoje' },
];
const produtividade = context.calcularProdutividadeAnalytics_(amostra, '2026-07-01', '2026-07-07');
assert.strictEqual(produtividade.equipe.recebidas, 3);
assert.strictEqual(produtividade.equipe.concluidas, 1);
assert.strictEqual(produtividade.equipe.backlog, 2);
assert.strictEqual(produtividade.equipe.atrasadas, 1);
assert.strictEqual(produtividade.porProfissional.length, 2);
```

- [ ] **Step 2: Rodar teste e confirmar falha**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: FAIL porque `Metricas.gs` ou funções não existem.

- [ ] **Step 3: Implementar agregadores determinísticos**

Implementar:

```javascript
function calcularProdutividadeAnalytics_(fatos, inicio, fim) {
  return {
    equipe: agregarProdutividadeAnalytics_(fatos, inicio, fim, null),
    porProfissional: profissionaisUnicosAnalytics_(fatos).map(function (nome) {
      return agregarProdutividadeAnalytics_(fatos, inicio, fim, nome);
    }),
  };
}
```

Cada agregado deve conter:

```javascript
{
  profissional,
  recebidas,
  concluidas,
  saldo,
  backlog,
  naoTransferidas,
  pendentes,
  atrasadas,
  taxaConclusao,
  taxaSla,
  tempoMedio,
  tempoMediano,
  tempoP75,
  maiorEspera,
  producaoDiaria,
  producaoSemanal,
  ultimaConclusao,
}
```

- [ ] **Step 4: Implementar séries e comparação equivalente**

Definir:

```javascript
function chavePeriodoAnalytics_(dataIso, granularidade) {
  if (granularidade === 'mensal') return dataIso.slice(0, 7);
  if (granularidade === 'semanal') {
    const p = dataIso.split('-').map(Number);
    const data = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    const dia = data.getUTCDay() || 7;
    data.setUTCDate(data.getUTCDate() - dia + 1);
    return data.toISOString().slice(0, 10);
  }
  return dataIso;
}

function calcularFluxoAnalytics_(fatos, inicio, fim, granularidade) {
  const mapa = {};
  function somar(data, campo) {
    if (!data || data < inicio || data > fim) return;
    const chave = chavePeriodoAnalytics_(data, granularidade);
    if (!mapa[chave]) mapa[chave] = { periodo: chave, entradas: 0, conclusoes: 0, saldo: 0 };
    mapa[chave][campo]++;
  }
  fatos.forEach(function (fato) {
    somar(fato.dataEntrada, 'entradas');
    somar(fato.dataConclusao, 'conclusoes');
  });
  return Object.keys(mapa).sort().map(function (chave) {
    mapa[chave].saldo = mapa[chave].entradas - mapa[chave].conclusoes;
    return mapa[chave];
  });
}

function criarPontosDiariosAnalytics_(inicio, fim) {
  const pontos = [];
  const a = inicio.split('-').map(Number);
  const b = fim.split('-').map(Number);
  const atual = new Date(Date.UTC(a[0], a[1] - 1, a[2]));
  const limite = new Date(Date.UTC(b[0], b[1] - 1, b[2]));
  while (atual <= limite) {
    pontos.push(atual.toISOString().slice(0, 10));
    atual.setUTCDate(atual.getUTCDate() + 1);
  }
  return pontos;
}

function calcularBacklogHistoricoAnalytics_(fatos, inicio, fim, granularidade) {
  const diario = criarPontosDiariosAnalytics_(inicio, fim).map(function (dia) {
    const backlog = fatos.filter(function (fato) {
      return fato.dataEntrada <= dia && (!fato.dataConclusao || fato.dataConclusao > dia);
    }).length;
    return { periodo: dia, backlog: backlog };
  });
  const mapa = {};
  diario.forEach(function (item) {
    mapa[chavePeriodoAnalytics_(item.periodo, granularidade)] = item.backlog;
  });
  return Object.keys(mapa).sort().map(function (periodo) {
    return { periodo: periodo, backlog: mapa[periodo] };
  });
}

function periodoAnteriorEquivalenteAnalytics_(inicio, fim) {
  const dias = calcularDiasCivisAnalytics_(inicio, fim) + 1;
  const p = inicio.split('-').map(Number);
  const fimAnterior = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  fimAnterior.setUTCDate(fimAnterior.getUTCDate() - 1);
  const inicioAnterior = new Date(fimAnterior.getTime());
  inicioAnterior.setUTCDate(inicioAnterior.getUTCDate() - dias + 1);
  return { inicio: inicioAnterior.toISOString().slice(0, 10), fim: fimAnterior.toISOString().slice(0, 10) };
}

function compararPeriodosAnalytics_(atual, anterior) {
  const resultado = {};
  Object.keys(atual).forEach(function (campo) {
    if (typeof atual[campo] !== 'number') return;
    const base = Number(anterior[campo] || 0);
    resultado[campo] = {
      atual: atual[campo],
      anterior: base,
      variacaoAbsoluta: atual[campo] - base,
      variacaoPercentual: base === 0 ? null : ((atual[campo] - base) / base) * 100,
    };
  });
  return resultado;
}
```

O backlog no dia `D` será: entradas com `dataEntrada <= D` e sem conclusão até `D`, ou com `dataConclusao > D`.

- [ ] **Step 5: Implementar diagnósticos sem nota única**

`diagnosticarGargalosAnalytics_(agregado, referenciaEquipe, anterior)` deve retornar objetos:

```javascript
{
  tipo: 'backlog_crescente',
  severidade: 'atencao',
  titulo: 'Backlog em crescimento',
  detalhe: 'As entradas superaram as conclusões no período selecionado.'
}
```

Cobrir: sem conclusão, saldo positivo, concentração por etapa, SLA abaixo da equipe, mediana pior, pendências antigas e ausência recente.

- [ ] **Step 6: Rodar testes**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: métricas, séries, comparações e diagnósticos aprovados.

- [ ] **Step 7: Checkpoint**

Confirmar que médias sem denominador retornam `null`, percentuais usam escala 0–100 e amostras menores que 5 recebem `amostraInsuficiente: true`.

---

### Task 4: Adaptadores de planilha somente leitura e validação de contrato

**Files:**
- Modify: `dashboard-analytics/Dados.gs`
- Create: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Produces: `obterPlanilhaAnalytics_`, `validarFontesAnalytics_`, `lerRespostasAnalytics_`, `lerMonitoramentoAnalytics_`, `lerFatosAnalytics_`.
- Consumes: `ANALYTICS_CONFIG` e normalizadores da Task 2.

- [ ] **Step 1: Criar mocks que detectam escrita proibida**

Em `sheets.test.js`, criar um mock cuja chamada a qualquer método de escrita falha:

```javascript
function proibido(nome) {
  return function () { throw new Error('ESCRITA_PROIBIDA:' + nome); };
}

const sheetReadOnly = {
  getLastRow: () => 3,
  getLastColumn: () => 8,
  getRange: () => ({ getValues: () => [], getDisplayValues: () => [] }),
  setValue: proibido('setValue'),
  setValues: proibido('setValues'),
  clear: proibido('clear'),
};
```

Testar que as leituras não acionam métodos proibidos e que aba ausente gera código `MONITORAMENTO_AUSENTE`.

- [ ] **Step 2: Executar e confirmar falha**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: FAIL com adaptadores ausentes.

- [ ] **Step 3: Implementar leitura por cabeçalhos normalizados**

Requisitos:

```javascript
function validarFontesAnalytics_(planilha) {
  // Exige Respostas e Monitoramento.
  // Retorna { ok, erros, avisos, indices }.
  // Não escreve em nenhuma das duas abas.
}
```

`lerRespostasAnalytics_` deve ler somente cabeçalhos e colunas necessárias: ID, data, aluno e profissional. `lerMonitoramentoAnalytics_` deve ler as oito colunas do contrato atual.

- [ ] **Step 4: Tratar transição da planilha oficial**

Quando a estrutura não estiver pronta, retornar erro acionável:

```javascript
{
  codigo: 'CABECALHO_AUSENTE',
  aba: 'Monitoramento',
  campo: 'Submission ID',
  mensagem: 'Execute a configuração do app operacional na planilha oficial.'
}
```

- [ ] **Step 5: Rodar testes de planilha**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: leituras passam; qualquer escrita em fonte falha o teste.

- [ ] **Step 6: Checkpoint**

Run:

```bash
grep -nE "setValue|setValues|clearContent|deleteRow|insertRow" dashboard-analytics/Dados.gs
```

Expected: nenhuma ocorrência de escrita nas funções de fonte.

---

### Task 5: `Analytics_Historico`, upsert idempotente e gatilho diário

**Files:**
- Create: `dashboard-analytics/Historico.gs`
- Modify: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Produces: `garantirHistoricoAnalytics_`, `montarSnapshotsAnalytics_`, `upsertSnapshotsAnalytics_`, `registrarSnapshotDiarioAnalytics()`, `instalarGatilhoAnalytics_`.
- Consumes: métricas agregadas e `ANALYTICS_CONFIG`.

- [ ] **Step 1: Escrever testes de schema e upsert**

Definir cabeçalhos esperados no teste:

```javascript
const HISTORICO_HEADERS = [
  'Data do snapshot', 'Profissional', 'Demandas recebidas no dia',
  'Prescrições concluídas no dia', 'Não transferidas',
  'Aguardando prescrição', 'Backlog total', 'Atrasadas',
  'Conclusões dentro do SLA no dia', 'Conclusões fora do SLA no dia',
  'Tempo médio de conclusão', 'Tempo mediano de conclusão',
  'Percentil 75', 'Atualizado em', 'Versão da estrutura'
];
```

Testar duas atualizações da chave `2026-07-13|Profissional A`: a segunda substitui a linha e não aumenta a quantidade.

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: FAIL com funções de histórico ausentes.

- [ ] **Step 3: Implementar criação/migração exclusiva da aba**

`garantirHistoricoAnalytics_(planilha)` pode criar e formatar apenas `Analytics_Historico`. Aplicar cabeçalho, congelamento, formatos de data/número e larguras. Se houver versão anterior conhecida, migrar preservando linhas; se o schema for desconhecido, falhar com `HISTORICO_INCOMPATIVEL`.

- [ ] **Step 4: Implementar upsert em lote**

Usar chave composta:

```javascript
function chaveSnapshotAnalytics_(data, profissional) {
  return data + '|' + profissional;
}
```

Gerar uma linha `__EQUIPE__` e uma por profissional. Usar `LockService.getScriptLock()` porque `Analytics_Historico` possui apenas este projeto como escritor.

- [ ] **Step 5: Implementar gatilho idempotente**

```javascript
function instalarGatilhoAnalytics_() {
  const nome = 'registrarSnapshotDiarioAnalytics';
  const existentes = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === nome;
  });
  existentes.slice(1).forEach(ScriptApp.deleteTrigger);
  if (!existentes.length) {
    ScriptApp.newTrigger(nome).timeBased().atHour(23).everyDays(1).create();
  }
}
```

- [ ] **Step 6: Rodar testes**

Run: `node dashboard-analytics/tests/sheets.test.js`

Expected: criação, upsert e idempotência aprovados; fontes não alteradas.

- [ ] **Step 7: Checkpoint**

Verificar que dados pessoais não existem no schema ou nas linhas históricas.

---

### Task 6: Cache, configuração pública e payload completo

**Files:**
- Create: `dashboard-analytics/Cache.gs`
- Modify: `dashboard-analytics/Código.gs`
- Modify: `dashboard-analytics/tests/backend.test.js`
- Modify: `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Produces: `configurarDashboardAnalytics()`, `getDashboardAnalytics()`, `atualizarDashboardAnalytics()`, `validarDashboardAnalytics()`, `obterCacheAnalytics_`, `salvarCacheAnalytics_`, `limparCacheAnalytics_`, `montarPayloadDashboardAnalytics_`.

- [ ] **Step 1: Adicionar testes de cache e contrato**

Testar que:

```javascript
const payload = context.montarPayloadDashboardAnalytics_(fatos, historico, opcoes);
assert.strictEqual(payload.meta.slaDias, 2);
assert(Array.isArray(payload.acompanhamento));
assert(payload.produtividade.equipe);
assert(Array.isArray(payload.comparativos.serieFluxo));
assert(Array.isArray(payload.qualidade));
assert(!JSON.stringify(payload.produtividade).includes('Pessoa Alfa'));
```

- [ ] **Step 2: Confirmar falha**

Run: `node dashboard-analytics/tests/backend.test.js`

Expected: FAIL com orquestração/cache ausentes.

- [ ] **Step 3: Implementar cache tolerante a falhas**

```javascript
function obterCacheAnalytics_() {
  try {
    const texto = CacheService.getScriptCache().get(ANALYTICS_CONFIG.cacheKey);
    return texto ? JSON.parse(texto) : null;
  } catch (erro) {
    return null;
  }
}
```

`salvarCacheAnalytics_` usa 600 segundos. Falhas de cache não podem impedir a leitura das planilhas.

- [ ] **Step 4: Implementar funções públicas**

Comportamento:

```javascript
function getDashboardAnalytics() {
  return obterCacheAnalytics_() || recalcularDashboardAnalytics_(false);
}

function atualizarDashboardAnalytics() {
  return recalcularDashboardAnalytics_(true);
}

function configurarDashboardAnalytics() {
  // valida fontes; cria/migra histórico; instala gatilho;
  // registra snapshot; recompõe cache; retorna relatório idempotente.
}
```

`recalcularDashboardAnalytics_(true)` atualiza somente `Analytics_Historico`. Nunca chama escrita nas fontes.

- [ ] **Step 5: Implementar validação acionável**

`validarDashboardAnalytics()` retorna:

```javascript
{
  ok: true,
  spreadsheetId: ANALYTICS_CONFIG.spreadsheetId,
  fontes: { respostas: true, monitoramento: true, historico: true },
  gatilho: { instalado: true, duplicadosRemovidos: 0 },
  qualidade: [],
  atualizadoEm: '13/07/2026 23:10'
}
```

- [ ] **Step 6: Rodar toda a suíte backend**

Run:

```bash
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
```

Expected: ambos imprimem aprovação e encerram com código 0.

- [ ] **Step 7: Checkpoint**

Confirmar que configuração repetida mantém um gatilho e uma linha por chave diária/profissional.

---

### Task 7: Shell frontend, preview e navegação em três abas

**Files:**
- Create: `dashboard-analytics/index.html`
- Create: `dashboard-analytics/styles.html`
- Create: `dashboard-analytics/scripts.html`
- Create: `dashboard-analytics/charts.html`
- Create: `dashboard-analytics/scripts/build-preview.js`
- Create: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `getDashboardAnalytics()` e `atualizarDashboardAnalytics()`.
- Produces: navegação `acompanhamento`, `produtividade`, `comparativos`; estado global e filtros.

- [ ] **Step 1: Criar teste estrutural que falha**

`frontend.test.js` deve validar:

```javascript
const assert = require('assert');
const fs = require('fs');
const index = fs.readFileSync('dashboard-analytics/index.html', 'utf8');
const scripts = fs.readFileSync('dashboard-analytics/scripts.html', 'utf8');

['Acompanhamento', 'Produtividade', 'Comparativos'].forEach(function (label) {
  assert(index.includes(label));
});
assert(scripts.includes('getDashboardAnalytics'));
assert(scripts.includes('atualizarDashboardAnalytics'));
assert(scripts.includes("abaAtiva: 'acompanhamento'"));
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL porque os arquivos não existem.

- [ ] **Step 3: Criar shell e identidade visual**

`index.html` deve incluir logo SVG local, cabeçalho, botão Atualizar, filtros globais, três `<section data-view>` e navegação inferior. Usar:

```html
<nav class="app-nav" aria-label="Navegação principal">
  <button data-tab="acompanhamento" aria-selected="true">Acompanhamento</button>
  <button data-tab="produtividade" aria-selected="false">Produtividade</button>
  <button data-tab="comparativos" aria-selected="false">Comparativos</button>
</nav>
```

- [ ] **Step 4: Implementar estado e ponte Apps Script**

```javascript
const state = {
  abaAtiva: 'acompanhamento',
  payload: null,
  periodo: 'ultimos_30',
  profissional: 'todos',
  situacao: 'a_fazer',
  prazo: 'todos',
  busca: '',
};
```

Adicionar mock local com nomes genéricos e IDs sintéticos. O preview nunca pode conter dados copiados da planilha oficial.

- [ ] **Step 5: Criar builder do preview**

`build-preview.js` resolve `<?!= include('styles'); ?>`, `charts` e `scripts` usando funções de substituição para não expandir `$&` presente no JavaScript.

- [ ] **Step 6: Rodar testes e build**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: preview criado e contrato estrutural aprovado.

- [ ] **Step 7: Checkpoint visual**

Renderizar 430×932 e 1280×900 com Chrome headless; verificar navegação, foco, ausência de overflow horizontal e alvos de toque mínimos de 44px.

---

### Task 8: Aba Acompanhamento com filtro composto padrão

**Files:**
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `payload.acompanhamento`.
- Produces: `filtrarAcompanhamento`, `renderizarResumoAcompanhamento`, `renderizarListaAcompanhamento`.

- [ ] **Step 1: Testar filtro padrão**

Extrair funções puras testáveis ou expô-las em `window.AnalyticsTest`. Testar:

```javascript
const itens = [
  { status: 'nao_transferida' },
  { status: 'pendente' },
  { status: 'prescrita' },
];
assert.strictEqual(filtrarPorSituacao(itens, 'a_fazer').length, 2);
```

- [ ] **Step 2: Confirmar falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL com filtro ausente.

- [ ] **Step 3: Implementar filtros combináveis**

Combinar busca, profissional, período, situação e prazo. A busca normaliza acentos e consulta aluno/Submission ID. O estado inicial permanece `situacao: 'a_fazer'`.

- [ ] **Step 4: Implementar cards e resumo**

Cada card deve renderizar apenas os campos operacionais aprovados. Usar badges de SLA e uma área de detalhes sem respostas da anamnese.

- [ ] **Step 5: Testar estados**

Cobrir: lista normal, vazia, inconsistência, profissional ausente e conclusão com data.

- [ ] **Step 6: Rodar testes e screenshot mobile**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: filtro padrão retorna somente demandas a fazer e layout não transborda.

- [ ] **Step 7: Checkpoint**

Confirmar que nenhum controle de edição ou salvamento operacional aparece no dashboard.

---

### Task 9: Aba Produtividade descritiva e gargalos

**Files:**
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `payload.produtividade` e filtros globais.
- Produces: `renderizarProdutividade`, `renderizarDiagnosticos`, `renderizarTabelaProfissionais`.

- [ ] **Step 1: Adicionar testes de renderização sem nota única**

Validar que o HTML contém métricas de volume, backlog, SLA, mediana e P75, e não contém `nota de produtividade` nem score composto.

- [ ] **Step 2: Confirmar falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL com renderizadores ausentes.

- [ ] **Step 3: Implementar visão da equipe/profissional**

Criar grupos:

```text
Produção: recebidas, concluídas, saldo
Backlog: total, não transferidas, pendentes, atrasadas
Velocidade: média, mediana, P75, maior espera
Qualidade de prazo: taxa SLA e taxa de conclusão
```

- [ ] **Step 4: Implementar diagnósticos**

Mostrar cartões textuais ordenados por severidade. Em amostra menor que 5, exibir `Amostra pequena; interprete a tendência com cautela.`

- [ ] **Step 5: Implementar tabela e ranking configurável**

Permitir ordenar por concluídas, backlog, atrasadas, taxa SLA e mediana. Não fixar um único ranking como verdade.

- [ ] **Step 6: Rodar testes e revisar desktop/mobile**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: equipe e profissionais renderizados; tabela acessível e ordenável.

- [ ] **Step 7: Checkpoint**

Confirmar que zeros, `null` e divisões sem denominador são apresentados como `—`, não como `NaN` ou `Infinity`.

---

### Task 10: Aba Comparativos com gráficos SVG e tabela

**Files:**
- Modify: `dashboard-analytics/charts.html`
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `payload.comparativos`.
- Produces: `renderLineChart`, `renderBarChart`, `renderStackedBarChart`, `renderizarComparativos`.

- [ ] **Step 1: Testar utilitários de escala e SVG**

Testar domínio vazio, todos valores iguais, zero e valores positivos:

```javascript
assert.deepStrictEqual(calcularDominio([0, 4, 2]), { min: 0, max: 4 });
assert(renderLineChart([{ x: 'S1', y: 2 }], opcoes).includes('<svg'));
```

- [ ] **Step 2: Confirmar falha**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL com funções de gráfico ausentes.

- [ ] **Step 3: Implementar gráficos sem dependência externa**

Criar SVGs acessíveis com `<title>`, legenda textual e tabela alternativa. Gráficos:

- entradas versus conclusões;
- backlog histórico;
- backlog empilhado por etapa;
- SLA por profissional;
- média/mediana/P75;
- produção versus recebimento;
- variação atual/anterior.

- [ ] **Step 4: Implementar modos de período**

Controles: histórico completo, período selecionado/anterior e comparação entre profissionais. Granularidade automática: diária até 31 dias, semanal até 180 dias e mensal acima disso; permitir seleção manual.

- [ ] **Step 5: Implementar tabela comparativa**

Todas as séries visuais devem ter equivalente tabular. Colunas seguem a especificação e ordenação preserva o filtro ativo.

- [ ] **Step 6: Rodar testes e screenshots**

Run:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: SVGs válidos, tabelas alternativas presentes e sem overflow horizontal destrutivo.

- [ ] **Step 7: Checkpoint**

Verificar contraste, rótulos, legenda, teclado e comportamento com amostra insuficiente.

---

### Task 11: Documentação de implantação e verificação final

**Files:**
- Create: `dashboard-analytics/README_DEPLOY.md`
- Modify: `dashboard-analytics/tests/backend.test.js`
- Modify: `dashboard-analytics/tests/sheets.test.js`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Produces: pacote copiável para um segundo projeto Apps Script e instruções completas.

- [ ] **Step 1: Escrever README operacional**

Incluir passos exatos:

1. acessar `script.google.com` e criar Novo projeto;
2. nomear `Dashboard Gerencial de Prescrições`;
3. criar/copiar todos os `.gs` e `.html`;
4. habilitar o manifesto em Configurações do projeto e substituir `appsscript.json`;
5. executar `configurarDashboardAnalytics()`;
6. autorizar acesso;
7. executar `validarDashboardAnalytics()` e exigir `ok: true`;
8. implantar como Aplicativo da Web, executar como o proprietário e restringir o público;
9. usar `Atualizar dados` para atualização imediata;
10. atualizar uma implantação após alterações futuras.

Documentar erro de transição: se `Monitoramento` estiver incompatível, concluir primeiro a migração do app operacional na planilha oficial.

- [ ] **Step 2: Adicionar teste de privacidade**

Varrer fixtures e preview por padrões proibidos definidos no teste; permitir apenas nomes sintéticos `Pessoa Alfa/Beta` e `Profissional A/B`.

- [ ] **Step 3: Rodar verificação completa**

Run:

```bash
node --check < dashboard-analytics/Código.gs
node --check < dashboard-analytics/Config.gs
node --check < dashboard-analytics/Dados.gs
node --check < dashboard-analytics/Metricas.gs
node --check < dashboard-analytics/Historico.gs
node --check < dashboard-analytics/Cache.gs
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: todos os comandos encerram com código 0.

- [ ] **Step 4: Validar preservação do app operacional**

Run:

```bash
sha256sum -c /tmp/prescricao-root-before.sha256
```

Expected: `Código.gs`, `appsscript.json`, `index.html`, `styles.html` e `scripts.html`: `OK`.

- [ ] **Step 5: Auditoria final de escrita**

Run:

```bash
grep -R -nE "getSheetByName\(.*(Respostas|Monitoramento).*\).*(set|clear|delete|insert)" dashboard-analytics
```

Expected: nenhuma ocorrência. Escritas ficam confinadas às funções de `Historico.gs` que obtêm `Analytics_Historico`.

- [ ] **Step 6: Revisar preview final**

Abrir `dashboard-analytics/preview.html` em 430×932 e 1280×900. Verificar as três abas, atualização, filtros, estados vazios/erro, tabela e gráficos.

- [ ] **Step 7: Checkpoint de entrega**

Entregar lista dos arquivos, testes executados, limitações da base ainda em transição e instruções para criar a segunda implantação.
