# Brand visual contract

## Contexto e premissas

- Requisitos considerados: tornar Produtividade e Comparativos mais limpos, modernos, agradáveis no mobile e orientados à saúde da operação; manter dicas “?” atualizadas.
- Premissas: a fonte de dados atual continua sendo Respostas e Monitoramento; o período e o profissional globais já são sincronizados pelo backend; não há novos dados históricos de etapas.
- Tarefa e decisão principais: avaliar se a equipe acompanha a demanda e identificar rapidamente onde agir.

## Perfil

- Tipo: dashboard de gestão.
- Público e frequência: gestão de prescrições, consulta recorrente ao longo da semana em desktop e mobile.
- Justificativa: o usuário interpreta volume, prazo, tendência e concentração de pendências para decidir priorização e apoio.

## Tema

- Escolha: dark.
- Superfícies e justificativa: base escura, cards somente para o resumo e painéis de decisão, superfície ativa para seletores; bordas sutis sustentam hierarquia. O lime `#E2FF42` fica reservado a métrica prioritária, foco e ação, sem preencher blocos recorrentes de leitura.

## Densidade

- Escolha: confortável.
- Justificativa: há leitura analítica e uso em mobile; a redução de gráficos permite mostrar menos blocos, com espaço suficiente para escaneamento e toque.

## Hierarquia

1. Saúde atual: estoque, atrasadas, variação da fila e tempo mediano.
2. Tendência: entradas versus conclusões no período.
3. Ação: insight e ranking de profissionais que precisam de atenção.
4. Detalhe: tabela sob demanda.

## Zonas

| Zona | Objetivo | Conteúdo | Prioridade | Componente |
|---|---|---|---|---|
| Resumo operacional | Informar saúde da fila | 4 métricas principais | Alta | Grade de KPIs compacta |
| Insight | Traduzir dado em foco de gestão | Frase baseada em dados e dica | Alta | Painel focal discreto |
| Tendência | Mostrar ritmo entre demanda e capacidade | Entradas × conclusões | Alta | Gráfico de linha único |
| Onde agir | Localizar concentração de risco | Ranking por dimensão selecionada | Alta | Lista ranqueada com seletor |
| Detalhe | Consultar sem poluir a visão principal | Dados por profissional | Média | Tabela desktop / cartões expansíveis mobile |

## Componentes

- Componente focal: gráfico Entradas × Conclusões na aba Comparativos.
- Fluxos lineares: filtros globais → resumo → insight → tendência/ranking → detalhe.
- Blocos de overview/bento: quatro KPIs e um painel de insight; demais zonas seguem fluxo linear.
- Dados densos — tabela ou cards e por quê: tabela no desktop preserva comparação; cartões expansíveis no mobile evitam rolagem horizontal e mostram detalhes somente quando solicitados.
- Estados vazios, carregamento, erro e sucesso: manter estados existentes; ranking sem dados explica ausência de conclusões/amostra; dica “?” informa a condição de amostra pequena.

## Responsividade

- Mobile em coluna única: resumo 2 × 2, insight, ranking, gráfico e detalhe nessa ordem.
- Ordem das zonas no mobile: resumo operacional, insight, ranking de ação, gráfico de tendência, detalhe expansível.
- Adaptação de dados densos: sem séries de barras múltiplas; ranking em linhas compactas com números tabulares; tabela detalhada progressivamente exibida.
- Expansão para telas maiores: resumo pode ocupar quatro colunas; insight e ranking podem formar duas colunas; gráfico segue focal em largura total; tabela usa largura disponível sem criar gráficos adicionais.
