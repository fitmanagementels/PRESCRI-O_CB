# Ações de demanda no dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o PWA gerencial abra o WhatsApp do aluno e exclua uma demanda de forma definitiva e auditável.

**Architecture:** O dashboard continuará usando `ID da demanda` como chave. O backend localizará esse ID em `Respostas` e `Monitoramento`, excluirá as duas linhas sob lock, invalidará o cache e gravará um registro mínimo em `Analytics_Exclusoes`. O modal de anamnese conterá os dois comandos; o link de WhatsApp só aparece quando houver um número utilizável.

**Tech Stack:** Google Apps Script, Google Sheets, HTML/CSS/JavaScript sem dependências e testes Node.js com VM.

## Global Constraints

- Alterar somente `dashboard-analytics/`; o PWA dos prescritores não recebe essas ações.
- Excluir por `ID da demanda`, nunca pelo nome do aluno.
- A exclusão exige a confirmação literal `EXCLUIR` e remove dados de `Respostas` e `Monitoramento`.
- O log não armazena respostas clínicas nem telefone; guarda apenas ID, data/hora, motivo e origem.
- O WhatsApp usa o número cadastrado e acrescenta DDI `55` para números brasileiros de 10 ou 11 dígitos.

### Task 1: Contrato e exclusão segura no backend

**Files:**
- Modify: `dashboard-analytics/Config.gs`, `dashboard-analytics/Dados.gs`, `dashboard-analytics/README_DEPLOY.md`
- Create: `dashboard-analytics/Exclusoes.gs`
- Test: `dashboard-analytics/tests/backend.test.js`, `dashboard-analytics/tests/sheets.test.js`

**Interfaces:**
- Produces `excluirDemandaAnalytics({ submissionId, confirmacao, motivo })`.
- Produces `whatsapp` no retorno de `getAnamneseDashboardAnalytics(id)`.

- [x] Escrever testes que exijam a função pública, exponham o WhatsApp e removam as duas linhas apenas após confirmação.
- [x] Executar os testes e confirmar falha pela ausência da função/comportamento.
- [x] Implementar o contrato de telefone, log mínimo, lock, exclusão e invalidação de cache.
- [x] Executar testes de backend e planilha até passarem.

### Task 2: Ações no modal do PWA gerencial

**Files:**
- Modify: `dashboard-analytics/index.html`, `dashboard-analytics/styles.html`, `dashboard-analytics/scripts.html`
- Test: `dashboard-analytics/tests/frontend.test.js`

**Interfaces:**
- Consumes `ficha.whatsapp` e `excluirDemandaAnalytics`.
- Produces link seguro `https://wa.me/<número>` e fluxo de confirmação no modal.

- [x] Escrever testes estáticos e unitários para os novos controles e a normalização do telefone.
- [x] Executar o teste e confirmar falha pela ausência desses elementos/funções.
- [x] Implementar ícone acessível de WhatsApp, ação de exclusão com confirmação textual e atualização da tela.
- [x] Executar o teste até passar.

### Task 3: Verificação e documentação de implantação

**Files:**
- Modify: `dashboard-analytics/README_DEPLOY.md`, `Contexto/CONTEXTO_DO_PROJETO.md`, `Contexto/CONTEXTO_DO_PROJETO.html`

- [x] Documentar a exceção de escrita, o log de exclusões, a natureza irreversível e a necessidade de nova implantação do dashboard.
- [x] Gerar o preview e executar toda a suíte relevante.
- [x] Revisar que nenhuma ação foi adicionada ao PWA dos prescritores.
