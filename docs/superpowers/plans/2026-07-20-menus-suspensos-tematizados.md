# Menus suspensos tematizados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir todos os menus suspensos do dashboard como listas próprias do PWA, sem alterar filtros, dados ou métricas.

**Architecture:** Os cinco selects originais permanecem como fonte de valor e recebem os mesmos eventos `change` atuais. `scripts.html` cria um botão e um listbox sincronizados por select; `styles.html` controla a superfície, foco, opções e o posicionamento mobile. O componente falha de forma segura: sem JavaScript, o select nativo continua disponível.

**Tech Stack:** HTML, CSS, JavaScript sem dependências, Google Apps Script HTML Service e Node.js `assert`/`vm`.

## Global Constraints

- Alvos: `periodFilter`, `professionalFilter`, `situationFilter`, `deadlineFilter` e `rankingSort`.
- O App Script, fontes de dados, métricas e abas da planilha não mudam.
- Todos os valores e eventos `change` dos selects existentes devem ser preservados.
- O menu visual deve funcionar com toque, mouse e teclado.
- O workspace não possui repositório Git funcional; nenhum commit será criado.

---

### Task 1: Testar o contrato de menus próprios

**Files:**
- Modify: `dashboard-analytics/tests/frontend.test.js`
- Modify: `dashboard-analytics/scripts.html`

**Interfaces:**
- Produces: `inicializarMenusTematizados()`, `atualizarMenuTematizado(select)`, `fecharMenusTematizados(retornarFoco)`.
- Consumes: selects identificados por `data-themed-select`.

- [ ] **Step 1: Escrever o teste vermelho**

Adicionar ao teste de frontend as verificações de que `index.html` identifica os cinco selects com `data-themed-select`, que o JavaScript exporta as três funções e que o CSS contém `.themed-select-menu` e `role="listbox"`.

- [ ] **Step 2: Executar o teste**

Executar `node dashboard-analytics/tests/frontend.test.js`.

Resultado esperado: falha pela ausência de `data-themed-select`.

- [ ] **Step 3: Implementar o componente mínimo**

Criar no JavaScript um registro por select. Para cada registro, criar um wrapper, botão e lista; reconstruir opções a partir do select original; atualizar o select e despachar `change` após a escolha; expor as três funções previstas.

- [ ] **Step 4: Executar o teste verde**

Executar `node dashboard-analytics/tests/frontend.test.js`.

Resultado esperado: `Frontend analytics aprovado.`

### Task 2: Aplicar interação, acessibilidade e sincronização dinâmica

**Files:**
- Modify: `dashboard-analytics/scripts.html`
- Modify: `dashboard-analytics/index.html`
- Test: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes: `preencherFiltros()` e os listeners `change` existentes.
- Produces: menus que fecham ao clicar fora/Escape, se atualizam após novos profissionais e mantêm um único listbox aberto.

- [ ] **Step 1: Escrever o teste vermelho**

Verificar que `preencherFiltros()` chama `atualizarMenuTematizado(select)`, e que o script contém `aria-expanded`, `aria-selected`, `Escape` e `fecharMenusTematizados`.

- [ ] **Step 2: Executar o teste**

Executar `node dashboard-analytics/tests/frontend.test.js`.

Resultado esperado: falha pela falta da sincronização após o preenchimento de profissionais.

- [ ] **Step 3: Conectar a interação**

Inicializar os menus em `iniciarApp()`, fechar menus antes de abrir ajuda/modal ou trocar aba, atualizar o menu do profissional após `innerHTML`, e acrescentar os handlers de clique externo e teclado.

- [ ] **Step 4: Executar o teste verde**

Executar `node dashboard-analytics/tests/frontend.test.js`.

Resultado esperado: `Frontend analytics aprovado.`

### Task 3: Aplicar a linguagem visual e verificar responsividade

**Files:**
- Modify: `dashboard-analytics/styles.html`
- Modify: `dashboard-analytics/index.html`
- Modify: `dashboard-analytics/scripts/build-preview.js` via regeneração de `preview.html`
- Test: `dashboard-analytics/tests/frontend.test.js`, `dashboard-analytics/tests/backend.test.js`, `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Consumes: classes `.themed-select`, `.themed-select-trigger`, `.themed-select-menu` e `.themed-select-option`.
- Produces: popup escuro com foco verde, altura de toque e z-index acima do conteúdo e abaixo do modal.

- [ ] **Step 1: Escrever o teste vermelho**

Verificar a presença das regras de foco e menu temático no CSS e que o preview contém as novas classes depois da geração.

- [ ] **Step 2: Executar o teste**

Executar `node dashboard-analytics/tests/frontend.test.js`.

Resultado esperado: falha pela ausência das regras de `.themed-select-menu`.

- [ ] **Step 3: Implementar o CSS e identificar selects**

Adicionar `data-themed-select` aos cinco selects. Ocultar visualmente o select original somente depois de o wrapper ser criado. Estilizar o trigger, lista, opção ativa, hover, foco e breakpoint de 640 px para o popup abrir acima da navegação inferior.

- [ ] **Step 4: Gerar preview e executar a verificação completa**

Executar:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/frontend.test.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
```

Resultado esperado: os quatro comandos terminam com código 0.
