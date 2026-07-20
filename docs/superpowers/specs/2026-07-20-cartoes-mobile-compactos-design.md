# Cartões compactos no mobile — Dashboard

**Data:** 2026-07-20  
**Status:** aprovado pelo usuário

## Objetivo

Diminuir a altura dos cartões de demanda no dashboard mobile para exibir mais
alunos na tela, sem ocultar informações nem reduzir as áreas de toque.

## Comportamento aprovado

- O nome e os metadados de entrada/ID continuam no topo do cartão.
- Abaixo deles, uma faixa única terá três colunas: responsável, etapa com
  prazo (`A transferir` e `4 dias`) e selo de SLA (`Atrasada`).
- Os comandos WhatsApp, excluir e `Ver anamnese` permanecem em uma linha
  própria no rodapé.
- Em telas desktop, o layout atual não muda.
- A solução usa somente CSS no breakpoint mobile: `display: contents` permite
  que os elementos já existentes da etapa participem da grade do cartão, sem
  duplicar dados ou alterar a renderização JavaScript.

## Critérios de aceite

1. Entre 320 px e 760 px, responsável, etapa/prazo e SLA ficam lado a lado.
2. Ações continuam abaixo da faixa informativa, com área de toque de 44 px.
3. A partir de 761 px, o cartão preserva o layout atual.
4. Nenhuma alteração é feita na planilha, no backend ou no PWA de
   prescritores.
