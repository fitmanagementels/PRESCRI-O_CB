# Migração do App 1 para a planilha oficial

## Objetivo

Fazer o App 1 usar exclusivamente a planilha oficial `Anamnese CB by XSTEAM - Treino Personalizado`, identificada por `1swfX2KCs9Rts781UhzJnlRTjlmGmIMiquqtatAQoUOk`, preservando o comportamento atual do frontend e impedindo a exibição temporária de dados da base piloto.

## Estrutura confirmada da planilha

- `Respostas` (`sheetId: 0`): 40 colunas e cabeçalhos compatíveis com o backend atual.
- `Monitoramento` (`sheetId: 1438553011`): aba existente, atualmente sem cabeçalhos nem registros.
- `Complementar` (`sheetId: 1070137667`): fora do escopo desta migração e não acessada pelo App 1.
- Localidade: `pt_BR`.
- Fuso atual da planilha: `Etc/GMT`.

Os quatro campos obrigatórios da aba `Respostas` foram confirmados: `Submission ID`, `Submitted at`, `Nome do Profissional ` e `Nome completo`. A normalização existente remove o espaço excedente do cabeçalho do profissional.

## Solução aprovada

### Configuração da base

O valor `PRESCRICAO_CONFIG.spreadsheetId` será substituído pelo ID oficial. Os nomes `Respostas` e `Monitoramento` continuarão explícitos na configuração. Nenhuma referência à aba `Complementar` será adicionada.

### Isolamento do cache

A chave do `CacheService` receberá uma nova versão própria da base oficial. Assim, uma execução recém-publicada não poderá devolver o payload armazenado da planilha piloto durante os primeiros minutos.

### Inicialização de `Monitoramento`

Todo fluxo que monta o payload principal deverá obter `Monitoramento` por `garantirEstruturaMonitoramento_`, e não por uma leitura obrigatória direta. Como a aba oficial está vazia, a primeira execução autorizada criará os oito cabeçalhos operacionais, formatação, checkboxes, formatos de data e filtro.

Os oito campos são:

1. `Submission ID`
2. `Data da anamnese`
3. `Aluno`
4. `Profissional`
5. `Anamnese transferida?`
6. `Treino prescrito?`
7. `Data da prescrição`
8. `Atualizado em`

Depois da inicialização, a sincronização copiará para `Monitoramento` somente os metadados necessários dos registros de `Respostas`. O conteúdo da anamnese continuará somente em `Respostas`.

### Validação operacional

`validarBackendPrescricoes` continuará sendo a verificação manual de ponta a ponta e passará a informar também a identificação da planilha e das abas utilizadas. A validação deve falhar com uma mensagem explícita se a planilha não puder ser aberta, se `Respostas` não existir ou se algum cabeçalho obrigatório estiver ausente.

O app continuará escrevendo exclusivamente em `Monitoramento`. `Respostas` será somente leitura e `Complementar` não será lida nem modificada.

## Fluxo de dados

1. O navegador chama `getDadosPrescricoes`.
2. O backend abre a planilha oficial pelo ID fixo.
3. O backend valida `Respostas` e garante a estrutura de `Monitoramento`.
4. O backend combina as respostas com o estado operacional, gera o payload e o salva na nova chave de cache.
5. O botão `Atualizar` sincroniza novos `Submission ID` antes de devolver o payload.
6. As alterações de transferência e prescrição atualizam apenas as colunas E:H de `Monitoramento`.

## Fuso horário

O projeto Apps Script e a formatação do backend usam `America/Fortaleza`. A planilha oficial está configurada como `Etc/GMT`. A implantação deverá incluir a alteração manual do fuso da planilha para `America/Fortaleza` ou uma opção equivalente de GMT-03:00 nas configurações da planilha, evitando diferenças de data e hora entre respostas, filtros e contagem de dias.

## Testes e critérios de aceitação

- O backend contém exatamente o ID da planilha oficial e não contém mais o ID piloto.
- A chave de cache oficial difere da chave usada com a base piloto.
- O carregamento principal usa `garantirEstruturaMonitoramento_`.
- A aba `Complementar` não aparece no código do App 1.
- Os cabeçalhos reais da aba `Respostas` são aceitos.
- Uma aba `Monitoramento` vazia é inicializada antes da primeira leitura.
- Os testes automatizados existentes continuam passando.
- Após autorização no Apps Script, `validarBackendPrescricoes` devolve `ok: true` e o total de registros da base oficial.
- Após nova implantação, a interface lista os alunos da planilha oficial e permite salvar o estado operacional.

## Implantação e responsabilidades do usuário

Depois da atualização dos arquivos, o usuário deverá copiar/sincronizar o código com o projeto Apps Script, executar a validação manual uma vez para conceder permissões, conferir a criação da estrutura de `Monitoramento`, ajustar o fuso da planilha e publicar uma nova versão da implantação do app da web. A URL só permanece a mesma quando a implantação existente é editada para apontar para uma nova versão.

## Fora do escopo

- Funções futuras da aba `Complementar`.
- Alterações visuais no App 1.
- Migração de estados operacionais da planilha piloto.
- Alterações no formulário que alimenta `Respostas`.
