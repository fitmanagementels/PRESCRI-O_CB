# Anamnese v3 — ordem principal e seleções no padrão Tally

**Data:** 2026-08-17  
**Status:** implementado, publicado e ativado; aceite autenticado de uma demanda v3 pendente.

## Objetivo

Transformar a ordem lógica já definida para o PWA na ordem principal da anamnese e substituir caixas de texto por controles de seleção nas perguntas equivalentes às do Tally, sem usar o editor de questionário do PWA gestor e sem reinterpretar respostas históricas.

A mudança será publicada como `v3`. As versões `v1` e `v2`, suas respostas e suas colunas permanecem preservadas.

## Fontes de referência

- O Tally publicado e o PDF `Anamnese CB by XSTEAM - Treino Personalizado.pdf` definem opções, tipos de seleção e comportamento de `Outro`.
- A planilha `BASE_PRESCRIÇÃO_CB — PWA` define os cabeçalhos canônicos e preserva as respostas históricas.
- Os prints do PWA publicado comprovam a ordem e o formato livre usados atualmente pela `v2`.
- Este documento define a ordem e o contrato da nova `v3`.

## Estratégia de versionamento

- Criar um catálogo completo para `v3`; não editar semanticamente a `v2`.
- Manter `v1` e `v2` arquivadas e legíveis.
- Ativar a `v3` somente depois de validar que todas as etapas, perguntas, tipos e opções foram gravados corretamente.
- Novas respostas devem registrar `Versão do questionário = v3`.
- Como nenhuma pergunta será adicionada ou removida, a `v3` reutiliza os cabeçalhos canônicos existentes de `Respostas`.
- A mudança de ordem não move colunas nem respostas. O vínculo continua sendo feito pelo código estável e pelo cabeçalho de cada pergunta.

## Ordem principal da v3

### Etapa 1 — Consentimento e responsável

1. `consentimento` — Confirmo que minhas respostas serão usadas para avaliar meu perfil e montar uma prescrição de treino personalizada.
2. `profissional` — Nome do profissional.

### Etapa 2 — Identificação e dados físicos

1. `nomeCompleto` — Nome completo.
2. `email` — E-mail.
3. `whatsapp` — WhatsApp.
4. `dataNascimento` — Data de nascimento.
5. `alturaCm` — Altura em centímetros.
6. `pesoKg` — Peso em kg.

### Etapa 3 — Experiência de treino

1. `experienciaMusculacao` — Qual é sua experiência com musculação?
2. `frequenciaUltimos3Meses` — Nos últimos 3 meses, quantas vezes por semana você treinou musculação em média?

### Etapa 4 — Objetivo e rotina

1. `objetivo` — Qual seu objetivo principal agora?
2. `frequenciaPretendida` — Quantas vezes na semana pretende treinar?
3. `tempoTreino` — Quanto tempo você tem por treino?
4. `atividadesExtras` — Além da musculação, você faz corrida, cardio, esporte ou aula?

### Etapa 5 — Dor, assimetrias e limitações

1. `dorAtual` — Você sente alguma dor ou desconforto hoje que possa interferir no treino?
2. `localDor` — Onde é a dor ou desconforto?
3. `intensidadeDor` — Intensidade da dor de 0 a 10.
4. `movimentosPioramDor` — Quais movimentos pioram essa dor ou desconforto?
5. `assimetria` — Você percebe diferença entre o lado direito e esquerdo do corpo?
6. `detalhesAssimetria` — Se marcou sim, qual lado, qual região e qual diferença sente?
7. `movimentosIncomodam` — Algum movimento costuma incomodar?
8. `exerciciosEvitados` — Existe algum exercício que você não pode fazer, não gosta ou não se sente seguro fazendo?

### Etapa 6 — Saúde e preferências

1. `historicoLesoes` — Já teve lesão, cirurgia, hérnia, tendinite, luxação, fratura ou problema de coluna?
2. `condicaoImportante` — Tem alguma doença ou condição importante?
3. `medicamentoContinuo` — Usa algum medicamento contínuo?
4. `sintomasEsforco` — Já sentiu dor no peito, desmaio, tontura forte, falta de ar fora do normal ou palpitação durante esforço?
5. `preferenciaTreino` — Que tipo de treino você prefere?
6. `observacoes` — Tem algo importante sobre seu corpo, rotina ou treino que eu não perguntei?

### Etapa 7 — Revisar e enviar

Não contém perguntas. Apresenta todas as respostas da tentativa, permite retornar às etapas anteriores e envia a demanda.

## Tipos, opções e obrigatoriedade

| Código | Tipo v3 | Obrigatória | Opções ou regra |
| --- | --- | --- | --- |
| `consentimento` | consentimento | Sim | Deve estar marcado. |
| `profissional` | escolha única dinâmica | Sim | Nomes com `Status = Ativo` na aba `Complementar`. |
| `nomeCompleto` | texto | Sim | Texto livre. |
| `email` | e-mail | Sim | Formato de e-mail válido. |
| `whatsapp` | telefone | Sim | Mínimo de dez dígitos após normalização. |
| `dataNascimento` | data | Sim | Controle de data. |
| `alturaCm` | número | Sim | Número positivo. |
| `pesoKg` | número | Sim | Número positivo. |
| `experienciaMusculacao` | escolha única | Sim | Nunca treinei; Menos de 3 meses; 3 a 12 meses; 1 a 3 anos; Mais de 3 anos. |
| `frequenciaUltimos3Meses` | escolha única | Sim | Não treinei; 1x por semana; 2x por semana; 3x por semana; 4x ou mais. |
| `objetivo` | escolha única com `Outro` | Sim | Ganhar massa; Emagrecer; Força; Saúde; Estética; Performance; Voltar a treinar; Outro. |
| `frequenciaPretendida` | seleção | Sim | Inteiros de 1 a 7. |
| `tempoTreino` | escolha única com `Outro` | Sim | 40 min; 60 min; 75 min; Outro. |
| `atividadesExtras` | texto longo | Sim | Texto livre. |
| `dorAtual` | escolha única | Sim | Não; Sim. |
| `localDor` | texto | Não | Texto livre. |
| `intensidadeDor` | número | Não | Inteiro de 0 a 10. |
| `movimentosPioramDor` | texto longo | Não | Texto livre. |
| `assimetria` | escolha única | Sim | Não percebo diferença; Sim; Não sei dizer. |
| `detalhesAssimetria` | texto | Não | Texto livre. |
| `movimentosIncomodam` | múltipla escolha com `Outro` | Sim | Nenhum; Agachar; Correr; Subir escada; Empurrar; Puxar; Levantar peso do chão; Elevar o braço acima da cabeça; Outro. |
| `exerciciosEvitados` | texto longo | Sim | Texto livre. |
| `historicoLesoes` | texto longo | Sim | Texto livre. |
| `condicaoImportante` | texto | Sim | Texto livre. |
| `medicamentoContinuo` | texto | Sim | Texto livre. |
| `sintomasEsforco` | escolha única | Sim | Não; Sim. |
| `preferenciaTreino` | escolha única | Sim | Curto e direto; Mais variado; Mais pesado; Mais guiado; Com máquinas; Com pesos livres; Sem preferência. |
| `observacoes` | texto longo | Sim | Texto livre. |

## Comportamento de `Outro`

- Ao selecionar `Outro` em objetivo, tempo por treino ou movimentos incômodos, o PWA abre um campo complementar obrigatório.
- Ao desmarcar ou substituir `Outro`, o complemento deixa de ser obrigatório e seu valor é descartado do rascunho.
- Escolha única com complemento é gravada como `Outro: <texto informado>` na coluna canônica da pergunta.
- Em múltipla escolha, cada valor é unido por ` | `. Exemplo: `Agachar | Outro: salto`.
- Não serão criadas colunas exclusivas para complementos de `Outro`.
- A tela de revisão mostra a forma final que será gravada, sem expor chaves internas.

## Regras adicionais de validação

- `intensidadeDor` deve aceitar apenas inteiros entre 0 e 10, inclusive.
- `alturaCm` e `pesoKg` devem ser números positivos.
- `frequenciaPretendida` deve aceitar somente uma opção de 1 a 7.
- Uma pergunta de escolha deve rejeitar valores que não estejam nas opções, exceto o complemento normalizado de `Outro`.
- Em `movimentosIncomodam`, selecionar `Nenhum` deve desmarcar as demais opções; selecionar qualquer outra opção deve desmarcar `Nenhum`.
- Campos opcionais continuam visíveis na etapa correspondente; não serão adicionadas regras condicionais de exibição nesta entrega.
- O envio continua idempotente por `ID da tentativa` e mantém o rascunho local por seis horas.

## Fonte de verdade e ativação

O catálogo versionado na aba `Questionário` será a fonte de verdade da ordem, dos tipos e das opções. O código local conterá a mesma definição como semente e recuperação segura.

A preparação da base deve:

1. validar a estrutura atual sem modificar respostas;
2. criar todas as linhas de etapas e perguntas da `v3` em estado não ativo;
3. conferir códigos únicos, cabeçalhos existentes, opções e ordenação;
4. arquivar a `v2` e ativar a `v3` somente em uma operação validada;
5. impedir que duas versões permaneçam ativas;
6. ser idempotente, sem duplicar a `v3` quando executada novamente.

O PWA do gestor não será usado. A alteração será preparada no projeto local, sincronizada com o Apps Script operacional e publicada na implantação existente.

## Fluxo de dados

1. O PWA carrega a única versão ativa do catálogo.
2. O backend entrega etapas e perguntas já ordenadas.
3. O frontend renderiza cada campo conforme seu tipo e preserva o rascunho por código.
4. A revisão apresenta as respostas normalizadas, incluindo complementos de `Outro`.
5. O backend valida novamente tipos, limites e opções.
6. A resposta é gravada em uma única linha de `Respostas`, identificada como `v3`.
7. A linha correspondente é criada em `Monitoramento` pelo mesmo `ID da demanda`.
8. O rascunho é removido apenas depois da confirmação de sucesso.

## Compatibilidade histórica

- A leitura de demandas `v1` e `v2` não depende dos tipos da `v3`.
- Respostas livres existentes continuam sendo exibidas como foram gravadas.
- O dashboard e o acompanhamento continuam lendo os mesmos cabeçalhos canônicos.
- A ordem visual da nova anamnese não altera a ordem física das colunas.
- Filtros e métricas existentes não devem passar a interpretar textos históricos como opções da `v3`.

## Tratamento de falhas

- Se o catálogo `v3` estiver incompleto ou inválido, a ativação deve falhar antes de arquivar a `v2`.
- Se não houver exatamente uma versão ativa, o PWA deve exibir erro de configuração e não aceitar envio.
- Se as opções carregadas estiverem vazias para um campo de seleção, o formulário não deve renderizar silenciosamente um grupo vazio.
- Se a versão ativa mudar enquanto houver um rascunho antigo, o PWA deve descartar o rascunho incompatível e iniciar uma tentativa da nova versão.
- Falhas de rede ou servidor preservam o rascunho e o `ID da tentativa` para evitar duplicidade.

## Verificação e critérios de aceite

### Catálogo e backend

- Existe exatamente uma versão ativa e ela é `v3`.
- As 28 perguntas aparecem uma única vez, nos seis blocos e na ordem especificada.
- Todas as perguntas de seleção possuem suas opções completas.
- O backend rejeita opção desconhecida, `Outro` sem complemento, intensidade fora de 0–10, altura/peso não positivos e frequência fora de 1–7.
- Um reenvio com o mesmo `ID da tentativa` não cria nova demanda.

### Frontend

- O formulário possui seis etapas de perguntas e a sétima de revisão.
- Escolhas únicas, múltiplas, consentimento, data, números e textos usam controles próprios.
- `Outro` abre e fecha corretamente o complemento e preserva o valor ao voltar de etapa.
- `Nenhum` é mutuamente exclusivo em movimentos incômodos.
- A ordem visual coincide com esta especificação em celular e desktop.
- O rascunho continua válido por seis horas e é descartado quando sua versão não coincide com a ativa.

### Planilha e publicação

- Um envio de teste cria uma linha `Origem = PWA`, `Versão do questionário = v3` e frequência pretendida entre 1 e 7.
- Valores múltiplos usam ` | ` e `Outro` usa o prefixo `Outro: `.
- A linha correspondente aparece em `Monitoramento` sem duplicidade.
- Respostas `v1` e `v2` permanecem inalteradas e visíveis.
- A implantação existente é atualizada para manter a URL oficial.

## Fora de escopo

- Editar o questionário pelo PWA gestor.
- Reescrever ou normalizar respostas históricas.
- Reordenar colunas físicas da aba `Respostas`.
- Criar condicionais para ocultar perguntas de dor ou assimetria.
- Alterar o dashboard além do necessário para continuar exibindo respostas `v3` pelos cabeçalhos existentes.
