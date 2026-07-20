# Editor de questionário no PWA do gestor

**Data:** 2026-07-20  
**Status:** desenho aprovado; aguardando revisão desta especificação antes do plano de implementação.

## Objetivo

Adicionar ao PWA de gestão de prescrições uma aba para consultar e administrar o questionário usado no PWA dos prescritores. A interface deve permitir criar e editar uma próxima versão do formulário com segurança, sem alterar anamneses já enviadas e sem exigir que a pessoa gestora entenda a estrutura técnica da planilha.

## Princípios de uso

- Há sempre **uma única versão ativa** do questionário para novas anamneses.
- A versão ativa não é editada diretamente. Uma edição começa por uma cópia dela, criada como rascunho da próxima versão.
- Respostas existentes permanecem vinculadas à versão com a qual foram enviadas.
- A tela mostra nomes, versões e estados legíveis; IDs internos não aparecem como ação principal para a pessoa usuária.
- Não haverá lógica condicional de perguntas nesta etapa. Toda pergunta ativa é mostrada para toda anamnese da respectiva versão.
- Não haverá arrastar e soltar. Reordenação e movimentação serão ações explícitas, para reduzir alterações acidentais.
- A versão `v2` também deixa de aplicar as condicionais legadas de dor e assimetria; a partir desta entrega, todas as perguntas de uma versão aparecem para todas as pessoas que preenchem a anamnese.

## Modelo de dados e versões

O catálogo `Questionário` continua a ser a fonte oficial da estrutura do formulário. A evolução prevista adiciona identidade e estado de versão, sem mudar as respostas já gravadas em `Respostas`.

| Conceito | Papel | Exemplo visível |
| --- | --- | --- |
| Questionário | Identidade estável do formulário | Anamnese inicial |
| Versão | Conjunto fechado de etapas e perguntas | Versão 2 |
| Estado da versão | Define o uso operacional | Em uso, Rascunho, Arquivada |
| Demanda | Uma anamnese enviada | ID da demanda |

O identificador técnico do questionário e os códigos estáveis das perguntas continuam sendo usados pelo backend. A gestão visual trabalha prioritariamente com nome, versão e estado.

### Regras de publicação

1. `Criar nova versão` duplica integralmente a versão ativa: etapas, ordem, perguntas, tipos, opções e obrigatoriedade.
2. A cópia recebe o estado `Rascunho` e a próxima numeração de versão.
3. Apenas o rascunho pode ser alterado.
4. `Publicar versão` valida o rascunho; se estiver válido, ele se torna `Em uso` e a versão antes ativa se torna `Arquivada`.
5. O sistema impede dois estados `Em uso` ao mesmo tempo.
6. Nenhuma operação do editor modifica perguntas ou respostas de versões arquivadas.

## Nova aba: Questionário

A navegação principal do PWA do gestor receberá a aba `Questionário`. Ela tem duas áreas de leitura simples:

1. **Em uso agora:** nome do questionário, versão ativa, quantidade de etapas e perguntas, data de publicação e ação `Criar nova versão`.
2. **Rascunho em edição:** aparece quando houver rascunho. Exibe estado local, última alteração salva e as ações `Editar rascunho`, `Salvar rascunho` e `Publicar versão`.
3. **Versões anteriores:** lista compacta de versões arquivadas, somente para consulta.

O botão principal em uma versão ativa é sempre `Criar nova versão`; não existe a ação ambígua `Editar versão ativa`.

## Editor de rascunho

O editor organiza perguntas em etapas, que correspondem às telas/blocos de navegação do formulário no PWA dos prescritores. A etapa final `Revisar e enviar` é de sistema e não aparece como etapa editável.

Cada etapa apresenta nome, posição e suas perguntas. A pessoa gestora poderá:

- criar, renomear, reposicionar e excluir etapas;
- criar, editar, reposicionar, mover e excluir perguntas;
- alterar o texto, tipo, obrigatoriedade e opções de cada pergunta;
- salvar o rascunho ou publicá-lo após revisão.

Os tipos iniciais são: texto curto, texto longo, número, data, sim ou não, escolha única e múltipla escolha. `Número` é entrada numérica; seleção em lista é um tipo de escolha única, não o tipo número.

Três campos operacionais permanecem protegidos no editor: `profissional`, `nomeCompleto` e `whatsapp`. Eles não podem ser removidos, duplicados ou ter seus tipos especiais alterados; todos são obrigatórios. Seus rótulos e etapas continuam editáveis. O WhatsApp passa a ser requerido porque o gestor poderá abrir uma conversa pelo link seguro associado à demanda.

### Movimentação deliberada

Não há arrastar e soltar. O menu de cada pergunta contém `Mover para etapa…`, que abre a lista de etapas existentes. Reordenar perguntas ou etapas usa ações explícitas de mover para cima/baixo ou uma seleção de posição. Assim, o mesmo fluxo funciona em desktop e mobile sem risco de arrasto acidental.

### Exclusão de etapa

É permitido excluir uma etapa com suas perguntas. A interface exige confirmação forte e informa exatamente o impacto antes de concluir:

> Excluir “Objetivo e rotina”? As 3 perguntas desta etapa também serão apagadas deste rascunho. Esta ação não afeta anamneses já enviadas.

O botão destrutivo usa um rótulo inequívoco, como `Excluir etapa e 3 perguntas`. A exclusão só muda o rascunho; uma versão publicada anterior não é afetada.

## Fluidez e persistência

As alterações de edição ocorrem primeiro no estado local do navegador. Criar, renomear, mover, editar ou excluir etapas/perguntas não chama a planilha. Uma cópia local do rascunho no navegador protege contra recarga acidental ou fechamento da página.

As únicas chamadas de escrita à base são:

- `Salvar rascunho`, que grava a versão ainda não publicada;
- `Publicar versão`, que valida e troca a versão ativa em uma operação protegida no backend.

Ao abrir a aba, o app reconcilia o estado local com o rascunho salvo mais recente. Se houver conflito, o app informa a diferença e nunca sobrescreve silenciosamente o rascunho salvo.

## Prevenção de duplicidade e feedback de ações

Todo botão que chama o backend para alterar dados entra em estado pendente até a resposta ser recebida: fica desabilitado, muda para um rótulo como `Salvando…` ou `Publicando…` e apresenta indicador visual de progresso. Em erro, o botão volta ao estado normal e o rascunho local continua disponível para nova tentativa.

Esta convenção também se aplica às ações de escrita dos dois PWAs: envio de anamnese, salvar a prescrição, alterar estados operacionais, criar/publicar versões e atualização manual de dados quando a atualização aciona uma operação concorrente. Filtros, navegação, expansão de blocos e outras ações sem escrita não devem ser bloqueados.

No backend, publicações e envios usam bloqueio de concorrência e identificadores/versões esperados para que uma repetição por rede, recarga ou toque duplo não grave uma alteração duplicada.

## Contato por WhatsApp

Cada demanda exibida no PWA do gestor terá uma ação secundária `WhatsApp` quando houver número válido. Ela abre `https://wa.me/<numero-normalizado>` em nova aba, sem enviar mensagem automaticamente e sem texto pré-preenchido nesta entrega. A normalização remove símbolos e aplica o código do Brasil (`55`) apenas quando o número não o possuir. Se o valor estiver ausente ou inválido, o botão não é exibido; a origem desse caso deve ser apenas o histórico anterior, pois o campo será obrigatório nas novas versões.

## Validações antes de publicar

Um rascunho só pode ser publicado se:

- houver pelo menos uma etapa editável;
- cada etapa tiver ao menos uma pergunta;
- toda pergunta tiver texto e tipo válidos;
- perguntas de escolha única ou múltipla escolha tiverem ao menos duas opções não vazias e sem duplicidade;
- a ordem de etapas e perguntas estiver completa;
- não houver outra versão ativa fora da transação de publicação.

Erros aparecem próximos ao item correspondente e em um resumo antes da publicação. O rascunho pode continuar salvo com itens incompletos, mas não pode ser publicado até a correção.

## Limites desta entrega

Ficam fora deste escopo:

- regras condicionais entre perguntas;
- mais de uma versão ativa;
- arrastar e soltar;
- edição de respostas já enviadas;
- substituição da planilha como fonte de verdade;
- alterações na aba `Complementar`.

## Verificação prevista

1. Abrir a aba e confirmar uma única versão ativa e versões antigas somente leitura.
2. Criar um rascunho que replique integralmente a versão ativa.
3. Criar, renomear, mover e excluir etapas/perguntas; confirmar que nenhuma chamada à planilha ocorre antes do salvamento.
4. Excluir uma etapa com perguntas e conferir o texto da confirmação.
5. Recarregar antes de salvar e recuperar o rascunho local.
6. Salvar o rascunho e recarregar; conferir persistência na fonte oficial.
7. Tentar publicar com campos inválidos e conferir bloqueio detalhado.
8. Publicar rascunho válido; conferir troca atômica de versão ativa e manutenção das respostas históricas.
9. Simular chamada lenta/falha e verificar botão bloqueado, prevenção de toque duplo e preservação do rascunho.
10. Confirmar que as perguntas condicionais legadas da v2 aparecem sempre e que toda nova versão também não contém condicionais.
11. Confirmar que WhatsApp é obrigatório no editor e que uma demanda com número válido abre a conversa correta pelo link `wa.me`.
