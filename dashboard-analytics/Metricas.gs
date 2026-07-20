function arredondarAnalytics_(valor, casas) {
  if (valor == null || !isFinite(valor)) return null;
  const fator = Math.pow(10, casas == null ? 1 : casas);
  return Math.round(valor * fator) / fator;
}

function mediaAnalytics_(valores) {
  const validos = (valores || []).filter(function (v) { return typeof v === 'number' && isFinite(v); });
  return validos.length ? validos.reduce(function (a, b) { return a + b; }, 0) / validos.length : null;
}

function percentilAnalytics_(valores, p) {
  const lista = (valores || []).filter(function (v) { return typeof v === 'number' && isFinite(v); }).slice().sort(function (a, b) { return a - b; });
  if (!lista.length) return null;
  if (lista.length === 1) return lista[0];
  const pos = (lista.length - 1) * p;
  const base = Math.floor(pos);
  const resto = pos - base;
  return lista[base + 1] == null ? lista[base] : lista[base] + resto * (lista[base + 1] - lista[base]);
}

function medianaAnalytics_(valores) {
  return percentilAnalytics_(valores, 0.5);
}

function entreDatasAnalytics_(data, inicio, fim) {
  return !!data && data >= inicio && data <= fim;
}

function profissionaisUnicosAnalytics_(fatos) {
  return Array.from(new Set((fatos || []).map(function (f) { return f.profissional || 'Não informado'; }))).sort();
}

function agregarProdutividadeAnalytics_(fatos, inicio, fim, profissional) {
  const escopo = (fatos || []).filter(function (f) { return !profissional || f.profissional === profissional; });
  const recebidas = escopo.filter(function (f) { return entreDatasAnalytics_(f.dataEntrada, inicio, fim); });
  const concluidas = escopo.filter(function (f) { return entreDatasAnalytics_(f.dataConclusao, inicio, fim); });
  const concluidasDaCoorte = recebidas.filter(function (f) { return f.status === 'prescrita'; });
  const backlog = escopo.filter(function (f) { return f.status !== 'prescrita'; });
  const tempos = concluidas.map(function (f) { return f.tempoConclusaoDias; }).filter(function (v) { return v != null && v >= 0; });
  const slaValidas = concluidas.filter(function (f) { return f.sla === 'dentro_prazo' || f.sla === 'atrasada'; });
  const diasPeriodo = Math.max(1, (calcularDiasCivisAnalytics_(inicio, fim) || 0) + 1);
  const ultima = concluidas.map(function (f) { return f.dataConclusao; }).sort().pop() || '';
  return {
    profissional: profissional || ANALYTICS_CONFIG.equipeId,
    recebidas: recebidas.length,
    concluidas: concluidas.length,
    saldo: recebidas.length - concluidas.length,
    backlog: backlog.length,
    naoTransferidas: backlog.filter(function (f) { return f.status === 'nao_transferida'; }).length,
    pendentes: backlog.filter(function (f) { return f.status === 'pendente' || f.status === 'inconsistente'; }).length,
    atrasadas: backlog.filter(function (f) { return f.sla === 'atrasada'; }).length,
    taxaConclusao: recebidas.length ? arredondarAnalytics_(concluidasDaCoorte.length / recebidas.length * 100, 1) : null,
    taxaSla: slaValidas.length ? arredondarAnalytics_(slaValidas.filter(function (f) { return f.sla === 'dentro_prazo'; }).length / slaValidas.length * 100, 1) : null,
    tempoMedio: arredondarAnalytics_(mediaAnalytics_(tempos), 1),
    tempoMediano: arredondarAnalytics_(medianaAnalytics_(tempos), 1),
    tempoP75: arredondarAnalytics_(percentilAnalytics_(tempos, 0.75), 1),
    maiorEspera: backlog.length ? Math.max.apply(null, backlog.map(function (f) { return f.idadeDias == null ? 0 : f.idadeDias; })) : 0,
    producaoDiaria: arredondarAnalytics_(concluidas.length / diasPeriodo, 2),
    producaoSemanal: arredondarAnalytics_(concluidas.length / diasPeriodo * 7, 1),
    ultimaConclusao: ultima,
    amostraInsuficiente: concluidas.length < 5,
  };
}

function calcularProdutividadeAnalytics_(fatos, inicio, fim) {
  return {
    equipe: agregarProdutividadeAnalytics_(fatos, inicio, fim, null),
    porProfissional: profissionaisUnicosAnalytics_(fatos).map(function (nome) { return agregarProdutividadeAnalytics_(fatos, inicio, fim, nome); }),
  };
}

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
    if (!entreDatasAnalytics_(data, inicio, fim)) return;
    const chave = chavePeriodoAnalytics_(data, granularidade);
    if (!mapa[chave]) mapa[chave] = { periodo: chave, entradas: 0, conclusoes: 0, saldo: 0 };
    mapa[chave][campo]++;
  }
  (fatos || []).forEach(function (fato) { somar(fato.dataEntrada, 'entradas'); somar(fato.dataConclusao, 'conclusoes'); });
  return Object.keys(mapa).sort().map(function (chave) { mapa[chave].saldo = mapa[chave].entradas - mapa[chave].conclusoes; return mapa[chave]; });
}

function criarPontosDiariosAnalytics_(inicio, fim) {
  const pontos = [];
  const a = inicio.split('-').map(Number);
  const b = fim.split('-').map(Number);
  const atual = new Date(Date.UTC(a[0], a[1] - 1, a[2]));
  const limite = new Date(Date.UTC(b[0], b[1] - 1, b[2]));
  while (atual <= limite) { pontos.push(atual.toISOString().slice(0, 10)); atual.setUTCDate(atual.getUTCDate() + 1); }
  return pontos;
}

function calcularBacklogHistoricoAnalytics_(fatos, inicio, fim, granularidade) {
  const mapa = {};
  criarPontosDiariosAnalytics_(inicio, fim).forEach(function (dia) {
    const backlog = (fatos || []).filter(function (f) { return f.dataEntrada && f.dataEntrada <= dia && (!f.dataConclusao || f.dataConclusao > dia); }).length;
    mapa[chavePeriodoAnalytics_(dia, granularidade)] = backlog;
  });
  return Object.keys(mapa).sort().map(function (periodo) { return { periodo: periodo, backlog: mapa[periodo] }; });
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
  Object.keys(atual || {}).forEach(function (campo) {
    if (typeof atual[campo] !== 'number') return;
    const base = typeof anterior[campo] === 'number' ? anterior[campo] : 0;
    resultado[campo] = { atual: atual[campo], anterior: base, variacaoAbsoluta: atual[campo] - base, variacaoPercentual: base === 0 ? null : arredondarAnalytics_((atual[campo] - base) / base * 100, 1) };
  });
  return resultado;
}

function diagnosticarGargalosAnalytics_(agregado, referenciaEquipe, anterior) {
  const alertas = [];
  if (!agregado.concluidas && agregado.backlog) alertas.push({ tipo: 'sem_conclusao', severidade: 'critico', titulo: 'Sem conclusões no período', detalhe: 'Há demandas abertas, mas nenhuma prescrição foi concluída.' });
  if (agregado.saldo > 0) alertas.push({ tipo: 'backlog_crescente', severidade: 'atencao', titulo: 'Backlog em crescimento', detalhe: 'As entradas superaram as conclusões no período selecionado.' });
  if (agregado.atrasadas) alertas.push({ tipo: 'atrasos', severidade: 'atencao', titulo: 'Demandas fora do SLA', detalhe: agregado.atrasadas + ' demanda(s) ultrapassaram 2 dias.' });
  if (referenciaEquipe && agregado.taxaSla != null && referenciaEquipe.taxaSla != null && agregado.taxaSla < referenciaEquipe.taxaSla) alertas.push({ tipo: 'sla_abaixo', severidade: 'informativo', titulo: 'SLA abaixo da equipe', detalhe: 'O índice está abaixo da referência geral no período.' });
  if (anterior && agregado.concluidas < anterior.concluidas) alertas.push({ tipo: 'queda_producao', severidade: 'informativo', titulo: 'Produção menor', detalhe: 'Foram concluídas menos prescrições que no período anterior equivalente.' });
  return alertas;
}

function granularidadeAnalytics_(inicio, fim) {
  const dias = calcularDiasCivisAnalytics_(inicio, fim) + 1;
  return dias <= 31 ? 'diaria' : dias <= 180 ? 'semanal' : 'mensal';
}

function montarPayloadDashboardAnalytics_(fatos, historico, opcoes) {
  opcoes = opcoes || {};
  const hoje = opcoes.hoje || hojeIsoAnalytics_();
  const fim = opcoes.fim || hoje;
  const inicio = opcoes.inicio || (function () { const p = periodoAnteriorEquivalenteAnalytics_(fim, fim); return p.inicio; })();
  const anteriorPeriodo = periodoAnteriorEquivalenteAnalytics_(inicio, fim);
  const produtividade = calcularProdutividadeAnalytics_(fatos, inicio, fim);
  const anterior = calcularProdutividadeAnalytics_(fatos, anteriorPeriodo.inicio, anteriorPeriodo.fim);
  const granularidade = granularidadeAnalytics_(inicio, fim);
  const qualidade = [];
  fatos.forEach(function (f) {
    if (!f.dataEntrada) qualidade.push({ codigo: 'DATA_ENTRADA_INVALIDA', submissionId: f.submissionId });
    if (f.status === 'inconsistente') qualidade.push({ codigo: 'PRESCRICAO_SEM_DATA', submissionId: f.submissionId });
  });
  produtividade.diagnosticos = diagnosticarGargalosAnalytics_(produtividade.equipe, null, anterior.equipe);
  produtividade.comparacaoAnterior = compararPeriodosAnalytics_(produtividade.equipe, anterior.equipe);
  return {
    meta: { atualizadoEm: new Date().toISOString(), slaDias: ANALYTICS_CONFIG.slaDias, spreadsheetId: ANALYTICS_CONFIG.spreadsheetId, versao: ANALYTICS_CONFIG.versao, inicio: inicio, fim: fim, granularidade: granularidade },
    filtros: { profissionais: profissionaisUnicosAnalytics_(fatos), periodos: [] },
    acompanhamento: fatos.slice().sort(function (a, b) { return (b.dataEntrada || '').localeCompare(a.dataEntrada || ''); }),
    produtividade: produtividade,
    comparativos: {
      serieFluxo: calcularFluxoAnalytics_(fatos, inicio, fim, granularidade),
      serieBacklog: calcularBacklogHistoricoAnalytics_(fatos, inicio, fim, granularidade),
      porProfissional: produtividade.porProfissional,
      tabela: produtividade.porProfissional,
      atualAnterior: produtividade.comparacaoAnterior,
      historico: historico || [],
    },
    qualidade: qualidade,
  };
}
