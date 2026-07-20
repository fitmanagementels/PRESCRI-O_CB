# Contexto do Projeto — Prescrições CB

Última atualização: **2026-07-20 14:20 -0300**

## Resumo executivo

- Este workspace contém dois web apps Google Apps Script sobre a mesma fonte de dados: o PWA operacional de prescrições/anamnese (raiz) e o dashboard gerencial (`dashboard-analytics/`).
- A planilha oficial é **BASE_PRESCRIÇÃO_CB — PWA**, ID `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`, fuso `America/Fortaleza`.
- O Tally deixou de ser a origem pretendida de novas anamneses. Seu histórico foi preservado como `v1`; o PWA cria demandas `v2` diretamente em `Respostas`.
- A estrutura foi projetada para evolução: perguntas antigas e colunas existentes não são apagadas quando o questionário mudar; mudanças semânticas futuras devem criar uma nova versão (`v3`, `v4` etc.).
- O PWA atual contém acompanhamento operacional e a aba **Adicionar demanda**, com rascunho local de seis horas, envio idempotente e fluxo mobile-first de sete telas.
- O código local foi verificado, mas a sincronização dos arquivos e a publicação da nova versão no editor do Apps Script ainda precisam ser confirmadas manualmente.

## Objetivo do projeto

- **Objetivo principal:** permitir que prescritores registrem diretamente a anamnese de alunos e acompanhem o ciclo até a prescrição, sem depender do webhook/exportação do Tally.
- **Resultado esperado:** dados históricos e novos em uma base única, versionada, auditável e utilizável pelo PWA operacional e pelo dashboard gerencial.
- **Público:** profissionais prescritores que preenchem anamneses; equipe operacional que acompanha transferência e prescrição; gestão que consulta o dashboard.
- **Critérios de sucesso:** registro `v2` seguro em `Respostas`, criação correspondente em `Monitoramento`, recuperação de rascunho por seis horas, navegação confortável em celular, preservação integral do histórico `v1` e dashboard com ações controladas de WhatsApp e exclusão por ID.

## Estado atual

- **Etapa atual:** código e estrutura local do PWA de anamnese estão implementados; falta confirmar a publicação no Apps Script e executar o aceite em ambiente publicado.
- **Última alteração relevante:** fluxo de anamnese reorganizado em seis etapas de perguntas e uma sétima de revisão/envio; o campo de dias por semana deixou de usar o menu nativo do navegador.
- **Planilha nova:** preparada e conferida com `Respostas` canônica, `Respostas – legado Tally`, `Questionário`, `Monitoramento`, `Complementar` e `Analytics_Historico`.
- **Histórico observado:** 35 demandas do Tally foram migradas como `Origem = Tally` e `Versão do questionário = v1`.
- **Dashboard:** há um projeto local independente em `dashboard-analytics/`, configurado para a mesma base. A implantação online e o gatilho diário precisam ser confirmados, não presumidos.

## Arquitetura e contrato de dados

### Planilha oficial

| Aba | Responsabilidade | Regra importante |
|---|---|---|
| `Respostas` | Fonte canônica; uma linha por demanda | Não apagar/renomear colunas que já tenham histórico. |
| `Respostas – legado Tally` | Cópia legível da exportação original | Sem escrita pelo PWA e não lida pelo dashboard. |
| `Questionário` | Catálogo de versões, códigos, tipos, obrigatoriedade e opções | Registra `v1` e `v2`; futuras mudanças devem manter rastreabilidade. |
| `Monitoramento` | Estado operacional de cada demanda | Chave é `ID da demanda`; campos de transferência/prescrição e datas. |
| `Complementar` | Profissionais disponíveis no formulário | Apenas linhas com `Status = Ativo` aparecem no PWA. |
| `Analytics_Historico` | Snapshots agregados gerados pelo dashboard | Não contém respostas clínicas individuais. |
| `Analytics_Exclusoes` | Auditoria mínima de exclusões feitas no dashboard | ID, data/hora, motivo e origem; sem respostas clínicas ou telefone. |

### Cabeçalhos e identificação

- `Respostas` começa com `ID da demanda`, `Origem`, `Criado em`, `Versão do questionário`, `ID da tentativa`, `Profissional` e `Nome completo`.
- Registros legados usam seu `Submission ID` original como `ID da demanda`, `Origem = Tally` e `Versão do questionário = v1`.
- Registros novos usam `Origem = PWA`, `Versão do questionário = v2`, ID `DEM-AAAAMMDD-...` e `ID da tentativa` para evitar duplicidade em reenvios.
- `Monitoramento!A1` é `ID da demanda`; os demais campos mantêm o acompanhamento de transferência, prescrição e datas.

## Fluxo atual da anamnese `v2`

O questionário preserva as mesmas chaves/cabeçalhos de resposta; a mudança recente foi apenas de agrupamento e experiência.

1. **Consentimento e responsável:** consentimento, depois profissional ativo.
2. **Identificação e dados físicos:** nome completo, e-mail, WhatsApp, nascimento, altura e peso.
3. **Experiência de treino:** experiência em musculação e frequência dos últimos três meses.
4. **Objetivo e rotina:** objetivo, dias pretendidos por semana (1–7), tempo disponível e atividades extras.
5. **Dor, assimetrias e limitações:** dor e detalhes condicionais, assimetria e detalhes condicionais, movimentos incômodos e exercícios evitados.
6. **Saúde e preferências:** lesões, condições, medicamentos, sintomas no esforço, preferência e observações.
7. **Revisar e enviar:** não faz novas perguntas; apresenta o resumo completo, permite voltar e envia a demanda.

### Regras de experiência e segurança

- O seletor de dias por semana é um `combobox/listbox` personalizado no tema escuro, com toque, clique, Tab, setas, Home/End, Enter e Escape. Não usar `<select>` nativo para esse campo, pois a lista aberta é controlada pelo navegador.
- Rascunho: `localStorage`, chave `prescricoes_anamnese_v2_rascunho`, validade de **6 horas**. Não há linhas incompletas na planilha.
- Backend: valida campos obrigatórios, e-mail, dor de 0 a 10 e dias de 1 a 7; usa `LockService` e idempotência por `ID da tentativa`.
- Ao enviar com sucesso, grava uma linha em `Respostas`, cria a linha correspondente em `Monitoramento` com os dois checkboxes falsos, limpa o cache do payload e só então remove o rascunho local.

## Acesso, manifesto e implantação

- Decisão aprovada: qualquer pessoa **conectada a uma conta Google** pode abrir o PWA; não há autenticação por lista de e-mails.
- O profissional é selecionado manualmente no formulário a partir de `Complementar`; não foram criadas colunas de e-mail nessa aba.
- `appsscript.json` do PWA declara `runtimeVersion: V8`, `America/Fortaleza`, `webapp.access: ANYONE`, `webapp.executeAs: USER_DEPLOYING` e escopo `https://www.googleapis.com/auth/spreadsheets`.
- A configuração da implantação publicada também precisa estar como acesso para pessoas conectadas e execução pelo proprietário. O manifesto não substitui a conferência na tela **Implantar**.
- A URL `/dev` sempre executa o código salvo mais recente para editores do projeto; a URL oficial só recebe alterações após **Implantar → Gerenciar implantações → Nova versão**.

## Administração autônoma da base

O menu **Prescrições** da planilha fornece:

- `Validar base versionada`: diagnóstico somente de leitura de abas e cabeçalhos.
- `Preparar base versionada`: rotina idempotente que cria abas/cabeçalhos ausentes, adiciona campos novos sem apagar dados e migra uma planilha ainda em formato Tally de forma não destrutiva.

Se a rotina encontrar estrutura incompatível ou uma aba de legado já existente durante uma migração, deve interromper antes de alterar dados. A fonte de verdade da estrutura é o backend, não instruções manuais isoladas.

## Decisões tomadas

- Não utilizar mais o Tally para registrar novas demandas; ele permanece somente como histórico `v1`.
- Manter a base nova como única fonte para PWA e dashboard, com a aba de exportação Tally separada e preservada.
- Permitir acesso a qualquer pessoa conectada a Conta Google, sem lista de e-mails; o vínculo operacional é a seleção manual do profissional ativo.
- Guardar rascunhos no navegador por seis horas, nunca como registros incompletos na planilha.
- Tratar revisão como etapa 7 independente, depois das seis etapas de perguntas.
- Usar seletor customizado para os dias de treino, pois o menu nativo não atende ao tema do app.
- Preservar o dashboard como projeto independente. A única escrita nas fontes operacionais autorizada é a exclusão confirmada de uma demanda por `ID da demanda`, sempre removendo as linhas de `Respostas` e `Monitoramento` e registrando auditoria mínima.

## Informações importantes capturadas do chat

- O preenchimento é feito pelos próprios prescritores, para alimentar posteriormente o banco de prescrições.
- Nome completo e e-mail devem ser as primeiras perguntas de identificação; consentimento e profissional vêm antes, em etapa própria.
- Data de nascimento, altura e peso pertencem à mesma etapa de identificação física.
- O usuário prioriza confiabilidade de dados e continuidade do formulário em celular, inclusive quando o app é fechado ou o aparelho desliga.
- A planilha precisa poder evoluir sem depender de uma nova base ou de reconstrução manual de dados antigos.

## Etapa atual em desenvolvimento

- **Pronto localmente:** backend versionado, administração da base, wizard de sete telas, rascunho, idempotência, seletor temático, testes e documentação de implantação.
- **Arquivos ativos:** `Código.gs`, `index.html`, `scripts.html`, `styles.html`, `appsscript.json`, `tests/` e `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`.
- **Cuidado ao continuar:** `preview.html` é gerado; o PWA on-line não é atualizado automaticamente pelos arquivos locais.

## Próximos passos

1. Sincronizar os arquivos atualizados no projeto Apps Script e salvar.
2. Abrir `/dev`, autorizar novamente caso solicitado e executar o teste de aceite em celular.
3. Publicar uma nova versão da implantação mantendo a URL oficial.
4. Confirmar em `Respostas`, `Monitoramento` e `Questionário` o primeiro envio `v2` real/de teste.
5. Atualizar ou arquivar o guia antigo `docs/IMPLANTACAO_PLANILHA_OFICIAL.md` antes de ele ser usado por outra pessoa.

## Dashboard gerencial independente

- Diretório: `dashboard-analytics/`.
- Lê `Respostas` e `Monitoramento`; escreve snapshots agregados em `Analytics_Historico` e logs mínimos em `Analytics_Exclusoes`.
- Não deve formatar, limpar, reordenar ou reescrever `Respostas`/`Monitoramento`; a única exceção é a exclusão definitiva de uma demanda, acionada no modal, confirmada com `EXCLUIR` e feita em ambas as abas pelo `ID da demanda`.
- O modal da anamnese exibe um ícone de WhatsApp somente se o número cadastrado for válido; ele abre `wa.me` e não fica disponível no PWA dos prescritores.
- Usa cache próprio por até 10 minutos, SLA configurado de 2 dias e pode instalar gatilho diário entre 23h e 0h no fuso de Fortaleza.
- O dashboard é operacional/gerencial: volume, backlog, SLA, tempo, distribuição por profissional e ficha de anamnese sob demanda. Não registrar respostas clínicas completas no histórico ou cache analítico.

## Histórico relevante

| Data | Mudança | Impacto |
|---|---|---|
| 2026-07-13 | PWA operacional recebeu refinamento mobile-first, modal e acompanhamento de monitoramento | Melhor uso em celular e acompanhamento das prescrições. |
| 2026-07-20 | Nova base `BASE_PRESCRIÇÃO_CB — PWA` criada a partir da planilha Tally | Dados históricos preservados como `v1`; nova fonte única para PWA e dashboard. |
| 2026-07-20 | Backend ganhou catálogo `v2`, gravação direta, idempotência e rotinas de preparar/validar base | Elimina dependência operacional do Tally para novas anamneses. |
| 2026-07-20 | Wizard de anamnese criado com rascunho de seis horas | Prescritores podem interromper e retomar o preenchimento sem linha parcial na planilha. |
| 2026-07-20 | Manifesto e splash corrigidos | Acesso/execução documentados; erro que travava a abertura em 100% foi removido. |
| 2026-07-20 | Fluxo reorganizado e dias por semana convertido em seletor temático | Agrupamento mais lógico e interface consistente no mobile. |
| 2026-07-20 | Dashboard ganhou WhatsApp e exclusão confirmada de demanda | A exclusão remove `Respostas` e `Monitoramento` pelo ID e registra auditoria sem dados clínicos. |

## Memória de decisões e justificativas

| Decisão | Motivo | Impacto / como retomar |
|---|---|---|
| Substituir Tally por PWA | Webhook/exportação podia falhar e obrigar trocas de planilha | Novas demandas entram somente pelo PWA após o aceite publicado. |
| Uma base nova, não reutilizar a aba bruta | Separar legado da estrutura controlada pelo produto | Usar somente o ID da base nova no PWA e dashboard. |
| Versionar anamneses (`v1`, `v2`...) | Mudanças futuras não podem apagar ou corromper histórico | Alteração de significado/tipo/opções relevantes cria nova versão e preserva colunas anteriores. |
| Rascunho local por 6 horas | Celular pode fechar, desligar ou ser pausado durante a anamnese | Não usar `CacheService` para rascunho do aluno; manter no navegador. |
| Sem lista de e-mails de acesso | Operação permitida para qualquer pessoa com Conta Google | Manter acesso na implantação e seleção de profissional por `Complementar`. |
| Separar dashboard em outro projeto Apps Script | Isolar URL, cache, gatilhos e risco operacional | Não editar o PWA raiz no trabalho exclusivo do dashboard sem autorização. |
| Excluir somente no dashboard | Evitar exclusão acidental por prescritores e manter limpeza operacional centralizada | Exigir `EXCLUIR`, apagar as duas linhas pelo ID e consultar `Analytics_Exclusoes` para a auditoria. |
| Seletor próprio para dias 1–7 | Popup nativo não respeita o tema escuro | Manter componente customizado acessível em `scripts.html`/`styles.html`. |

## Arquivos e pastas importantes

| Caminho | Função | Observação |
|---|---|---|
| `Código.gs` | Backend do PWA: planilha, versão `v2`, envio, monitoramento e administração da base | Arquivo principal a ler primeiro. |
| `index.html` | Estrutura do PWA e das abas | Inclui `styles` e `scripts` pelo Apps Script. |
| `scripts.html` | Estado do app, wizard, rascunho, combobox e chamadas `google.script.run` | Contém também mocks de preview. |
| `styles.html` | Tema, responsividade e componentes | Inclui estilos do seletor customizado e do wizard. |
| `appsscript.json` | Runtime, escopo e configuração de web app | Deve acompanhar a publicação manual. |
| `tests/` | Testes de backend, frontend e responsividade | Executar após qualquer alteração relevante. |
| `dashboard-analytics/` | Segundo projeto Apps Script, independente | Ver `README_DEPLOY.md` antes de publicar. |
| `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md` | Procedimento atualizado de publicação/aceite | Referência de implantação do PWA atual. |
| `docs/superpowers/specs/2026-07-20-anamnese-pwa-versionada-design.md` | Decisões do desenho da anamnese | Inclui fluxo atual de sete telas. |

## Verificação local conhecida

Executados com sucesso após os ajustes de 2026-07-20:

```bash
node scripts/build-preview.js
node tests/backend.test.js
node tests/frontend.test.js
node tests/responsive.test.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

O teste responsivo aprovou larguras de 320, 360, 390, 412, 430 e 880 px. `preview.html` é gerado: recriá-lo sempre que `index.html`, `styles.html` ou `scripts.html` mudar.

## Riscos, bloqueios e pendências

- **Publicação a confirmar:** não há integração `clasp` configurada; copiar os arquivos atualizados para o editor Apps Script, salvar, testar `/dev` e publicar uma nova versão é uma ação manual pendente.
- **Aceite pendente:** enviar uma anamnese de teste publicada, conferir a linha `v2`, `Monitoramento`, rascunho de seis horas, revisão da etapa 7 e prevenção de duplicidade.
- **Documento obsoleto:** `docs/IMPLANTACAO_PLANILHA_OFICIAL.md` ainda referencia a planilha antiga, `Submission ID` e um modelo de acesso anterior. Não usá-lo para esta base sem atualizá-lo/substituí-lo.
- **Catálogo na planilha:** confirmar após a publicação que a aba `Questionário` reflete a nova ordem visual de `v2`; a ordem não muda o significado dos dados nem exige nova versão.
- **Dados sensíveis:** anamnese contém informações de saúde. Não copiar linhas reais para testes, documentação, prints públicos, cache analítico ou novos projetos sem necessidade.
- **Infraestrutura:** este diretório não possui repositório Git funcional; não presumir commits, branches ou deploy automático.

## Como retomar o trabalho

1. Leia este arquivo e `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`.
2. Confirme no editor Apps Script se `Código.gs`, `index.html`, `scripts.html`, `styles.html` e `appsscript.json` locais estão sincronizados e se existe uma nova versão publicada.
3. Abra `/dev`, execute o teste de aceite e só então valide a URL publicada em celular.
4. Se o problema for de base, use primeiro `Validar base versionada`; só execute `Preparar base versionada` quando o diagnóstico indicar necessidade.
5. Para dashboard, trabalhe em `dashboard-analytics/` e preserve o PWA da raiz.

## Contexto para outro chat ou IA

```text
Projeto: PWA de prescrições/anamnese CB + dashboard gerencial independente.
Workspace: /home/elohimlima/Downloads/VSCODE|ANTIGRAVITY/PRESCRIÇÃO-CB

Leia primeiro:
- Contexto/CONTEXTO_DO_PROJETO.md
- Código.gs
- scripts.html
- styles.html
- appsscript.json
- docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md

Base oficial: BASE_PRESCRIÇÃO_CB — PWA
ID: 1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs
Fuso: America/Fortaleza

Objetivo atual: substituir o Tally por registro direto da anamnese no PWA, preservando histórico v1 e criando novas demandas v2 versionadas.

Contratos que não podem ser desfeitos:
- Respostas é uma linha por demanda; dados antigos v1 permanecem.
- Novos registros v2 usam ID da demanda, Origem=PWA e ID da tentativa idempotente.
- Perguntas futuras não apagam colunas/respostas; mudanças de significado criam nova versão.
- Rascunho é local por 6 horas; não gravar anamneses incompletas na planilha.
- Acesso é para qualquer usuário conectado a Conta Google; profissional vem de Complementar com Status=Ativo.
- Dashboard em dashboard-analytics/ é projeto separado; somente ele pode excluir uma demanda confirmada de `Respostas` e `Monitoramento` pelo ID.

Fluxo do wizard atual:
1 consentimento e responsável;
2 identificação/dados físicos;
3 experiência;
4 objetivo/rotina;
5 dor/assimetria/limitações;
6 saúde/preferências;
7 revisão e envio.
Dias por semana usa seletor customizado, não select nativo.

Antes de declarar conclusão: executar build e os testes listados no contexto. A publicação no Apps Script é manual e deve ser confirmada, não presumida.
```
