# Implantação — anamnese versionada no PWA

## Nova base oficial

- Planilha: `BASE_PRESCRIÇÃO_CB — PWA`
- URL: <https://docs.google.com/spreadsheets/d/1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs/edit>
- ID: `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`
- Fuso: `America/Fortaleza`

## Estado e objetivo desta implantação

- `Respostas – legado Tally`: cópia inalterada da exportação original.
- `Respostas`: 35 demandas históricas migradas como `Origem = Tally` e `Versão do questionário = v1`.
- `Questionário`: preserva `v1` e `v2`; o código desta entrega prepara e ativa a nova `v3`.
- `Monitoramento`: preservado e com a chave renomeada para `ID da demanda`.
- `Complementar`: mantida sem alterações; `Nome`, `Turno`, `Whatsapp` e `Status` definem os profissionais disponíveis no formulário.

Esta entrega transforma a ordem aprovada nos seis blocos na ordem principal, converte os campos equivalentes em seleções no padrão Tally e mantém a etapa 7 exclusivamente para revisão e envio. Nenhuma resposta histórica ou coluna física de `Respostas` é reordenada.

## Publicar e ativar a v3

1. No projeto Apps Script do PWA, substitua os arquivos pelo conteúdo local atualizado:
   - `Código.gs`
   - `Questionario.gs`
   - `index.html`
   - `styles.html`
   - `scripts.html`
   - `appsscript.json`
2. Confirme que `PRESCRICAO_CONFIG.spreadsheetId` é o ID desta nova base.
3. Salve o projeto e teste a URL `/dev`. Neste ponto o catálogo ainda pode continuar com a versão anterior ativa.
4. Em **Implantar → Gerenciar implantações**, publique uma nova versão da implantação existente, preservando a URL oficial.
5. Na planilha, use **Prescrições → Preparar e ativar anamnese v3**. A operação valida as 28 perguntas e suas opções antes de arquivar a versão anterior e ativar a `v3`.
6. Execute **Prescrições → Validar base versionada** e confirme que há exatamente uma versão ativa e que ela é `v3`.
7. Mantenha o acesso para qualquer pessoa conectada a uma conta Google, conforme decidido.
8. Abra **Adicionar demanda** e confira que só aparecem profissionais com `Status = Ativo` em `Complementar`.

O PWA do gestor não participa desta alteração. Não use o editor de questionário do gestor para preparar, editar ou publicar a `v3`.

## Autonomia da base

Depois de publicar o `Código.gs`, a própria planilha passa a ter o menu **Prescrições** com três operações administrativas:

- **Validar base versionada**: apenas verifica as abas, os cabeçalhos e as versões disponíveis; não modifica dados.
- **Preparar base versionada**: operação idempotente. Cria as abas ausentes, acrescenta cabeçalhos novos sem mexer nas colunas existentes e registra perguntas ausentes no catálogo.
- **Preparar e ativar anamnese v3**: registra a `v3` como rascunho, valida estrutura/tipos/opções e troca a versão ativa em uma única operação protegida por lock.

Se for executada em uma cópia ainda no formato do Tally, a rotina renomeia a aba original para `Respostas – legado Tally`, cria a `Respostas` canônica e migra as linhas como `v1`, preservando o ID original. Se encontrar uma estrutura ambígua ou uma aba de legado já existente, ela interrompe antes de alterar dados.

Para uma futura mudança de questionário, acrescente uma nova versão no código, publique e execute a preparação correspondente. As respostas antigas continuam nas mesmas linhas, identificadas pela versão que as criou; não se deve apagar nem renomear colunas já usadas.

## Publicar o dashboard analítico

1. No projeto independente do dashboard, atualize `Config.gs` e `Dados.gs` com a versão local de `dashboard-analytics/`.
2. Publique uma nova versão do dashboard.
3. Confirme que registros `v1` continuam visíveis e que uma demanda nova aparece depois de atualizar.

## Teste de aceite

1. Em celular, abrir **Adicionar demanda** e preencher até metade.
2. Fechar ou recarregar a página dentro de seis horas; conferir retomada do rascunho.
3. Confirmar que a etapa 7, **Revisar e enviar**, aparece somente após a conclusão das seis etapas de perguntas.
4. Testar uma escolha com `Outro`, preenchendo o complemento, e a múltipla escolha de movimentos; confirmar que `Nenhum` não permanece marcado junto com outra opção.
5. Concluir a anamnese com frequência pretendida entre 1 e 7 usando o seletor no tema escuro do app.
6. Conferir uma nova linha `v3` em `Respostas`, inclusive `Outro: texto` e múltiplos valores separados por ` | ` quando usados.
7. Conferir a linha correspondente em `Monitoramento` com ambos os checkboxes desmarcados.
8. Tocar em enviar novamente após uma falha simulada; o `ID da tentativa` deve impedir duplicação.
9. Confirmar que respostas `v1` e `v2` continuam visíveis e inalteradas.
10. Só após este teste, desativar qualquer integração remanescente do Tally. A planilha original deve permanecer guardada como arquivo histórico.

## Reversão segura

Se a `v3` falhar antes de receber respostas reais, restaure no catálogo exatamente uma versão anterior válida como `Ativa`, marque a `v3` como `Arquivada`, limpe o cache do script e publique novamente a versão anterior do Apps Script. Não apague linhas do catálogo nem respostas históricas.

Se já houver respostas `v3`, preserve-as. A reversão muda apenas qual catálogo atende novas anamneses; não reclassifique registros `v3` como `v2`.
