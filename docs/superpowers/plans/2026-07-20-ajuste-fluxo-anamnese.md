# Ajuste de fluxo da anamnese Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reordenar o wizard da anamnese em seis etapas de resposta e uma etapa final de revisão, com seletor de frequência visualmente integrado ao PWA.

**Architecture:** O backend continua oferecendo as mesmas chaves e cabeçalhos `v2`; apenas as propriedades `etapa` e a ordem do catálogo mudam. O frontend renderiza `select` como um combobox/listbox próprio e guarda o valor no mesmo campo `frequenciaPretendida` do rascunho e do envio.

**Tech Stack:** Google Apps Script, HTML Service, JavaScript, CSS, Node `assert`.

## Global Constraints

- Não alterar nomes de campos, cabeçalhos de `Respostas` ou a versão `v2`.
- Etapas 1 a 6 contêm perguntas; a etapa 7 só revisa e envia.
- O seletor personalizado deve funcionar por toque, clique, Escape, teclado e navegação por Tab.
- Rascunhos existentes de seis horas continuam válidos.

---

### Task 1: Reordenar o catálogo do backend

**Files:**
- Modify: `Código.gs`
- Test: `tests/backend.test.js`

- [ ] Escrever asserts para a sequência `consentimento`, `profissional` na etapa 1; `nomeCompleto`, `email`, `dataNascimento`, `alturaCm`, `pesoKg` na etapa 2; e sete rótulos de etapa.
- [ ] Executar `node tests/backend.test.js` e confirmar falha.
- [ ] Reordenar o objeto `PRESCRICAO_QUESTIONARIOS.v2.campos` e atualizar `getQuestionarioPwaPrescricao().etapas`.
- [ ] Executar `node tests/backend.test.js` e confirmar aprovação.

### Task 2: Renderizar revisão autônoma e combobox temático

**Files:**
- Modify: `scripts.html`
- Modify: `styles.html`
- Test: `tests/frontend.test.js`

- [ ] Escrever asserts que exigem `wizard-review-step`, `custom-select` e ausência de `<select>` para o tipo `select` do wizard.
- [ ] Executar `node tests/frontend.test.js` e confirmar falha.
- [ ] Renderizar a etapa 7 somente com revisão e os botões Voltar/Enviar; renderizar a frequência com botão `role="combobox"`, lista `role="listbox"` e input oculto com o valor real.
- [ ] Adicionar eventos de abrir, selecionar, fechar em clique externo/Escape e teclas Arrow/Home/End/Enter.
- [ ] Estilizar botão e lista no tema escuro, com foco verde-limão e opções com estados ativo/focado.
- [ ] Executar `node scripts/build-preview.js && node tests/frontend.test.js` e confirmar aprovação.

### Task 3: Verificar a experiência completa

**Files:**
- Modify: `tests/responsive.test.js`
- Modify: `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`

- [ ] Incluir no teste responsivo a presença da nova etapa de revisão e do controle customizado em preview.
- [ ] Executar `node tests/responsive.test.js` e confirmar aprovação em 320–880px.
- [ ] Registrar no guia de implantação que a revisão é a etapa 7 e que a atualização exige publicar nova versão.
