const assert = require('assert');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(raiz, 'styles.html'), 'utf8');
const scriptsHtml = fs.readFileSync(path.join(raiz, 'scripts.html'), 'utf8');
const preview = fs.readFileSync(path.join(raiz, 'preview.html'), 'utf8');
const javascript = scriptsHtml
  .replace(/^\s*<script>\s*/, '')
  .replace(/\s*<\/script>\s*$/, '');
const previewEsperado = index
  .replace("<?!= include('styles'); ?>", () => styles)
  .replace("<?!= include('scripts'); ?>", () => scriptsHtml);

assert.doesNotThrow(() => new Function(javascript), 'O JavaScript do frontend deve compilar.');
const blocoRevelacao = scriptsHtml.match(
  /function revelarAplicativo\(\)[\s\S]*?\n\s*function definirEstadoBotaoAtualizar/
);
assert(blocoRevelacao, 'A transição da tela de abertura deve existir.');
assert(
  !blocoRevelacao[0].includes('nomeFuncao'),
  'A transição da tela de abertura não pode depender da função de comunicação do Apps Script.'
);
assert(!preview.includes('<?!='), 'O preview deve resolver todas as inclusões do Apps Script.');
assert.strictEqual(
  preview,
  previewEsperado,
  'O preview deve estar sincronizado com index.html, styles.html e scripts.html.'
);

[
  'Buscar aluno',
  'Profissional',
  'Período',
  'Prescrições',
  'prescriptionModal',
  'xsteamLogo',
  'bootProgress',
].forEach((texto) => assert(index.includes(texto), `index.html deve conter: ${texto}`));

assert(
  /<h1>Prescrições da CB Fitness<\/h1>/.test(index),
  'O cabeçalho deve exibir o novo título da CB Fitness.'
);
assert(
  /<symbol id="cbFitnessHeaderLogo"[\s\S]*?<rect[^>]*rx="72"[^>]*>[\s\S]*?<\/symbol>/.test(index),
  'A marca do cabeçalho deve possuir contorno quadrado com cantos arredondados.'
);
assert(
  /<svg class="brand-logo"[\s\S]*?<use href="#cbFitnessHeaderLogo"><\/use>/.test(index),
  'O novo tratamento da marca deve ficar restrito ao cabeçalho.'
);

[
  'getDadosPrescricoes',
  'atualizarMonitoramentoEObterDados',
  'salvarMonitoramentoPrescricao',
  'Anamnese transferida',
  'Treino prescrito',
  'Data da prescrição',
  'Informações para prescrição',
  'open-info',
  'abrirModalPrescricao',
  'getRespostasAnamnese',
  'getRespostasAnamneses',
  'agendarPrecarregamentoAnamneses',
  'carregarRespostasRegistro',
  'carregarSnapshotLocal',
  'salvarSnapshotLocal',
  'iniciarTelaInicial',
  'atualizarProgressoInicial',
  'alternarSecoesModal',
  'Perfil físico, objetivo e rotina',
  'Dores, lesões e condições de saúde',
  'Adicionar demanda',
  'demandWizard',
  'wizardProgress',
  'Frequência pretendida',
  'DEMAND_DRAFT_MAX_AGE',
  '6 * 60 * 60 * 1000',
  'enviarDemandaPwaPrescricao',
  'wizard-review-step',
  'custom-select-trigger',
  'tratarTecladoSelectCustom',
].forEach((texto) => assert(scriptsHtml.includes(texto), `scripts.html deve conter: ${texto}`));

assert(
  !scriptsHtml.includes("<select id=\"' + id + '\" name=\"' + chave"),
  'O seletor de frequência do wizard não deve usar o menu nativo do navegador.'
);
assert(
  scriptsHtml.includes("if (nomeFuncao === 'getQuestionarioPwaPrescricao')"),
  'A prévia local deve carregar o questionário da anamnese.'
);
assert(
  scriptsHtml.includes("if (nomeFuncao === 'enviarDemandaPwaPrescricao')"),
  'A prévia local deve simular o envio da anamnese.'
);

assert(
  scriptsHtml.includes("indexOf('consentimento')"),
  'Campos de consentimento devem ser removidos da anamnese exibida.'
);
assert(
  scriptsHtml.includes("chave === 'perfil_rotina' ? ' open' : ''"),
  'Perfil, objetivo e rotina deve abrir por padrão.'
);

assert(styles.includes('--lime-strong'), 'O tema deve manter o token verde-limão.');
assert(index.includes('class="tab-label-mobile"'), 'A navegação deve possuir rótulos curtos específicos para mobile.');
assert(styles.includes('.app-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));overflow:visible}'), 'No mobile, as duas abas devem formar uma grade fixa sem rolagem horizontal.');
assert(styles.includes('--question-text: #a9bd49'), 'As perguntas devem usar o verde de leitura equilibrado.');
assert(!scriptsHtml.includes("respostas.dorAtual === 'Sim'"), 'O wizard não deve manter condicionais de dor.');
assert(!scriptsHtml.includes("respostas.assimetria === 'Sim'"), 'O wizard não deve manter condicionais de assimetria.');
assert(
  /\.answer-label\s*\{[^}]*color:\s*var\(--question-text\);/s.test(styles),
  'O verde de leitura deve ser aplicado somente aos enunciados da anamnese.'
);
assert(styles.includes('@media (min-width: 680px)'), 'O layout deve possuir adaptação responsiva.');
assert(styles.includes('.student-card'), 'Os cards de alunos devem estar estilizados.');
assert(styles.includes('.demand-wizard'), 'O wizard de nova demanda deve estar estilizado.');
assert(styles.includes('.custom-select-menu'), 'O menu personalizado deve receber o tema do app.');
assert(styles.includes('.boot-logo'), 'A tela inicial deve exibir a logo da empresa.');
assert(styles.includes('.brand-logo'), 'O cabeçalho deve exibir a logo da empresa.');
assert(styles.includes('.prescription-modal'), 'O pop-up de informações deve estar estilizado.');
assert(styles.includes('body.modal-open'), 'A página deve bloquear a rolagem enquanto o pop-up estiver aberto.');
assert(!styles.includes('backdrop-filter'), 'O pop-up não deve usar desfoque de fundo durante a rolagem.');
assert(styles.includes('-webkit-overflow-scrolling: touch'), 'A rolagem do pop-up deve ser otimizada para telas móveis.');
assert(
  styles.includes('touch-action: pan-y pinch-zoom;'),
  'O conteúdo do pop-up deve permitir rolagem vertical e zoom por pinça.'
);
assert(
  styles.includes('outline: 3px solid var(--lime);')
    && styles.includes('.toggle-control input:focus-visible + .toggle-visual'),
  'O foco deve possuir alto contraste e aparecer no toggle visível.'
);

[
  '@media (max-width: 600px)',
  '--mobile-control-height: 48px',
  '.student-summary {',
  'grid-template-areas:',
  '.save-button {',
  '.modal-card {',
  'height: 100dvh',
].forEach((regra) => {
  assert(styles.includes(regra), `O contrato mobile deve conter: ${regra}`);
});

assert(
  styles.includes('font-size: 16px') && styles.includes('min-height: var(--mobile-control-height)'),
  'Entradas e controles mobile devem usar 16px e altura mínima padronizada.'
);

const inicioMobile = styles.indexOf('@media (max-width: 600px)');
const fimMobile = styles.indexOf('@media (max-width: 370px)');
const estilosMobile = styles.slice(inicioMobile, fimMobile);
assert(
  estilosMobile.includes('grid-template-columns: 1fr;')
    && estilosMobile.includes('width: 100%;')
    && estilosMobile.includes('justify-content: center;'),
  'O cabeçalho mobile deve empilhar o botão Atualizar sem sobrepor o título.'
);
assert(
  /\.card-actions\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*justify-content:\s*stretch;/s.test(estilosMobile),
  'A área de ações mobile deve esticar o botão Salvar pela largura do card.'
);
assert(
  /\.field label,\s*\.process-label\s*\{[^}]*font-size:\s*13px;/s.test(estilosMobile)
    && /\.professional-box span\s*\{[^}]*font-size:\s*13px;/s.test(estilosMobile)
    && /\.answer-label\s*\{[^}]*font-size:\s*13px;/s.test(estilosMobile),
  'Rótulos funcionais mobile devem possuir pelo menos 13px.'
);
assert(
  /\.sort-select\s*\{[^}]*min-height:\s*48px;/s.test(estilosMobile)
    && /\.modal-close,\s*\.modal-expand-toggle\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px;/s.test(estilosMobile),
  'Controles interativos mobile devem possuir alvo mínimo de 48px.'
);
assert(
  /\.metric-card\s*\{[^}]*min-height:\s*96px;/s.test(estilosMobile)
    && /\.metric-value\s*\{[^}]*font-size:\s*35px;/s.test(estilosMobile)
    && /\.student-summary\s*\{[^}]*min-height:\s*100px;/s.test(estilosMobile)
    && /\.student-name\s*\{[^}]*font-size:\s*18px;/s.test(estilosMobile)
    && /\.toggle-control\s*\{[^}]*min-height:\s*60px;/s.test(estilosMobile),
  'A camada mobile deve usar a densidade compacta leve aprovada.'
);

console.log('Frontend: estrutura, contrato e compilação aprovados.');
