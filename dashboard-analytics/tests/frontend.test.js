const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const index = fs.readFileSync('dashboard-analytics/index.html', 'utf8');
const styles = fs.readFileSync('dashboard-analytics/styles.html', 'utf8');
const scripts = fs.readFileSync('dashboard-analytics/scripts.html', 'utf8');
const charts = fs.readFileSync('dashboard-analytics/charts.html', 'utf8');
const preview = fs.existsSync('dashboard-analytics/preview.html') ? fs.readFileSync('dashboard-analytics/preview.html', 'utf8') : '';
['Acompanhamento', 'Produtividade', 'Comparativos'].forEach((label) => assert(index.includes(label)));
['backlogStageChart', 'slaChart', 'timeChart'].forEach((id) => assert(index.includes(`id="${id}"`)));
assert(index.includes('data-tab="acompanhamento"'));
assert(index.includes('data-tab="questionario"'));
assert(index.includes('data-view="questionario"'));
assert(styles.includes('grid-template-columns:repeat(4,1fr)'), 'A navegação com quatro abas deve permanecer em uma única linha.');
assert(index.includes('id="helpPopover"'));
assert(index.includes('id="anamnesisModal"'));
assert(!index.includes('id="anamnesisWhatsapp"'), 'WhatsApp deve ficar no cartão, não no pop-up.');
assert(!index.includes('id="anamnesisDelete"'), 'Exclusão deve ficar no cartão, não no pop-up.');
assert(index.includes('placeholder="Nome ou ID da demanda"'));
assert(!index.includes('Submission ID'));
assert.strictEqual((index.match(/id="helpPopover"/g) || []).length, 1, 'Deve existir apenas um pop-up reutilizável.');
[
  'periodFilter', 'professionalFilter', 'situationFilter', 'deadlineFilter', 'rankingSort'
].forEach((id) => assert(
  new RegExp(`id="${id}"[^>]*data-themed-select`).test(index),
  `O select ${id} deve usar o menu tematizado.`
));
assert(scripts.includes('getDashboardAnalytics'));
assert(scripts.includes('atualizarDashboardAnalytics'));
assert(scripts.includes('getAnamneseDashboardAnalytics'));
assert(scripts.includes('excluirDemandaAnalytics'));
assert(scripts.includes('data-open-anamnesis'));
assert(scripts.includes('data-card-delete-demand'));
assert(!scripts.includes('role="button" tabindex="0" data-open-anamnesis'), 'O cartão não pode abrir a ficha ao ser clicado.');
assert(!scripts.includes("evento.target.matches&&evento.target.matches('[data-open-anamnesis]')"), 'Somente o botão deve abrir a ficha via teclado.');
assert(scripts.includes('Ver anamnese'));
assert(scripts.includes('function inicializarMenusTematizados'));
assert(scripts.includes('function atualizarMenuTematizado'));
assert(scripts.includes('function fecharMenusTematizados'));
assert(scripts.includes("setAttribute('role', 'listbox')"));
assert(
  /function preencherFiltros\(\)[\s\S]*atualizarMenuTematizado\(select\)/.test(scripts),
  'Profissionais carregados dinamicamente devem atualizar o menu tematizado.'
);
assert(
  /function iniciarApp\(\)[\s\S]*inicializarMenusTematizados\(\)/.test(scripts),
  'Os menus tematizados devem iniciar junto com o app.'
);
assert(scripts.includes("evento.key === 'Escape'"));
assert(styles.includes('.themed-select-menu'));
assert(styles.includes('.themed-select-trigger'));
assert(styles.includes('.themed-select-option[aria-selected="true"]'));
assert(styles.includes('.themed-select-menu.opens-upward'));
assert(scripts.includes("abaAtiva: 'acompanhamento'"));
assert(scripts.includes('https://wa.me/'));
assert(!/(?:draggable\s*=|addEventListener\(['"]dragstart|addEventListener\(['"]drop)/.test(index + styles + scripts));
assert(styles.includes('@media (max-width: 640px)'));
assert(/min-height:\s*44px/.test(styles));
assert(styles.includes('.demand-card .stage{display:contents}'), 'No mobile, a etapa deve participar diretamente da grade compacta do cartão.');
assert(styles.includes('.demand-card .stage .badge{grid-column:3;grid-row:2/4;align-self:center}'), 'O SLA deve ocupar a terceira coluna da faixa operacional no mobile.');
assert(styles.includes('.help-button'));
assert(charts.includes('function renderLineChart'));
assert(charts.includes('function renderBarChart'));
assert(!scripts.toLowerCase().includes('nota de produtividade'));

const js = (charts + '\n' + scripts).replace(/^<script>|<\/script>$/gm, '');
const sandbox = { console, window: {}, document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } }, google: undefined, setTimeout() {}, Intl, Date, Math, Object, Array, String, Number, JSON };
vm.createContext(sandbox);
vm.runInContext(js, sandbox);
const itens = [{ status: 'nao_transferida' }, { status: 'pendente' }, { status: 'prescrita' }];
assert.strictEqual(sandbox.filtrarPorSituacao(itens, 'a_fazer').length, 2);
assert.deepStrictEqual(JSON.parse(JSON.stringify(sandbox.calcularDominio([0, 4, 2]))), { min: 0, max: 4 });
assert(sandbox.renderLineChart([{ periodo: 'S1', valor: 2 }], { campo: 'valor', titulo: 'Teste' }).includes('<svg'));
assert(sandbox.renderBarChart([{ rotulo: 'A', valor: 2 }], { titulo: 'Teste' }).includes('<svg'));
assert.strictEqual(typeof sandbox.botaoAjuda, 'function');
assert.strictEqual(typeof sandbox.abrirAjuda, 'function');
assert.strictEqual(typeof sandbox.fecharAjuda, 'function');
assert.strictEqual(typeof sandbox.agruparAnamnese, 'function');
assert.strictEqual(typeof sandbox.renderizarAnamnese, 'function');
assert.strictEqual(typeof sandbox.formatarValorAnamnese, 'function');
assert.strictEqual(typeof sandbox.urlWhatsappGestor, 'function');
assert.strictEqual(sandbox.urlWhatsappGestor('(85) 99999-0000'), 'https://wa.me/5585999990000');
assert.strictEqual(sandbox.urlWhatsappGestor(''), '');
assert.strictEqual(typeof sandbox.telefoneDeLinkWhatsapp, 'function');
assert.strictEqual(sandbox.telefoneDeLinkWhatsapp('https://wa.me/5585999990000'), '5585999990000');
assert.strictEqual(sandbox.telefoneDeLinkWhatsapp('https://wa.me/numero-invalido'), '');
assert.strictEqual(typeof sandbox.linkAppWhatsapp, 'function');
assert.strictEqual(sandbox.linkAppWhatsapp('https://wa.me/5585999990000'), 'whatsapp://send?phone=5585999990000');
assert.strictEqual(sandbox.linkAppWhatsapp(''), '');
const gruposAnamnese = sandbox.agruparAnamnese([
  { campo: 'Consentimento', valor: true, tipo: 'booleano' },
  { campo: 'Objetivo principal', valor: 'Saúde', tipo: 'texto' },
  { campo: 'Data de nascimento', valor: '1976-08-14', tipo: 'data' }
]);
assert.strictEqual(gruposAnamnese.perfil_rotina.itens[0].valor, 'Saúde');
assert.strictEqual(gruposAnamnese.identificacao.itens[0].valor, '14/08/1976');
assert(!JSON.stringify(gruposAnamnese).toLowerCase().includes('consentimento'));
const htmlAnamnese = sandbox.renderizarAnamnese([{ campo: 'Objetivo principal', valor: 'Saúde', tipo: 'texto' }]);
assert(htmlAnamnese.includes('class="anamnesis-section" open'));
assert.strictEqual(sandbox.formatarValorAnamnese('1976-08-14', 'data'), '14/08/1976');
assert(sandbox.botaoAjuda('kpi_a_fazer').includes('data-help="kpi_a_fazer"'));
assert(sandbox.botaoAjuda('kpi_a_fazer').includes('aria-controls="helpPopover"'));
const guiasAjuda = vm.runInContext('GUIAS_AJUDA', sandbox);
['kpi_a_fazer', 'grupo_producao', 'grafico_fluxo'].forEach((chave) => assert(guiasAjuda[chave]));
[
  'kpi_atrasadas', 'kpi_sla', 'lista_demandas', 'metrica_recebidas',
  'metrica_mediana', 'metrica_p75', 'metrica_taxa_conclusao',
  'comparacao_periodo', 'grafico_sla', 'grafico_tempo', 'tabela_comparativa'
].forEach((chave) => assert(guiasAjuda[chave], `Guia ausente: ${chave}`));
assert(Object.keys(guiasAjuda).length >= 30, 'O catálogo deve cobrir os blocos das três abas.');
const atributosAjuda = {};
const ancoraAjuda = {
  setAttribute: (nome, valor) => { atributosAjuda[nome] = valor; },
  getBoundingClientRect: () => ({ top: 100, right: 300, bottom: 128 }),
  focus: () => { atributosAjuda.focou = true; }
};
const elementosAjuda = {
  helpPopover: { hidden: true, style: {}, getBoundingClientRect: () => ({ width: 300, height: 120 }) },
  helpTitle: { textContent: '' },
  helpText: { textContent: '' }
};
sandbox.window.innerWidth = 800;
sandbox.window.innerHeight = 600;
sandbox.document.getElementById = (id) => elementosAjuda[id] || null;
sandbox.abrirAjuda('kpi_a_fazer', ancoraAjuda);
assert.strictEqual(elementosAjuda.helpPopover.hidden, false);
assert.strictEqual(elementosAjuda.helpTitle.textContent, guiasAjuda.kpi_a_fazer.titulo);
assert.strictEqual(atributosAjuda['aria-expanded'], 'true');
sandbox.fecharAjuda(true);
assert.strictEqual(elementosAjuda.helpPopover.hidden, true);
assert.strictEqual(atributosAjuda['aria-expanded'], 'false');
assert.strictEqual(atributosAjuda.focou, true);
assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(preview), 'O preview não pode conter e-mails.');
assert(!/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9\d{4}[-\s]?\d{4}/.test(preview), 'O preview não pode conter telefones pessoais.');
console.log('Frontend analytics aprovado.');
