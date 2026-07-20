const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function sheet(name, values) {
  let data = values.map((row) => row.slice());
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => Math.max(0, ...data.map((row) => row.length)),
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => data.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      getDisplayValues: () => data.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc).map(String)),
      setValues: (rows) => { rows.forEach((row, ri) => row.forEach((v, ci) => { data[r - 1 + ri] ||= []; data[r - 1 + ri][c - 1 + ci] = v; })); return this; },
      setFontWeight: () => this, setBackground: () => this, setFontColor: () => this,
      setNumberFormat: () => this,
    }),
    getDataRange: () => ({ getValues: () => data.map((row) => row.slice()) }),
    clearContents: () => { data = []; },
    appendRow: (row) => { data.push(row.slice()); },
    deleteRow: (row) => { data.splice(row - 1, 1); },
    setFrozenRows: () => {}, setColumnWidths: () => {},
    _data: () => data,
  };
}

const respostas = sheet('Respostas', [
  ['Submission ID', 'Submitted at', 'Nome do Profissional', 'Nome completo', 'Consentimento', 'Objetivo principal'],
  ['SYN-001', '01/07/2026', 'Profissional A', 'Pessoa Alfa', true, 'Saúde'],
]);
const monitoramento = sheet('Monitoramento', [
  ['Submission ID', 'Data da anamnese', 'Aluno', 'Profissional', 'Anamnese transferida?', 'Treino prescrito?', 'Data da prescrição', 'Atualizado em'],
  ['SYN-001', '01/07/2026', 'Pessoa Alfa', 'Profissional A', false, false, '', ''],
]);
const sheets = { Respostas: respostas, Monitoramento: monitoramento };
const spreadsheet = {
  getSheetByName: (name) => sheets[name] || null,
  insertSheet: (name) => (sheets[name] = sheet(name, [])),
};
const lock = { waitLock() {}, releaseLock() {} };
const context = vm.createContext({
  console, Object, Array, String, Number, Boolean, Date, Math, Set, JSON,
  SpreadsheetApp: { openById: () => spreadsheet },
  LockService: { getScriptLock: () => lock },
  CacheService: { getScriptCache: () => ({ get: () => null, removeAll() {} }) },
  Utilities: { formatDate: (d) => d.toISOString().slice(0, 10) },
});
['Config.gs', 'Dados.gs', 'Metricas.gs', 'Historico.gs', 'Cache.gs', 'Exclusoes.gs'].forEach((file) => vm.runInContext(fs.readFileSync(`dashboard-analytics/${file}`, 'utf8'), context));

const validacao = context.validarFontesAnalytics_(spreadsheet);
assert.strictEqual(validacao.ok, true);
assert.strictEqual(context.lerRespostasAnalytics_(respostas).length, 1);
const respostasPwa = sheet('Respostas', [
  ['ID da demanda', 'Criado em', 'Profissional', 'Nome completo'],
  ['DEM-20260720-abc', new Date(2026, 6, 20), 'Profissional A', 'Pessoa Beta'],
]);
const lidaPwa = context.lerRespostasAnalytics_(respostasPwa);
assert.strictEqual(lidaPwa[0].submissionId, 'DEM-20260720-abc');
assert.strictEqual(lidaPwa[0].dataEntrada, '2026-07-20');
const monitoramentoPwa = sheet('Monitoramento', [
  ['ID da demanda', 'Data da anamnese', 'Aluno', 'Profissional', 'Anamnese transferida?', 'Treino prescrito?', 'Data da prescrição'],
  ['DEM-20260720-abc', new Date(2026, 6, 20), 'Pessoa Beta', 'Profissional A', true, false, ''],
]);
const fontesPwa = {
  getSheetByName: (name) => ({ Respostas: respostasPwa, Monitoramento: monitoramentoPwa })[name] || null,
};
assert.strictEqual(context.validarFontesAnalytics_(fontesPwa).ok, true);
const monitoramentoPwaLido = context.lerMonitoramentoAnalytics_(monitoramentoPwa);
assert.strictEqual(monitoramentoPwaLido[0].submissionId, 'DEM-20260720-abc');
assert.strictEqual(monitoramentoPwaLido[0].transferida, true);
assert.strictEqual(monitoramentoPwaLido[0].prescrita, false);
assert.strictEqual(context.lerMonitoramentoAnalytics_(monitoramento).length, 1);
assert.strictEqual(context.validarFontesAnalytics_({ getSheetByName: () => null }).erros[0].codigo, 'RESPOSTAS_AUSENTE');

const fichaTransformada = context.montarAnamneseDashboardAnalytics_(
  ['Submission ID', 'Submitted at', 'Nome do Profissional', 'Nome completo', 'Whatsapp', 'Consentimento', 'Objetivo principal'],
  ['SYN-001', '2026-07-13', 'Profissional A', 'Pessoa Alfa', '(85) 99999-0000', true, 'Saúde'],
  ['SYN-001', '13/07/2026', 'Profissional A', 'Pessoa Alfa', '(85) 99999-0000', 'Sim', 'Saúde']
);
assert.strictEqual(fichaTransformada.submissionId, 'SYN-001');
assert.strictEqual(fichaTransformada.aluno, 'Pessoa Alfa');
assert.strictEqual(fichaTransformada.profissional, 'Profissional A');
assert.strictEqual(fichaTransformada.dataResposta, '2026-07-13');
assert.strictEqual(fichaTransformada.whatsapp, '(85) 99999-0000');
assert.strictEqual(fichaTransformada.respostas.length, 1);
assert.strictEqual(fichaTransformada.respostas[0].campo, 'Objetivo principal');
assert.strictEqual(context.getAnamneseDashboardAnalytics('SYN-001').respostas[0].valor, 'Saúde');
assert.throws(() => context.getAnamneseDashboardAnalytics(''), /ID da demanda/);
assert.throws(() => context.getAnamneseDashboardAnalytics('SYN-404'), /não localizada/);

assert.throws(() => context.excluirDemandaAnalytics({ submissionId: 'SYN-001', confirmacao: 'apagar' }), /EXCLUIR/);
const exclusao = context.excluirDemandaAnalytics({ submissionId: 'SYN-001', confirmacao: 'EXCLUIR', motivo: 'Teste local' });
assert.strictEqual(exclusao.ok, true);
assert.strictEqual(respostas._data().length, 1, 'A resposta deve ser removida.');
assert.strictEqual(monitoramento._data().length, 1, 'O monitoramento deve ser removido.');
const logExclusoes = spreadsheet.getSheetByName('Analytics_Exclusoes')._data();
assert.strictEqual(logExclusoes.length, 2, 'A exclusão deve gerar um registro mínimo de auditoria.');
assert.strictEqual(logExclusoes[1][0], 'SYN-001');
assert(!JSON.stringify(logExclusoes[1]).includes('Pessoa Alfa'), 'O log não deve guardar dados clínicos ou identificação do aluno.');

const historico = context.garantirHistoricoAnalytics_(spreadsheet);
assert.strictEqual(historico.getName(), 'Analytics_Historico');
const snapshots = [
  ['2026-07-13', 'Profissional A', 1, 0, 1, 0, 1, 0, 0, 0, '', '', '', '2026-07-13 10:00', 1],
];
context.upsertSnapshotsAnalytics_(historico, snapshots);
context.upsertSnapshotsAnalytics_(historico, [snapshots[0].map((v, i) => i === 2 ? 2 : v)]);
const registros = historico._data().filter((row) => row[0] === '2026-07-13' && row[1] === 'Profissional A');
assert.strictEqual(registros.length, 1);
assert.strictEqual(registros[0][2], 2);
const headersHistorico = vm.runInContext('HISTORICO_ANALYTICS_HEADERS', context);
assert(!Array.from(headersHistorico).some((h) => /aluno|submission/i.test(h)));
console.log('Integração segura com planilhas aprovada.');
