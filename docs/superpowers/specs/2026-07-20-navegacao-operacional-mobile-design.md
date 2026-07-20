# Navegação operacional mobile — PWA de prescritores

**Data:** 2026-07-20  
**Status:** aprovado pelo usuário

## Objetivo

Exibir os comandos de navegação do PWA operacional lado a lado em celulares,
sem rolagem horizontal ou gesto de arrasto.

## Comportamento aprovado

- Até 600 px, a barra `.app-tabs` será uma grade fixa de duas colunas, com
  largura total e sem overflow horizontal.
- Os rótulos visíveis serão `Acompanhar` e `Adicionar`; os rótulos completos
  permanecem no desktop.
- Cada botão tem altura mínima de 48 px, uma área de toque adequada e texto
  sem quebra de linha.
- Não há alteração de rotas, ações JavaScript, dados ou do dashboard
  gerencial.

## Critérios de aceite

1. Em 320 px, os dois botões cabem na largura da tela sem rolagem lateral.
2. O botão ativo mantém o tema verde-limão.
3. Acima de 600 px, os nomes completos e o layout atual permanecem.
