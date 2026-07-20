const QUESTIONARIO_GESTOR_EXTENSOES = Object.freeze([
  'Questionário ID', 'Nome do questionário', 'Tipo de registro', 'ID da etapa',
  'Etapa', 'Ordem da etapa', 'Ordem da pergunta', 'Cabeçalho', 'Publicado em',
  'Atualizado em', 'Revisão',
]);

const QUESTIONARIO_GESTOR_TIPOS = Object.freeze([
  'texto', 'texto_longo', 'numero', 'data', 'unica', 'multipla', 'select',
  'consentimento', 'profissional', 'email', 'tel',
]);

const QUESTIONARIO_GESTOR_PROTEGIDOS = Object.freeze({
  profissional: 'profissional', nomeCompleto: 'texto', whatsapp: 'tel',
});

function textoQuestionarioGestor_(valor) { return limparTextoAnalytics_(valor); }
function chaveQuestionarioGestor_(valor) { return normalizarCabecalhoAnalytics_(valor); }
function statusQuestionarioGestor_(valor) {
  const texto = textoQuestionarioGestor_(valor).toLowerCase();
  return texto === 'ativa' || texto === 'ativo' ? 'Ativa' : (texto === 'rascunho' ? 'Rascunho' : 'Arquivada');
}
function opcoesQuestionarioGestor_(valor) {
  return (Array.isArray(valor) ? valor : String(valor == null ? '' : valor).split('|'))
    .map(textoQuestionarioGestor_).filter(Boolean);
}
function indicesQuestionarioGestor_(cabecalhos) {
  const indices = {};
  (cabecalhos || []).forEach(function (cabecalho, indice) { indices[chaveQuestionarioGestor_(cabecalho)] = indice; });
  return indices;
}
function valorQuestionarioGestor_(linha, indices, cabecalho) {
  const indice = indices[chaveQuestionarioGestor_(cabecalho)];
  return indice === undefined ? '' : linha[indice];
}

function obterAbaQuestionarioGestor_() {
  const aba = obterPlanilhaAnalytics_().getSheetByName(ANALYTICS_CONFIG.abaQuestionario);
  if (!aba) throw new Error('A aba Questionário não foi encontrada na planilha oficial.');
  return aba;
}

function garantirEstruturaQuestionarioGestor_(aba) {
  if (aba.getLastRow() < 1 || aba.getLastColumn() < 1) {
    throw new Error('A aba Questionário está vazia. Execute Preparar base versionada no PWA dos prescritores antes de editar o formulário.');
  }
  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  const indices = indicesQuestionarioGestor_(cabecalhos);
  const faltantes = QUESTIONARIO_GESTOR_EXTENSOES.filter(function (cabecalho) { return indices[chaveQuestionarioGestor_(cabecalho)] === undefined; });
  if (faltantes.length) {
    throw new Error('O catálogo ainda não está preparado para edição. Atualize o PWA dos prescritores e execute Preparar base versionada. Campos ausentes: ' + faltantes.join(', ') + '.');
  }
  return { cabecalhos: cabecalhos, indices: indices };
}

function lerQuestionariosGestor_(aba) {
  const estrutura = garantirEstruturaQuestionarioGestor_(aba);
  const valores = aba.getLastRow() > 1 ? aba.getRange(2, 1, aba.getLastRow() - 1, estrutura.cabecalhos.length).getValues() : [];
  const versoes = {};
  valores.forEach(function (linha) {
    const versao = textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Versão'));
    if (!versao) return;
    const questionarioId = textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Questionário ID')) || 'anamnese_inicial';
    const chave = questionarioId + '|' + versao;
    if (!versoes[chave]) {
      versoes[chave] = {
        questionarioId: questionarioId,
        nome: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Nome do questionário')) || 'Anamnese inicial',
        versao: versao,
        status: statusQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Status')),
        revisao: Number(valorQuestionarioGestor_(linha, estrutura.indices, 'Revisão')) || 1,
        etapas: [],
      };
    }
    const destino = versoes[chave];
    const tipoRegistro = textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Tipo de registro'));
    const etapaId = textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'ID da etapa'));
    if (tipoRegistro === 'etapa') {
      if (!destino.etapas.some(function (etapa) { return etapa.id === etapaId; })) {
        destino.etapas.push({ id: etapaId, titulo: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Etapa')), ordem: Number(valorQuestionarioGestor_(linha, estrutura.indices, 'Ordem da etapa')) || destino.etapas.length + 1, campos: [] });
      }
      return;
    }
    let etapa = destino.etapas.filter(function (item) { return item.id === etapaId; })[0];
    if (!etapa) {
      etapa = { id: etapaId || 'etapa_' + (destino.etapas.length + 1), titulo: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Etapa')) || 'Etapa', ordem: Number(valorQuestionarioGestor_(linha, estrutura.indices, 'Ordem da etapa')) || destino.etapas.length + 1, campos: [] };
      destino.etapas.push(etapa);
    }
    etapa.campos.push({
      codigo: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Código')),
      cabecalho: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Cabeçalho')),
      rotulo: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Pergunta')),
      tipo: textoQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Tipo')),
      obrigatorio: String(valorQuestionarioGestor_(linha, estrutura.indices, 'Obrigatória')).toLowerCase() !== 'false',
      opcoes: opcoesQuestionarioGestor_(valorQuestionarioGestor_(linha, estrutura.indices, 'Opções')),
      ordem: Number(valorQuestionarioGestor_(linha, estrutura.indices, 'Ordem da pergunta')) || Number(valorQuestionarioGestor_(linha, estrutura.indices, 'Ordem')) || 1,
    });
  });
  return Object.keys(versoes).map(function (chave) {
    const versao = versoes[chave];
    versao.etapas.sort(function (a, b) { return a.ordem - b.ordem; });
    versao.etapas.forEach(function (etapa) { etapa.campos.sort(function (a, b) { return a.ordem - b.ordem; }); });
    return versao;
  });
}

function proximaVersaoQuestionarioGestor_(versoes) {
  return 'v' + ((versoes || []).reduce(function (maior, item) {
    return Math.max(maior, Number(String(item.versao || '').replace(/^v/i, '')) || 0);
  }, 0) + 1);
}

function validarRascunhoQuestionarioGestor_(rascunho) {
  const erros = [];
  const etapas = rascunho && Array.isArray(rascunho.etapas) ? rascunho.etapas : [];
  const codigos = {}, cabecalhos = {}, protegidos = {};
  if (!etapas.length) erros.push({ campo: 'etapas', mensagem: 'Crie ao menos uma etapa.' });
  etapas.forEach(function (etapa, indiceEtapa) {
    const campos = Array.isArray(etapa.campos) ? etapa.campos : [];
    if (!textoQuestionarioGestor_(etapa.titulo)) erros.push({ campo: 'etapa', mensagem: 'Dê um nome à etapa ' + (indiceEtapa + 1) + '.' });
    if (!campos.length) erros.push({ campo: 'etapa', mensagem: 'A etapa "' + (textoQuestionarioGestor_(etapa.titulo) || indiceEtapa + 1) + '" precisa ter ao menos uma pergunta.' });
    campos.forEach(function (campo) {
      const codigo = textoQuestionarioGestor_(campo.codigo);
      const cabecalho = textoQuestionarioGestor_(campo.cabecalho);
      const tipo = textoQuestionarioGestor_(campo.tipo);
      if (!codigo || codigos[codigo]) erros.push({ campo: codigo || 'pergunta', mensagem: 'Cada pergunta precisa ter um código único.' });
      if (!cabecalho || cabecalhos[chaveQuestionarioGestor_(cabecalho)]) erros.push({ campo: codigo || 'pergunta', mensagem: 'Cada pergunta precisa ter um cabeçalho interno único.' });
      codigos[codigo] = true; cabecalhos[chaveQuestionarioGestor_(cabecalho)] = true;
      if (!textoQuestionarioGestor_(campo.rotulo)) erros.push({ campo: codigo, mensagem: 'Toda pergunta precisa ter texto.' });
      if (QUESTIONARIO_GESTOR_TIPOS.indexOf(tipo) === -1) erros.push({ campo: codigo, mensagem: 'Tipo de pergunta inválido.' });
      const opcoes = opcoesQuestionarioGestor_(campo.opcoes);
      if ((tipo === 'unica' || tipo === 'multipla' || tipo === 'select') && new Set(opcoes.map(function (opcao) { return opcao.toLowerCase(); })).size < 2) erros.push({ campo: codigo, mensagem: 'Perguntas de escolha precisam de ao menos duas opções diferentes.' });
      if (QUESTIONARIO_GESTOR_PROTEGIDOS[codigo]) {
        protegidos[codigo] = true;
        if (tipo !== QUESTIONARIO_GESTOR_PROTEGIDOS[codigo] || campo.obrigatorio === false) erros.push({ campo: codigo, mensagem: 'O campo "' + codigo + '" é obrigatório e possui um tipo protegido.' });
      }
    });
  });
  Object.keys(QUESTIONARIO_GESTOR_PROTEGIDOS).forEach(function (codigo) {
    if (!protegidos[codigo]) erros.push({ campo: codigo, mensagem: 'O campo obrigatório "' + codigo + '" não pode ser removido.' });
  });
  return { ok: !erros.length, erros: erros };
}

function getQuestionarioGestorAnalytics() {
  const versoes = lerQuestionariosGestor_(obterAbaQuestionarioGestor_());
  const ordenadas = versoes.sort(function (a, b) { return (Number(String(b.versao).replace(/^v/i, '')) || 0) - (Number(String(a.versao).replace(/^v/i, '')) || 0); });
  return {
    ativa: ordenadas.filter(function (item) { return item.status === 'Ativa'; })[0] || null,
    rascunho: ordenadas.filter(function (item) { return item.status === 'Rascunho'; })[0] || null,
    arquivadas: ordenadas.filter(function (item) { return item.status === 'Arquivada'; }),
    proximaVersao: proximaVersaoQuestionarioGestor_(ordenadas),
    atualizadoEm: new Date().toISOString(),
  };
}

function linhaQuestionarioGestor_(cabecalhos, valores) {
  const indices = indicesQuestionarioGestor_(cabecalhos);
  const linha = Array(cabecalhos.length).fill('');
  Object.keys(valores).forEach(function (cabecalho) {
    const indice = indices[chaveQuestionarioGestor_(cabecalho)];
    if (indice !== undefined) linha[indice] = valores[cabecalho];
  });
  return linha;
}

function linhasRascunhoQuestionarioGestor_(rascunho, status, revisao) {
  const agora = new Date();
  const linhas = [];
  (rascunho.etapas || []).forEach(function (etapa, indiceEtapa) {
    linhas.push({ 'Versão': rascunho.versao, 'Status': status, 'Questionário ID': rascunho.questionarioId || 'anamnese_inicial', 'Nome do questionário': rascunho.nome || 'Anamnese inicial', 'Tipo de registro': 'etapa', 'ID da etapa': etapa.id, 'Etapa': etapa.titulo, 'Ordem da etapa': indiceEtapa + 1, 'Publicado em': status === 'Ativa' ? agora : '', 'Atualizado em': agora, 'Revisão': revisao });
    (etapa.campos || []).forEach(function (campo, indiceCampo) {
      linhas.push({ 'Versão': rascunho.versao, 'Ordem': indiceCampo + 1, 'Código': campo.codigo, 'Pergunta': campo.rotulo, 'Tipo': campo.tipo, 'Obrigatória': campo.obrigatorio !== false, 'Opções': opcoesQuestionarioGestor_(campo.opcoes).join(' | '), 'Status': status, 'Questionário ID': rascunho.questionarioId || 'anamnese_inicial', 'Nome do questionário': rascunho.nome || 'Anamnese inicial', 'Tipo de registro': 'pergunta', 'ID da etapa': etapa.id, 'Etapa': etapa.titulo, 'Ordem da etapa': indiceEtapa + 1, 'Ordem da pergunta': indiceCampo + 1, 'Cabeçalho': campo.cabecalho, 'Publicado em': status === 'Ativa' ? agora : '', 'Atualizado em': agora, 'Revisão': revisao });
    });
  });
  return linhas;
}

function removerVersaoQuestionarioGestor_(aba, cabecalhos, versao) {
  const indiceVersao = indicesQuestionarioGestor_(cabecalhos)[chaveQuestionarioGestor_('Versão')];
  if (indiceVersao === undefined || aba.getLastRow() < 2) return;
  const valores = aba.getRange(2, indiceVersao + 1, aba.getLastRow() - 1, 1).getDisplayValues();
  for (let indice = valores.length - 1; indice >= 0; indice--) {
    if (textoQuestionarioGestor_(valores[indice][0]) === versao) aba.deleteRow(indice + 2);
  }
}

function materializarCabecalhosRespostasGestor_(rascunho) {
  const aba = obterPlanilhaAnalytics_().getSheetByName(ANALYTICS_CONFIG.abaRespostas);
  if (!aba) throw new Error('A aba Respostas não foi encontrada na planilha oficial.');
  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  const existentes = {};
  cabecalhos.forEach(function (cabecalho) { existentes[chaveQuestionarioGestor_(cabecalho)] = true; });
  const novos = [];
  (rascunho.etapas || []).forEach(function (etapa) { (etapa.campos || []).forEach(function (campo) {
    if (!existentes[chaveQuestionarioGestor_(campo.cabecalho)]) { existentes[chaveQuestionarioGestor_(campo.cabecalho)] = true; novos.push(campo.cabecalho); }
  }); });
  if (novos.length) aba.getRange(1, cabecalhos.length + 1, 1, novos.length).setValues([novos]);
}

function salvarOuPublicarQuestionarioGestor_(rascunho, revisaoEsperada, publicar) {
  const validacao = validarRascunhoQuestionarioGestor_(rascunho);
  if (publicar && !validacao.ok) throw new Error(validacao.erros.map(function (erro) { return erro.mensagem; }).join(' '));
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const aba = obterAbaQuestionarioGestor_();
    const estrutura = garantirEstruturaQuestionarioGestor_(aba);
    const existentes = lerQuestionariosGestor_(aba);
    const anterior = existentes.filter(function (item) { return item.versao === rascunho.versao; })[0];
    if (anterior && Number(revisaoEsperada) !== Number(anterior.revisao)) throw new Error('Este rascunho foi alterado em outra sessão. Recarregue antes de salvar.');
    if (!anterior && Number(revisaoEsperada) !== 0) throw new Error('A versão não existe mais. Recarregue antes de salvar.');
    if (publicar) materializarCabecalhosRespostasGestor_(rascunho);
    const proximaRevisao = (anterior ? Number(anterior.revisao) : 0) + 1;
    removerVersaoQuestionarioGestor_(aba, estrutura.cabecalhos, rascunho.versao);
    if (publicar) {
      const iStatus = estrutura.indices[chaveQuestionarioGestor_('Status')];
      const iVersao = estrutura.indices[chaveQuestionarioGestor_('Versão')];
      if (iStatus !== undefined && iVersao !== undefined && aba.getLastRow() > 1) {
        const todas = aba.getRange(2, 1, aba.getLastRow() - 1, estrutura.cabecalhos.length).getValues();
        todas.forEach(function (linha, indice) {
          if (statusQuestionarioGestor_(linha[iStatus]) === 'Ativa') aba.getRange(indice + 2, iStatus + 1).setValue('Arquivada');
        });
      }
    }
    const linhas = linhasRascunhoQuestionarioGestor_(rascunho, publicar ? 'Ativa' : 'Rascunho', proximaRevisao).map(function (valores) { return linhaQuestionarioGestor_(estrutura.cabecalhos, valores); });
    if (linhas.length) aba.getRange(aba.getLastRow() + 1, 1, linhas.length, estrutura.cabecalhos.length).setValues(linhas);
    SpreadsheetApp.flush();
    return getQuestionarioGestorAnalytics();
  } finally { lock.releaseLock(); }
}

function salvarRascunhoQuestionarioGestorAnalytics(rascunho, revisaoEsperada) {
  return salvarOuPublicarQuestionarioGestor_(rascunho, revisaoEsperada, false);
}

function publicarQuestionarioGestorAnalytics(rascunho, revisaoEsperada) {
  return salvarOuPublicarQuestionarioGestor_(rascunho, revisaoEsperada, true);
}
