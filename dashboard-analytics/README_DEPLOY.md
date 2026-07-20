# Dashboard Gerencial de Prescrições

Segundo web app Google Apps Script, independente do app operacional. Os dois projetos usam a mesma planilha oficial, mas possuem código, URL, cache e implantação separados.

## Responsabilidade de cada projeto

- PWA de anamnese: escreve em `Respostas`.
- `Respostas – legado Tally`: permanece apenas como histórico e não é lida pelo dashboard.
- App operacional: sincroniza e atualiza `Monitoramento`.
- Dashboard gerencial: lê essas duas abas, escreve snapshots agregados em `Analytics_Historico` e, exclusivamente pelo comando confirmado de exclusão, remove uma demanda de `Respostas` e `Monitoramento` pelo `ID da demanda`.

Fora essa exclusão explícita, o dashboard nunca formata, limpa ou reordena `Respostas` e `Monitoramento`. Cada exclusão registra somente ID, data/hora, motivo e origem em `Analytics_Exclusoes`; não copia respostas clínicas nem telefone. A ligação entre as fontes é feita por `ID da demanda`.

## Arquivos que entram no novo projeto Apps Script

Crie no segundo projeto os arquivos com estes nomes e copie seus conteúdos:

### Scripts

- `Código.gs`
- `Config.gs`
- `Dados.gs`
- `Metricas.gs`
- `Historico.gs`
- `Cache.gs`
- `Questionario.gs`
- `Exclusoes.gs`

### HTML

- `index.html`
- `styles.html`
- `charts.html`
- `scripts.html`

### Manifesto

- `appsscript.json`

`preview.html`, `tests/` e `scripts/build-preview.js` são ferramentas locais e não precisam ser copiados para o Apps Script.

## Como criar o segundo espaço

1. Abra [script.google.com](https://script.google.com/).
2. Clique em **Novo projeto**. Não abra nem substitua o projeto do app operacional.
3. Renomeie o novo projeto para **Dashboard Gerencial de Prescrições**.
4. No editor, renomeie o primeiro arquivo para `Código.gs` e crie os demais arquivos listados acima.
5. Em **Configurações do projeto**, ative **Mostrar o arquivo de manifesto appsscript.json no editor**.
6. Substitua o manifesto pelo conteúdo de `dashboard-analytics/appsscript.json`.
7. Salve o projeto.

Ter dois projetos Apps Script não cria conflito: ambos apenas apontam para o mesmo ID de planilha. A separação está nas responsabilidades de escrita descritas acima.

## Configuração única

1. No seletor de funções do novo projeto, escolha `configurarDashboardAnalytics`.
2. Clique em **Executar**.
3. Autorize o acesso à planilha e a criação do gatilho quando o Google solicitar.
4. Aguarde o resultado com `ok: true` no registro de execução.
5. Execute `validarDashboardAnalytics` e confirme:
   - `ok: true`;
   - `fontes.respostas: true`;
   - `fontes.monitoramento: true`;
   - `fontes.historico: true`;
   - `gatilho.instalado: true`.

Essa configuração é idempotente: pode ser executada novamente sem duplicar o gatilho ou o snapshot do mesmo dia/profissional.

Ela cria e formata somente a aba `Analytics_Historico`, registra o primeiro snapshot agregado e instala um gatilho diário entre 23h e 0h no fuso `America/Fortaleza`.

## Se a planilha oficial ainda estiver em transição

Caso a função retorne `ok: false`, leia a lista `erros`. Se `Monitoramento` estiver ausente ou com cabeçalhos incompatíveis:

1. conclua a configuração/migração do app operacional na planilha oficial;
2. confirme que as abas se chamam exatamente `Respostas` e `Monitoramento`;
3. execute `configurarDashboardAnalytics` novamente.

Não tente corrigir as abas pelo dashboard. Esse bloqueio intencional evita que um projeto sobrescreva a estrutura do outro.

## Implantação independente

1. Clique em **Implantar > Nova implantação**.
2. Em tipo, escolha **Aplicativo da Web**.
3. Use uma descrição como `Dashboard gerencial v1`.
4. Em **Executar como**, escolha **Eu** (proprietário do projeto).
5. Em **Quem pode acessar**, escolha apenas o grupo adequado à gestão da empresa.
6. Clique em **Implantar**, autorize se solicitado e copie a nova URL.

Essa URL é diferente da URL do app operacional. Em alterações futuras, use **Implantar > Gerenciar implantações > Editar > Nova versão** para preservar o mesmo endereço.

## Uso cotidiano

- Ao abrir, o app usa cache próprio por até 10 minutos para acelerar a primeira tela.
- O botão **Atualizar dados** ignora o cache, relê as fontes e atualiza o snapshot do dia.
- O gatilho diário mantém a evolução de backlog e produtividade registrada mesmo quando ninguém abre o app.
- A visão padrão de Acompanhamento é **A fazer**, combinação de demandas não transferidas e aguardando prescrição.
- Na aba **Acompanhamento**, clique em qualquer cartão ou em **Ver anamnese** para abrir a ficha completa do aluno em um pop-up.
- No pop-up, o ícone verde abre a conversa de WhatsApp quando a anamnese tiver um número válido. O número não aparece no dashboard e o comando existe apenas neste projeto gerencial.
- O ícone vermelho exclui a demanda de `Respostas` e a respectiva linha de `Monitoramento`. É irreversível no fluxo do app: o gestor precisa digitar `EXCLUIR` e pode registrar um motivo. O ID, a data/hora, o motivo e a origem ficam em `Analytics_Exclusoes`.
- A ficha é buscada por `ID da demanda` somente no primeiro acesso e reaproveitada em memória enquanto a página permanecer aberta.
- Essa consulta é somente de leitura: abrir a ficha não altera `Respostas`, `Monitoramento` nem o histórico analítico.
- A exclusão não altera snapshots já existentes em `Analytics_Historico`; eles são registros agregados do momento em que foram criados.

## Administração do questionário

A aba **Questionário** edita versões da anamnese. Antes de usá-la, publique o PWA dos prescritores com o arquivo raiz `Questionario.gs` e execute **Preparar base versionada**. A rotina acrescenta metadados ao catálogo, sem alterar respostas históricas.

A versão ativa não é editada: o gestor cria uma cópia como rascunho, trabalha localmente, salva quando desejar e só troca o formulário dos prescritores em **Publicar versão**. Os campos `Profissional`, `Nome completo` e `WhatsApp` são obrigatórios e protegidos; não edite linhas da aba `Questionário` manualmente.

## Limites conhecidos da análise

- O histórico de etapas começa na data em que este dashboard for configurado. Estados passados não são inventados.
- Sem uma data de transferência, não é possível medir separadamente o tempo entre transferência e prescrição.
- Médias, medianas e P75 com menos de cinco conclusões são sinalizados como amostra pequena.
- Uma resposta existente em `Respostas`, mas ainda ausente em `Monitoramento`, é considerada não transferida em memória; a fonte não é alterada.

## Verificação local

Na pasta raiz do workspace:

```bash
node dashboard-analytics/scripts/build-preview.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Abra `dashboard-analytics/preview.html` para revisar a interface com dados totalmente sintéticos.
