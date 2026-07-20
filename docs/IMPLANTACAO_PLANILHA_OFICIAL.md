# Implantação do App 1 com a planilha oficial

## Base oficial confirmada

- Planilha: `Anamnese CB by XSTEAM - Treino Personalizado`
- URL: <https://docs.google.com/spreadsheets/d/1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk/edit>
- ID: `1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk`
- Entrada somente leitura: `Respostas`
- Estado operacional do app: `Monitoramento`
- Fora do escopo do App 1: `Complementar`

## 1. Ajustar o fuso da planilha oficial

A planilha está atualmente configurada como `Etc/GMT`, enquanto o app usa `America/Fortaleza`.

1. Abra a planilha oficial.
2. Acesse **Arquivo → Configurações**.
3. Mantenha a localidade como **Brasil**.
4. Em fuso horário, escolha **GMT-03:00**, preferencialmente **Fortaleza** ou **Brasília/São Paulo**.
5. Salve as configurações.

Esse ajuste evita diferenças na data da anamnese, no filtro por período e na contagem de dias até a prescrição.

## 2. Confirmar a conta que executará o app

A conta proprietária da implantação do Apps Script precisa ter permissão de **Editor** na planilha oficial. Se a planilha pertencer a outra conta, compartilhe-a com a conta que publica o app antes de continuar.

Para evitar conceder acesso direto à base para todos os profissionais, a configuração recomendada da implantação é:

- **Executar como:** você, proprietário do script.
- **Quem pode acessar:** somente as contas autorizadas da equipe.

Não publique como acesso público irrestrito, pois o app pode atualizar o estado das prescrições.

## 3. Atualizar os arquivos no projeto Apps Script

No projeto Apps Script que já publica o App 1, substitua o conteúdo de `Código.gs` pela versão local atualizada. Esse é o único arquivo funcional alterado nesta migração da base.

Se o projeto on-line ainda não recebeu os ajustes visuais feitos anteriormente, sincronize também `index.html`, `styles.html` e `scripts.html`. O manifesto `appsscript.json` só precisa ser copiado caso seja gerenciado manualmente no editor.

No início de `Código.gs`, confirme:

```js
spreadsheetId: '1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk',
abaRespostas: 'Respostas',
abaMonitoramento: 'Monitoramento',
timeZone: 'America/Fortaleza',
cachePayloadKey: 'prescricoes_payload_oficial_v1',
```

Não adicione `Complementar` à configuração do App 1.

## 4. Conferir o fuso do projeto Apps Script

1. No editor do Apps Script, abra **Configurações do projeto**.
2. Confirme o fuso horário **America/Fortaleza** ou **GMT-03:00**.
3. Se o arquivo `appsscript.json` estiver visível, confirme:

```json
"timeZone": "America/Fortaleza"
```

## 5. Autorizar e inicializar a base oficial

1. No editor do Apps Script, selecione a função `validarBackendPrescricoes`.
2. Clique em **Executar**.
3. Na primeira execução, clique em **Revisar permissões**.
4. Escolha a conta que possui acesso de edição à planilha oficial.
5. Autorize o script a acessar e modificar as planilhas necessárias.
6. Aguarde a conclusão sem erro.
7. Abra o **Registro de execução** e expanda o valor retornado.

O retorno correto deve conter:

```text
ok: true
baseDados.spreadsheetId: 1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk
baseDados.abaRespostas: Respostas
baseDados.abaMonitoramento: Monitoramento
```

Essa primeira execução cria a estrutura da aba `Monitoramento` e sincroniza os alunos existentes.

## 6. Conferir a aba Monitoramento

Na planilha oficial, abra `Monitoramento` e confirme `A1:H1`:

| Coluna | Cabeçalho |
|---|---|
| A | Submission ID |
| B | Data da anamnese |
| C | Aluno |
| D | Profissional |
| E | Anamnese transferida? |
| F | Treino prescrito? |
| G | Data da prescrição |
| H | Atualizado em |

Também confirme:

- uma linha para cada `Submission ID` de `Respostas`;
- checkboxes nas colunas E e F;
- filtro na linha 1;
- datas formatadas nas colunas B, G e H.

Não renomeie esses oito cabeçalhos e não insira colunas entre A e H.

## 7. Publicar uma nova versão mantendo a URL atual

1. No editor do Apps Script, clique em **Implantar → Gerenciar implantações**.
2. Localize a implantação atual do App 1.
3. Clique no ícone de edição.
4. Em versão, escolha **Nova versão**.
5. Use uma descrição como `Base oficial CB Fitness`.
6. Confirme **Executar como: você**.
7. Restrinja o acesso às contas que realmente usarão o app.
8. Clique em **Implantar**.

Ao editar a implantação existente, a URL do app permanece a mesma. Criar uma implantação separada gera outra URL.

## 8. Teste final no app publicado

Abra a URL publicada em uma janela anônima ou em outro dispositivo autorizado e faça este teste:

1. Confirme que aparecem alunos da planilha oficial.
2. Pesquise um aluno pelo nome.
3. Abra seu card e confira os dados da anamnese.
4. Clique em **Atualizar** e confira que a tela permanece conectada.
5. Em um registro de teste, altere `Anamnese transferida` e clique em **Salvar**.
6. Confira a mesma linha na aba `Monitoramento`.
7. Se testar `Treino prescrito`, marque primeiro `Anamnese transferida` e informe a data da prescrição.

Evite usar um aluno real para o primeiro teste de escrita se ainda houver um registro criado especificamente para testes.

## Diagnóstico de erros comuns

### `Aba não encontrada: Respostas`

O nome da aba precisa ser exatamente `Respostas`. Não use espaços antes ou depois do nome.

### `Cabeçalho obrigatório não encontrado em Respostas`

Confirme a linha 1 e preserve estes nomes: `Submission ID`, `Submitted at`, `Nome do Profissional` e `Nome completo`. O app tolera espaços excedentes e diferenças de acentuação/maiúsculas, mas não a ausência do campo.

### `Estrutura inválida em Monitoramento`

Confira `Monitoramento!A1:H1` conforme a tabela acima. O app inicializa uma aba totalmente vazia, mas não sobrescreve silenciosamente uma estrutura parcialmente preenchida ou alterada.

### Erro de autorização ou acesso à planilha

Confirme que a conta que executa a implantação é **Editora** da planilha oficial. Depois, execute novamente `validarBackendPrescricoes` no editor e conclua a autorização.

### App ainda exibe dados antigos

Confirme que foi publicada uma **nova versão** da implantação existente e que `Código.gs` contém `prescricoes_payload_oficial_v1`. Feche completamente a aba do navegador e abra a URL novamente.

### Salvar não funciona para um aluno

Clique primeiro em **Atualizar** para sincronizar novos `Submission ID`. Se o erro continuar, confirme se o ID existe em `Respostas` e se não foi duplicado manualmente em `Monitoramento`.
