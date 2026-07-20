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

function recalcularDashboardAnalytics_(registrarSnapshot) {
  const planilha = obterPlanilhaAnalytics_();
  const validacao = validarFontesAnalytics_(planilha);
  if (!validacao.ok) return { ok: false, error: { code: 'ESTRUTURA_INCOMPATIVEL', message: 'A planilha oficial ainda não está pronta para o dashboard.', details: validacao.erros } };
  const fatos = lerFatosAnalytics_(planilha);
  const historicoAba = garantirHistoricoAnalytics_(planilha);
  if (registrarSnapshot) upsertSnapshotsAnalytics_(historicoAba, montarSnapshotsAnalytics_(fatos, hojeIsoAnalytics_()));
  const fim = hojeIsoAnalytics_();
  const payload = montarPayloadDashboardAnalytics_(fatos, lerHistoricoAnalytics_(historicoAba), { inicio: dataMenosDiasAnalytics_(fim, 29), fim: fim, hoje: fim });
  payload.ok = true;
  salvarCacheAnalytics_(payload);
  return payload;
}

function getDashboardAnalytics() {
  const cache = obterCacheAnalytics_();
  return cache || recalcularDashboardAnalytics_(false);
}

function atualizarDashboardAnalytics() {
  limparCacheAnalytics_();
  return recalcularDashboardAnalytics_(true);
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
