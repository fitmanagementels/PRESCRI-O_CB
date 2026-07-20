const EXCLUSOES_ANALYTICS_HEADERS = Object.freeze([
  'ID da demanda', 'Excluído em', 'Motivo', 'Origem',
]);

function dataHoraExclusaoAnalytics_() {
  if (typeof Utilities !== 'undefined') return Utilities.formatDate(new Date(), ANALYTICS_CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss');
  return new Date().toISOString();
}

function garantirAbaExclusoesAnalytics_(planilha) {
  let aba = planilha.getSheetByName(ANALYTICS_CONFIG.abaExclusoes);
  if (!aba) aba = planilha.insertSheet(ANALYTICS_CONFIG.abaExclusoes);
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, EXCLUSOES_ANALYTICS_HEADERS.length).setValues([EXCLUSOES_ANALYTICS_HEADERS]);
    aba.setFrozenRows(1);
  }
  return aba;
}

function localizarLinhaPorDemandaAnalytics_(aba, submissionId, contrato) {
  if (!aba || aba.getLastRow() < 2 || aba.getLastColumn() < 1) return 0;
  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  const indices = mapearIndicesAnalytics_(cabecalhos, contrato);
  if (indices.submissionId < 0) throw new Error('A aba ' + aba.getName() + ' não possui a coluna ID da demanda.');
  const ids = aba.getRange(2, indices.submissionId + 1, aba.getLastRow() - 1, 1).getDisplayValues();
  for (let indice = 0; indice < ids.length; indice++) {
    if (limparTextoAnalytics_(ids[indice][0]) === submissionId) return indice + 2;
  }
  return 0;
}

function excluirDemandaAnalytics(pedido) {
  pedido = pedido || {};
  const submissionId = limparTextoAnalytics_(pedido.submissionId);
  if (!submissionId) throw new Error('ID da demanda não informado.');
  if (limparTextoAnalytics_(pedido.confirmacao) !== 'EXCLUIR') {
    throw new Error('Para excluir definitivamente, digite EXCLUIR.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const planilha = obterPlanilhaAnalytics_();
    const respostas = planilha.getSheetByName(ANALYTICS_CONFIG.abaRespostas);
    const monitoramento = planilha.getSheetByName(ANALYTICS_CONFIG.abaMonitoramento);
    if (!respostas || !monitoramento) throw new Error('As abas Respostas e Monitoramento devem existir para excluir uma demanda.');

    const linhaResposta = localizarLinhaPorDemandaAnalytics_(respostas, submissionId, ANALYTICS_HEADERS.respostas);
    if (!linhaResposta) throw new Error('Demanda não localizada em Respostas. Ela pode já ter sido excluída.');
    const linhaMonitoramento = localizarLinhaPorDemandaAnalytics_(monitoramento, submissionId, ANALYTICS_HEADERS.monitoramento);
    const motivo = limparTextoAnalytics_(pedido.motivo) || 'Não informado';
    const log = garantirAbaExclusoesAnalytics_(planilha);

    log.appendRow([submissionId, dataHoraExclusaoAnalytics_(), motivo, 'Dashboard gerencial']);
    if (linhaMonitoramento) monitoramento.deleteRow(linhaMonitoramento);
    respostas.deleteRow(linhaResposta);
    limparCacheAnalytics_();
    return { ok: true, submissionId: submissionId, monitoramentoExcluido: !!linhaMonitoramento };
  } finally {
    lock.releaseLock();
  }
}
