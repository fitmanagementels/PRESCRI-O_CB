const HISTORICO_ANALYTICS_HEADERS = Object.freeze([
  'Data do snapshot', 'Profissional', 'Demandas recebidas no dia',
  'Prescrições concluídas no dia', 'Não transferidas',
  'Aguardando prescrição', 'Backlog total', 'Atrasadas',
  'Conclusões dentro do SLA no dia', 'Conclusões fora do SLA no dia',
  'Tempo médio de conclusão', 'Tempo mediano de conclusão',
  'Percentil 75', 'Atualizado em', 'Versão da estrutura',
]);

function garantirHistoricoAnalytics_(planilha) {
  let aba = planilha.getSheetByName(ANALYTICS_CONFIG.abaHistorico);
  if (!aba) aba = planilha.insertSheet(ANALYTICS_CONFIG.abaHistorico);
  const ultimaColuna = aba.getLastColumn();
  const ultimaLinha = aba.getLastRow();
  if (!ultimaLinha || !ultimaColuna) {
    aba.getRange(1, 1, 1, HISTORICO_ANALYTICS_HEADERS.length).setValues([HISTORICO_ANALYTICS_HEADERS.slice()]);
  } else {
    const atuais = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0].map(limparTextoAnalytics_);
    const esperado = HISTORICO_ANALYTICS_HEADERS.slice();
    if (atuais.join('|') !== esperado.join('|')) {
      throw new Error('HISTORICO_INCOMPATIVEL: a aba Analytics_Historico possui uma estrutura desconhecida. Renomeie-a para preservar os dados e execute a configuração novamente.');
    }
  }
  try {
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, HISTORICO_ANALYTICS_HEADERS.length).setFontWeight('bold').setBackground('#dfff32').setFontColor('#05070d');
    aba.getRange(2, 1, Math.max(1, aba.getLastRow() - 1), 1).setNumberFormat('yyyy-mm-dd');
    aba.setColumnWidths(1, HISTORICO_ANALYTICS_HEADERS.length, 150);
  } catch (erro) {
    // Formatação é auxiliar; a estrutura válida continua utilizável.
  }
  return aba;
}

function chaveSnapshotAnalytics_(data, profissional) {
  return normalizarDataAnalytics_(data) + '|' + limparTextoAnalytics_(profissional);
}

function montarSnapshotsAnalytics_(fatos, dataSnapshot) {
  const data = normalizarDataAnalytics_(dataSnapshot) || hojeIsoAnalytics_();
  const nomes = [ANALYTICS_CONFIG.equipeId].concat(profissionaisUnicosAnalytics_(fatos));
  const atualizadoEm = typeof Utilities !== 'undefined'
    ? Utilities.formatDate(new Date(), ANALYTICS_CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss')
    : new Date().toISOString();
  return nomes.map(function (nome) {
    const escopo = nome === ANALYTICS_CONFIG.equipeId ? fatos : fatos.filter(function (f) { return f.profissional === nome; });
    const agregado = agregarProdutividadeAnalytics_(escopo, data, data, nome === ANALYTICS_CONFIG.equipeId ? null : nome);
    const concluidasHoje = escopo.filter(function (f) { return f.dataConclusao === data; });
    return [
      data, nome, agregado.recebidas, agregado.concluidas, agregado.naoTransferidas,
      agregado.pendentes, agregado.backlog, agregado.atrasadas,
      concluidasHoje.filter(function (f) { return f.sla === 'dentro_prazo'; }).length,
      concluidasHoje.filter(function (f) { return f.sla === 'atrasada'; }).length,
      agregado.tempoMedio == null ? '' : agregado.tempoMedio,
      agregado.tempoMediano == null ? '' : agregado.tempoMediano,
      agregado.tempoP75 == null ? '' : agregado.tempoP75,
      atualizadoEm, ANALYTICS_CONFIG.versao,
    ];
  });
}

function upsertSnapshotsAnalytics_(aba, novasLinhas) {
  if (!novasLinhas || !novasLinhas.length) return { inseridas: 0, atualizadas: 0 };
  const lock = typeof LockService !== 'undefined' ? LockService.getScriptLock() : null;
  if (lock) lock.waitLock(30000);
  try {
    const ultimaLinha = aba.getLastRow();
    const existentes = ultimaLinha > 1 ? aba.getRange(2, 1, ultimaLinha - 1, HISTORICO_ANALYTICS_HEADERS.length).getValues() : [];
    const porChave = {};
    existentes.forEach(function (linha, indice) { porChave[chaveSnapshotAnalytics_(linha[0], linha[1])] = indice + 2; });
    const inserir = [];
    let atualizadas = 0;
    novasLinhas.forEach(function (linha) {
      const numero = porChave[chaveSnapshotAnalytics_(linha[0], linha[1])];
      if (numero) { aba.getRange(numero, 1, 1, HISTORICO_ANALYTICS_HEADERS.length).setValues([linha]); atualizadas++; }
      else inserir.push(linha);
    });
    if (inserir.length) aba.getRange(aba.getLastRow() + 1, 1, inserir.length, HISTORICO_ANALYTICS_HEADERS.length).setValues(inserir);
    return { inseridas: inserir.length, atualizadas: atualizadas };
  } finally {
    if (lock) lock.releaseLock();
  }
}

function lerHistoricoAnalytics_(aba) {
  if (!aba || aba.getLastRow() < 2) return [];
  return aba.getRange(2, 1, aba.getLastRow() - 1, HISTORICO_ANALYTICS_HEADERS.length).getValues().map(function (linha) {
    return {
      data: normalizarDataAnalytics_(linha[0]), profissional: limparTextoAnalytics_(linha[1]),
      recebidas: Number(linha[2] || 0), concluidas: Number(linha[3] || 0),
      naoTransferidas: Number(linha[4] || 0), pendentes: Number(linha[5] || 0),
      backlog: Number(linha[6] || 0), atrasadas: Number(linha[7] || 0),
      dentroSla: Number(linha[8] || 0), foraSla: Number(linha[9] || 0),
      tempoMedio: linha[10] === '' ? null : Number(linha[10]),
      tempoMediano: linha[11] === '' ? null : Number(linha[11]),
      tempoP75: linha[12] === '' ? null : Number(linha[12]), atualizadoEm: limparTextoAnalytics_(linha[13]),
    };
  });
}

function registrarSnapshotDiarioAnalytics() {
  const planilha = obterPlanilhaAnalytics_();
  const fatos = lerFatosAnalytics_(planilha);
  const aba = garantirHistoricoAnalytics_(planilha);
  const resultado = upsertSnapshotsAnalytics_(aba, montarSnapshotsAnalytics_(fatos, hojeIsoAnalytics_()));
  limparCacheAnalytics_();
  return resultado;
}

function instalarGatilhoAnalytics_() {
  const nome = 'registrarSnapshotDiarioAnalytics';
  const existentes = ScriptApp.getProjectTriggers().filter(function (trigger) { return trigger.getHandlerFunction() === nome; });
  existentes.slice(1).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  if (!existentes.length) ScriptApp.newTrigger(nome).timeBased().atHour(23).everyDays(1).create();
  return { instalado: true, duplicadosRemovidos: Math.max(0, existentes.length - 1) };
}
