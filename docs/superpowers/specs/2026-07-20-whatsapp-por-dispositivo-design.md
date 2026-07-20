# Abertura do WhatsApp por dispositivo — Dashboard

**Data:** 2026-07-20  
**Status:** aprovado pelo usuário

## Objetivo

Fazer o comando WhatsApp de cada cartão de demanda priorizar o aplicativo
instalado no dispositivo: WhatsApp mobile em celulares e WhatsApp Desktop em
computadores. Quando o aplicativo não puder ser aberto, preservar uma rota
funcional para o WhatsApp Web.

## Comportamento

- O backend continua entregando apenas `whatsappLink` no formato
  `https://wa.me/55...`; não há mudança na planilha, no número armazenado ou
  no cache de dados.
- No clique do comando WhatsApp, o frontend tenta
  `whatsapp://send?phone=<numero>` na mesma ação do usuário. O sistema
  operacional associa o protocolo ao WhatsApp mobile em celulares ou ao
  WhatsApp Desktop em computadores.
- Caso o navegador permaneça em primeiro plano — sinal de que não havia
  aplicativo capaz de assumir o protocolo — abre `wa.me` em nova guia,
  permitindo continuar pelo WhatsApp Web.
- Sem número válido, o ícone permanece desabilitado como hoje.

## Implementação

`dashboard-analytics/scripts.html` concentra o comportamento numa função de
clique do link. Ela extrai o telefone da URL já normalizada, monta a deep link
e agenda o fallback HTTP. Nenhuma alteração é necessária em `Dados.gs`.

O listener delegado continua ignorando a ação WhatsApp para não abrir a
anamnese. O link deixa de depender apenas do `target=_blank`, garantindo que
o protocolo seja tentado no contexto de um gesto explícito do usuário.

## Testes e aceite

1. Um item com `whatsappLink` gera o controle habilitado.
2. Em contexto mobile, o clique solicita `whatsapp://send?phone=...`.
3. Em contexto desktop, usa o mesmo protocolo para o aplicativo Desktop e
   mantém `https://wa.me/...` como fallback.
4. Um item sem link continua desabilitado.
5. O PWA de prescritores e as colunas da planilha não são alterados.
