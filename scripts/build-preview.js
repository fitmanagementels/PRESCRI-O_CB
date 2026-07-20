const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const arquivoIndex = path.join(raiz, 'index.html');
const arquivoStyles = path.join(raiz, 'styles.html');
const arquivoScripts = path.join(raiz, 'scripts.html');
const arquivoPreview = path.join(raiz, 'preview.html');

const index = fs.readFileSync(arquivoIndex, 'utf8');
const styles = fs.readFileSync(arquivoStyles, 'utf8');
const scripts = fs.readFileSync(arquivoScripts, 'utf8');

const preview = index
  .replace("<?!= include('styles'); ?>", () => styles)
  .replace("<?!= include('scripts'); ?>", () => scripts);

if (preview.includes('<?!=')) {
  throw new Error('O preview ainda contém uma inclusão do Apps Script não processada.');
}

fs.writeFileSync(arquivoPreview, preview);
console.log(`Preview criado em ${arquivoPreview}`);
