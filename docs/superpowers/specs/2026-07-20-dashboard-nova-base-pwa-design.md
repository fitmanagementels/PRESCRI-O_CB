# Compatibilidade do dashboard com a nova base PWA

## Objetivo

Garantir que o dashboard em `dashboard-analytics/` leia exclusivamente a planilha oficial `BASE_PRESCRIÇÃO_CB — PWA`, identificada por `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`, sem reutilizar dados da base anterior e sem gerar erros quando o PWA de prescritores for atualizado.

## Estrutura confirmada

Planilha: `https://docs.google.com/spreadsheets/d/1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs/edit`

- `Respostas` (`sheetId: 1564616330`): fonte operacional nova, com 40 colunas e linha de cabeçalho congelada.
- `Monitoramento` (`sheetId: 1438553011`): estado operacional das demandas.
- `Analytics_Historico` (`sheetId: 1795215408`): snapshots agregados já compatíveis com o dashboard.
- `Respostas – legado Tally`: fonte histórica separada e fora da leitura do dashboard.
- `Complementar` e `Questionário`: fora do escopo do dashboard gerencial.
- Localidade e fuso: `pt_BR` e `America/Fortaleza`.

O contrato obrigatório da nova aba `Respostas` é:

| Dado | Cabeçalho oficial |
|---|---|
| Identificador | `ID da demanda` |
| Data de entrada | `Criado em` |
| Responsável | `Profissional` |
| Aluno | `Nome completo` |

O contrato da aba `Monitoramento` permanece: `ID da demanda`, `Anamnese transferida?`, `Treino prescrito?` e `Data da prescrição`, além de seus campos auxiliares.

## Solução aprovada

### Vínculo explícito e cache

`ANALYTICS_CONFIG.spreadsheetId` permanecerá definido exclusivamente com o ID da nova base. A chave de `CacheService` será versionada para a nova origem; assim, o primeiro acesso após a publicação não poderá exibir por até dez minutos um payload da planilha anterior.

### Contrato de dados

O dashboard continuará usando apenas `Respostas` e `Monitoramento`. A validação reconhecerá e será coberta por testes usando os quatro cabeçalhos oficiais novos. Não haverá leitura de `Respostas – legado Tally`, `Complementar` ou `Questionário`.

As colunas adicionais da nova resposta — como `Origem`, `Versão do questionário` e `ID da tentativa` — serão ignoradas pelo dashboard nesta etapa. Isso mantém a leitura robusta quando novas perguntas de anamnese forem adicionadas.

### Linguagem da interface

Todas as mensagens de busca, ficha e falha que ainda se referirem a `Submission ID` serão alteradas para `ID da demanda`. A lógica continuará usando o mesmo identificador único; a alteração é de terminologia e não altera filtros, métricas ou histórico.

### Histórico e segurança

`Analytics_Historico` continuará sendo atualizado somente pelo dashboard. Sua estrutura não será modificada. A nova base já possui cabeçalhos compatíveis, portanto não há migração ou reprocessamento de snapshots históricos.

## Fluxo após a publicação

1. O dashboard abre a nova planilha pelo ID oficial.
2. Valida os contratos de `Respostas` e `Monitoramento`.
3. Lê apenas as duas fontes operacionais.
4. Gera o payload com a nova chave de cache.
5. Ao abrir uma ficha, procura o mesmo `ID da demanda` em `Respostas`.
6. Atualizações de dashboard escrevem somente snapshots em `Analytics_Historico`.

## Critérios de aceitação

- O código contém apenas o ID da nova base como fonte do dashboard.
- O cache do dashboard possui chave diferente da usada na base anterior.
- Os testes aceitam os cabeçalhos `ID da demanda`, `Criado em`, `Profissional` e `Nome completo`.
- A interface não mostra `Submission ID` ao usuário.
- Nenhuma referência operacional é adicionada a `Respostas – legado Tally`, `Complementar` ou `Questionário`.
- Backend, testes de planilha e frontend continuam aprovados.
- Após publicar uma nova versão e executar `validarDashboardAnalytics`, a resposta identifica a nova planilha e confirma `Respostas`, `Monitoramento` e `Analytics_Historico`.

## Fora do escopo

- Alterar o formulário ou o PWA dos prescritores.
- Criar novos indicadores a partir de `Origem`, `Versão do questionário` ou `Questionário`.
- Reescrever ou limpar snapshots existentes.
- Alterar a interface além da terminologia do identificador.
