function pad2Analytics_(valor) {
  return String(valor).padStart(2, '0');
}

function limparTextoAnalytics_(valor) {
  return String(valor == null ? '' : valor).trim();
}

function normalizarCabecalhoAnalytics_(valor) {
  return limparTextoAnalytics_(valor)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ');
}

function normalizarBooleanoAnalytics_(valor) {
  if (valor === true || valor === false) return valor;
  const texto = limparTextoAnalytics_(valor).toLowerCase();
  return ['true', 'sim', '1', 'yes', 'x'].indexOf(texto) !== -1;
}

function normalizarDataAnalytics_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor.getFullYear() + '-' + pad2Analytics_(valor.getMonth() + 1) + '-' + pad2Analytics_(valor.getDate());
  }
  const texto = limparTextoAnalytics_(valor);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return br ? br[3] + '-' + pad2Analytics_(br[2]) + '-' + pad2Analytics_(br[1]) : '';
}

function calcularDiasCivisAnalytics_(inicio, fim) {
  const a = limparTextoAnalytics_(inicio).split('-').map(Number);
  const b = limparTextoAnalytics_(fim).split('-').map(Number);
  if (a.length !== 3 || b.length !== 3 || a.some(isNaN) || b.some(isNaN)) return null;
  return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
}

function hojeIsoAnalytics_() {
  if (typeof Utilities !== 'undefined') return Utilities.formatDate(new Date(), ANALYTICS_CONFIG.timeZone, 'yyyy-MM-dd');
  return normalizarDataAnalytics_(new Date());
}

function derivarStatusAnalytics_(registro) {
  if (registro.prescrita && !registro.dataConclusao) return 'inconsistente';
  if (registro.prescrita || registro.dataConclusao) return 'prescrita';
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
  const hojeIso = normalizarDataAnalytics_(hoje) || hojeIsoAnalytics_();
  (monitoramento || []).forEach(function (item) { porId[limparTextoAnalytics_(item.submissionId)] = item; });
  return (respostas || []).filter(function (resposta) {
    return limparTextoAnalytics_(resposta.submissionId);
  }).map(function (resposta) {
    const acompanhamento = porId[limparTextoAnalytics_(resposta.submissionId)] || {};
    const fato = {
      submissionId: limparTextoAnalytics_(resposta.submissionId),
      aluno: limparTextoAnalytics_(resposta.aluno),
      profissional: limparTextoAnalytics_(resposta.profissional) || 'Não informado',
      dataEntrada: normalizarDataAnalytics_(resposta.dataEntrada),
      transferida: normalizarBooleanoAnalytics_(acompanhamento.transferida),
      prescrita: normalizarBooleanoAnalytics_(acompanhamento.prescrita),
      dataConclusao: normalizarDataAnalytics_(acompanhamento.dataConclusao),
    };
    fato.status = derivarStatusAnalytics_(fato);
    fato.idadeDias = calcularDiasCivisAnalytics_(fato.dataEntrada, hojeIso);
    fato.tempoConclusaoDias = fato.dataConclusao ? calcularDiasCivisAnalytics_(fato.dataEntrada, fato.dataConclusao) : null;
    fato.sla = classificarSlaAnalytics_(fato, hojeIso);
    fato.periodoEntrada = fato.dataEntrada ? fato.dataEntrada.slice(0, 7) : '';
    return fato;
  });
}

function mapearIndicesAnalytics_(cabecalhos, contrato) {
  const normalizados = cabecalhos.map(normalizarCabecalhoAnalytics_);
  const indices = {};
  Object.keys(contrato).forEach(function (campo) {
    indices[campo] = -1;
    contrato[campo].some(function (alias) {
      const indice = normalizados.indexOf(normalizarCabecalhoAnalytics_(alias));
      if (indice >= 0) indices[campo] = indice;
      return indice >= 0;
    });
  });
  return indices;
}

function errosContratoAnalytics_(aba, indices, obrigatorios) {
  return obrigatorios.filter(function (campo) { return indices[campo] < 0; }).map(function (campo) {
    return { codigo: 'CABECALHO_AUSENTE', aba: aba, campo: campo, mensagem: 'Execute a configuração do app operacional na planilha oficial.' };
  });
}

function validarFontesAnalytics_(planilha) {
  const erros = [];
  const respostas = planilha.getSheetByName(ANALYTICS_CONFIG.abaRespostas);
  const monitoramento = planilha.getSheetByName(ANALYTICS_CONFIG.abaMonitoramento);
  if (!respostas) erros.push({ codigo: 'RESPOSTAS_AUSENTE', aba: ANALYTICS_CONFIG.abaRespostas, mensagem: 'A aba Respostas não foi encontrada.' });
  if (!monitoramento) erros.push({ codigo: 'MONITORAMENTO_AUSENTE', aba: ANALYTICS_CONFIG.abaMonitoramento, mensagem: 'Execute a configuração do app operacional na planilha oficial.' });
  const indices = {};
  if (respostas && respostas.getLastColumn()) {
    indices.respostas = mapearIndicesAnalytics_(respostas.getRange(1, 1, 1, respostas.getLastColumn()).getValues()[0], ANALYTICS_HEADERS.respostas);
    erros.push.apply(erros, errosContratoAnalytics_('Respostas', indices.respostas, ['submissionId', 'dataEntrada', 'profissional', 'aluno']));
  }
  if (monitoramento && monitoramento.getLastColumn()) {
    indices.monitoramento = mapearIndicesAnalytics_(monitoramento.getRange(1, 1, 1, monitoramento.getLastColumn()).getValues()[0], ANALYTICS_HEADERS.monitoramento);
    erros.push.apply(erros, errosContratoAnalytics_('Monitoramento', indices.monitoramento, ['submissionId', 'transferida', 'prescrita', 'dataConclusao']));
  }
  return { ok: erros.length === 0, erros: erros, avisos: [], indices: indices };
}

function lerLinhasAnalytics_(aba) {
  const linhas = aba.getLastRow();
  const colunas = aba.getLastColumn();
  if (linhas < 2 || colunas < 1) return { cabecalhos: [], valores: [], exibidos: [] };
  return {
    cabecalhos: aba.getRange(1, 1, 1, colunas).getValues()[0],
    valores: aba.getRange(2, 1, linhas - 1, colunas).getValues(),
    exibidos: aba.getRange(2, 1, linhas - 1, colunas).getDisplayValues(),
  };
}

function lerRespostasAnalytics_(aba) {
  const dados = lerLinhasAnalytics_(aba);
  const i = mapearIndicesAnalytics_(dados.cabecalhos, ANALYTICS_HEADERS.respostas);
  return dados.valores.map(function (linha, n) {
    const exibida = dados.exibidos[n] || linha;
    return {
      submissionId: limparTextoAnalytics_(exibida[i.submissionId]),
      dataEntrada: normalizarDataAnalytics_(linha[i.dataEntrada] || exibida[i.dataEntrada]),
      profissional: limparTextoAnalytics_(exibida[i.profissional]),
      aluno: limparTextoAnalytics_(exibida[i.aluno]),
    };
  }).filter(function (item) { return item.submissionId; });
}

function lerMonitoramentoAnalytics_(aba) {
  const dados = lerLinhasAnalytics_(aba);
  const i = mapearIndicesAnalytics_(dados.cabecalhos, ANALYTICS_HEADERS.monitoramento);
  return dados.valores.map(function (linha, n) {
    const exibida = dados.exibidos[n] || linha;
    return {
      submissionId: limparTextoAnalytics_(exibida[i.submissionId]),
      transferida: normalizarBooleanoAnalytics_(linha[i.transferida]),
      prescrita: normalizarBooleanoAnalytics_(linha[i.prescrita]),
      dataConclusao: normalizarDataAnalytics_(linha[i.dataConclusao] || exibida[i.dataConclusao]),
    };
  }).filter(function (item) { return item.submissionId; });
}

function obterPlanilhaAnalytics_() {
  return SpreadsheetApp.openById(ANALYTICS_CONFIG.spreadsheetId);
}

function lerFatosAnalytics_(planilha) {
  planilha = planilha || obterPlanilhaAnalytics_();
  const validacao = validarFontesAnalytics_(planilha);
  if (!validacao.ok) {
    const erro = new Error(validacao.erros.map(function (e) { return e.mensagem; }).join(' '));
    erro.detalhes = validacao;
    throw erro;
  }
  return juntarFontesAnalytics_(
    lerRespostasAnalytics_(planilha.getSheetByName(ANALYTICS_CONFIG.abaRespostas)),
    lerMonitoramentoAnalytics_(planilha.getSheetByName(ANALYTICS_CONFIG.abaMonitoramento)),
    hojeIsoAnalytics_()
  );
}

const ANAMNESE_ANALYTICS_CABECALHOS_TECNICOS = Object.freeze([
  'submission id', 'respondent id', 'submitted at',
  'id da demanda', 'criado em', 'nome do profissional', 'profissional', 'nome completo', 'whatsapp',
]);

function tipoValorAnamneseAnalytics_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return 'data';
  if (typeof valor === 'boolean') return 'booleano';
  if (typeof valor === 'number') return 'numero';
  return 'texto';
}

function serializarValorAnamneseAnalytics_(valor, exibido) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return normalizarDataAnalytics_(valor);
  if (typeof valor === 'boolean' || typeof valor === 'number') return valor;
  return limparTextoAnalytics_(exibido) || limparTextoAnalytics_(valor);
}

function valorVazioAnamneseAnalytics_(valor) {
  return valor == null || (typeof valor === 'string' && !valor.trim());
}

function montarAnamneseDashboardAnalytics_(cabecalhos, valores, exibidos) {
  const indices = mapearIndicesAnalytics_(cabecalhos, ANALYTICS_HEADERS.respostas);
  const faltantes = errosContratoAnalytics_('Respostas', indices, ['submissionId', 'dataEntrada', 'profissional', 'aluno']);
  if (faltantes.length) throw new Error(faltantes[0].mensagem);
  exibidos = exibidos || valores;
  const respostas = cabecalhos.map(function (cabecalho, indice) {
    const campo = limparTextoAnalytics_(cabecalho);
    const chave = normalizarCabecalhoAnalytics_(campo);
    const valor = serializarValorAnamneseAnalytics_(valores[indice], exibidos[indice]);
    if (!campo || ANAMNESE_ANALYTICS_CABECALHOS_TECNICOS.indexOf(chave) !== -1) return null;
    if (chave.indexOf('consentimento') !== -1 || valorVazioAnamneseAnalytics_(valor)) return null;
    return { campo: campo, valor: valor, tipo: tipoValorAnamneseAnalytics_(valores[indice]) };
  }).filter(function (item) { return item; });
  return {
    submissionId: limparTextoAnalytics_(exibidos[indices.submissionId]),
    aluno: limparTextoAnalytics_(exibidos[indices.aluno]),
    profissional: limparTextoAnalytics_(exibidos[indices.profissional]) || 'Não informado',
    whatsapp: indices.whatsapp >= 0 ? limparTextoAnalytics_(exibidos[indices.whatsapp]) : '',
    dataResposta: normalizarDataAnalytics_(valores[indices.dataEntrada] || exibidos[indices.dataEntrada]),
    respostas: respostas,
  };
}

function getAnamneseDashboardAnalytics(submissionId) {
  const id = limparTextoAnalytics_(submissionId);
  if (!id) throw new Error('ID da demanda não informado.');
  const planilha = obterPlanilhaAnalytics_();
  const aba = planilha.getSheetByName(ANALYTICS_CONFIG.abaRespostas);
  if (!aba) throw new Error('A aba Respostas não foi encontrada na planilha oficial.');
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 2 || ultimaColuna < 1) throw new Error('Nenhuma anamnese disponível em Respostas.');
  const cabecalhos = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];
  const indices = mapearIndicesAnalytics_(cabecalhos, ANALYTICS_HEADERS.respostas);
  if (indices.submissionId < 0) throw new Error('Execute a configuração do app operacional na planilha oficial.');
  const ids = aba.getRange(2, indices.submissionId + 1, ultimaLinha - 1, 1).getDisplayValues();
  let numeroLinha = 0;
  for (let indice = 0; indice < ids.length; indice++) {
    if (limparTextoAnalytics_(ids[indice][0]) === id) { numeroLinha = indice + 2; break; }
  }
  if (!numeroLinha) throw new Error('Anamnese não localizada para o ID da demanda informado.');
  const intervalo = aba.getRange(numeroLinha, 1, 1, ultimaColuna);
  return montarAnamneseDashboardAnalytics_(cabecalhos, intervalo.getValues()[0], intervalo.getDisplayValues()[0]);
}
