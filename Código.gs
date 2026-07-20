const PRESCRICAO_CONFIG = Object.freeze({
  spreadsheetId: '1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs',
  abaRespostas: 'Respostas',
  abaMonitoramento: 'Monitoramento',
  abaComplementar: 'Complementar',
  abaQuestionario: 'Questionário',
  abaLegadoTally: 'Respostas – legado Tally',
  timeZone: 'America/Fortaleza',
  cachePayloadKey: 'prescricoes_payload_oficial_v1',
  cachePayloadSegundos: 300,
  cabecalhosMonitoramento: [
    'ID da demanda',
    'Data da anamnese',
    'Aluno',
    'Profissional',
    'Anamnese transferida?',
    'Treino prescrito?',
    'Data da prescrição',
    'Atualizado em',
  ],
});

const PRESCRICAO_CAMPOS_RESPOSTAS = Object.freeze({
  submissionId: 'ID da demanda',
  submittedAt: 'Criado em',
  profissional: 'Profissional',
  aluno: 'Nome completo',
});

const PRESCRICAO_CABECALHOS_TECNICOS = Object.freeze([
  'submission id',
  'respondent id',
  'submitted at',
  'nome do profissional',
  'nome completo',
  'id da demanda',
  'origem',
  'criado em',
  'versao do questionario',
  'id da tentativa',
  'profissional',
]);

const PRESCRICAO_CABECALHOS_RESPOSTAS = Object.freeze([
  'ID da demanda', 'Origem', 'Criado em', 'Versão do questionário', 'ID da tentativa',
  'Profissional', 'Nome completo', 'Email', 'Whatsapp', 'Consentimento',
  'Data de nascimento', 'Altura em centímetros', 'Peso em kg',
  'Experiência com musculação', 'Frequência de musculação nos últimos 3 meses',
  'Dor ou desconforto atual', 'Local da dor ou desconforto', 'Intensidade da dor (0 a 10)',
  'Movimentos que pioram a dor', 'Diferença entre lados do corpo', 'Detalhes da assimetria',
  'Objetivo principal', 'Tempo disponível por treino', 'Frequência pretendida (dias/semana)',
  'Atividades além da musculação', 'Histórico de lesões ou cirurgias',
  'Movimentos que incomodam', 'Exercícios evitados ou inseguros',
  'Doença ou condição importante', 'Medicamento contínuo', 'Sintomas durante esforço',
  'Preferência de treino', 'Observações finais',
]);

const PRESCRICAO_ALIASES_RESPOSTAS = Object.freeze({
  submissionId: ['ID da demanda', 'Submission ID'],
  submittedAt: ['Criado em', 'Submitted at'],
  profissional: ['Profissional', 'Nome do Profissional'],
  aluno: ['Nome completo'],
});

function campoQuestionario_(cabecalho, rotulo, tipo, etapa, obrigatorio, opcoes) {
  return Object.freeze({
    cabecalho: cabecalho,
    rotulo: rotulo,
    tipo: tipo,
    etapa: etapa,
    obrigatorio: obrigatorio !== false,
    opcoes: Object.freeze(opcoes || []),
  });
}

const PRESCRICAO_QUESTIONARIOS = Object.freeze({
  v2: Object.freeze({
    versao: 'v2',
    campos: Object.freeze({
      consentimento: campoQuestionario_('Consentimento', 'Confirmo que minhas respostas serão usadas para avaliar meu perfil e montar uma prescrição de treino personalizada.', 'consentimento', 1),
      profissional: campoQuestionario_('Profissional', 'Nome do profissional', 'profissional', 1),
      nomeCompleto: campoQuestionario_('Nome completo', 'Nome completo', 'texto', 2),
      email: campoQuestionario_('Email', 'E-mail', 'email', 2),
      whatsapp: campoQuestionario_('Whatsapp', 'WhatsApp', 'tel', 2),
      dataNascimento: campoQuestionario_('Data de nascimento', 'Data de nascimento', 'data', 2),
      alturaCm: campoQuestionario_('Altura em centímetros', 'Altura em centímetros', 'numero', 2),
      pesoKg: campoQuestionario_('Peso em kg', 'Peso em kg', 'numero', 2),
      experienciaMusculacao: campoQuestionario_('Experiência com musculação', 'Qual é sua experiência com musculação?', 'unica', 3, true, ['Nunca treinei', 'Menos de 3 meses', '3 a 12 meses', '1 a 3 anos', 'Mais de 3 anos']),
      frequenciaUltimos3Meses: campoQuestionario_('Frequência de musculação nos últimos 3 meses', 'Nos últimos 3 meses, quantas vezes por semana você treinou musculação em média?', 'unica', 3, true, ['Não treinei', '1x por semana', '2x por semana', '3x por semana', '4x ou mais']),
      objetivo: campoQuestionario_('Objetivo principal', 'Qual seu objetivo principal agora?', 'unica', 4, true, ['Ganhar massa', 'Emagrecer', 'Força', 'Saúde', 'Estética', 'Performance', 'Voltar a treinar', 'Outro']),
      frequenciaPretendida: campoQuestionario_('Frequência pretendida (dias/semana)', 'Quantas vezes na semana pretende treinar?', 'select', 4, true, ['1', '2', '3', '4', '5', '6', '7']),
      tempoTreino: campoQuestionario_('Tempo disponível por treino', 'Quanto tempo você tem por treino?', 'unica', 4, true, ['40 min', '60 min', '75 min', 'Outro']),
      atividadesExtras: campoQuestionario_('Atividades além da musculação', 'Além da musculação, você faz corrida, cardio, esporte ou aula?', 'texto_longo', 4),
      dorAtual: campoQuestionario_('Dor ou desconforto atual', 'Você sente alguma dor ou desconforto hoje que possa interferir no treino?', 'unica', 5, true, ['Não', 'Sim']),
      localDor: campoQuestionario_('Local da dor ou desconforto', 'Onde é a dor ou desconforto?', 'texto', 5, false),
      intensidadeDor: campoQuestionario_('Intensidade da dor (0 a 10)', 'Intensidade da dor de 0 a 10', 'numero', 5, false),
      movimentosPioramDor: campoQuestionario_('Movimentos que pioram a dor', 'Quais movimentos pioram essa dor ou desconforto?', 'texto_longo', 5, false),
      assimetria: campoQuestionario_('Diferença entre lados do corpo', 'Você percebe diferença entre o lado direito e esquerdo do corpo?', 'unica', 5, true, ['Não percebo diferença', 'Sim', 'Não sei dizer']),
      detalhesAssimetria: campoQuestionario_('Detalhes da assimetria', 'Se marcou sim, qual lado, qual região e qual diferença sente?', 'texto', 5, false),
      movimentosIncomodam: campoQuestionario_('Movimentos que incomodam', 'Algum movimento costuma incomodar?', 'multipla', 5, true, ['Nenhum', 'Agachar', 'Correr', 'Subir escada', 'Empurrar', 'Puxar', 'Levantar peso do chão', 'Elevar o braço acima da cabeça', 'Outro']),
      exerciciosEvitados: campoQuestionario_('Exercícios evitados ou inseguros', 'Existe algum exercício que você não pode fazer, não gosta ou não se sente seguro fazendo?', 'texto_longo', 5),
      historicoLesoes: campoQuestionario_('Histórico de lesões ou cirurgias', 'Já teve lesão, cirurgia, hérnia, tendinite, luxação, fratura ou problema de coluna?', 'texto_longo', 6),
      condicaoImportante: campoQuestionario_('Doença ou condição importante', 'Tem alguma doença ou condição importante?', 'texto', 6),
      medicamentoContinuo: campoQuestionario_('Medicamento contínuo', 'Usa algum medicamento contínuo?', 'texto', 6),
      sintomasEsforco: campoQuestionario_('Sintomas durante esforço', 'Já sentiu dor no peito, desmaio, tontura forte, falta de ar fora do normal ou palpitação durante esforço?', 'unica', 6, true, ['Não', 'Sim']),
      preferenciaTreino: campoQuestionario_('Preferência de treino', 'Que tipo de treino você prefere?', 'unica', 6, true, ['Curto e direto', 'Mais variado', 'Mais pesado', 'Mais guiado', 'Com máquinas', 'Com pesos livres', 'Sem preferência']),
      observacoes: campoQuestionario_('Observações finais', 'Tem algo importante sobre seu corpo, rotina ou treino que eu não perguntei?', 'texto_longo', 6),
    }),
  }),
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Prescrições')
    .addItem('Sincronizar Monitoramento', 'sincronizarMonitoramento')
    .addItem('Preparar base versionada', 'prepararBaseAnamneseVersionadaPrescricao')
    .addItem('Validar base versionada', 'validarBaseAnamneseVersionadaPrescricao')
    .addItem('Validar backend', 'validarBackendPrescricoes')
    .addToUi();
}

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setTitle('Acompanhamento de prescrições')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nomeArquivo) {
  return HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();
}

function getQuestionarioPwaPrescricao() {
  const questionarioAtivo = obterQuestionarioAtivoPrescricao_();
  const campos = {};
  questionarioAtivo.etapas.forEach(function (etapa) {
    etapa.campos.forEach(function (campo) {
      campos[campo.codigo] = Object.assign({}, campo, { etapa: etapa.ordem });
    });
  });
  return {
    versao: questionarioAtivo.versao,
    etapas: questionarioAtivo.etapas.map(function (etapa) { return etapa.titulo; }).concat(['Revisar e enviar']),
    campos: campos,
    profissionais: getProfissionaisAtivosPrescricao(),
  };
}

function getProfissionaisAtivosPrescricao() {
  const planilha = obterPlanilhaPrescricao_();
  const aba = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaComplementar);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 2 || ultimaColuna < 1) return [];
  const valores = aba.getRange(1, 1, ultimaLinha, ultimaColuna).getDisplayValues();
  const indices = {};
  valores[0].forEach(function (cabecalho, indice) {
    indices[normalizarCabecalhoPrescricao_(cabecalho)] = indice;
  });
  const nome = indices.nome;
  const status = indices.status;
  if (nome === undefined || status === undefined) {
    throw new Error('Aba Complementar precisa conter os cabeçalhos Nome e Status.');
  }
  return valores.slice(1).filter(function (linha) {
    return limparTextoPrescricao_(linha[nome])
      && normalizarCabecalhoPrescricao_(linha[status]) === 'ativo';
  }).map(function (linha) {
    return limparTextoPrescricao_(linha[nome]);
  }).sort(compararTextoPrescricao_);
}

function validarDemandaPwaPrescricao_(formulario) {
  formulario = formulario || {};
  const questionario = obterQuestionarioAtivoPrescricao_();
  const campos = {};
  questionario.etapas.forEach(function (etapa) {
    etapa.campos.forEach(function (campo) { campos[campo.codigo] = campo; });
  });
  if (limparTextoPrescricao_(formulario.versao) !== questionario.versao) {
    throw new Error('Versão de questionário inválida. Atualize o formulário e tente novamente.');
  }
  const tentativaId = limparTextoPrescricao_(formulario.tentativaId);
  if (!tentativaId || tentativaId.length < 8) {
    throw new Error('Não foi possível identificar esta tentativa de envio. Reabra a anamnese.');
  }
  const respostasRecebidas = formulario.respostas || {};
  const frequencia = campos.frequenciaPretendida;
  if (frequencia && respostasRecebidas.frequenciaPretendida
    && frequencia.opcoes.indexOf(limparTextoPrescricao_(respostasRecebidas.frequenciaPretendida)) === -1) {
    throw new Error('Frequência pretendida deve ser um número de 1 a 7.');
  }
  const respostas = {};
  Object.keys(campos).forEach(function (chave) {
    const campo = campos[chave];
    const valor = respostasRecebidas[chave];
    respostas[chave] = Array.isArray(valor)
      ? valor.map(limparTextoPrescricao_).filter(Boolean)
      : (campo.tipo === 'consentimento' ? normalizarBooleanoPrescricao_(valor) : limparTextoPrescricao_(valor));
    if (campo.obrigatorio && (!respostas[chave] || (Array.isArray(respostas[chave]) && !respostas[chave].length))) {
      throw new Error('Preencha o campo obrigatório: ' + campo.rotulo);
    }
    if ((campo.tipo === 'unica' || campo.tipo === 'multipla' || campo.tipo === 'select') && respostas[chave]) {
      const selecionadas = Array.isArray(respostas[chave]) ? respostas[chave] : [respostas[chave]];
      if (selecionadas.some(function (opcao) { return campo.opcoes.indexOf(opcao) === -1; })) {
        throw new Error('Selecione uma opção válida em: ' + campo.rotulo);
      }
    }
    if (campo.tipo === 'numero' && respostas[chave] && !/^[-+]?\d+(?:[.,]\d+)?$/.test(respostas[chave])) {
      throw new Error('Informe um número válido em: ' + campo.rotulo);
    }
    if (campo.tipo === 'email' && respostas[chave] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respostas[chave])) {
      throw new Error('Informe um e-mail válido.');
    }
    if (campo.codigo === 'whatsapp' && respostas[chave] && respostas[chave].replace(/\D/g, '').length < 10) {
      throw new Error('Informe um WhatsApp válido com DDD.');
    }
  });
  return { versao: questionario.versao, tentativaId: tentativaId, respostas: respostas, questionario: questionario };
}

function criarIdDemandaPrescricao_(agora) {
  const data = agora || new Date();
  const dataId = Utilities.formatDate(data, PRESCRICAO_CONFIG.timeZone, 'yyyyMMdd');
  const sufixo = typeof Utilities.getUuid === 'function'
    ? Utilities.getUuid().replace(/-/g, '').slice(0, 10)
    : String(data.getTime()).slice(-10);
  return 'DEM-' + dataId + '-' + sufixo;
}

function prepararRegistroDemandaPwaPrescricao_(formularioValidado, agora, demandaId) {
  const respostas = formularioValidado.respostas;
  const questionario = formularioValidado.questionario || obterQuestionarioAtivoPrescricao_();
  const id = demandaId || criarIdDemandaPrescricao_(agora);
  const data = agora || new Date();
  const registro = {
    'ID da demanda': id,
    'Origem': 'PWA',
    'Criado em': data,
    'Versão do questionário': formularioValidado.versao,
    'ID da tentativa': formularioValidado.tentativaId,
  };
  questionario.etapas.forEach(function (etapa) {
    etapa.campos.forEach(function (campo) {
      const valor = respostas[campo.codigo];
      registro[campo.cabecalho] = Array.isArray(valor) ? valor.join(' | ') : valor;
    });
  });
  return {
    resposta: registro,
    monitoramento: [id, data, respostas.nomeCompleto, respostas.profissional, false, false, '', data],
  };
}

function enviarDemandaPwaPrescricao(formulario) {
  return executarComLockPrescricao_(function () {
    const validado = validarDemandaPwaPrescricao_(formulario);
    const planilha = obterPlanilhaPrescricao_();
    const abaRespostas = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
    const abaMonitoramento = garantirEstruturaMonitoramento_(planilha);
    const cabecalhos = abaRespostas.getRange(1, 1, 1, abaRespostas.getLastColumn()).getDisplayValues()[0];
    const indices = {};
    cabecalhos.forEach(function (cabecalho, indice) { indices[normalizarCabecalhoPrescricao_(cabecalho)] = indice; });
    const indiceTentativa = indices[normalizarCabecalhoPrescricao_('ID da tentativa')];
    const indiceId = indices[normalizarCabecalhoPrescricao_('ID da demanda')];
    if (indiceTentativa === undefined || indiceId === undefined) {
      throw new Error('A base ainda não foi preparada para receber demandas do PWA.');
    }
    if (abaRespostas.getLastRow() > 1) {
      const tentativas = abaRespostas.getRange(2, indiceTentativa + 1, abaRespostas.getLastRow() - 1, 1).getDisplayValues();
      for (let i = 0; i < tentativas.length; i++) {
        if (limparTextoPrescricao_(tentativas[i][0]) === validado.tentativaId) {
          const idExistente = limparTextoPrescricao_(abaRespostas.getRange(i + 2, indiceId + 1).getDisplayValue());
          return { ok: true, demandaId: idExistente, repetida: true };
        }
      }
    }
    const preparado = prepararRegistroDemandaPwaPrescricao_(validado, new Date());
    const linha = cabecalhos.map(function (cabecalho) { return preparado.resposta[limparTextoPrescricao_(cabecalho)] || ''; });
    abaRespostas.appendRow(linha);
    abaMonitoramento.appendRow(preparado.monitoramento);
    abaRespostas.getRange(abaRespostas.getLastRow(), indices[normalizarCabecalhoPrescricao_('Criado em')] + 1).setNumberFormat('dd/MM/yyyy HH:mm');
    abaMonitoramento.getRange(abaMonitoramento.getLastRow(), 2).setNumberFormat('dd/MM/yyyy HH:mm');
    abaMonitoramento.getRange(abaMonitoramento.getLastRow(), 8).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    SpreadsheetApp.flush();
    removerPayloadPrescricoesCache_();
    return { ok: true, demandaId: preparado.resposta['ID da demanda'], repetida: false };
  });
}

/**
 * Diagnóstico puro de cabeçalhos. É usado tanto na validação administrativa
 * quanto nos testes para que a estrutura da planilha não seja um conhecimento
 * implícito do operador.
 */
function diagnosticarCabecalhosPrescricao_(encontrados, esperados) {
  const existentes = {};
  (encontrados || []).forEach(function (cabecalho) {
    const chave = normalizarCabecalhoPrescricao_(cabecalho);
    if (chave) existentes[chave] = true;
  });
  const faltantes = (esperados || []).filter(function (cabecalho) {
    return !existentes[normalizarCabecalhoPrescricao_(cabecalho)];
  });
  return { ok: !faltantes.length, faltantes: faltantes };
}

function obterIndiceCabecalhoPrescricao_(cabecalhos, aliases) {
  const normalizados = {};
  (cabecalhos || []).forEach(function (cabecalho, indice) {
    const chave = normalizarCabecalhoPrescricao_(cabecalho);
    if (normalizados[chave] === undefined) normalizados[chave] = indice;
  });
  let indice;
  (aliases || []).some(function (alias) {
    const encontrado = normalizados[normalizarCabecalhoPrescricao_(alias)];
    if (encontrado !== undefined) indice = encontrado;
    return encontrado !== undefined;
  });
  return indice;
}

function valorLinhaLegadaTallyPrescricao_(cabecalhos, linha, aliases) {
  const indice = obterIndiceCabecalhoPrescricao_(cabecalhos, aliases);
  return indice === undefined ? '' : linha[indice];
}

/**
 * Converte uma linha do export do Tally para o registro canônico v1. A fonte
 * original permanece inalterada na aba de legado; esta função só cria uma
 * cópia normalizada, preservando os IDs originais para o Monitoramento.
 */
function mapearLinhaLegadaTallyPrescricao_(cabecalhos, linha) {
  const valor = function (aliases) {
    return valorLinhaLegadaTallyPrescricao_(cabecalhos, linha, aliases);
  };
  const registro = {
    'ID da demanda': valor(['Submission ID', 'ID da demanda']),
    'Origem': 'Tally',
    'Criado em': valor(['Submitted at', 'Criado em']),
    'Versão do questionário': 'v1',
    'ID da tentativa': '',
    'Profissional': valor(['Nome do Profissional', 'Profissional']),
    'Nome completo': valor(['Nome completo']),
    'Email': valor(['Email', 'E-mail']),
    'Whatsapp': valor(['Whatsapp', 'WhatsApp']),
    'Consentimento': valor(['Consentimento (Confirmo que minhas respostas serão usadas para avaliar meu perfil e montar uma prescrição de treino personalizada.)', 'Consentimento']),
    'Data de nascimento': valor(['Data de nascimento']),
    'Altura em centímetros': valor(['Altura em centímetros']),
    'Peso em kg': valor(['Peso em kg']),
    'Experiência com musculação': valor(['Qual é sua experiência com musculação?', 'Experiência com musculação']),
    'Frequência de musculação nos últimos 3 meses': valor(['Nos últimos 3 meses, quantas vezes por semana você treinou musculação em média?', 'Frequência de musculação nos últimos 3 meses']),
    'Dor ou desconforto atual': valor(['Você sente alguma dor ou desconforto hoje que possa interferir no treino?', 'Dor ou desconforto atual']),
    'Local da dor ou desconforto': valor(['Onde é a dor ou desconforto?', 'Local da dor ou desconforto']),
    'Intensidade da dor (0 a 10)': valor(['Intensidade da dor de 0 a 10', 'Intensidade da dor (0 a 10)']),
    'Movimentos que pioram a dor': valor(['Quais movimentos pioram essa dor ou desconforto?', 'Movimentos que pioram a dor']),
    'Diferença entre lados do corpo': valor(['Você percebe diferença entre o lado direito e esquerdo do corpo?', 'Diferença entre lados do corpo']),
    'Detalhes da assimetria': valor(['Se marcou sim, qual lado, qual região e qual diferença sente?', 'Detalhes da assimetria']),
    'Objetivo principal': valor(['Qual seu objetivo principal agora?', 'Objetivo principal']),
    'Tempo disponível por treino': valor(['Quanto tempo você tem por treino?', 'Tempo disponível por treino']),
    'Frequência pretendida (dias/semana)': '',
    'Atividades além da musculação': valor(['Além da musculação, você faz corrida, cardio, esporte ou aula?', 'Atividades além da musculação']),
    'Histórico de lesões ou cirurgias': valor(['Já teve lesão, cirurgia, hérnia, tendinite, luxação, fratura ou problema de coluna?', 'Histórico de lesões ou cirurgias']),
    'Movimentos que incomodam': valor(['Algum movimento costuma incomodar?', 'Movimentos que incomodam']),
    'Exercícios evitados ou inseguros': valor(['Existe algum exercício que você não pode fazer, não gosta ou não se sente seguro fazendo?', 'Exercícios evitados ou inseguros']),
    'Doença ou condição importante': valor(['Tem alguma doença ou condição importante?', 'Doença ou condição importante']),
    'Medicamento contínuo': valor(['Usa algum medicamento contínuo?', 'Medicamento contínuo']),
    'Sintomas durante esforço': valor(['Já sentiu dor no peito, desmaio, tontura forte, falta de ar fora do normal ou palpitação durante esforço?', 'Sintomas durante esforço']),
    'Preferência de treino': valor(['Que tipo de treino você prefere?', 'Preferência de treino']),
    'Observações finais': valor(['Tem algo importante sobre seu corpo, rotina ou treino que eu não perguntei?', 'Observações finais']),
  };
  return registro;
}

function cabecalhosParecemTallyPrescricao_(cabecalhos) {
  return obterIndiceCabecalhoPrescricao_(cabecalhos, ['Submission ID']) !== undefined
    && obterIndiceCabecalhoPrescricao_(cabecalhos, ['Submitted at']) !== undefined;
}

function criarOuCompletarAbaRespostasCanonicaPrescricao_(planilha) {
  let aba = planilha.getSheetByName(PRESCRICAO_CONFIG.abaRespostas);
  if (!aba) {
    aba = planilha.insertSheet(PRESCRICAO_CONFIG.abaRespostas, 0);
    aba.getRange(1, 1, 1, PRESCRICAO_CABECALHOS_RESPOSTAS.length)
      .setValues([PRESCRICAO_CABECALHOS_RESPOSTAS]);
    aba.setFrozenRows(1);
    return { aba: aba, colunasAdicionadas: PRESCRICAO_CABECALHOS_RESPOSTAS.length };
  }

  if (aba.getLastColumn() < 1 || aba.getLastRow() < 1) {
    aba.getRange(1, 1, 1, PRESCRICAO_CABECALHOS_RESPOSTAS.length)
      .setValues([PRESCRICAO_CABECALHOS_RESPOSTAS]);
    aba.setFrozenRows(1);
    return { aba: aba, colunasAdicionadas: PRESCRICAO_CABECALHOS_RESPOSTAS.length };
  }

  const cabecalhos = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
  if (cabecalhosParecemTallyPrescricao_(cabecalhos)) {
    throw new Error('Aba Respostas ainda está no formato do Tally e precisa ser migrada antes de receber novas demandas.');
  }
  const essenciais = ['ID da demanda', 'Origem', 'Criado em', 'Versão do questionário', 'ID da tentativa', 'Profissional', 'Nome completo'];
  const diagnosticoEssencial = diagnosticarCabecalhosPrescricao_(cabecalhos, essenciais);
  if (!diagnosticoEssencial.ok) {
    throw new Error('Aba Respostas incompatível. Cabeçalhos obrigatórios ausentes: ' + diagnosticoEssencial.faltantes.join(', ') + '.');
  }
  const diagnostico = diagnosticarCabecalhosPrescricao_(cabecalhos, PRESCRICAO_CABECALHOS_RESPOSTAS);
  if (diagnostico.faltantes.length) {
    aba.getRange(1, aba.getLastColumn() + 1, 1, diagnostico.faltantes.length)
      .setValues([diagnostico.faltantes]);
  }
  aba.setFrozenRows(1);
  return { aba: aba, colunasAdicionadas: diagnostico.faltantes.length };
}

function migrarRespostasTallyParaBaseVersionadaPrescricao_(planilha, abaLegada) {
  const cabecalhosLegados = abaLegada.getRange(1, 1, 1, abaLegada.getLastColumn()).getValues()[0];
  const totalLinhas = Math.max(abaLegada.getLastRow() - 1, 0);
  const abaRespostas = planilha.insertSheet(PRESCRICAO_CONFIG.abaRespostas, 0);
  abaRespostas.getRange(1, 1, 1, PRESCRICAO_CABECALHOS_RESPOSTAS.length)
    .setValues([PRESCRICAO_CABECALHOS_RESPOSTAS]);
  if (totalLinhas) {
    const linhasLegadas = abaLegada.getRange(2, 1, totalLinhas, abaLegada.getLastColumn()).getValues();
    const linhasCanonicas = linhasLegadas.map(function (linha) {
      const registro = mapearLinhaLegadaTallyPrescricao_(cabecalhosLegados, linha);
      return PRESCRICAO_CABECALHOS_RESPOSTAS.map(function (cabecalho) { return registro[cabecalho] || ''; });
    });
    abaRespostas.getRange(2, 1, linhasCanonicas.length, PRESCRICAO_CABECALHOS_RESPOSTAS.length)
      .setValues(linhasCanonicas);
    abaRespostas.getRange(2, 3, linhasCanonicas.length, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  }
  abaRespostas.setFrozenRows(1);
  return { aba: abaRespostas, registrosMigrados: totalLinhas };
}

function garantirMonitoramentoVersionadoPrescricao_(planilha) {
  let aba = planilha.getSheetByName(PRESCRICAO_CONFIG.abaMonitoramento);
  if (aba && aba.getLastRow() > 0 && aba.getLastColumn() > 0) {
    const primeiroCabecalho = aba.getRange(1, 1).getDisplayValue();
    if (normalizarCabecalhoPrescricao_(primeiroCabecalho) === normalizarCabecalhoPrescricao_('Submission ID')) {
      aba.getRange(1, 1).setValue('ID da demanda');
    }
  }
  return garantirEstruturaMonitoramento_(planilha);
}

function linhasCatalogoQuestionarioPrescricao_() {
  const linhas = [];
  const perguntasLegadas = [
    'Nome do Profissional', 'Nome completo', 'Email', 'Whatsapp', 'Consentimento',
    'Data de nascimento', 'Altura em centímetros', 'Peso em kg',
    'Qual é sua experiência com musculação?',
    'Nos últimos 3 meses, quantas vezes por semana você treinou musculação em média?',
    'Você sente alguma dor ou desconforto hoje que possa interferir no treino?',
    'Onde é a dor ou desconforto?', 'Intensidade da dor de 0 a 10',
    'Quais movimentos pioram essa dor ou desconforto?',
    'Você percebe diferença entre o lado direito e esquerdo do corpo?',
    'Se marcou sim, qual lado, qual região e qual diferença sente?',
    'Qual seu objetivo principal agora?', 'Quanto tempo você tem por treino?',
    'Além da musculação, você faz corrida, cardio, esporte ou aula?',
    'Já teve lesão, cirurgia, hérnia, tendinite, luxação, fratura ou problema de coluna?',
    'Algum movimento costuma incomodar?',
    'Existe algum exercício que você não pode fazer, não gosta ou não se sente seguro fazendo?',
    'Tem alguma doença ou condição importante?', 'Usa algum medicamento contínuo?',
    'Já sentiu dor no peito, desmaio, tontura forte, falta de ar fora do normal ou palpitação durante esforço?',
    'Que tipo de treino você prefere?',
    'Tem algo importante sobre seu corpo, rotina ou treino que eu não perguntei?',
  ];
  perguntasLegadas.forEach(function (pergunta, indice) {
    linhas.push(['v1', indice + 1, 'v1_' + (indice + 1), pergunta, 'legado', true, '', 'Arquivado']);
  });
  Object.keys(PRESCRICAO_QUESTIONARIOS.v2.campos).forEach(function (chave, indice) {
    const campo = PRESCRICAO_QUESTIONARIOS.v2.campos[chave];
    linhas.push(['v2', indice + 1, chave, campo.rotulo, campo.tipo, campo.obrigatorio, campo.opcoes.join(' | '), 'Ativa']);
  });
  return linhas;
}

function garantirCatalogoQuestionarioPrescricao_(planilha) {
  const cabecalhos = ['Versão', 'Ordem', 'Código', 'Pergunta', 'Tipo', 'Obrigatória', 'Opções', 'Status'];
  let aba = planilha.getSheetByName(PRESCRICAO_CONFIG.abaQuestionario);
  if (!aba) {
    aba = planilha.insertSheet(PRESCRICAO_CONFIG.abaQuestionario);
  }
  if (aba.getLastRow() < 1 || aba.getLastColumn() < 1) {
    aba.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  } else {
    const encontrados = aba.getRange(1, 1, 1, aba.getLastColumn()).getDisplayValues()[0];
    const diagnostico = diagnosticarCabecalhosPrescricao_(encontrados, cabecalhos);
    if (!diagnostico.ok) {
      throw new Error('Aba Questionário incompatível. Cabeçalhos ausentes: ' + diagnostico.faltantes.join(', ') + '.');
    }
  }
  const existentes = {};
  if (aba.getLastRow() > 1) {
    aba.getRange(2, 1, aba.getLastRow() - 1, 3).getDisplayValues().forEach(function (linha) {
      const versao = limparTextoPrescricao_(linha[0]);
      const ordem = limparTextoPrescricao_(linha[1]);
      const codigo = limparTextoPrescricao_(linha[2]);
      existentes[versao + '|' + codigo] = true;
      // O catálogo v1 originado do Tally não tinha códigos estáveis; nele, a
      // ordem é o identificador histórico. Isso evita duplicá-lo numa base já
      // preparada com uma versão anterior deste script.
      if (versao === 'v1') existentes['v1|ordem|' + ordem] = true;
    });
  }
  const novas = linhasCatalogoQuestionarioPrescricao_().filter(function (linha) {
    return linha[0] === 'v1'
      ? !existentes['v1|ordem|' + linha[1]]
      : !existentes[linha[0] + '|' + linha[2]];
  });
  if (novas.length) aba.getRange(aba.getLastRow() + 1, 1, novas.length, cabecalhos.length).setValues(novas);
  aba.setFrozenRows(1);
  return { aba: aba, perguntasAdicionadas: novas.length };
}

/**
 * Prepara uma cópia nova ou uma base antiga, sem apagar respostas. Pode ser
 * executada novamente: depois da primeira execução, só valida e completa
 * colunas ou itens de catálogo que estejam faltando.
 */
function prepararBaseAnamneseVersionadaPrescricao() {
  return executarComLockPrescricao_(function () {
    const planilha = obterPlanilhaPrescricao_();
    let abaRespostas = planilha.getSheetByName(PRESCRICAO_CONFIG.abaRespostas);
    let registrosMigrados = 0;
    let colunasAdicionadas = 0;
    if (abaRespostas && abaRespostas.getLastRow() > 0 && abaRespostas.getLastColumn() > 0) {
      const cabecalhos = abaRespostas.getRange(1, 1, 1, abaRespostas.getLastColumn()).getDisplayValues()[0];
      if (cabecalhosParecemTallyPrescricao_(cabecalhos)) {
        if (planilha.getSheetByName(PRESCRICAO_CONFIG.abaLegadoTally)) {
          throw new Error('Migração interrompida: já existe a aba "' + PRESCRICAO_CONFIG.abaLegadoTally + '". Nenhum dado foi alterado.');
        }
        abaRespostas.setName(PRESCRICAO_CONFIG.abaLegadoTally);
        const migracao = migrarRespostasTallyParaBaseVersionadaPrescricao_(planilha, abaRespostas);
        abaRespostas = migracao.aba;
        registrosMigrados = migracao.registrosMigrados;
      }
    }
    const estrutura = criarOuCompletarAbaRespostasCanonicaPrescricao_(planilha);
    abaRespostas = estrutura.aba;
    colunasAdicionadas = estrutura.colunasAdicionadas;
    garantirMonitoramentoVersionadoPrescricao_(planilha);
    const catalogo = garantirCatalogoQuestionarioPrescricao_(planilha);
    const catalogoVersionado = garantirCatalogoVersionadoPrescricao_(planilha);
    SpreadsheetApp.flush();
    removerPayloadPrescricoesCache_();
    const validacao = validarBaseAnamneseVersionadaPrescricao();
    return {
      ok: validacao.ok,
      registrosMigrados: registrosMigrados,
      colunasAdicionadas: colunasAdicionadas,
      perguntasAdicionadas: catalogo.perguntasAdicionadas,
      versaoAtiva: catalogoVersionado.versaoAtiva,
      validacao: validacao,
    };
  });
}

/** Validação somente de leitura; não altera a planilha. */
function validarBaseAnamneseVersionadaPrescricao() {
  const planilha = obterPlanilhaPrescricao_();
  const pendencias = [];
  const abaRespostas = planilha.getSheetByName(PRESCRICAO_CONFIG.abaRespostas);
  if (!abaRespostas) {
    pendencias.push('Aba Respostas não encontrada.');
  } else if (abaRespostas.getLastRow() < 1 || abaRespostas.getLastColumn() < 1) {
    pendencias.push('Aba Respostas não possui cabeçalhos.');
  } else {
    const cabecalhos = abaRespostas.getRange(1, 1, 1, abaRespostas.getLastColumn()).getDisplayValues()[0];
    if (cabecalhosParecemTallyPrescricao_(cabecalhos)) {
      pendencias.push('Aba Respostas ainda está no formato do Tally; execute Preparar base versionada.');
    } else {
      const diagnostico = diagnosticarCabecalhosPrescricao_(cabecalhos, PRESCRICAO_CABECALHOS_RESPOSTAS);
      if (!diagnostico.ok) pendencias.push('Respostas sem cabeçalhos: ' + diagnostico.faltantes.join(', ') + '.');
    }
  }
  const abaMonitoramento = planilha.getSheetByName(PRESCRICAO_CONFIG.abaMonitoramento);
  if (!abaMonitoramento) {
    pendencias.push('Aba Monitoramento não encontrada.');
  } else if (abaMonitoramento.getLastRow() > 0 && abaMonitoramento.getLastColumn() > 0) {
    const encontrados = abaMonitoramento.getRange(1, 1, 1, 8).getDisplayValues()[0];
    const diagnostico = diagnosticarCabecalhosPrescricao_(encontrados, PRESCRICAO_CONFIG.cabecalhosMonitoramento);
    if (!diagnostico.ok) pendencias.push('Monitoramento sem cabeçalhos: ' + diagnostico.faltantes.join(', ') + '.');
  }
  const abaComplementar = planilha.getSheetByName(PRESCRICAO_CONFIG.abaComplementar);
  if (!abaComplementar) {
    pendencias.push('Aba Complementar não encontrada.');
  } else if (abaComplementar.getLastRow() > 0 && abaComplementar.getLastColumn() > 0) {
    const complementares = abaComplementar.getRange(1, 1, 1, abaComplementar.getLastColumn()).getDisplayValues()[0];
    const diagnostico = diagnosticarCabecalhosPrescricao_(complementares, ['Nome', 'Status']);
    if (!diagnostico.ok) pendencias.push('Complementar sem cabeçalhos: ' + diagnostico.faltantes.join(', ') + '.');
  }
  const abaQuestionario = planilha.getSheetByName(PRESCRICAO_CONFIG.abaQuestionario);
  if (!abaQuestionario) {
    pendencias.push('Aba Questionário não encontrada.');
  }
  return {
    ok: !pendencias.length,
    pendencias: pendencias,
    spreadsheetId: PRESCRICAO_CONFIG.spreadsheetId,
    versoesSuportadas: ['v1', 'v2'],
  };
}

/**
 * Operação usada pelo botão Atualizar do futuro frontend.
 * Sincroniza os IDs e devolve todos os dados prontos para renderização.
 */
function atualizarMonitoramentoEObterDados() {
  return executarComLockPrescricao_(function () {
    const sincronizacao = sincronizarMonitoramentoSemLock_();
    const payload = montarPayloadPrescricoes_(false);
    payload.sincronizacao = sincronizacao;
    salvarPayloadPrescricoesCache_(payload);
    return payload;
  });
}

/**
 * Carregamento inicial leve. A sincronização completa fica no botão Atualizar.
 */
function getDadosPrescricoes() {
  const cache = obterPayloadPrescricoesCache_();
  if (cache) {
    return cache;
  }
  const payload = montarPayloadPrescricoes_(false);
  salvarPayloadPrescricoesCache_(payload);
  return payload;
}

/**
 * Carrega a anamnese completa apenas quando o usuário abre o pop-up.
 */
function getRespostasAnamnese(submissionId) {
  const id = limparTextoPrescricao_(submissionId);
  if (!id) {
    throw new Error('Submission ID não informado.');
  }

  const planilha = obterPlanilhaPrescricao_();
  const aba = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();
  if (ultimaLinha < 2 || ultimaColuna < 1) {
    throw new Error('Nenhuma resposta disponível.');
  }

  const cabecalhos = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];
  const indices = mapearIndicesRespostasPrescricao_(cabecalhos);
  const ids = aba.getRange(2, indices.submissionId + 1, ultimaLinha - 1, 1).getDisplayValues();
  let numeroLinha = 0;
  for (let i = 0; i < ids.length; i++) {
    if (limparTextoPrescricao_(ids[i][0]) === id) {
      numeroLinha = i + 2;
      break;
    }
  }
  if (!numeroLinha) {
    throw new Error('Submission ID não encontrado em Respostas: ' + id);
  }

  const intervalo = aba.getRange(numeroLinha, 1, 1, ultimaColuna);
  return montarRespostasAnamnesePrescricao_(
    cabecalhos,
    intervalo.getValues()[0],
    intervalo.getDisplayValues()[0]
  );
}

/**
 * Pré-carrega um pequeno grupo de anamneses em uma única leitura da planilha.
 * Usado somente depois que a lista principal já está visível.
 */
function getRespostasAnamneses(submissionIds) {
  const idsRecebidos = Array.isArray(submissionIds) ? submissionIds : [];
  const ids = [];
  const vistos = {};

  idsRecebidos.forEach(function (submissionId) {
    const id = limparTextoPrescricao_(submissionId);
    if (id && !vistos[id] && ids.length < 10) {
      vistos[id] = true;
      ids.push(id);
    }
  });

  if (!ids.length) {
    return {};
  }

  const planilha = obterPlanilhaPrescricao_();
  const aba = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
  const respostas = lerRespostasPrescricao_(aba);
  const resultado = {};

  ids.forEach(function (id) {
    const resposta = respostas.porId[id];
    if (!resposta) {
      return;
    }
    resultado[id] = montarRespostasAnamnesePrescricao_(
      respostas.cabecalhos,
      resposta.linha,
      resposta.linhaExibida
    );
  });

  return resultado;
}

/**
 * Operação pública para menu, gatilho ou execução manual no Apps Script.
 */
function sincronizarMonitoramento() {
  return executarComLockPrescricao_(sincronizarMonitoramentoSemLock_);
}

/**
 * Salva apenas os campos operacionais. Respostas nunca é modificada.
 */
function salvarMonitoramentoPrescricao(
  submissionId,
  anamneseTransferida,
  treinoPrescrito,
  dataPrescricao
) {
  return executarComLockPrescricao_(function () {
    const id = limparTextoPrescricao_(submissionId);
    const transferida = normalizarBooleanoPrescricao_(anamneseTransferida);
    const prescrito = normalizarBooleanoPrescricao_(treinoPrescrito);
    const data = normalizarDataInputPrescricao_(dataPrescricao);

    if (!id) {
      throw new Error('Submission ID não informado.');
    }

    if (prescrito && !transferida) {
      throw new Error('Marque a anamnese como transferida antes de concluir a prescrição.');
    }

    if (prescrito && !data) {
      throw new Error('A data da prescrição é obrigatória para um treino prescrito.');
    }

    const planilha = obterPlanilhaPrescricao_();
    const abaRespostas = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
    const abaMonitoramento = garantirEstruturaMonitoramento_(planilha);
    const respostas = lerRespostasPrescricao_(abaRespostas);

    if (!respostas.porId[id]) {
      throw new Error('Submission ID não encontrado em Respostas: ' + id);
    }

    let monitoramento = lerMonitoramentoPrescricao_(abaMonitoramento);

    if (!monitoramento.porId[id]) {
      sincronizarMonitoramentoSemLock_();
      monitoramento = lerMonitoramentoPrescricao_(abaMonitoramento);
    }

    const registro = monitoramento.porId[id];

    if (!registro) {
      throw new Error('Não foi possível criar o registro de monitoramento para: ' + id);
    }

    const agora = new Date();
    abaMonitoramento.getRange(registro.numeroLinha, 5, 1, 4).setValues([[
      transferida,
      prescrito,
      prescrito ? data : '',
      agora,
    ]]);
    abaMonitoramento.getRange(registro.numeroLinha, 7).setNumberFormat('dd/MM/yyyy');
    abaMonitoramento.getRange(registro.numeroLinha, 8).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    SpreadsheetApp.flush();
    removerPayloadPrescricoesCache_();

    const monitoramentoAtualizado = lerMonitoramentoPrescricao_(abaMonitoramento);
    return montarRegistroAppPrescricao_(
      respostas.porId[id],
      monitoramentoAtualizado.porId[id],
      respostas.cabecalhos,
      false
    );
  });
}

/**
 * Verificação rápida executável pelo editor do Apps Script.
 */
function validarBackendPrescricoes() {
  const payload = atualizarMonitoramentoEObterDados();
  return {
    ok: true,
    baseDados: {
      spreadsheetId: PRESCRICAO_CONFIG.spreadsheetId,
      abaRespostas: PRESCRICAO_CONFIG.abaRespostas,
      abaMonitoramento: PRESCRICAO_CONFIG.abaMonitoramento,
    },
    totalRegistros: payload.registros.length,
    totais: payload.totais,
    atualizadoEm: payload.atualizadoEm,
    sincronizacao: payload.sincronizacao,
  };
}

function sincronizarMonitoramentoSemLock_() {
  const planilha = obterPlanilhaPrescricao_();
  const abaRespostas = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
  const abaMonitoramento = garantirEstruturaMonitoramento_(planilha);
  const respostas = lerRespostasPrescricao_(abaRespostas);
  const monitoramento = lerMonitoramentoPrescricao_(abaMonitoramento);
  const idsRespostas = {};
  let novos = 0;
  let existentes = 0;
  let metadadosAtualizados = 0;

  const linhas = respostas.registros.map(function (resposta) {
    idsRespostas[resposta.submissionId] = true;
    const atual = monitoramento.porId[resposta.submissionId];

    if (atual) {
      existentes++;
      if (
        valorDataPrescricao_(atual.dataAnamnese) !== valorDataPrescricao_(resposta.submittedAt)
        || atual.aluno !== resposta.aluno
        || atual.profissional !== resposta.profissional
      ) {
        metadadosAtualizados++;
      }
    } else {
      novos++;
    }

    return [
      resposta.submissionId,
      resposta.submittedAt || '',
      resposta.aluno,
      resposta.profissional,
      atual ? atual.anamneseTransferida : false,
      atual ? atual.treinoPrescrito : false,
      atual && atual.treinoPrescrito ? atual.dataPrescricao || '' : '',
      atual ? atual.atualizadoEm || '' : '',
    ];
  });

  const orfaos = monitoramento.registros.filter(function (registro) {
    return !idsRespostas[registro.submissionId];
  });

  orfaos.forEach(function (registro) {
    linhas.push([
      registro.submissionId,
      registro.dataAnamnese || '',
      registro.aluno,
      registro.profissional,
      registro.anamneseTransferida,
      registro.treinoPrescrito,
      registro.treinoPrescrito ? registro.dataPrescricao || '' : '',
      registro.atualizadoEm || '',
    ]);
  });

  const precisaReescrever = novos > 0
    || metadadosAtualizados > 0
    || monitoramento.registros.length !== linhas.length;
  if (precisaReescrever) {
    reescreverMonitoramentoPrescricao_(abaMonitoramento, linhas);
  }

  return {
    ok: true,
    totalRespostas: respostas.registros.length,
    totalMonitoramento: linhas.length,
    novos: novos,
    existentes: existentes,
    metadadosAtualizados: metadadosAtualizados,
    orfaosPreservados: orfaos.length,
    idsDuplicadosIgnorados: respostas.idsDuplicados,
    sincronizadoEm: formatarDataHoraPrescricao_(new Date()),
  };
}

function montarPayloadPrescricoes_(incluirRespostas) {
  const planilha = obterPlanilhaPrescricao_();
  const abaRespostas = obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaRespostas);
  const abaMonitoramento = garantirEstruturaMonitoramento_(planilha);
  const respostas = lerRespostasPrescricao_(abaRespostas);
  const monitoramento = lerMonitoramentoPrescricao_(abaMonitoramento);
  const registros = respostas.registros.map(function (resposta) {
    return montarRegistroAppPrescricao_(
      resposta,
      monitoramento.porId[resposta.submissionId],
      respostas.cabecalhos,
      incluirRespostas
    );
  });

  const profissionais = {};
  const periodos = {};
  registros.forEach(function (registro) {
    if (registro.profissional) {
      profissionais[registro.profissional] = true;
    }
    if (registro.periodo) {
      periodos[registro.periodo] = true;
    }
  });

  return {
    registros: registros,
    profissionais: Object.keys(profissionais).sort(compararTextoPrescricao_),
    periodos: Object.keys(periodos).sort().reverse().map(function (periodo) {
      return { valor: periodo, rotulo: formatarPeriodoPrescricao_(periodo) };
    }),
    totais: montarTotaisPrescricao_(registros),
    atualizadoEm: formatarDataHoraPrescricao_(new Date()),
  };
}

function montarRegistroAppPrescricao_(resposta, monitoramento, cabecalhos, incluirRespostas) {
  const transferida = monitoramento ? monitoramento.anamneseTransferida : false;
  const prescrito = monitoramento ? monitoramento.treinoPrescrito : false;
  const dataPrescricao = monitoramento ? monitoramento.dataPrescricao : null;
  const status = prescrito ? 'prescrito' : (transferida ? 'pendente' : 'a_transferir');
  const dataFim = prescrito && dataPrescricao ? dataPrescricao : new Date();

  return {
    submissionId: resposta.submissionId,
    aluno: resposta.aluno,
    profissional: resposta.profissional,
    dataAnamnese: formatarDataIsoPrescricao_(resposta.submittedAt, true),
    dataAnamneseLabel: formatarDataHoraPrescricao_(resposta.submittedAt),
    periodo: resposta.submittedAt instanceof Date
      ? Utilities.formatDate(resposta.submittedAt, PRESCRICAO_CONFIG.timeZone, 'yyyy-MM')
      : '',
    status: status,
    statusLabel: status === 'prescrito'
      ? 'Prescrito'
      : (status === 'pendente' ? 'Pendente' : 'A transferir'),
    diasProcesso: calcularDiasPrescricao_(resposta.submittedAt, dataFim),
    monitoramento: {
      anamneseTransferida: transferida,
      treinoPrescrito: prescrito,
      dataPrescricao: formatarDataIsoPrescricao_(dataPrescricao, false),
      dataPrescricaoLabel: formatarDataPrescricao_(dataPrescricao),
      atualizadoEm: monitoramento
        ? formatarDataHoraPrescricao_(monitoramento.atualizadoEm)
        : '',
    },
    respostasCarregadas: incluirRespostas !== false,
    respostas: incluirRespostas === false
      ? []
      : montarRespostasAnamnesePrescricao_(
        cabecalhos,
        resposta.linha,
        resposta.linhaExibida
      ),
  };
}

function montarRespostasAnamnesePrescricao_(cabecalhos, linha, linhaExibida) {
  return cabecalhos.map(function (cabecalho, indice) {
    const chave = normalizarCabecalhoPrescricao_(cabecalho);
    if (PRESCRICAO_CABECALHOS_TECNICOS.indexOf(chave) !== -1) {
      return null;
    }

    return {
      campo: limparTextoPrescricao_(cabecalho),
      valor: serializarValorPrescricao_(
        linha[indice],
        linhaExibida ? linhaExibida[indice] : ''
      ),
      tipo: tipoValorPrescricao_(linha[indice]),
    };
  }).filter(function (item) {
    return item && item.campo;
  });
}

function lerRespostasPrescricao_(aba) {
  const ultimaLinha = aba.getLastRow();
  const ultimaColuna = aba.getLastColumn();

  if (ultimaLinha < 1 || ultimaColuna < 1) {
    throw new Error('A aba Respostas está vazia.');
  }

  const intervalo = aba.getRange(1, 1, ultimaLinha, ultimaColuna);
  const valores = intervalo.getValues();
  const valoresExibidos = intervalo.getDisplayValues();
  const cabecalhos = valores[0];
  const indices = mapearIndicesRespostasPrescricao_(cabecalhos);
  const registros = [];
  const porId = {};
  const duplicados = [];

  valores.slice(1).forEach(function (linha, indice) {
    const linhaExibida = valoresExibidos[indice + 1];
    const id = limparTextoPrescricao_(linha[indices.submissionId]);
    if (!id) {
      return;
    }

    if (porId[id]) {
      duplicados.push(id);
      return;
    }

    const registro = {
      submissionId: id,
      submittedAt: normalizarDataPlanilhaPrescricao_(linha[indices.submittedAt]),
      profissional: limparTextoPrescricao_(linha[indices.profissional]),
      aluno: limparTextoPrescricao_(linha[indices.aluno]),
      numeroLinha: indice + 2,
      linha: linha,
      linhaExibida: linhaExibida,
    };

    porId[id] = registro;
    registros.push(registro);
  });

  return {
    cabecalhos: cabecalhos,
    registros: registros,
    porId: porId,
    idsDuplicados: Array.from(new Set(duplicados)),
  };
}

function lerMonitoramentoPrescricao_(aba) {
  validarCabecalhosMonitoramentoPrescricao_(aba);
  const ultimaLinha = aba.getLastRow();
  const registros = [];
  const porId = {};

  if (ultimaLinha < 2) {
    return { registros: registros, porId: porId };
  }

  const linhas = aba.getRange(2, 1, ultimaLinha - 1, 8).getValues();
  linhas.forEach(function (linha, indice) {
    const id = limparTextoPrescricao_(linha[0]);
    if (!id) {
      return;
    }
    if (porId[id]) {
      throw new Error('Submission ID duplicado em Monitoramento: ' + id);
    }

    const registro = {
      submissionId: id,
      dataAnamnese: normalizarDataPlanilhaPrescricao_(linha[1]),
      aluno: limparTextoPrescricao_(linha[2]),
      profissional: limparTextoPrescricao_(linha[3]),
      anamneseTransferida: normalizarBooleanoPrescricao_(linha[4]),
      treinoPrescrito: normalizarBooleanoPrescricao_(linha[5]),
      dataPrescricao: normalizarDataPlanilhaPrescricao_(linha[6]),
      atualizadoEm: normalizarDataPlanilhaPrescricao_(linha[7]),
      numeroLinha: indice + 2,
    };

    porId[id] = registro;
    registros.push(registro);
  });

  return { registros: registros, porId: porId };
}

function reescreverMonitoramentoPrescricao_(aba, linhas) {
  const ultimaLinhaAtual = Math.max(aba.getLastRow(), 2);
  const quantidadeLimpeza = Math.max(ultimaLinhaAtual - 1, linhas.length, 1);
  aba.getRange(2, 1, quantidadeLimpeza, 8).clearContent();

  if (linhas.length) {
    aba.getRange(2, 1, linhas.length, 8).setValues(linhas);
  }

  SpreadsheetApp.flush();
}

function garantirEstruturaMonitoramento_(planilha) {
  let aba = planilha.getSheetByName(PRESCRICAO_CONFIG.abaMonitoramento);

  if (!aba) {
    aba = planilha.insertSheet(PRESCRICAO_CONFIG.abaMonitoramento, 0);
    aba.getRange(1, 1, 1, 8).setValues([PRESCRICAO_CONFIG.cabecalhosMonitoramento]);
    formatarAbaMonitoramentoPrescricao_(aba);
    return aba;
  }

  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, 8).setValues([PRESCRICAO_CONFIG.cabecalhosMonitoramento]);
    formatarAbaMonitoramentoPrescricao_(aba);
  }

  validarCabecalhosMonitoramentoPrescricao_(aba);
  return aba;
}

function obterPayloadPrescricoesCache_() {
  try {
    const texto = CacheService.getScriptCache().get(PRESCRICAO_CONFIG.cachePayloadKey);
    return texto ? JSON.parse(texto) : null;
  } catch (erro) {
    return null;
  }
}

function salvarPayloadPrescricoesCache_(payload) {
  try {
    CacheService.getScriptCache().put(
      PRESCRICAO_CONFIG.cachePayloadKey,
      JSON.stringify(payload),
      PRESCRICAO_CONFIG.cachePayloadSegundos
    );
  } catch (erro) {
    // O cache é apenas uma otimização; falhas não interrompem o app.
  }
}

function removerPayloadPrescricoesCache_() {
  try {
    CacheService.getScriptCache().remove(PRESCRICAO_CONFIG.cachePayloadKey);
  } catch (erro) {
    // O salvamento principal já foi concluído.
  }
}

function validarCabecalhosMonitoramentoPrescricao_(aba) {
  const encontrados = aba.getRange(1, 1, 1, 8).getDisplayValues()[0];
  const esperados = PRESCRICAO_CONFIG.cabecalhosMonitoramento;

  for (let i = 0; i < esperados.length; i++) {
    if (normalizarCabecalhoPrescricao_(encontrados[i]) !== normalizarCabecalhoPrescricao_(esperados[i])) {
      throw new Error(
        'Estrutura inválida em Monitoramento. Esperado "'
        + esperados[i]
        + '" na coluna '
        + (i + 1)
        + '.'
      );
    }
  }
}

function formatarAbaMonitoramentoPrescricao_(aba) {
  const maxLinhasDados = Math.max(aba.getMaxRows() - 1, 1);
  const regraCheckbox = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .setAllowInvalid(false)
    .build();

  aba.setFrozenRows(1);
  aba.getRange(1, 1, 1, 8)
    .setValues([PRESCRICAO_CONFIG.cabecalhosMonitoramento])
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBackground('#eeeeee')
    .setFontColor('#141414');

  aba.getRange(2, 5, maxLinhasDados, 2)
    .setDataValidation(regraCheckbox)
    .setHorizontalAlignment('center');
  aba.getRange(2, 2, maxLinhasDados, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange(2, 7, maxLinhasDados, 1).setNumberFormat('dd/MM/yyyy');
  aba.getRange(2, 8, maxLinhasDados, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  const larguras = [120, 165, 260, 180, 165, 165, 165, 165];
  larguras.forEach(function (largura, indice) {
    aba.setColumnWidth(indice + 1, largura);
  });

  if (!aba.getFilter()) {
    aba.getRange(1, 1, aba.getMaxRows(), 8).createFilter();
  }
}

function mapearIndicesRespostasPrescricao_(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach(function (cabecalho, indice) {
    mapa[normalizarCabecalhoPrescricao_(cabecalho)] = indice;
  });

  const indices = {};
  Object.keys(PRESCRICAO_ALIASES_RESPOSTAS).forEach(function (campo) {
    const aliases = PRESCRICAO_ALIASES_RESPOSTAS[campo];
    let indice;
    aliases.some(function (cabecalho) {
      const encontrado = mapa[normalizarCabecalhoPrescricao_(cabecalho)];
      if (encontrado !== undefined) indice = encontrado;
      return encontrado !== undefined;
    });
    if (indice === undefined) {
      throw new Error('Cabeçalho obrigatório não encontrado em Respostas: ' + aliases[0]);
    }
    indices[campo] = indice;
  });
  return indices;
}

function montarTotaisPrescricao_(registros) {
  return {
    total: registros.length,
    aTransferir: registros.filter(function (r) { return r.status === 'a_transferir'; }).length,
    pendentes: registros.filter(function (r) { return r.status === 'pendente'; }).length,
    prescritos: registros.filter(function (r) { return r.status === 'prescrito'; }).length,
  };
}

function executarComLockPrescricao_(operacao) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    throw new Error('Outra atualização está em andamento. Tente novamente em alguns segundos.');
  }

  try {
    return operacao();
  } finally {
    lock.releaseLock();
  }
}

function obterPlanilhaPrescricao_() {
  return SpreadsheetApp.openById(PRESCRICAO_CONFIG.spreadsheetId);
}

function obterAbaObrigatoriaPrescricao_(planilha, nome) {
  const aba = planilha.getSheetByName(nome);
  if (!aba) {
    throw new Error('Aba não encontrada: ' + nome);
  }
  return aba;
}

function normalizarCabecalhoPrescricao_(valor) {
  return limparTextoPrescricao_(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function limparTextoPrescricao_(valor) {
  return valor === null || valor === undefined ? '' : String(valor).trim();
}

function normalizarBooleanoPrescricao_(valor) {
  if (valor === true || valor === false) {
    return valor;
  }
  const texto = limparTextoPrescricao_(valor).toLowerCase();
  return texto === 'true' || texto === 'verdadeiro' || texto === 'sim' || texto === '1';
}

function normalizarDataPlanilhaPrescricao_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor;
  }
  if (!valor) {
    return null;
  }
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function normalizarDataInputPrescricao_(valor) {
  if (!valor) {
    return null;
  }
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor;
  }

  const partes = limparTextoPrescricao_(valor).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) {
    throw new Error('Data inválida. Use o formato AAAA-MM-DD.');
  }

  const data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  if (
    data.getFullYear() !== Number(partes[1])
    || data.getMonth() !== Number(partes[2]) - 1
    || data.getDate() !== Number(partes[3])
  ) {
    throw new Error('Data da prescrição inválida.');
  }
  return data;
}

function serializarValorPrescricao_(valor, valorExibido) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return limparTextoPrescricao_(valorExibido) || formatarDataPrescricao_(valor);
  }
  if (typeof valor === 'boolean' || typeof valor === 'number') {
    return valor;
  }
  return limparTextoPrescricao_(valor);
}

function tipoValorPrescricao_(valor) {
  if (valor instanceof Date) {
    return 'data';
  }
  if (typeof valor === 'boolean') {
    return 'booleano';
  }
  if (typeof valor === 'number') {
    return 'numero';
  }
  return 'texto';
}

function formatarDataIsoPrescricao_(data, incluirHora) {
  if (!(data instanceof Date) || isNaN(data.getTime())) {
    return '';
  }
  return Utilities.formatDate(
    data,
    PRESCRICAO_CONFIG.timeZone,
    incluirHora ? "yyyy-MM-dd'T'HH:mm:ss" : 'yyyy-MM-dd'
  );
}

function formatarDataHoraPrescricao_(data) {
  if (!(data instanceof Date) || isNaN(data.getTime())) {
    return '';
  }
  return Utilities.formatDate(data, PRESCRICAO_CONFIG.timeZone, 'dd/MM/yyyy HH:mm');
}

function formatarDataPrescricao_(data) {
  if (!(data instanceof Date) || isNaN(data.getTime())) {
    return '';
  }
  return Utilities.formatDate(data, PRESCRICAO_CONFIG.timeZone, 'dd/MM/yyyy');
}

function formatarPeriodoPrescricao_(periodo) {
  const partes = limparTextoPrescricao_(periodo).match(/^(\d{4})-(\d{2})$/);
  return partes ? partes[2] + '/' + partes[1] : periodo;
}

function calcularDiasPrescricao_(inicio, fim) {
  if (!(inicio instanceof Date) || !(fim instanceof Date)) {
    return null;
  }
  const inicioDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const fimDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  return Math.max(0, Math.round((fimDia.getTime() - inicioDia.getTime()) / 86400000));
}

function valorDataPrescricao_(valor) {
  return valor instanceof Date && !isNaN(valor.getTime()) ? valor.getTime() : 0;
}

function compararTextoPrescricao_(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'pt-BR');
}
