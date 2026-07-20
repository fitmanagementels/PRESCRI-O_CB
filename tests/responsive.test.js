const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { promisify } = require('util');

const execFile = promisify(childProcess.execFile);
const raiz = path.resolve(__dirname, '..');
const previewUrl = pathToFileURL(path.join(raiz, 'preview.html')).href;

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
].find((arquivo) => arquivo && fs.existsSync(arquivo));

assert(chrome, 'Responsivo: Chrome é obrigatório para validar o layout computado.');

function probeHtml(width) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Teste responsivo</title></head>
<body>
  <iframe id="app" title="Aplicativo em teste" style="width:${width}px;height:1200px;border:0"></iframe>
  <pre id="result">aguardando</pre>
  <script>
    const frame = document.getElementById('app');
    const result = document.getElementById('result');
    frame.addEventListener('load', function () {
      const limite = Date.now() + 5000;
      const timer = setInterval(function () {
        const doc = frame.contentDocument;
        const shell = doc && doc.getElementById('appShell');
        const pronto = shell
          && !shell.hidden
          && doc.querySelector('.student-card')
          && doc.querySelector('.answer-value');
        if (!pronto && Date.now() < limite) return;
        clearInterval(timer);
        if (!pronto) {
          result.textContent = JSON.stringify({ error: 'Aplicativo não carregou no tempo limite.' });
          return;
        }
        const root = doc.documentElement;
        const query = (selector) => doc.querySelector(selector);
        const style = (selector) => getComputedStyle(query(selector));
        const rect = (selector) => query(selector).getBoundingClientRect();
        const cards = Array.from(doc.querySelectorAll('.metric-card'));
        const primeiraLinha = cards.filter((card) => Math.abs(card.offsetTop - cards[0].offsetTop) < 2).length;
        const abas = Array.from(doc.querySelectorAll('.app-tab'));
        const navegacao = query('.app-tabs');
        const abasNaPrimeiraLinha = abas.filter((aba) => Math.abs(aba.offsetTop - abas[0].offsetTop) < 2).length;
        result.textContent = JSON.stringify({
          width: ${width},
          horizontalOverflow: root.scrollWidth > root.clientWidth,
          searchFont: parseFloat(style('#searchInput').fontSize),
          searchHeight: rect('#searchInput').height,
          filterLabelFont: parseFloat(style('.field label').fontSize),
          sortHeight: rect('.sort-select').height,
          refreshHeight: rect('#refreshButton').height,
          metricColumns: primeiraLinha,
          metricHeight: rect('.metric-card').height,
          studentNameFont: parseFloat(style('.student-name').fontSize),
          summaryHeight: rect('.student-summary').height,
          toggleHeight: rect('.toggle-control').height,
          saveHeight: rect('.save-button').height,
          infoHeight: rect('.prescription-info-button').height,
          saveWidth: rect('.save-button').width,
          cardBodyWidth: rect('.card-body').width,
          anamnesisTitleHeight: parseFloat(style('.anamnesis-title').minHeight),
          answerValueFont: parseFloat(style('.answer-value').fontSize),
          modalCloseHeight: parseFloat(style('.modal-close').height),
          modalExpandHeight: parseFloat(style('.modal-expand-toggle').height),
          modalTouchAction: style('.modal-content').touchAction,
          tabsDisplay: style('.app-tabs').display,
          tabsOverflow: navegacao.scrollWidth > navegacao.clientWidth,
          tabsNaPrimeiraLinha: abasNaPrimeiraLinha,
          tabHeight: rect('.app-tab').height,
        });
      }, 50);
    });
    frame.src = ${JSON.stringify(`${previewUrl}?modal=1`)};
  </script>
</body>
</html>`;
}

async function medir(width) {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), `prescricoes-${width}-`));
  const probe = path.join(perfil, 'probe.html');
  fs.writeFileSync(probe, probeHtml(width));
  try {
    const { stdout } = await execFile(chrome, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-breakpad',
      '--disable-crash-reporter',
      '--disable-features=Crashpad',
      '--allow-file-access-from-files',
      '--virtual-time-budget=6500',
      `--user-data-dir=${perfil}`,
      '--dump-dom',
      pathToFileURL(probe).href,
    ], { maxBuffer: 5 * 1024 * 1024 });
    const resultado = stdout.match(/<pre id="result">([^<]+)<\/pre>/);
    assert(resultado, `Chrome não retornou as métricas para ${width}px.`);
    return JSON.parse(resultado[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  } finally {
    fs.rmSync(perfil, { recursive: true, force: true });
  }
}

async function executar() {
  for (const width of [320, 360, 390, 412, 430]) {
    const medida = await medir(width);
    assert(!medida.error, medida.error);
    assert.strictEqual(medida.horizontalOverflow, false, `Não deve haver overflow em ${width}px.`);
    assert(medida.searchFont >= 16, `Busca deve usar fonte de 16px em ${width}px.`);
    assert(medida.searchHeight >= 48, `Busca deve ter pelo menos 48px em ${width}px.`);
    assert(medida.filterLabelFont >= 13, `Rótulos devem ter 13px em ${width}px.`);
    assert(medida.sortHeight >= 48, `Ordenação deve ter 48px em ${width}px.`);
    assert(medida.refreshHeight >= 48, `Atualizar deve ter 48px em ${width}px.`);
    assert.strictEqual(medida.metricColumns, 2, `Métricas devem formar duas colunas em ${width}px.`);
    assert(medida.metricHeight <= 98, `Métricas devem ter densidade compacta em ${width}px.`);
    assert(medida.studentNameFont >= 18, `Nome do aluno deve ter pelo menos 18px em ${width}px.`);
    assert(medida.summaryHeight <= 120, `Resumo do aluno deve ser compacto em ${width}px.`);
    assert(medida.toggleHeight >= 60, `Toggles devem ter pelo menos 60px em ${width}px.`);
    assert(medida.saveHeight >= 48, `Salvar deve ter pelo menos 48px em ${width}px.`);
    assert(medida.infoHeight >= 48, `Informações deve ter pelo menos 48px em ${width}px.`);
    assert(
      medida.saveWidth >= medida.cardBodyWidth - 40,
      `Salvar deve ocupar a largura útil do card em ${width}px.`
    );
    assert(medida.modalCloseHeight >= 48, `Fechar deve ter 48px em ${width}px.`);
    assert(medida.modalExpandHeight >= 48, `Expandir deve ter 48px em ${width}px.`);
    assert(medida.anamnesisTitleHeight >= 48, `Seções da anamnese devem ter 48px em ${width}px.`);
    assert(medida.answerValueFont >= 15, `Respostas devem ter pelo menos 15px em ${width}px.`);
    assert.strictEqual(medida.tabsDisplay, 'grid', `Navegação deve usar duas colunas fixas em ${width}px.`);
    assert.strictEqual(medida.tabsOverflow, false, `Navegação não deve ter rolagem horizontal em ${width}px.`);
    assert.strictEqual(medida.tabsNaPrimeiraLinha, 2, `As duas abas devem ficar lado a lado em ${width}px.`);
    assert(medida.tabHeight >= 48, `Abas devem manter 48px de toque em ${width}px.`);
    assert(
      medida.modalTouchAction.includes('pinch-zoom'),
      `Modal deve permitir zoom por pinça em ${width}px.`
    );
  }

  const desktop = await medir(880);
  assert.strictEqual(desktop.horizontalOverflow, false, 'Desktop não deve possuir overflow horizontal.');
  assert.strictEqual(desktop.metricColumns, 4, 'Desktop deve manter quatro métricas na mesma linha.');
  assert.strictEqual(desktop.tabsDisplay, 'flex', 'Desktop deve manter a navegação horizontal original.');

  console.log('Responsivo: layout computado aprovado em 320, 360, 390, 412, 430 e 880px.');
}

executar().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
