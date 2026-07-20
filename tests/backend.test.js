const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date, _timeZone, pattern) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return pattern
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', pad(date.getSeconds()))
    .replace("'T'", 'T');
}

const htmlOutputStub = {
  metaTags: [],
  title: '',
  frameMode: '',
  addMetaTag(name, content) {
    this.metaTags.push({ name, content });
    return this;
  },
  setTitle(title) {
    this.title = title;
    return this;
  },
  setXFrameOptionsMode(mode) {
    this.frameMode = mode;
    return this;
  },
};

const context = vm.createContext({
  console,
  Date,
  Math,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Set,
  isNaN,
  Utilities: { formatDate },
  HtmlService: {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
    createTemplateFromFile() {
      return {
        evaluate() {
          return htmlOutputStub;
        },
      };
    },
  },
});

const backend = fs.readFileSync('Código.gs', 'utf8');
const manifesto = JSON.parse(fs.readFileSync('appsscript.json', 'utf8'));
vm.runInContext(backend, context, { filename: 'Código.gs' });
vm.runInContext(fs.readFileSync('Questionario.gs', 'utf8'), context, { filename: 'Questionario.gs' });

assert.deepStrictEqual(manifesto.webapp, {
  access: 'ANYONE',
  executeAs: 'USER_DEPLOYING',
});
assert.deepStrictEqual(manifesto.oauthScopes, [
  'https://www.googleapis.com/auth/spreadsheets',
]);

const config = vm.runInContext('PRESCRICAO_CONFIG', context);
assert.strictEqual(
  config.spreadsheetId,
  '1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs'
);
assert.strictEqual(config.abaRespostas, 'Respostas');
assert.strictEqual(config.abaMonitoramento, 'Monitoramento');
assert.strictEqual(config.cachePayloadKey, 'prescricoes_payload_oficial_v1');
assert(!backend.includes('1IcbgXe7qxmJ0B3_6a7_5EauY0_O7x5qhrm2FE8YZa8c'));
assert.strictEqual(config.abaComplementar, 'Complementar');
assert.strictEqual(typeof context.garantirCatalogoVersionadoPrescricao_, 'function');
assert.strictEqual(typeof context.obterQuestionarioAtivoPrescricao_, 'function');
assert.strictEqual(typeof context.validarRascunhoQuestionarioPrescricao_, 'function');

const headersRespostas = vm.runInContext('PRESCRICAO_CABECALHOS_RESPOSTAS', context);
const questionarios = vm.runInContext('PRESCRICAO_QUESTIONARIOS', context);
const ordemCamposV2 = JSON.parse(vm.runInContext(
  'JSON.stringify(Object.keys(PRESCRICAO_QUESTIONARIOS.v2.campos))',
  context
));
assert.strictEqual(headersRespostas[0], 'ID da demanda');
assert(headersRespostas.includes('Frequência pretendida (dias/semana)'));
assert.strictEqual(questionarios.v2.campos.frequenciaPretendida.opcoes.length, 7);
assert.deepStrictEqual(ordemCamposV2.slice(0, 2), ['consentimento', 'profissional']);
assert.deepStrictEqual(
  ordemCamposV2.slice(2, 8),
  ['nomeCompleto', 'email', 'whatsapp', 'dataNascimento', 'alturaCm', 'pesoKg']
);
assert.strictEqual(questionarios.v2.campos.movimentosIncomodam.etapa, 5);
assert.strictEqual(questionarios.v2.campos.historicoLesoes.etapa, 6);
assert(backend.includes("'Revisar e enviar'"));
assert.throws(() => context.validarDemandaPwaPrescricao_({
  versao: 'v2',
  tentativaId: 'tentativa-teste-001',
  respostas: { profissional: 'Elias', frequenciaPretendida: '8' },
}), /Frequência pretendida/);

const demandaValida = context.validarDemandaPwaPrescricao_({
  versao: 'v2',
  tentativaId: 'tentativa-teste-001',
  respostas: {
    profissional: 'Elias', nomeCompleto: 'Aluno Teste', email: 'aluno@example.com',
    whatsapp: '85999999999', consentimento: true, dataNascimento: '1990-01-01',
    alturaCm: '171', pesoKg: '80', experienciaMusculacao: '1 a 3 anos',
    frequenciaUltimos3Meses: '3x por semana', dorAtual: 'Não',
    assimetria: 'Não percebo diferença', objetivo: 'Força', tempoTreino: '60 min',
    frequenciaPretendida: '3', atividadesExtras: 'Não', historicoLesoes: 'Não',
    movimentosIncomodam: ['Nenhum'], exerciciosEvitados: 'Não', condicaoImportante: 'Não',
    medicamentoContinuo: 'Não', sintomasEsforco: 'Não', preferenciaTreino: 'Mais pesado',
    observacoes: 'Sem observações',
  },
});
assert.strictEqual(demandaValida.respostas.frequenciaPretendida, '3');
const registroPwa = context.prepararRegistroDemandaPwaPrescricao_(demandaValida, new Date(2026, 6, 20, 10, 0), 'DEM-20260720-abc');
assert.strictEqual(registroPwa.resposta['Versão do questionário'], 'v2');
assert.strictEqual(registroPwa.resposta['Frequência pretendida (dias/semana)'], '3');
assert.strictEqual(registroPwa.monitoramento[4], false);
assert.strictEqual(registroPwa.monitoramento[5], false);

const legadoMapeado = context.mapearLinhaLegadaTallyPrescricao_(
  ['Submission ID', 'Submitted at', 'Nome do Profissional', 'Nome completo', 'Email', 'Whatsapp'],
  ['LEG-001', new Date(2026, 6, 20, 10, 0), 'Elias', 'Pessoa histórica', 'pessoa@example.com', '85999999999']
);
assert.strictEqual(legadoMapeado['ID da demanda'], 'LEG-001');
assert.strictEqual(legadoMapeado.Origem, 'Tally');
assert.strictEqual(legadoMapeado['Versão do questionário'], 'v1');
assert.strictEqual(legadoMapeado.Profissional, 'Elias');
assert.strictEqual(
  context.diagnosticarCabecalhosPrescricao_(
    ['ID da demanda', 'Origem', 'Criado em', 'Versão do questionário', 'ID da tentativa', 'Profissional', 'Nome completo'],
    ['ID da demanda', 'Origem', 'Criado em', 'Versão do questionário', 'ID da tentativa', 'Profissional', 'Nome completo']
  ).ok,
  true
);
assert.strictEqual(
  context.diagnosticarCabecalhosPrescricao_(['ID da demanda'], ['ID da demanda', 'Criado em']).faltantes[0],
  'Criado em'
);
const linhasCatalogo = context.linhasCatalogoQuestionarioPrescricao_();
assert.strictEqual(linhasCatalogo.filter((linha) => linha[0] === 'v1').length, 27);
assert.strictEqual(linhasCatalogo.filter((linha) => linha[0] === 'v2').length, 28);
assert.strictEqual(linhasCatalogo[0][2], 'v1_1');
assert.strictEqual(linhasCatalogo.find((linha) => linha[2] === 'frequenciaPretendida')[6], '1 | 2 | 3 | 4 | 5 | 6 | 7');
assert(backend.includes('function prepararBaseAnamneseVersionadaPrescricao()'));
assert(backend.includes('function validarBaseAnamneseVersionadaPrescricao()'));
const fontePrepararBase = vm.runInContext('prepararBaseAnamneseVersionadaPrescricao.toString()', context);
assert(
  fontePrepararBase.includes('garantirCatalogoVersionadoPrescricao_(planilha)'),
  'Preparar base versionada deve acrescentar os metadados exigidos pelo editor do questionário.'
);

const fonteMontarPayload = vm.runInContext(
  'montarPayloadPrescricoes_.toString()',
  context
);
assert(
  fonteMontarPayload.includes('garantirEstruturaMonitoramento_(planilha)'),
  'O carregamento inicial deve preparar Monitoramento antes da leitura.'
);
assert(
  !fonteMontarPayload.includes(
    'obterAbaObrigatoriaPrescricao_(planilha, PRESCRICAO_CONFIG.abaMonitoramento)'
  ),
  'Monitoramento vazia não pode impedir o primeiro carregamento.'
);

const fonteValidacao = vm.runInContext(
  'validarBackendPrescricoes.toString()',
  context
);
assert(fonteValidacao.includes('baseDados'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.spreadsheetId'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.abaRespostas'));
assert(fonteValidacao.includes('PRESCRICAO_CONFIG.abaMonitoramento'));

const htmlOutput = context.doGet();
assert.deepStrictEqual(htmlOutput.metaTags, [{
  name: 'viewport',
  content: 'width=device-width, initial-scale=1, viewport-fit=cover',
}]);

assert.strictEqual(
  context.normalizarCabecalhoPrescricao_(' Nome do Profissional  '),
  'nome do profissional'
);
assert.strictEqual(context.normalizarBooleanoPrescricao_('FALSE'), false);
assert.strictEqual(context.normalizarBooleanoPrescricao_('sim'), true);

const data = context.normalizarDataInputPrescricao_('2026-07-13');
assert.strictEqual(data.getFullYear(), 2026);
assert.strictEqual(data.getMonth(), 6);
assert.strictEqual(data.getDate(), 13);
assert.throws(
  () => context.normalizarDataInputPrescricao_('2026-02-30'),
  /inválida/
);

const cabecalhos = [
  'Submission ID',
  'Submitted at',
  'Nome do Profissional ',
  'Nome completo',
  'Qual é seu objetivo principal agora?',
];
const resposta = {
  submissionId: 'abc123',
  submittedAt: new Date(2026, 6, 10, 8, 30),
  profissional: 'Elias',
  aluno: 'Aluno Teste',
  linha: ['abc123', new Date(2026, 6, 10, 8, 30), 'Elias', 'Aluno Teste', 'Força'],
};

assert.strictEqual(
  context.serializarValorPrescricao_(new Date(1976, 7, 14), '14/08/1976'),
  '14/08/1976'
);

const aTransferir = context.montarRegistroAppPrescricao_(
  resposta,
  { anamneseTransferida: false, treinoPrescrito: false },
  cabecalhos
);
assert.strictEqual(aTransferir.status, 'a_transferir');
assert.strictEqual(aTransferir.respostas.length, 1);
assert.strictEqual(aTransferir.respostas[0].valor, 'Força');

const resumoSemAnamnese = context.montarRegistroAppPrescricao_(
  resposta,
  { anamneseTransferida: false, treinoPrescrito: false },
  cabecalhos,
  false
);
assert.strictEqual(resumoSemAnamnese.respostasCarregadas, false);
assert.strictEqual(resumoSemAnamnese.respostas.length, 0);

const pendente = context.montarRegistroAppPrescricao_(
  resposta,
  { anamneseTransferida: true, treinoPrescrito: false },
  cabecalhos
);
assert.strictEqual(pendente.status, 'pendente');

const prescrito = context.montarRegistroAppPrescricao_(
  resposta,
  {
    anamneseTransferida: true,
    treinoPrescrito: true,
    dataPrescricao: new Date(2026, 6, 13),
    atualizadoEm: new Date(2026, 6, 13, 12, 0),
  },
  cabecalhos
);
assert.strictEqual(prescrito.status, 'prescrito');
assert.strictEqual(prescrito.diasProcesso, 3);
assert.strictEqual(prescrito.monitoramento.dataPrescricao, '2026-07-13');

const totais = context.montarTotaisPrescricao_([aTransferir, pendente, prescrito]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(totais)), {
  total: 3,
  aTransferir: 1,
  pendentes: 1,
  prescritos: 1,
});

console.log('Backend: testes de regras e payload aprovados.');
