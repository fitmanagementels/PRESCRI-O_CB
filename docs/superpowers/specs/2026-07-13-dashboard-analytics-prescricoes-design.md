# Dashboard Gerencial de Prescrições — Especificação de Design

Data: 2026-07-13

## 1. Objetivo

Criar um segundo web app Google Apps Script para gestão operacional e análise de produtividade das prescrições. O novo app utilizará a mesma planilha do app operacional, mas terá projeto Apps Script, implantação, URL, manifesto, cache, gatilhos e arquivos próprios.

O dashboard não analisará o perfil clínico ou de treinamento das demandas nesta fase. O foco é produtividade, backlog, cumprimento de prazo e identificação de gargalos por profissional e para a equipe.

## 2. Isolamento obrigatório

O app operacional existente não será modificado. O novo projeto será criado em:

```text
dashboard-analytics/
```

Responsabilidades de escrita:

| Recurso | Responsável por escrever |
|---|---|
| `Respostas` | Tally/integração existente |
| `Monitoramento` | App operacional |
| `Analytics_Historico` | Dashboard analítico |

O dashboard nunca reformatará, reordenará, limpará ou reescreverá `Respostas` ou `Monitoramento`. Se uma resposta ainda não possuir linha correspondente em `Monitoramento`, o dashboard a tratará em memória como não transferida.

Se `Monitoramento` estiver ausente ou com cabeçalhos incompatíveis, o dashboard exibirá uma orientação para executar a configuração do app operacional. O segundo projeto não tentará corrigir essa aba.

## 3. Fonte e contrato de dados

A base oficial será a planilha Google Sheets com ID:

```text
1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk
```

Durante a transição da base piloto para a oficial, o dashboard assumirá o mesmo contrato funcional de `Respostas` e `Monitoramento`. Enquanto a nova planilha ainda não estiver compatível, as funções de configuração e validação deverão retornar um diagnóstico acionável, sem tentar migrar ou reformatar as abas controladas pelo Tally e pelo app operacional.

A ligação entre `Respostas` e `Monitoramento` será feita exclusivamente por `Submission ID`.

Campos operacionais mínimos:

- Submission ID;
- data da anamnese;
- aluno;
- profissional responsável;
- anamnese transferida;
- treino prescrito;
- data da prescrição;
- atualizado em.

O profissional identificado no Tally será considerado o responsável e prescritor da demanda.

Linhas incompletas, possivelmente em gravação pelo Tally, serão ignoradas até a próxima atualização. IDs duplicados, datas inválidas, conclusão sem data e outras inconsistências serão relatados sem correção silenciosa dos dados originais.

## 4. Regras operacionais

Status derivados:

- `nao_transferida`: anamnese não transferida e treino não prescrito;
- `pendente`: anamnese transferida e treino não prescrito;
- `prescrita`: treino prescrito com data de conclusão válida;
- `inconsistente`: combinação inválida ou dados obrigatórios ausentes.

O filtro composto `a_fazer` reúne `nao_transferida` e `pendente` e será o padrão da aba Acompanhamento.

O SLA será de 2 dias corridos, calculado no fuso `America/Fortaleza`, comparando dias civis e desconsiderando a hora do dia:

- dentro do prazo: conclusão em até 2 dias ou pendência com idade inferior a 2 dias;
- vence hoje: pendência com idade igual a 2 dias;
- atrasada: conclusão após 2 dias ou pendência com idade superior a 2 dias.

As métricas de etapa não afirmarão tempo entre transferência e prescrição, pois a base atual não possui data específica da transferência.

## 5. Arquitetura híbrida

O backend será dividido em unidades independentes:

1. acesso e validação das planilhas;
2. normalização de datas, textos e booleanos;
3. junção por Submission ID;
4. derivação de fatos operacionais;
5. cálculo de métricas de coorte;
6. cálculo de métricas de fluxo;
7. cálculo de produtividade por profissional;
8. construção de séries e comparações;
9. persistência de snapshots agregados;
10. cache e entrega de payloads.

O frontend receberá:

- registros normalizados necessários para a aba Acompanhamento;
- métricas e diagnósticos prontos para Produtividade;
- séries e tabelas prontas para Comparativos;
- dimensões para filtros.

O navegador será responsável por filtrar, ordenar e renderizar, não por redefinir as regras estatísticas.

## 6. Aba 1 — Acompanhamento

Visão gerencial de leitura, com filtro padrão `A fazer`.

Resumo:

- total a fazer;
- atrasadas;
- dentro do prazo;
- concluídas no período.

Filtros:

- busca por aluno ou Submission ID;
- profissional;
- período;
- situação: A fazer, Não transferidas, Pendentes, Prescritas e Todas;
- prazo: Dentro do prazo, Vence hoje e Atrasada.

Cada card mostrará:

- aluno;
- data de entrada;
- profissional responsável;
- etapa atual;
- dias em aberto ou tempo até conclusão;
- classificação do SLA;
- data de conclusão, quando aplicável;
- Submission ID para rastreamento.

O detalhamento será estritamente operacional. Respostas sensíveis da anamnese não farão parte deste dashboard.

## 7. Aba 2 — Produtividade

Visão descritiva da equipe completa ou de um profissional.

Indicadores:

- demandas recebidas;
- prescrições concluídas;
- saldo entre recebidas e concluídas;
- backlog atual;
- não transferidas;
- transferidas aguardando prescrição;
- pendências atrasadas;
- taxa de conclusão da coorte;
- taxa de conclusão dentro do SLA;
- tempo médio, mediano e percentil 75 até conclusão;
- maior idade entre pendências;
- produção média diária e semanal;
- data da última conclusão.

Diagnósticos descritivos:

- recebeu demandas, mas não concluiu nenhuma;
- produção menor que as novas entradas;
- backlog crescente;
- concentração em não transferidas;
- concentração em pendentes de prescrição;
- taxa de SLA abaixo da equipe;
- tempo mediano pior que o período anterior;
- concentração de pendências antigas;
- ausência de atividade recente.

Não haverá nota única de produtividade. A comparação usará ranking selecionável e tabela completa.

## 8. Aba 3 — Comparativos

Modos:

- histórico completo;
- período selecionado;
- período selecionado contra o anterior equivalente;
- comparação entre profissionais.

O período poderá ser definido por opções rápidas e intervalo personalizado. A granularidade será diária, semanal ou mensal conforme a extensão selecionada.

Gráficos:

1. entradas versus conclusões e saldo;
2. evolução do backlog;
3. backlog por etapa e profissional;
4. cumprimento do SLA por profissional;
5. média, mediana e percentil 75 do tempo até conclusão;
6. produção e recebimento por profissional;
7. tendência contra o período anterior.

Tabela comparativa:

- profissional;
- recebidas;
- concluídas;
- saldo;
- backlog;
- atrasadas;
- taxa de conclusão;
- taxa dentro do SLA;
- média, mediana e percentil 75;
- produção média semanal;
- variação contra o período anterior.

Os gráficos serão renderizados com SVG/CSS local, sem dependência obrigatória de biblioteca externa. Em amostras pequenas, o app exibirá aviso e evitará tratar oscilações como tendência.

## 9. Coorte, fluxo e comparação temporal

As duas leituras coexistirão:

- coorte: demandas recebidas no período e seu estado/conclusão;
- fluxo: entradas pela data da anamnese e conclusões pela data da prescrição.

O modo comparativo utilizará um período anterior de mesma duração. O histórico completo continuará disponível sem comparação obrigatória.

## 10. `Analytics_Historico`

O segundo backend criará e controlará exclusivamente esta aba.

Cada snapshot terá uma linha para a equipe e uma linha para cada profissional, usando a chave composta por data civil e profissional.

Colunas previstas:

- Data do snapshot;
- Profissional;
- Demandas recebidas no dia;
- Prescrições concluídas no dia;
- Não transferidas;
- Aguardando prescrição;
- Backlog total;
- Atrasadas;
- Conclusões dentro do SLA no dia;
- Conclusões fora do SLA no dia;
- Tempo médio de conclusão;
- Tempo mediano de conclusão;
- Percentil 75;
- Atualizado em;
- Versão da estrutura.

Não serão gravados nomes de alunos, respostas da anamnese ou outros dados pessoais nessa aba.

Atualizações do mesmo dia e profissional substituirão o snapshot daquele dia; não criarão duplicatas. O histórico de etapas será válido a partir da implantação. Estados intermediários anteriores não serão inventados retroativamente.

## 11. Configuração e atualização

Funções públicas:

- `configurarDashboardAnalytics()`;
- `getDashboardAnalytics()`;
- `atualizarDashboardAnalytics()`;
- `validarDashboardAnalytics()`;
- `registrarSnapshotDiarioAnalytics()`.

`configurarDashboardAnalytics()` será idempotente e executada uma vez pelo editor. Ela:

- valida `Respostas` e `Monitoramento`;
- cria ou migra apenas `Analytics_Historico`;
- instala um único gatilho diário;
- registra o primeiro snapshot;
- prepara o cache;
- devolve um relatório de configuração.

O gatilho será diário, executado na janela entre 23:00 e 00:00 no fuso `America/Fortaleza`. A linha agregada da equipe usará o identificador reservado `__EQUIPE__`, que não poderá coincidir com um profissional real.

O botão `Atualizar dados` do web app:

- relê as fontes;
- recalcula métricas;
- atualiza o snapshot do dia;
- invalida e recompõe o cache analítico;
- informa horário, inconsistências e resultado da atualização.

## 12. Cache e desempenho

O dashboard terá namespace de cache próprio, sem compartilhar chaves com o app operacional.

O cache terá validade nominal de 10 minutos. A expiração nunca será usada como armazenamento histórico; em cache frio, o backend reconstruirá o payload a partir das abas autorizadas.

Camadas:

1. `CacheService` para payloads operacionais e estatísticos;
2. `Analytics_Historico` como persistência agregada;
3. último resumo estatístico válido no navegador, sem nomes ou dados sensíveis.

O botão Atualizar sempre força a leitura atual. Uma falha de atualização preserva o último payload válido e mostra o erro sem substituir a interface por uma tela vazia.

## 13. Interface

- mobile-first;
- tema visual compatível com o app operacional;
- logo incorporada localmente;
- navegação inferior com Acompanhamento, Produtividade e Comparativos;
- melhor aproveitamento de largura em desktop;
- filtros ativos e horário da última atualização sempre visíveis;
- estados de carregamento, vazio, erro e amostra insuficiente.

## 14. Segurança e privacidade

- nenhum dado pessoal em documentação, testes ou fixtures;
- nenhum dado da anamnese clínica no payload analítico;
- nomes apenas na lista gerencial em tempo de execução;
- nenhum armazenamento local persistente de nomes de alunos;
- implantação com acesso restrito aos gestores autorizados;
- `Respostas` e `Monitoramento` nunca serão alteradas pelo dashboard.

## 15. Tratamento de erros

O app tratará explicitamente:

- planilha ou aba ausente;
- cabeçalhos incompatíveis;
- IDs ausentes ou duplicados;
- profissional ausente;
- datas inválidas;
- prescrição sem data;
- combinações de status inconsistentes;
- falha de cache;
- falha do gatilho;
- amostra insuficiente;
- leitura durante gravação incompleta do Tally.

## 16. Testes

Testes locais usarão dados totalmente sintéticos e não identificáveis.

Cobertura mínima:

- normalização e junção por ID;
- regras de status;
- SLA de 2 dias corridos;
- média, mediana e percentil 75;
- coorte e fluxo;
- reconstrução do backlog;
- comparação de períodos equivalentes;
- agrupamento por profissional;
- diagnósticos de gargalo;
- upsert diário sem duplicação;
- idempotência da configuração e do gatilho;
- cache e fallback;
- ausência de escrita em `Respostas` e `Monitoramento`;
- contrato dos três payloads;
- responsividade e navegação das três abas.

## 17. Entrega e implantação

O diretório do novo projeto conterá:

```text
dashboard-analytics/
├── Código.gs
├── appsscript.json
├── index.html
├── styles.html
├── scripts.html
├── README_DEPLOY.md
└── tests/
```

O `README_DEPLOY.md` explicará como:

1. criar um novo projeto independente em `script.google.com`;
2. copiar os arquivos;
3. exibir e substituir `appsscript.json`;
4. executar `configurarDashboardAnalytics()`;
5. autorizar o acesso;
6. validar a configuração;
7. implantar como aplicativo da web;
8. escolher o público autorizado;
9. atualizar uma implantação existente.

## 18. Critérios de aceite

- app operacional da raiz permanece inalterado;
- novo app possui projeto e URL independentes;
- três abas internas funcionam em mobile e desktop;
- Acompanhamento abre em `A fazer`;
- SLA de 2 dias é aplicado de forma consistente;
- métricas de coorte e fluxo são distinguíveis;
- produtividade pode ser vista por profissional ou equipe;
- comparação recente/anterior e histórico completo estão disponíveis;
- `Analytics_Historico` não contém dados pessoais;
- configuração é idempotente;
- gatilho diário não é duplicado;
- dashboard não escreve em `Respostas` ou `Monitoramento`;
- falhas não eliminam o último estado válido;
- instruções permitem copiar, autorizar e implantar sem edição estrutural manual da planilha.
