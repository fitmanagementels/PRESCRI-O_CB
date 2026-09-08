# Contexto do Projeto — Prescrições CB

**Última atualização:** 2026-09-08 15:15 -0300
**Status:** implementação local validada; migração do catálogo do questionário precisa ser executada na planilha antes do uso do editor no PWA do gestor.

## Resumo executivo

O projeto possui dois PWAs em Google Apps Script, ambos ligados à planilha oficial **BASE_PRESCRIÇÃO_CB — PWA** (ID `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`):

- o PWA operacional, usado pelos prescritores para consultar demandas e preencher a anamnese;
- o PWA `dashboard-analytics`, usado pela gestão para acompanhar demandas, métricas e administrar o questionário.

O formulário é versionado: existe sempre **uma única versão ativa** e o gestor edita uma cópia local em rascunho antes de salvar ou publicar. Não há perguntas condicionais, nem arrastar e soltar. Campos estruturais protegidos incluem profissional, nome completo e WhatsApp; o WhatsApp é obrigatório e pode ser usado somente por link para iniciar conversa.

## Estado atual

- A fonte local já está vinculada à planilha oficial nos dois projetos Apps Script.
- O PWA operacional lê o questionário ativo de forma dinâmica.
- O dashboard possui a aba **Questionário**, com criação de rascunho, etapas, perguntas, mudança explícita de etapa, salvar e publicar com bloqueio contra duplo clique.
- O catálogo da aba `Questionário` precisa ter os metadados de versão nas colunas I:S. O erro exibido no dashboard ocorreu porque a planilha ainda continha apenas o formato legado A:H.
- A causa foi corrigida localmente: `prepararBaseAnamneseVersionadaPrescricao()` agora chama `garantirCatalogoVersionadoPrescricao_()` e acrescenta os metadados exigidos pelo editor.
- A versão efetivamente ativa na planilha deve ser confirmada após executar a preparação; o contexto anterior mencionava uma v3, mas isso não deve ser assumido sem essa verificação.

## Arquitetura e dados

### Planilha oficial

- ID: `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`
- Timezone esperada: `America/Fortaleza`
- Abas principais: `Respostas`, `Respostas – legado Tally`, `Analytics_Historico`, `Monitoramento`, `Complementar` e `Questionário`.
- `Complementar` está reservada para função futura e não deve ser alterada neste escopo.

### Catálogo `Questionário`

O formato legado ocupa A:H. O catálogo editável adiciona I:S:

`Questionário ID`, `Nome do questionário`, `Tipo de registro`, `ID da etapa`, `Etapa`, `Ordem da etapa`, `Ordem da pergunta`, `Cabeçalho`, `Publicado em`, `Atualizado em`, `Revisão`.

O PWA dos prescritores usa somente a versão publicada/ativa. Rascunhos ficam separados até a publicação.

### Arquivos principais

- PWA operacional: `Código.gs`, `Questionario.gs`, `index.html`, `scripts.html`, `styles.html`.
- Dashboard da gestão: `dashboard-analytics/Config.gs`, `Dados.gs`, `Metricas.gs`, `Historico.gs`, `Exclusoes.gs`, `Questionario.gs`, `Código.gs`, `index.html`, `scripts.html`, `styles.html`, `charts.html`.
- Testes: `tests/` e `dashboard-analytics/tests/`.
- Guias de implantação: `docs/IMPLANTACAO_PLANILHA_OFICIAL.md`, `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md` e `dashboard-analytics/README_DEPLOY.md`.

## Decisões de produto preservadas

- Um único questionário ativo por vez.
- Nova versão parte do questionário ativo e vira rascunho local antes de persistir.
- Salvar e publicar bloqueiam a ação enquanto a chamada está em andamento, evitando duplicidade.
- Etapas podem ser criadas, renomeadas, reordenadas, receber/mover perguntas e ser removidas.
- Remover etapa exige confirmação forte e remove também as perguntas dessa etapa no rascunho.
- Não usar arrastar e soltar: movimentos são explícitos para reduzir erro operacional.
- Não usar condicionais em v2 nem em versões futuras.
- WhatsApp é dado protegido, obrigatório e não deve ser exposto em métricas; a ação permitida é abrir `wa.me` com o número normalizado, sem envio automático.
- Os dois Apps Script são projetos independentes; mudanças em um não atualizam o outro automaticamente.

## Histórico recente

### 2026-07 — experiência operacional e mobile

- O PWA operacional recebeu ajustes de densidade, leitura no mobile, cabeçalho “Prescrições da CB Fitness” e identidade visual XSTEAM.
- A consulta de aluno e da situação da prescrição é a prioridade da tela inicial.

### 2026-07/08 — base oficial e dashboard

- A planilha oficial passou a ser a base comum dos dois PWAs.
- O dashboard recebeu filtros, métricas operacionais, histórico diário e tema consistente para controles.

### 2026-09 — editor versionado do questionário

- Foi implementada localmente a administração do questionário no dashboard.
- Foram removidas condicionais do fluxo atual e futuro.
- Foi incluído tratamento de WhatsApp protegido e ação de mensagem por link.
- Foi encontrado e corrigido o defeito de migração: a rotina de preparação não criava os metadados de catálogo requeridos pelo editor.

## Validação local

Após a correção de migração, os testes de backend operacional, backend do dashboard, integração segura com planilha e frontend do dashboard passaram. Antes do próximo deploy, executar a suíte completa:

```bash
node scripts/build-preview.js
node dashboard-analytics/scripts/build-preview.js
node tests/backend.test.js
node tests/frontend.test.js
node tests/responsive.test.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

## Próximas ações obrigatórias no Google Apps Script

1. No projeto Apps Script do PWA operacional, substituir/atualizar **`Código.gs` e `Questionario.gs`** com a versão local atual e salvar.
2. Na planilha, executar **Prescrições → Preparar base versionada**.
3. Confirmar que a aba `Questionário` passou a ter as colunas I:S e que os campos não aparecem mais como ausentes.
4. Atualizar o projeto Apps Script de `dashboard-analytics`, incluindo `Questionario.gs`, e publicar uma nova versão do Web App, se ainda não foi feito.
5. Reabrir o dashboard, acessar a aba **Questionário** e confirmar o carregamento do questionário ativo antes de editar/publicar.
6. Somente após a confirmação, validar um preenchimento no PWA dos prescritores e a leitura da nova resposta no dashboard.

## Riscos e cuidados

- Não editar manualmente o catálogo `Questionário` durante uma edição em andamento no dashboard; usar o editor para preservar ordens, IDs e publicação.
- Não assumir que uma versão citada em contexto anterior está ativa: confirmar no catálogo após a migração.
- Dados de anamnese, especialmente WhatsApp, são sensíveis. Evitar logs, exportações e métricas com dados identificáveis.
- Atualizações de schema devem começar pelo PWA operacional, que é responsável pela preparação da base.
- Arquivos `.clasp.json` apontam para deployments específicos e ficam fora do controle de versão para evitar vínculo acidental com produção.

## Como retomar em outro chat

> Estamos no projeto Prescrições CB, com dois PWAs Apps Script ligados à planilha `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`. O dashboard tem um editor de questionário versionado, com uma versão ativa, rascunho local, sem condicionais e sem drag-and-drop. O campo WhatsApp é obrigatório/protegido e só abre conversa via link. Houve um erro porque a planilha ainda tinha `Questionário` em A:H; a correção local já faz `Preparar base versionada` criar os metadados I:S. Primeiro conferir se `Código.gs` e `Questionario.gs` operacionais foram atualizados, executar a preparação e validar o editor. Depois manter os dois Apps Script sincronizados e testar antes de publicar.
