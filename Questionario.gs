const PRESCRICAO_ETAPAS_SEMENTE = Object.freeze([
  'Consentimento e responsável',
  'Identificação e dados físicos',
  'Experiência de treino',
  'Objetivo e rotina',
  'Dor, assimetrias e limitações',
  'Saúde e preferências',
]);

const PRESCRICAO_CABECALHOS_QUESTIONARIO_EXTENDIDOS = Object.freeze([
  'Questionário ID', 'Nome do questionário', 'Tipo de registro', 'ID da etapa',
  'Etapa', 'Ordem da etapa', 'Ordem da pergunta', 'Cabeçalho', 'Publicado em',
  'Atualizado em', 'Revisão',
]);

const PRESCRICAO_TIPOS_QUESTIONARIO = Object.freeze([
  'texto', 'texto_longo', 'numero', 'data', 'unica', 'multipla', 'select',
  'consentimento', 'profissional', 'email', 'tel',
]);

const PRESCRICAO_CAMPOS_PROTEGIDOS_QUESTIONARIO = Object.freeze({
  profissional: 'profissional',
  nomeCompleto: 'texto',
  whatsapp: 'tel',
});

function textoQuestionarioPrescricao_(valor) {
  return typeof limparTextoPrescricao_ === 'function'
    ? limparTextoPrescricao_(valor)
    : String(valor === undefined || valor === null ? '' : valor).trim();
}

function normalizarStatusQuestionarioPrescricao_(valor) {
  const texto = textoQuestionarioPrescricao_(valor).toLowerCase();
  if (texto === 'ativa' || texto === 'ativo') return 'Ativa';
  if (texto === 'rascunho') return 'Rascunho';
  return 'Arquivada';
}

function proximaVersaoQuestionarioPrescricao_(versao) {
  const numero = Number(String(versao || '').replace(/^v/i, '')) || 0;
  return 'v' + (numero + 1);
}

function etapasSementeQuestionarioPrescricao_() {
  return PRESCRICAO_ETAPAS_SEMENTE.map(function (titulo, indice) {
    return { id: 'etapa_' + (indice + 1), titulo: titulo, ordem: indice + 1, campos: [] };
  });
}

function montarQuestionarioSementePrescricao_() {
  const etapas = etapasSementeQuestionarioPrescricao_();
  Object.keys(PRESCRICAO_QUESTIONARIOS.v2.campos).forEach(function (codigo, indice) {
    const campoOriginal = PRESCRICAO_QUESTIONARIOS.v2.campos[codigo];
    const etapa = etapas[campoOriginal.etapa - 1];
    etapa.campos.push({
      codigo: codigo,
      cabecalho: campoOriginal.cabecalho,
      rotulo: campoOriginal.rotulo,
      tipo: campoOriginal.tipo,
      obrigatorio: campoOriginal.obrigatorio !== false,
      opcoes: (campoOriginal.opcoes || []).slice(),
      ordem: indice + 1,
    });
  });
  return {
    questionarioId: 'anamnese_inicial',
    nome: 'Anamnese inicial',
    versao: 'v2',
    status: 'Ativa',
    revisao: 1,
    etapas: etapas,
  };
}

function indiceCabecalhosQuestionarioPrescricao_(cabecalhos) {
  const indices = {};
  (cabecalhos || []).forEach(function (cabecalho, indice) {
    const chave = typeof normalizarCabecalhoPrescricao_ === 'function'
      ? normalizarCabecalhoPrescricao_(cabecalho)
      : textoQuestionarioPrescricao_(cabecalho).toLowerCase();
    if (chave) indices[chave] = indice;
  });
  return indices;
}

function valorQuestionarioPrescricao_(linha, indices, cabecalho) {
  const chave = typeof normalizarCabecalhoPrescricao_ === 'function'
    ? normalizarCabecalhoPrescricao_(cabecalho)
    : String(cabecalho).toLowerCase();
  const indice = indices[chave];
  return indice === undefined ? '' : linha[indice];
}

function opcoesQuestionarioPrescricao_(valor) {
  if (Array.isArray(valor)) return valor.map(textoQuestionarioPrescricao_).filter(Boolean);
  return textoQuestionarioPrescricao_(valor).split('|').map(textoQuestionarioPrescricao_).filter(Boolean);
}

function garantirCabecalhosQuestionarioPrescricao_(aba) {
  const ultimasColunas = aba.getLastColumn();
  if (aba.getLastRow() < 1 || ultimasColunas < 1) {
    aba.getRange(1, 1, 1, 8).setValues([['Versão', 'Ordem', 'Código', 'Pergunta', 'Tipo', 'Obrigatória', 'Opções', 'Status']]);
  }
  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  const existentes = indiceCabecalhosQuestionarioPrescricao_(cabecalhos);
  const novos = PRESCRICAO_CABECALHOS_QUESTIONARIO_EXTENDIDOS.filter(function (cabecalho) {
    return existentes[normalizarCabecalhoPrescricao_(cabecalho)] === undefined;
  });
  if (novos.length) aba.getRange(1, cabecalhos.length + 1, 1, novos.length).setValues([novos]);
  return aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
}

function escreverMetadadosLinhaQuestionarioPrescricao_(aba, linha, indices, valores) {
  const cabecalhos = Object.keys(valores);
  cabecalhos.forEach(function (cabecalho) {
    const indice = indices[normalizarCabecalhoPrescricao_(cabecalho)];
    if (indice !== undefined) aba.getRange(linha, indice + 1).setValue(valores[cabecalho]);
  });
}

function garantirCatalogoVersionadoPrescricao_(planilha) {
  const ss = planilha || obterPlanilhaPrescricao_();
  let aba = ss.getSheetByName(PRESCRICAO_CONFIG.abaQuestionario);
  if (!aba) aba = ss.insertSheet(PRESCRICAO_CONFIG.abaQuestionario);
  const cabecalhos = garantirCabecalhosQuestionarioPrescricao_(aba);
  const indices = indiceCabecalhosQuestionarioPrescricao_(cabecalhos);
  const valores = aba.getLastRow() > 1 ? aba.getRange(2, 1, aba.getLastRow() - 1, cabecalhos.length).getValues() : [];
  const semente = montarQuestionarioSementePrescricao_();
  const porCodigo = {};
  valores.forEach(function (linha, indice) {
    const codigo = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Código'));
    const versao = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Versão'));
    if (versao === 'v2' && codigo) porCodigo[codigo] = indice + 2;
  });

  semente.etapas.forEach(function (etapa) {
    const jaExiste = valores.some(function (linha) {
      return textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Versão')) === 'v2'
        && textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Tipo de registro')) === 'etapa'
        && textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'ID da etapa')) === etapa.id;
    });
    if (!jaExiste) {
      const linha = Array(cabecalhos.length).fill('');
      linha[indices[normalizarCabecalhoPrescricao_('Versão')]] = 'v2';
      linha[indices[normalizarCabecalhoPrescricao_('Status')]] = 'Ativa';
      linha[indices[normalizarCabecalhoPrescricao_('Questionário ID')]] = semente.questionarioId;
      linha[indices[normalizarCabecalhoPrescricao_('Nome do questionário')]] = semente.nome;
      linha[indices[normalizarCabecalhoPrescricao_('Tipo de registro')]] = 'etapa';
      linha[indices[normalizarCabecalhoPrescricao_('ID da etapa')]] = etapa.id;
      linha[indices[normalizarCabecalhoPrescricao_('Etapa')]] = etapa.titulo;
      linha[indices[normalizarCabecalhoPrescricao_('Ordem da etapa')]] = etapa.ordem;
      linha[indices[normalizarCabecalhoPrescricao_('Publicado em')]] = new Date();
      linha[indices[normalizarCabecalhoPrescricao_('Atualizado em')]] = new Date();
      linha[indices[normalizarCabecalhoPrescricao_('Revisão')]] = 1;
      aba.appendRow(linha);
    }
  });

  semente.etapas.forEach(function (etapa) {
    etapa.campos.forEach(function (campo) {
      const linha = porCodigo[campo.codigo];
      if (!linha) return;
      const valoresAtuais = aba.getRange(linha, 1, 1, cabecalhos.length).getValues()[0];
      const precisaMigrar = !textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(valoresAtuais, indices, 'Tipo de registro'))
        || !textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(valoresAtuais, indices, 'ID da etapa'))
        || !textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(valoresAtuais, indices, 'Cabeçalho'));
      if (!precisaMigrar) return;
      escreverMetadadosLinhaQuestionarioPrescricao_(aba, linha, indices, {
        'Questionário ID': semente.questionarioId,
        'Nome do questionário': semente.nome,
        'Tipo de registro': 'pergunta',
        'ID da etapa': etapa.id,
        'Etapa': etapa.titulo,
        'Ordem da etapa': etapa.ordem,
        'Ordem da pergunta': campo.ordem,
        'Cabeçalho': campo.cabecalho,
        'Publicado em': new Date(),
        'Atualizado em': new Date(),
        'Revisão': 1,
      });
    });
  });
  aba.setFrozenRows(1);
  return { aba: aba, versaoAtiva: 'v2' };
}

function lerVersoesQuestionarioPrescricao_(planilha) {
  const ss = planilha || obterPlanilhaPrescricao_();
  const aba = ss.getSheetByName(PRESCRICAO_CONFIG.abaQuestionario);
  if (!aba || aba.getLastRow() < 2) return [];
  const valores = aba.getDataRange().getValues();
  const indices = indiceCabecalhosQuestionarioPrescricao_(valores[0]);
  const versoes = {};
  valores.slice(1).forEach(function (linha) {
    const versao = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Versão'));
    if (!versao) return;
    const questionarioId = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Questionário ID')) || 'anamnese_inicial';
    const chave = questionarioId + '|' + versao;
    if (!versoes[chave]) {
      versoes[chave] = {
        questionarioId: questionarioId,
        nome: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Nome do questionário')) || 'Anamnese inicial',
        versao: versao,
        status: normalizarStatusQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Status')),
        revisao: Number(valorQuestionarioPrescricao_(linha, indices, 'Revisão')) || 1,
        etapas: [],
      };
    }
    const destino = versoes[chave];
    const tipoRegistro = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Tipo de registro')) || 'pergunta';
    const etapaId = textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'ID da etapa'));
    if (tipoRegistro === 'etapa') {
      const existente = destino.etapas.filter(function (etapa) { return etapa.id === etapaId; })[0];
      const etapa = existente || {
        id: etapaId,
        titulo: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Etapa')),
        ordem: Number(valorQuestionarioPrescricao_(linha, indices, 'Ordem da etapa')) || destino.etapas.length + 1,
        campos: [],
      };
      if (!existente) destino.etapas.push(etapa);
      return;
    }
    let etapa = destino.etapas.filter(function (item) { return item.id === etapaId; })[0];
    if (!etapa) {
      etapa = {
        id: etapaId || 'etapa_sem_id_' + (destino.etapas.length + 1),
        titulo: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Etapa')) || 'Etapa',
        ordem: Number(valorQuestionarioPrescricao_(linha, indices, 'Ordem da etapa')) || destino.etapas.length + 1,
        campos: [],
      };
      destino.etapas.push(etapa);
    }
    const campo = {
      codigo: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Código')),
      cabecalho: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Cabeçalho')),
      rotulo: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Pergunta')),
      tipo: textoQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Tipo')),
      obrigatorio: String(valorQuestionarioPrescricao_(linha, indices, 'Obrigatória')).toLowerCase() !== 'false',
      opcoes: opcoesQuestionarioPrescricao_(valorQuestionarioPrescricao_(linha, indices, 'Opções')),
      ordem: Number(valorQuestionarioPrescricao_(linha, indices, 'Ordem da pergunta')) || Number(valorQuestionarioPrescricao_(linha, indices, 'Ordem')) || 1,
    };
    etapa.campos.push(campo);
  });
  return Object.keys(versoes).map(function (chave) {
    const item = versoes[chave];
    item.etapas.sort(function (a, b) { return a.ordem - b.ordem; });
    item.etapas.forEach(function (etapa) { etapa.campos.sort(function (a, b) { return a.ordem - b.ordem; }); });
    return item;
  });
}

function obterQuestionarioAtivoPrescricao_(planilha) {
  if (!planilha && (typeof SpreadsheetApp === 'undefined' || !SpreadsheetApp.openById)) return montarQuestionarioSementePrescricao_();
  garantirCatalogoVersionadoPrescricao_(planilha);
  const ativa = lerVersoesQuestionarioPrescricao_(planilha).filter(function (questionario) {
    return questionario.status === 'Ativa';
  })[0];
  return ativa || montarQuestionarioSementePrescricao_();
}

function validarRascunhoQuestionarioPrescricao_(rascunho) {
  const erros = [];
  const etapas = rascunho && Array.isArray(rascunho.etapas) ? rascunho.etapas : [];
  if (!etapas.length) erros.push({ campo: 'etapas', mensagem: 'Crie ao menos uma etapa.' });
  const codigos = {};
  const protegidos = {};
  etapas.forEach(function (etapa, indiceEtapa) {
    const campos = Array.isArray(etapa.campos) ? etapa.campos : [];
    if (!textoQuestionarioPrescricao_(etapa.titulo)) erros.push({ campo: 'etapa', mensagem: 'Dê um nome à etapa ' + (indiceEtapa + 1) + '.' });
    if (!campos.length) erros.push({ campo: 'etapa', mensagem: 'A etapa "' + (textoQuestionarioPrescricao_(etapa.titulo) || indiceEtapa + 1) + '" precisa ter ao menos uma pergunta.' });
    campos.forEach(function (campo) {
      const codigo = textoQuestionarioPrescricao_(campo.codigo);
      const tipo = textoQuestionarioPrescricao_(campo.tipo);
      if (!codigo || codigos[codigo]) erros.push({ campo: codigo || 'pergunta', mensagem: 'Cada pergunta precisa ter um código único.' });
      codigos[codigo] = true;
      if (!textoQuestionarioPrescricao_(campo.rotulo)) erros.push({ campo: codigo, mensagem: 'Toda pergunta precisa ter texto.' });
      if (PRESCRICAO_TIPOS_QUESTIONARIO.indexOf(tipo) === -1) erros.push({ campo: codigo, mensagem: 'Tipo de pergunta inválido.' });
      const opcoes = opcoesQuestionarioPrescricao_(campo.opcoes);
      if ((tipo === 'unica' || tipo === 'multipla' || tipo === 'select') && new Set(opcoes.map(function (opcao) { return opcao.toLowerCase(); })).size < 2) {
        erros.push({ campo: codigo, mensagem: 'Perguntas de escolha precisam de ao menos duas opções diferentes.' });
      }
      if (PRESCRICAO_CAMPOS_PROTEGIDOS_QUESTIONARIO[codigo]) {
        protegidos[codigo] = campo;
        if (tipo !== PRESCRICAO_CAMPOS_PROTEGIDOS_QUESTIONARIO[codigo] || campo.obrigatorio === false) {
          erros.push({ campo: codigo, mensagem: 'O campo "' + codigo + '" é obrigatório e possui um tipo protegido.' });
        }
      }
    });
  });
  Object.keys(PRESCRICAO_CAMPOS_PROTEGIDOS_QUESTIONARIO).forEach(function (codigo) {
    if (!protegidos[codigo]) erros.push({ campo: codigo, mensagem: 'O campo obrigatório "' + codigo + '" não pode ser removido.' });
  });
  return { ok: !erros.length, erros: erros };
}
