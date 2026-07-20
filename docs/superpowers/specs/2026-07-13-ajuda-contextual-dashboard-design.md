# Ajuda contextual do dashboard — desenho aprovado

## Objetivo

Permitir que um gestor consulte rapidamente o significado de cada indicador ou análise do dashboard sem precisar de treinamento constante e sem aumentar permanentemente a quantidade de texto na tela.

## Comportamento

- KPIs, grupos de métricas, comparações, gráficos e tabelas relevantes receberão um botão circular `?` no canto superior direito.
- Ao tocar ou clicar, um único pop-up reutilizável será aberto próximo ao botão.
- Apenas um pop-up poderá permanecer aberto por vez.
- O pop-up fechará pelo botão de fechar, por toque fora dele ou pela tecla `Esc`.
- Em telas pequenas, sua posição será limitada ao espaço visível para não criar rolagem horizontal.
- O botão terá alvo de toque adequado e atributos acessíveis de rótulo, expansão e associação com o pop-up.

## Conteúdo

Cada mini guia terá título e texto breve, cobrindo apenas:

1. o que o indicador representa;
2. como ele é calculado ou qual período/base é comparado;
3. um cuidado neutro de leitura quando necessário.

Os textos não interpretarão os valores atuais, não afirmarão desempenho bom ou ruim e não inventarão causas. Definições importantes deverão distinguir:

- entradas por data da anamnese de conclusões por data da prescrição;
- fluxo do período de estoque atual de backlog;
- período selecionado de período anterior equivalente;
- média, mediana e percentil 75;
- taxa de conclusão por coorte de taxa de cumprimento do SLA;
- amostra pequena de tendência confiável.

## Cobertura

- Aba Acompanhamento: KPIs e guia para leitura dos cartões de demanda.
- Aba Produtividade: Produção, Backlog, Velocidade, Prazo e conclusão, Gargalos e tabela de profissionais.
- Aba Comparativos: cartões de variação, cada gráfico e tabela comparativa.

Não serão adicionados ícones repetidos em cada cartão de aluno; haverá um guia único para a lista, evitando ruído visual e dezenas de controles iguais.

## Implementação e desempenho

- Um único elemento de pop-up será incluído no `index.html`.
- Os botões carregarão apenas uma chave curta de ajuda; os textos ficarão em um catálogo local no `scripts.html`.
- Não haverá biblioteca, chamada ao backend, imagem, animação pesada ou novo acesso à planilha.
- A abertura será instantânea e não alterará o fluxo de atualização dos dados.

## Verificação

- Testar abertura, troca de conteúdo, fechamento externo e `Esc`.
- Confirmar que o pop-up permanece dentro da tela em 430×932 e 1280×900.
- Confirmar navegação por teclado, foco visível e alvo de toque.
- Executar os testes existentes e regenerar o preview.
- Revisar os textos para garantir que sejam definições neutras, e não interpretações do resultado atual.
