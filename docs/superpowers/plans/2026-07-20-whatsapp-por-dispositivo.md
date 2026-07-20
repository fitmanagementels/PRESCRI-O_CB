# WhatsApp por dispositivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir a conversa pelo app WhatsApp do dispositivo e manter `wa.me` como alternativa web.

**Architecture:** O dashboard já recebe uma URL normalizada `whatsappLink`. O frontend extrai o telefone dessa URL, tenta o protocolo `whatsapp://send` durante o clique e abre a URL HTTPS se não houver troca de página. O backend e a planilha permanecem inalterados.

**Tech Stack:** Google Apps Script HTML Service, JavaScript ES5, Node `assert`.

## Global Constraints

- Alterar somente `dashboard-analytics`; não modificar os dados do PWA de prescritores.
- Não enviar telefone bruto no payload agregado/cache.
- Manter o botão desabilitado quando `whatsappLink` estiver ausente.

---

### Task 1: Ação WhatsApp com deep link e fallback

**Files:**
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `item.whatsappLink` no formato `https://wa.me/<telefone>`.
- Produces: `abrirWhatsappPorDispositivo(evento, url)` que inicia `whatsapp://send?phone=<telefone>` e mantém o fallback HTTPS.

- [x] **Step 1: Write the failing test**

```js
assert.strictEqual(typeof sandbox.abrirWhatsappPorDispositivo, 'function');
assert.strictEqual(sandbox.telefoneDeLinkWhatsapp('https://wa.me/5585999990000'), '5585999990000');
```

- [x] **Step 2: Run test to verify it fails**

Run: `node dashboard-analytics/tests/frontend.test.js`

Expected: FAIL because `abrirWhatsappPorDispositivo` and `telefoneDeLinkWhatsapp` do not exist.

- [x] **Step 3: Write minimal implementation**

```js
function telefoneDeLinkWhatsapp(url) {
  const resultado = String(url || '').match(/^https:\/\/wa\.me\/(\d{12,15})$/);
  return resultado ? resultado[1] : '';
}

function abrirWhatsappPorDispositivo(evento, url) {
  const telefone = telefoneDeLinkWhatsapp(url);
  if (!telefone) return;
  evento.preventDefault();
  const fallback = url;
  const inicio = Date.now();
  window.location.href = 'whatsapp://send?phone=' + telefone;
  setTimeout(function () {
    if (Date.now() - inicio < 1800) window.open(fallback, '_blank', 'noopener');
  }, 1200);
}
```

Add the handler only to `[data-whatsapp-link]`, preserving the existing card actions.

- [x] **Step 4: Run tests to verify they pass**

Run: `node dashboard-analytics/tests/frontend.test.js && node dashboard-analytics/tests/backend.test.js`

Expected: `Frontend analytics aprovado.` and `Backend analytics aprovado.`

- [ ] **Step 5: Commit**

```bash
git add dashboard-analytics/scripts.html dashboard-analytics/tests/frontend.test.js docs/superpowers/specs/2026-07-20-whatsapp-por-dispositivo-design.md docs/superpowers/plans/2026-07-20-whatsapp-por-dispositivo.md
git commit -m "feat: abrir WhatsApp conforme o dispositivo"
```
