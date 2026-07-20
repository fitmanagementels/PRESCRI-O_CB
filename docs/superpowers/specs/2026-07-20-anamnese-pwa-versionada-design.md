# Anamnese versionada no PWA de prescrições

**Data:** 2026-07-20  
**Status:** desenho aprovado; pronto para planejamento de implementação.

## Objetivo

Substituir o Tally como origem de demandas de treino. O PWA de prescrições passará a criar anamneses diretamente em uma nova planilha-base, sem perder o histórico já coletado e sem quebrar quando o questionário mudar no futuro.

## Escopo aprovado

- Criar uma cópia integral da planilha atual para ser a nova base oficial. A planilha alimentada pelo Tally permanece como arquivo histórico e não recebe novas respostas após a virada.
- Reorganizar a aba `Respostas` da nova base, preservando todas as demandas existentes como anamnese `v1`.
- Adicionar uma aba `Adicionar demanda` ao PWA atual, com formulário mobile-first em etapas.
- A nova anamnese será `v2`, mantendo as perguntas atuais e acrescentando `Quantas vezes na semana pretende treinar?`.
- Gravar a demanda diretamente em `Respostas` e criar o registro correspondente em `Monitoramento` no mesmo envio.
- Manter o dashboard analítico usando a mesma nova base, após atualização de sua configuração e contrato de leitura.

## Acesso e profissionais

- Implantação do web app: qualquer pessoa com uma conta Google pode acessar, como no modelo atual.
- Não haverá autenticação por lista de e-mails, nem colunas de e-mail em `Complementar`.
- No formulário, o profissional será escolhido manualmente entre os registros de `Complementar` cujo `Status` seja `Ativo`.
- A aba `Complementar` mantém somente `Nome`, `Turno`, `Whatsapp` e `Status` neste escopo.

## Formulário PWA

O formulário será composto de seis etapas, com uma ação por tela, controles de toque amplos, indicador de progresso e botões `Voltar` e `Continuar`.

1. **Consentimento e responsável:** consentimento e, depois, profissional escolhido manualmente.
2. **Identificação e dados físicos:** nome completo, e-mail, WhatsApp, nascimento, altura e peso.
3. **Experiência de treino:** experiência com musculação e frequência nos últimos três meses.
4. **Objetivo e rotina:** objetivo, **frequência pretendida de 1 a 7 dias por semana**, tempo por treino e atividades além da musculação.
5. **Dor, assimetrias e limitações:** dor/desconforto, detalhes condicionais, assimetria, movimentos incômodos e exercícios evitados.
6. **Saúde e preferências:** lesões, condições, medicamentos, sinais durante esforço, preferência e observações.
7. **Revisar e enviar:** tela própria, somente para conferência completa, retorno a qualquer etapa e envio final.

O formulário conserva as respostas ao retroceder etapas. O rascunho é salvo localmente no dispositivo, com expiração de seis horas, e é removido após envio bem-sucedido ou descarte manual. Não há gravação de anamnese incompleta na planilha.

O controle de frequência pretendida usa uma lista personalizada, acessível por toque e teclado, no tema escuro do PWA. Não será utilizado o menu aberto pelo navegador, pois ele não pode ser tematizado de forma consistente.

## Estrutura da nova planilha

| Aba | Papel |
| --- | --- |
| `Respostas` | Fonte oficial, uma linha por demanda, reunindo registros `v1`, `v2` e futuros. |
| `Questionário` | Catálogo imutável das perguntas de cada versão. |
| `Monitoramento` | Estado operacional de cada demanda: transferência, prescrição e datas. |
| `Complementar` | Cadastro de profissionais ativos. |
| `Respostas – legado Tally` | Backup legível da exportação original, sem escrita pelo PWA. |
| Abas analíticas existentes | Histórico e visuais do dashboard, adaptados à nova fonte. |

### `Respostas`

A tabela é organizada por blocos, mas não depende da posição de colunas:

1. **Metadados:** `ID da demanda`, `Origem`, `Criado em`, `Versão do questionário`, `Profissional`.
2. **Aluno:** nome, e-mail, WhatsApp, consentimento, nascimento, altura e peso.
3. **Histórico de treino:** experiência e frequência recente.
4. **Dor e assimetrias.**
5. **Objetivo e rotina:** inclui `Frequência pretendida (dias/semana)`.
6. **Limitações e saúde.**
7. **Preferências e observações.**

Demandas históricas recebem `Origem = Tally`, `Versão do questionário = v1` e preservam o `Submission ID` original como `ID da demanda`. Demandas novas recebem `Origem = PWA`, `Versão do questionário = v2` e um ID único criado pelo backend. O campo `Frequência pretendida (dias/semana)` fica vazio nos registros `v1`.

### `Questionário`

Cada linha registra uma pergunta de uma versão: versão, ordem, código estável, texto exibido, tipo de controle, obrigatoriedade e opções. O código, e não o título ou a posição da coluna, é o contrato entre PWA, backend e planilha.

Regras de evolução:

- Uma pergunta adicionada cria um novo código, uma coluna ao final de `Respostas` e uma nova entrada na versão vigente.
- Uma pergunta removida mantém sua coluna e suas respostas históricas; apenas deixa de ser exibida na versão nova.
- Uma alteração de significado, tipo ou opções relevantes cria uma nova versão (`v3`, `v4` etc.) e preserva a versão anterior.
- Ao abrir uma demanda, o PWA usa sua versão para mostrar apenas as perguntas aplicáveis àquela anamnese.

## Fluxo de envio

1. O PWA valida os campos obrigatórios da versão atual.
2. O backend recebe um identificador de tentativa para tornar o envio idempotente.
3. O backend gera o ID da demanda, grava uma única linha em `Respostas` e cria a linha equivalente em `Monitoramento` com ambos os estados inicialmente falsos.
4. A resposta devolve confirmação e o ID; somente então o PWA remove o rascunho.
5. Em falha de rede ou servidor, o rascunho permanece e a nova tentativa não cria duplicata.

## Migração segura

1. Fazer uma cópia completa da planilha atual e nomeá-la como nova base oficial.
2. Na cópia, preservar a exportação recebida como `Respostas – legado Tally`.
3. Construir e preencher a nova `Respostas` a partir da exportação, transformando cada linha em registro `v1`.
4. Preservar os IDs atuais na nova tabela e em `Monitoramento`, mantendo os vínculos operacionais.
5. Criar e preencher `Questionário` com o catálogo de `v1` e `v2`.
6. Atualizar o PWA e o dashboard para o ID da nova planilha; executar as validações antes da publicação.
7. Testar uma demanda fictícia de ponta a ponta: rascunho, envio, `Respostas`, `Monitoramento`, detalhe no PWA e dashboard.
8. Publicar novas versões dos web apps e interromper a entrada do Tally somente após a verificação final.

## Código afetado

- PWA de prescrições: `Código.gs`, `index.html`, `scripts.html`, `styles.html`, `preview.html` e testes correspondentes.
- Dashboard analítico: `dashboard-analytics/Config.gs`, leitura e testes dependentes do contrato de `Respostas`/`Monitoramento`.
- Documentação de implantação e contexto do projeto.

## Critérios de aceite

- Dados históricos permanecem acessíveis no PWA como `v1`.
- Nova demanda `v2` é gravada diretamente, sem Tally.
- A frequência pretendida aceita somente inteiros de 1 a 7.
- Uma mudança futura de questionário não altera respostas históricas nem quebra a leitura.
- Um envio repetido após falha não duplica demandas.
- O PWA é confortável em celulares e recupera rascunhos recentes por seis horas.
