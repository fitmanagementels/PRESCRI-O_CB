function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Dashboard gerencial de prescrições')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

function dataMenosDiasAnalytics_(dataIso, dias) {
  const p = dataIso.split('-').map(Number);
  const data = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  data.setUTCDate(data.getUTCDate() - dias);
  return data.toISOString().slice(0, 10);
}

function normalizarFiltrosDashboardAnalytics_(filtros, fatos, hoje) {
  filtros = filtros || {};
  const fim = normalizarDataAnalytics_(hoje) || hojeIsoAnalytics_();
  const periodoSolicitado = String(filtros.periodo || '30');
  const periodo = ['7', '30', '90', 'todos'].indexOf(periodoSolicitado) >= 0 ? periodoSolicitado : '30';
  const profissionais = profissionaisUnicosAnalytics_(fatos);
  const profissionalSolicitado = normalizarNomeProfissionalAnalytics_(filtros.profissional);
  const profissional = profissionalSolicitado && profissionais.indexOf(profissionalSolicitado) >= 0
    ? profissionalSolicitado
    : 'todos';
  const datas = (fatos || []).map(function (fato) { return fato.dataEntrada; }).filter(function (data) { return data && data <= fim; }).sort();
  const inicio = periodo === 'todos'
    ? (datas[0] || fim)
    : dataMenosDiasAnalytics_(fim, Number(periodo) - 1);
  return { periodo: periodo, profissional: profissional, inicio: inicio, fim: fim };
}

function filtrarFatosDashboardAnalytics_(fatos, filtros) {
  const profissional = filtros && filtros.profissional;
  return (fatos || []).filter(function (fato) {
    return !profissional || profissional === 'todos' || fato.profissional === profissional;
  });
}

function recalcularDashboardAnalytics_(registrarSnapshot, filtros) {
  const planilha = obterPlanilhaAnalytics_();
  const validacao = validarFontesAnalytics_(planilha);
  if (!validacao.ok) return { ok: false, error: { code: 'ESTRUTURA_INCOMPATIVEL', message: 'A planilha oficial ainda não está pronta para o dashboard.', details: validacao.erros } };
  const fatos = lerFatosAnalytics_(planilha);
  const historicoAba = garantirHistoricoAnalytics_(planilha);
  if (registrarSnapshot) upsertSnapshotsAnalytics_(historicoAba, montarSnapshotsAnalytics_(fatos, hojeIsoAnalytics_()));
  const filtro = normalizarFiltrosDashboardAnalytics_(filtros, fatos, hojeIsoAnalytics_());
  const payload = montarPayloadDashboardAnalytics_(filtrarFatosDashboardAnalytics_(fatos, filtro), lerHistoricoAnalytics_(historicoAba), filtro);
  payload.filtros.profissionais = profissionaisUnicosAnalytics_(fatos);
  payload.filtros.selecao = { periodo: filtro.periodo, profissional: filtro.profissional };
  payload.ok = true;
  return payload;
}

function getDashboardAnalytics(filtros) {
  return recalcularDashboardAnalytics_(false, filtros);
}

function atualizarDashboardAnalytics(filtros) {
  limparCacheAnalytics_();
  return recalcularDashboardAnalytics_(true, filtros);
}

function configurarDashboardAnalytics() {
  const planilha = obterPlanilhaAnalytics_();
  const validacao = validarFontesAnalytics_(planilha);
  if (!validacao.ok) return { ok: false, etapa: 'validacao', erros: validacao.erros };
  const aba = garantirHistoricoAnalytics_(planilha);
  const gatilho = instalarGatilhoAnalytics_();
  const fatos = lerFatosAnalytics_(planilha);
  const snapshot = upsertSnapshotsAnalytics_(aba, montarSnapshotsAnalytics_(fatos, hojeIsoAnalytics_()));
  limparCacheAnalytics_();
  const payload = recalcularDashboardAnalytics_(false);
  return { ok: true, mensagem: 'Dashboard configurado com sucesso.', historico: ANALYTICS_CONFIG.abaHistorico, gatilho: gatilho, snapshot: snapshot, registros: payload.acompanhamento.length };
}

function validarDashboardAnalytics() {
  const planilha = obterPlanilhaAnalytics_();
  const fontes = validarFontesAnalytics_(planilha);
  let gatilhos = [];
  try { gatilhos = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'registrarSnapshotDiarioAnalytics'; }); } catch (erro) { /* execução local */ }
  return {
    ok: fontes.ok,
    spreadsheetId: ANALYTICS_CONFIG.spreadsheetId,
    fontes: {
      respostas: !!planilha.getSheetByName(ANALYTICS_CONFIG.abaRespostas),
      monitoramento: !!planilha.getSheetByName(ANALYTICS_CONFIG.abaMonitoramento),
      historico: !!planilha.getSheetByName(ANALYTICS_CONFIG.abaHistorico),
      questionario: !!planilha.getSheetByName(ANALYTICS_CONFIG.abaQuestionario),
    },
    gatilho: { instalado: gatilhos.length === 1, quantidade: gatilhos.length },
    qualidade: fontes.erros.concat(fontes.avisos),
    atualizadoEm: new Date().toISOString(),
  };
}
