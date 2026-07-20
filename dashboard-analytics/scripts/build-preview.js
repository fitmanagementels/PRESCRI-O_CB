const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
['styles', 'charts', 'scripts'].forEach((name) => {
  const token = `<?!= include('${name}'); ?>`;
  const content = fs.readFileSync(path.join(root, `${name}.html`), 'utf8');
  html = html.split(token).join(content);
});
fs.writeFileSync(path.join(root, 'preview.html'), html);
console.log('Preview analytics gerado.');
