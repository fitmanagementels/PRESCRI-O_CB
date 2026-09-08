# Produtividade e Comparativos — desenho operacional

**Data:** 2026-09-08  
**Produto:** Dashboard de gestão de prescrições  
**Status:** aprovado para especificação

## Objetivo

Fazer as abas Produtividade e Comparativos responderem primeiro se a equipe está acompanhando a demanda e, em seguida, onde a gestão deve agir. A comparação individual existe como detalhamento, não como finalidade principal.

## Problema atual

O dashboard mostra muitas métricas com o mesmo peso e seis gráficos concorrentes. O gráfico de tempo multiplica três barras por profissional (média, mediana e P75), tornando a visão mobile longa, visualmente poluída e pouco acionável. Alguns conceitos também precisam de rótulo mais preciso: backlog é estoque atual, enquanto entradas menos conclusões é uma variação do período.

## Direção escolhida

Usar narrativa operacional em três camadas:

1. saúde atual da operação;
2. tendência de demanda versus capacidade;
3. pontos de atenção por profissional.

O período e o profissional globais continuam sendo a fonte comum de todos os valores. O estoque atual permanece explicitamente identificado como uma leitura do momento, não como volume exclusivamente do período selecionado.

## Aba Produtividade

### Ordem de leitura

1. Quatro indicadores principais: estoque atual, atrasadas, variação da fila no período e tempo mediano até prescrição.
2. Um insight textual baseado somente nos dados disponíveis, priorizando crescimento da fila, atrasos e concentração de pendências.
3. Ranking compacto “Onde agir”, ordenado por atrasadas, com atrasadas, pendentes e tempo mediano por profissional.
4. Detalhe opcional por profissional em tabela no desktop e cartões expansíveis no mobile.

### Métricas

- **Estoque atual:** demandas abertas no instante da atualização; não depende do intervalo escolhido.
- **Atrasadas:** demandas abertas acima do SLA atual.
- **Variação da fila:** entradas menos conclusões no intervalo selecionado. Substitui o rótulo ambíguo “Saldo”.
- **Tempo mediano:** indicador central de velocidade entre entrada e prescrição concluída.
- **SLA:** exibir percentual e base, por exemplo, `90% · 9 de 10`, somente para conclusões do período.
- **P75:** indicador de risco da equipe, apresentado como detalhe quando houver ao menos cinco conclusões; não é exibido como série repetida por profissional.
- **Média:** permanece no detalhe técnico, não na leitura principal, pois é sensível a casos extremos.
- **Amostra pequena:** métricas de prazo e SLA individuais com menos de cinco conclusões mostram essa condição em vez de sugerir precisão indevida.

## Aba Comparativos

### Ordem de leitura

1. Comparação curta com o período anterior: entradas, conclusões e variação da fila.
2. Um único gráfico focal, **Entradas × Conclusões**, em linha, que mostra o ritmo operacional.
3. Painel de ranking único com seletor: Atrasadas, SLA, Tempo mediano ou Conclusões. Apenas uma dimensão aparece por vez.
4. Tabela completa como detalhamento, sem repetir gráficos que já não servem à decisão principal.

### Remoções e simplificações

- Remover os gráficos simultâneos de backlog, composição de backlog, SLA, produção e tempo.
- O ranking selecionável substitui barras múltiplas por profissional.
- O backlog atual permanece nos indicadores de saúde; sua evolução volta como detalhe futuro somente se houver uma pergunta operacional específica para ela.

## Dicas contextuais (“?”)

Cada novo valor, insight, seletor e visualização deve ter ajuda atualizada no mesmo catálogo de dicas existente. As dicas explicam o cálculo, período, limitação de amostra e ação sugerida, sem linguagem estatística desnecessária.

Cobertura mínima:

- estoque atual;
- atrasadas;
- variação da fila;
- tempo mediano;
- insight operacional;
- ranking “Onde agir”;
- comparação com período anterior;
- entradas × conclusões;
- cada opção do ranking;
- amostra pequena e SLA com denominador.

## Responsividade

- Composição mobile em coluna única.
- Os quatro indicadores entram em grade 2 × 2 compacta.
- Insight e ranking aparecem antes da tabela.
- O gráfico focal tem altura limitada e rótulos legíveis; não há gráficos com várias barras para cada profissional.
- O ranking usa linhas compactas, não barras múltiplas.
- A tabela vira cartões expansíveis ou mantém rolagem somente quando o usuário escolher abrir o detalhe.
- Desktop preserva a ordem editorial e usa largura extra para a tabela, nunca para multiplicar gráficos.

## Dados e cálculo

Não é necessária nova aba ou coluna. Os cálculos usam `Respostas` e `Monitoramento` já normalizados pelo dashboard. As regras de período e profissional implementadas no backend continuam sendo aplicadas a todos os blocos. O histórico diário permanece reservado para snapshots e não é usado para inventar estado passado ausente.

## Critérios de aceite

- Em mobile, a aba Comparativos apresenta um gráfico focal e um ranking, sem sequência de seis gráficos.
- As métricas principais deixam clara a diferença entre estoque atual e variação no período.
- Tempo mediano aparece como medida principal de velocidade.
- SLA exibe denominador e alerta de amostra pequena quando aplicável.
- Trocar período ou profissional atualiza todos os elementos.
- Todo elemento novo ou renomeado possui uma dica “?” coerente.
- Tabela e ranking não expõem dados pessoais de alunos.
