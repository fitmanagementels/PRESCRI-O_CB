# Menus suspensos tematizados do dashboard gerencial

## Objetivo

Substituir os menus nativos visíveis do PWA de gestão de prescrições por componentes próprios, para que a lista aberta siga o tema escuro, as bordas azuladas e os destaques verde-limão do dashboard em desktop e mobile.

## Problema confirmado

Os campos `<select>` fechados já recebem parte do tema via CSS. Entretanto, a lista de opções aberta é renderizada pelo navegador e pelo sistema operacional; no Chrome, isso resulta no menu azul claro padrão mostrado nas capturas. Esse popup nativo não pode receber uma identidade visual confiável com CSS.

## Escopo

Todos os menus suspensos do dashboard serão tematizados:

1. Período global (`periodFilter`)
2. Profissional global (`professionalFilter`)
3. Situação da fila (`situationFilter`)
4. Prazo da fila (`deadlineFilter`)
5. Ordenação da produtividade (`rankingSort`)

O campo de busca, os cartões, gráficos, filtros existentes, regras analíticas, fontes de dados e abas da planilha não serão modificados.

## Arquitetura

Cada `<select>` continuará no DOM como fonte de valor e compatibilidade. Um componente visual associado apresentará:

- botão com o rótulo da opção selecionada e ícone de seta;
- lista flutuante própria com as opções equivalentes;
- realce da opção selecionada, hover e foco com os tokens do tema;
- fechamento ao escolher uma opção, pressionar Escape ou clicar/tocar fora;
- atualização da opção visual quando o código atual preencher ou mudar o `<select>`;
- posicionamento acima do menu de navegação fixa quando necessário em telas pequenas.

O `<select>` original ficará visualmente oculto, mas permanecerá sincronizado para que a lógica de filtro já existente continue recebendo os mesmos IDs e valores. A lista temática será o ponto de interação visível.

## Interação e acessibilidade

- Cada botão terá `aria-haspopup="listbox"`, `aria-expanded` e relação com sua lista.
- A lista terá `role="listbox"`; cada item terá `role="option"` e refletirá a seleção com `aria-selected`.
- Clique e toque em uma opção atualizam o select original, disparam o mesmo evento `change` e fecham a lista.
- Teclado: Enter, Espaço, seta para baixo e seta para cima abrem ou percorrem opções; Enter/Espaço confirmam; Escape fecha; Tab sai do componente.
- O foco retorna ao botão após a seleção ou Escape.
- Apenas um menu pode ficar aberto por vez.

## Linguagem visual

- Superfície: fundo `--surface`/azul-escuro já usado nos painéis.
- Contorno: borda azulada do tema, com verde-limão apenas para foco e item selecionado.
- Estado selecionado: verde-limão suave, legível sobre fundo escuro, sem usar o azul claro do navegador.
- Opções: altura confortável para toque; separação sutil por hover, sem excesso de caixas ou sombras.
- O menu mantém a largura do seu campo e se ajusta ao espaço disponível na tela.

## Fluxo de sincronização

1. A página inicializa os componentes com as opções que já existem no HTML.
2. O backend entrega profissionais e o JavaScript atual adiciona opções ao select correspondente.
3. O componente observa ou recebe uma atualização explícita para reconstruir somente a lista daquele campo.
4. A pessoa escolhe uma opção no menu temático.
5. O valor do select nativo é atualizado e seu evento `change` existente filtra/redesenha o dashboard.
6. Alterações programáticas futuras no select atualizam o rótulo e o estado selecionado do menu visual.

## Erros e compatibilidade

Se o JavaScript do componente não inicializar, os selects nativos permanecem disponíveis e funcionais. O backend e a planilha não participam dessa mudança.

## Critérios de aceitação

- Nenhum popup aberto usa o azul claro padrão do navegador.
- Os cinco menus listados usam a mesma linguagem visual do PWA.
- Escolher uma opção atualiza os filtros e a ordenação exatamente como antes.
- Profissionais carregados dinamicamente aparecem no menu temático.
- O componente funciona por toque e teclado, fecha corretamente e não fica encoberto pela navegação inferior no mobile.
- A interface de desktop e mobile permanece responsiva.
- Os testes de frontend, backend e planilha continuam aprovados.

## Fora do escopo

- Alterar métricas, fontes de dados, histórico ou Apps Script.
- Ajustar o app operacional dos prescritores.
- Criar novos filtros ou mudar a regra dos filtros atuais.
