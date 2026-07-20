# Implantação — anamnese versionada no PWA

## Nova base oficial

- Planilha: `BASE_PRESCRIÇÃO_CB — PWA`
- URL: <https://docs.google.com/spreadsheets/d/1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs/edit>
- ID: `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`
- Fuso: `America/Fortaleza`

## Estado já preparado

- `Respostas – legado Tally`: cópia inalterada da exportação original.
- `Respostas`: 35 demandas históricas migradas como `Origem = Tally` e `Versão do questionário = v1`.
- `Questionário`: catálogo das versões `v1` e `v2`.
- `Monitoramento`: preservado e com a chave renomeada para `ID da demanda`.
- `Complementar`: mantida sem alterações; `Nome`, `Turno`, `Whatsapp` e `Status` definem os profissionais disponíveis no formulário.

## Publicar o PWA

1. No projeto Apps Script do PWA, substitua os arquivos pelo conteúdo local atualizado:
   - `Código.gs`
   - `Questionario.gs`
   - `index.html`
   - `styles.html`
   - `scripts.html`
   - `appsscript.json`
2. Confirme que `PRESCRICAO_CONFIG.spreadsheetId` é o ID desta nova base.
3. Em **Implantar → Gerenciar implantações**, publique uma nova versão da implantação atual.
4. Mantenha o acesso para qualquer pessoa conectada a uma conta Google, conforme decidido.
5. No primeiro acesso, abra **Adicionar demanda** e confira que só aparecem profissionais com `Status = Ativo` em `Complementar`.

## Editor de questionário no PWA do gestor

1. Publique primeiro o PWA dos prescritores contendo `Questionario.gs` e execute **Prescrições → Preparar base versionada** uma vez. Isso acrescenta ao catálogo os metadados de versão, etapas e perguntas sem modificar respostas já enviadas.
2. No projeto Apps Script do gestor, copie também `dashboard-analytics/Questionario.gs` e os arquivos atualizados do dashboard; então publique uma nova versão da implantação atual.
3. No gestor, abra **Questionário**. A versão em uso é somente leitura; use **Criar nova versão** para editar uma cópia local.
4. Apenas **Salvar rascunho** e **Publicar versão** escrevem na planilha. A publicação arquiva a versão anterior e ativa a nova em uma única operação.

Os campos `Profissional`, `Nome completo` e `WhatsApp` são obrigatórios e protegidos. O WhatsApp abre somente uma conversa por link no gestor; o app não envia mensagens automaticamente.

## Autonomia da base

Depois de publicar o `Código.gs`, a própria planilha passa a ter o menu **Prescrições** com duas operações administrativas:

- **Validar base versionada**: apenas verifica as abas, os cabeçalhos e as versões disponíveis; não modifica dados.
- **Preparar base versionada**: operação idempotente. Cria as abas ausentes, acrescenta cabeçalhos novos sem mexer nas colunas existentes e registra perguntas ausentes no catálogo.

Se for executada em uma cópia ainda no formato do Tally, a rotina renomeia a aba original para `Respostas – legado Tally`, cria a `Respostas` canônica e migra as linhas como `v1`, preservando o ID original. Se encontrar uma estrutura ambígua ou uma aba de legado já existente, ela interrompe antes de alterar dados.

Para uma futura mudança de questionário, acrescente a nova versão/campo no código, publique e execute **Preparar base versionada**. As respostas antigas continuam nas mesmas linhas, identificadas pela versão que as criou; não se deve apagar nem renomear colunas já usadas.

## Publicar o dashboard analítico

1. No projeto independente do dashboard, atualize `Config.gs` e `Dados.gs` com a versão local de `dashboard-analytics/`.
2. Publique uma nova versão do dashboard.
3. Confirme que registros `v1` continuam visíveis e que uma demanda nova aparece depois de atualizar.

## Teste de aceite

1. Em celular, abrir **Adicionar demanda** e preencher até metade.
2. Fechar ou recarregar a página dentro de seis horas; conferir retomada do rascunho.
3. Confirmar que a etapa 7, **Revisar e enviar**, aparece somente após a conclusão das seis etapas de perguntas.
4. Concluir a anamnese com frequência pretendida entre 1 e 7 usando o seletor no tema escuro do app.
5. Conferir uma nova linha `v2` em `Respostas` e a linha correspondente em `Monitoramento` com ambos os checkboxes desmarcados.
6. Tocar em enviar novamente após uma falha simulada; o `ID da tentativa` deve impedir duplicação.
7. Só após este teste, desativar a integração do Tally. A planilha original deve permanecer guardada como arquivo histórico.
