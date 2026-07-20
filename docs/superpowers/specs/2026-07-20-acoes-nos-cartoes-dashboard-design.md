# Ações nos cartões de demanda — Dashboard

**Data:** 2026-07-20
**Status:** aprovado pelo usuário

## Objetivo

Mover WhatsApp e exclusão do pop-up de anamnese para o cartão de cada demanda no dashboard gerencial. O pop-up passa a servir apenas para leitura da ficha.

## Comportamento aprovado

- Tocar/clicar no cartão não abre mais a anamnese e o cartão deixa de atuar como botão.
- Cada cartão apresenta três ações visíveis: WhatsApp, excluir e `Ver anamnese`.
- Somente `Ver anamnese` abre o pop-up da ficha.
- WhatsApp mantém a URL `wa.me` obtida do número cadastrado, sem expor telefone no payload agregado/cache.
- Excluir mantém a confirmação literal `EXCLUIR`, apaga a demanda pelo ID de `Respostas` e `Monitoramento` e registra `Analytics_Exclusoes`.
- No celular, as ações ficam em uma linha própria no rodapé do cartão; em telas maiores, permanecem alinhadas à direita.
- Não haverá expansão/retração do cartão nesta etapa: os três comandos estarão sempre disponíveis e terão áreas de toque de pelo menos 44 px.
- Os controles não existem no PWA dos prescritores.

## Componentes afetados

- `dashboard-analytics/scripts.html`: renderização do cartão e delegação de eventos.
- `dashboard-analytics/index.html`: remoção das ações do cabeçalho do modal.
- `dashboard-analytics/styles.html`: layout e estados de botão dos cartões.
- `dashboard-analytics/tests/frontend.test.js`: contrato da interação e dos controles.

## Critérios de aceite

1. Um clique fora dos botões em um cartão não abre a anamnese.
2. `Ver anamnese` abre a ficha correspondente.
3. WhatsApp e excluir atuam sobre o ID do mesmo cartão.
4. O modal não contém controles de WhatsApp ou exclusão.
5. O layout permanece utilizável em 320 px de largura.
