const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = vm.createContext({ console, Object, Array, String, Number, Boolean, Date, Math, Set, JSON });
['Config.gs', 'Dados.gs', 'Metricas.gs', 'Cache.gs', 'Historico.gs', 'Exclusoes.gs', 'Código.gs'].forEach((file) => {
  vm.runInContext(fs.readFileSync(`dashboard-analytics/${file}`, 'utf8'), context, { filename: file });
});

assert.strictEqual(vm.runInContext('ANALYTICS_CONFIG.spreadsheetId', context), '1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs');
assert.strictEqual(
  vm.runInContext('ANALYTICS_CONFIG.cacheKey', context),
  'dashboard_analytics_payload_pwa_v3'
);
assert.strictEqual(vm.runInContext('ANALYTICS_CONFIG.slaDias', context), 2);
assert.strictEqual(vm.runInContext('ANALYTICS_CONFIG.abaHistorico', context), 'Analytics_Historico');
['getDashboardAnalytics', 'atualizarDashboardAnalytics', 'configurarDashboardAnalytics', 'validarDashboardAnalytics'].forEach((nome) => {
  assert.strictEqual(typeof context[nome], 'function', `Função pública ausente: ${nome}`);
});
assert.strictEqual(typeof context.excluirDemandaAnalytics, 'function', 'A exclusão segura deve estar disponível apenas no dashboard.');
assert.strictEqual(context.normalizarBooleanoAnalytics_('SIM'), true);
assert.strictEqual(context.normalizarBooleanoAnalytics_('não'), false);
assert.strictEqual(context.normalizarDataAnalytics_('13/07/2026 10:00'), '2026-07-13');
assert.strictEqual(context.calcularDiasCivisAnalytics_('2026-07-01', '2026-07-03'), 2);

const respostas = [
  { submissionId: 'SYN-001', aluno: 'Pessoa Alfa', profissional: 'Profissional A', dataEntrada: '2026-07-01' },
  { submissionId: 'SYN-002', aluno: 'Pessoa Beta', profissional: 'Profissional B', dataEntrada: '2026-07-02' },
];
const monitoramento = [{ submissionId: 'SYN-002', transferida: true, prescrita: false, dataConclusao: '' }];
const fatos = context.juntarFontesAnalytics_(respostas, monitoramento, new Date(2026, 6, 4));
assert.strictEqual(fatos.length, 2);
assert.strictEqual(fatos[0].status, 'nao_transferida');
assert.strictEqual(fatos[0].sla, 'atrasada');
assert.strictEqual(fatos[1].status, 'pendente');
const fatoPrivado = context.juntarFontesAnalytics_([
  { submissionId: 'SYN-PRIV', aluno: 'Pessoa Privada', profissional: 'Profissional A', dataEntrada: '2026-07-01', whatsapp: '5585999990000' },
], [], new Date(2026, 6, 4))[0];
assert.strictEqual(Object.prototype.hasOwnProperty.call(fatoPrivado, 'whatsapp'), false, 'O cartão não deve receber o telefone como campo bruto.');
assert.strictEqual(fatoPrivado.whatsappLink, 'https://wa.me/5585999990000', 'O cartão deve receber somente o link direto de WhatsApp.');

assert.strictEqual(context.mediaAnalytics_([1, 2, 6]), 3);
assert.strictEqual(context.medianaAnalytics_([1, 2, 9, 10]), 5.5);
assert.strictEqual(context.percentilAnalytics_([1, 2, 3, 4], 0.75), 3.25);
assert.strictEqual(context.mediaAnalytics_([]), null);

const amostra = [
  { submissionId: 'A1', profissional: 'Profissional A', dataEntrada: '2026-07-01', dataConclusao: '2026-07-02', status: 'prescrita', tempoConclusaoDias: 1, sla: 'dentro_prazo' },
  { submissionId: 'A2', profissional: 'Profissional A', dataEntrada: '2026-07-02', dataConclusao: '', status: 'pendente', idadeDias: 3, sla: 'atrasada' },
  { submissionId: 'B1', profissional: 'Profissional B', dataEntrada: '2026-07-03', dataConclusao: '', status: 'nao_transferida', idadeDias: 2, sla: 'vence_hoje' },
];
const produtividade = context.calcularProdutividadeAnalytics_(amostra, '2026-07-01', '2026-07-07');
assert.strictEqual(produtividade.equipe.recebidas, 3);
assert.strictEqual(produtividade.equipe.concluidas, 1);
assert.strictEqual(produtividade.equipe.backlog, 2);
assert.strictEqual(produtividade.equipe.atrasadas, 1);
assert.strictEqual(produtividade.porProfissional.length, 2);
assert.strictEqual(produtividade.equipe.amostraInsuficiente, true);
const misturaCoorteFluxo = [
  { profissional: 'Profissional A', dataEntrada: '2026-07-01', dataConclusao: '2026-07-02', status: 'prescrita', tempoConclusaoDias: 1, sla: 'dentro_prazo' },
  { profissional: 'Profissional A', dataEntrada: '2026-06-20', dataConclusao: '2026-07-03', status: 'prescrita', tempoConclusaoDias: 13, sla: 'atrasada' },
];
assert.strictEqual(context.calcularProdutividadeAnalytics_(misturaCoorteFluxo, '2026-07-01', '2026-07-07').equipe.taxaConclusao, 100);

const fluxo = context.calcularFluxoAnalytics_(amostra, '2026-07-01', '2026-07-07', 'diaria');
assert.strictEqual(fluxo.reduce((s, x) => s + x.entradas, 0), 3);
assert.strictEqual(fluxo.reduce((s, x) => s + x.conclusoes, 0), 1);
assert.strictEqual(context.calcularBacklogHistoricoAnalytics_(amostra, '2026-07-01', '2026-07-03', 'diaria').at(-1).backlog, 2);
assert.deepStrictEqual(JSON.parse(JSON.stringify(context.periodoAnteriorEquivalenteAnalytics_('2026-07-08', '2026-07-14'))), { inicio: '2026-07-01', fim: '2026-07-07' });

const payload = context.montarPayloadDashboardAnalytics_(amostra, [], { inicio: '2026-07-01', fim: '2026-07-07', hoje: '2026-07-07' });
assert.strictEqual(payload.meta.slaDias, 2);
assert(Array.isArray(payload.acompanhamento));
assert(payload.produtividade.equipe);
assert(Array.isArray(payload.comparativos.serieFluxo));
assert(Array.isArray(payload.qualidade));
assert(!JSON.stringify(payload.produtividade).includes('Pessoa Alfa'));
console.log('Backend analytics aprovado.');
