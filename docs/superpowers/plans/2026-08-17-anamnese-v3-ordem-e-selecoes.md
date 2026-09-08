# Anamnese v3 — ordem e seleções Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar uma anamnese `v3` com a ordem lógica aprovada, controles de seleção equivalentes ao Tally e ativação segura sem usar o editor do PWA gestor.

**Architecture:** O catálogo `v3` completo será definido no backend e materializado na aba `Questionário`, que continuará sendo a fonte de verdade para o PWA. O frontend renderizará por tipo, armazenará respostas `Outro` na própria resposta canônica e manterá compatibilidade com `v1`/`v2`; uma operação explícita e atômica preparará, validará e ativará a `v3` somente depois da publicação do código compatível.

**Tech Stack:** Google Apps Script V8, HTML Service, JavaScript sem framework, Google Sheets, Node.js `assert`, Chrome headless.

## Global Constraints

- Não usar o editor de questionário do PWA gestor.
- Não apagar, renomear, reordenar ou reescrever colunas e respostas existentes em `Respostas`.
- Preservar `v1` e `v2`; todas as novas demandas após a virada usam `v3`.
- Manter seis etapas de perguntas e a sétima etapa somente para revisão e envio.
- Reutilizar os 28 códigos e cabeçalhos canônicos existentes; não criar novas colunas.
- Armazenar seleções múltiplas com ` | ` e complementos como `Outro: <texto>`.
- Manter rascunho local por seis horas e idempotência por `ID da tentativa`.
- Não adicionar condicionais de exibição para dor ou assimetria.
- Atualizar a implantação existente para preservar a URL oficial.
- Este workspace não possui repositório Git; substituir passos de commit por checkpoints com testes e cópia do diff dos arquivos alterados.

---

## File Structure

- `Código.gs`: definições `v2`/`v3`, validação de respostas, serialização e operação administrativa de preparação/ativação.
- `Questionario.gs`: leitura rigorosa do catálogo, montagem da semente `v3`, validação de versão única ativa e materialização das linhas versionadas.
- `scripts.html`: renderização dos controles, comportamento de `Outro`, exclusividade de `Nenhum`, rascunho e revisão.
- `styles.html`: aparência e estados acessíveis dos controles e complemento de `Outro`.
- `tests/backend.test.js`: contrato da `v3`, ordem, opções, validações e serialização.
- `tests/frontend.test.js`: contrato estrutural do frontend e compilação.
- `tests/responsive.test.js`: fluxo do wizard e métricas dos controles em 320–880 px.
- `preview.html`: artefato gerado por `scripts/build-preview.js`; não editar manualmente.
- `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`: sequência segura de sincronização, preparação, ativação e rollback.
- `Contexto/CONTEXTO_DO_PROJETO.md`: estado final e fonte de verdade após a publicação.

---

### Task 1: Definir o contrato completo da v3 no backend

**Files:**
- Modify: `tests/backend.test.js:80-180`
- Modify: `Código.gs:45-112`
- Modify: `Questionario.gs:1-70`

**Interfaces:**
- Consumes: `campoQuestionario_(cabecalho, rotulo, tipo, etapa, obrigatorio, opcoes)`.
- Produces: `PRESCRICAO_VERSAO_PRINCIPAL = 'v3'`, `PRESCRICAO_QUESTIONARIOS.v3`, `montarQuestionarioSementePrescricao_('v3')`.

- [ ] **Step 1: Escrever os testes que fixam versão, ordem, tipos e opções**

Adicionar a `tests/backend.test.js`:

```js
const versaoPrincipal = vm.runInContext('PRESCRICAO_VERSAO_PRINCIPAL', context);
const ordemV3 = JSON.parse(vm.runInContext(
  'JSON.stringify(Object.keys(PRESCRICAO_QUESTIONARIOS.v3.campos))',
  context
));

assert.strictEqual(versaoPrincipal, 'v3');
assert.deepStrictEqual(ordemV3, [
  'consentimento', 'profissional',
  'nomeCompleto', 'email', 'whatsapp', 'dataNascimento', 'alturaCm', 'pesoKg',
  'experienciaMusculacao', 'frequenciaUltimos3Meses',
  'objetivo', 'frequenciaPretendida', 'tempoTreino', 'atividadesExtras',
  'dorAtual', 'localDor', 'intensidadeDor', 'movimentosPioramDor',
  'assimetria', 'detalhesAssimetria', 'movimentosIncomodam', 'exerciciosEvitados',
  'historicoLesoes', 'condicaoImportante', 'medicamentoContinuo',
  'sintomasEsforco', 'preferenciaTreino', 'observacoes',
]);
assert.strictEqual(questionarios.v3.campos.objetivo.tipo, 'unica');
assert(questionarios.v3.campos.objetivo.opcoes.includes('Outro'));
assert.strictEqual(questionarios.v3.campos.movimentosIncomodam.tipo, 'multipla');
assert.deepStrictEqual(questionarios.v3.campos.frequenciaPretendida.opcoes, ['1', '2', '3', '4', '5', '6', '7']);
assert.deepStrictEqual(
  questionarios.v3.campos.preferenciaTreino.opcoes,
  ['Curto e direto', 'Mais variado', 'Mais pesado', 'Mais guiado', 'Com máquinas', 'Com pesos livres', 'Sem preferência']
);
```

- [ ] **Step 2: Executar o teste e confirmar a falha correta**

Run: `node tests/backend.test.js`  
Expected: FAIL porque `PRESCRICAO_VERSAO_PRINCIPAL` ou `PRESCRICAO_QUESTIONARIOS.v3` ainda não existe.

- [ ] **Step 3: Declarar a v3 sem remover a v2**

Em `Código.gs`, declarar `PRESCRICAO_VERSAO_PRINCIPAL` antes do catálogo e acrescentar a propriedade `v3` depois da propriedade `v2` existente, sem alterar o conteúdo da `v2`:

```js
const PRESCRICAO_VERSAO_PRINCIPAL = 'v3';

v3: Object.freeze({
    versao: 'v3',
    campos: Object.freeze({
      consentimento: campoQuestionario_('Consentimento', 'Confirmo que minhas respostas serão usadas para avaliar meu perfil e montar uma prescrição de treino personalizada.', 'consentimento', 1),
      profissional: campoQuestionario_('Profissional', 'Nome do profissional', 'profissional', 1),
      nomeCompleto: campoQuestionario_('Nome completo', 'Nome completo', 'texto', 2),
      email: campoQuestionario_('Email', 'E-mail', 'email', 2),
      whatsapp: campoQuestionario_('Whatsapp', 'WhatsApp', 'tel', 2),
      dataNascimento: campoQuestionario_('Data de nascimento', 'Data de nascimento', 'data', 2),
      alturaCm: campoQuestionario_('Altura em centímetros', 'Altura em centímetros', 'numero', 2),
      pesoKg: campoQuestionario_('Peso em kg', 'Peso em kg', 'numero', 2),
      experienciaMusculacao: campoQuestionario_('Experiência com musculação', 'Qual é sua experiência com musculação?', 'unica', 3, true, ['Nunca treinei', 'Menos de 3 meses', '3 a 12 meses', '1 a 3 anos', 'Mais de 3 anos']),
      frequenciaUltimos3Meses: campoQuestionario_('Frequência de musculação nos últimos 3 meses', 'Nos últimos 3 meses, quantas vezes por semana você treinou musculação em média?', 'unica', 3, true, ['Não treinei', '1x por semana', '2x por semana', '3x por semana', '4x ou mais']),
      objetivo: campoQuestionario_('Objetivo principal', 'Qual seu objetivo principal agora?', 'unica', 4, true, ['Ganhar massa', 'Emagrecer', 'Força', 'Saúde', 'Estética', 'Performance', 'Voltar a treinar', 'Outro']),
      frequenciaPretendida: campoQuestionario_('Frequência pretendida (dias/semana)', 'Quantas vezes na semana pretende treinar?', 'select', 4, true, ['1', '2', '3', '4', '5', '6', '7']),
      tempoTreino: campoQuestionario_('Tempo disponível por treino', 'Quanto tempo você tem por treino?', 'unica', 4, true, ['40 min', '60 min', '75 min', 'Outro']),
      atividadesExtras: campoQuestionario_('Atividades além da musculação', 'Além da musculação, você faz corrida, cardio, esporte ou aula?', 'texto_longo', 4),
      dorAtual: campoQuestionario_('Dor ou desconforto atual', 'Você sente alguma dor ou desconforto hoje que possa interferir no treino?', 'unica', 5, true, ['Não', 'Sim']),
      localDor: campoQuestionario_('Local da dor ou desconforto', 'Onde é a dor ou desconforto?', 'texto', 5, false),
      intensidadeDor: campoQuestionario_('Intensidade da dor (0 a 10)', 'Intensidade da dor de 0 a 10', 'numero', 5, false),
      movimentosPioramDor: campoQuestionario_('Movimentos que pioram a dor', 'Quais movimentos pioram essa dor ou desconforto?', 'texto_longo', 5, false),
      assimetria: campoQuestionario_('Diferença entre lados do corpo', 'Você percebe diferença entre o lado direito e esquerdo do corpo?', 'unica', 5, true, ['Não percebo diferença', 'Sim', 'Não sei dizer']),
      detalhesAssimetria: campoQuestionario_('Detalhes da assimetria', 'Se marcou sim, qual lado, qual região e qual diferença sente?', 'texto', 5, false),
      movimentosIncomodam: campoQuestionario_('Movimentos que incomodam', 'Algum movimento costuma incomodar?', 'multipla', 5, true, ['Nenhum', 'Agachar', 'Correr', 'Subir escada', 'Empurrar', 'Puxar', 'Levantar peso do chão', 'Elevar o braço acima da cabeça', 'Outro']),
      exerciciosEvitados: campoQuestionario_('Exercícios evitados ou inseguros', 'Existe algum exercício que você não pode fazer, não gosta ou não se sente seguro fazendo?', 'texto_longo', 5),
      historicoLesoes: campoQuestionario_('Histórico de lesões ou cirurgias', 'Já teve lesão, cirurgia, hérnia, tendinite, luxação, fratura ou problema de coluna?', 'texto_longo', 6),
      condicaoImportante: campoQuestionario_('Doença ou condição importante', 'Tem alguma doença ou condição importante?', 'texto', 6),
      medicamentoContinuo: campoQuestionario_('Medicamento contínuo', 'Usa algum medicamento contínuo?', 'texto', 6),
      sintomasEsforco: campoQuestionario_('Sintomas durante esforço', 'Já sentiu dor no peito, desmaio, tontura forte, falta de ar fora do normal ou palpitação durante esforço?', 'unica', 6, true, ['Não', 'Sim']),
      preferenciaTreino: campoQuestionario_('Preferência de treino', 'Que tipo de treino você prefere?', 'unica', 6, true, ['Curto e direto', 'Mais variado', 'Mais pesado', 'Mais guiado', 'Com máquinas', 'Com pesos livres', 'Sem preferência']),
      observacoes: campoQuestionario_('Observações finais', 'Tem algo importante sobre seu corpo, rotina ou treino que eu não perguntei?', 'texto_longo', 6),
    }),
  }),
```

O trecho `v3: Object.freeze(...)` acima deve ficar dentro do objeto já atribuído a `PRESCRICAO_QUESTIONARIOS`, separado da propriedade `v2` por vírgula.

Atualizar no mesmo passo os formulários usados pelos testes de fluxo: manter as asserções estáticas da definição `v2`, mas trocar `versao: 'v2'` por `versao: 'v3'` nas chamadas a `validarDemandaPwaPrescricao_` e esperar `v3` em `prepararRegistroDemandaPwaPrescricao_`. Isso evita que os testes de envio continuem solicitando uma versão que deixou de ser a versão principal do fallback local.

Em `Questionario.gs`, fazer `montarQuestionarioSementePrescricao_(versao)` usar a versão solicitada e `PRESCRICAO_VERSAO_PRINCIPAL` como padrão:

```js
function montarQuestionarioSementePrescricao_(versao) {
  const codigoVersao = textoQuestionarioPrescricao_(versao) || PRESCRICAO_VERSAO_PRINCIPAL;
  const definicao = PRESCRICAO_QUESTIONARIOS[codigoVersao];
  if (!definicao) throw new Error('Versão de questionário não suportada: ' + codigoVersao + '.');
  const etapas = etapasSementeQuestionarioPrescricao_();
  Object.keys(definicao.campos).forEach(function (codigo, indice) {
    const original = definicao.campos[codigo];
    etapas[original.etapa - 1].campos.push({
      codigo: codigo, cabecalho: original.cabecalho, rotulo: original.rotulo,
      tipo: original.tipo, obrigatorio: original.obrigatorio !== false,
      opcoes: (original.opcoes || []).slice(), ordem: indice + 1,
    });
  });
  return {
    questionarioId: 'anamnese_inicial', nome: 'Anamnese inicial',
    versao: codigoVersao, status: codigoVersao === PRESCRICAO_VERSAO_PRINCIPAL ? 'Rascunho' : 'Arquivada',
    revisao: 1, etapas: etapas,
  };
}
```

- [ ] **Step 4: Executar o teste e confirmar aprovação do contrato**

Run: `node tests/backend.test.js`  
Expected: PASS, incluindo ordem exata e opções da `v3`.

- [ ] **Step 5: Registrar checkpoint sem Git**

Run: `git diff --no-index /dev/null Código.gs || true` e `git diff --no-index /dev/null Questionario.gs || true`  
Expected: saída disponível para revisão; nenhum arquivo fora do escopo alterado.

---

### Task 2: Materializar e ativar o catálogo v3 com validação atômica

**Files:**
- Modify: `tests/backend.test.js:150-230`
- Modify: `Questionario.gs:70-295`
- Modify: `Código.gs:110-155,452-610`

**Interfaces:**
- Consumes: `montarQuestionarioSementePrescricao_('v3')`, `validarRascunhoQuestionarioPrescricao_(questionario)`.
- Produces: `prepararEAtivarQuestionarioV3Prescricao()`, `validarVersaoQuestionarioPrescricao_(questionario, versaoEsperada)`, `obterQuestionarioAtivoPrescricao_()` rigoroso.

- [ ] **Step 1: Escrever testes para catálogo completo e versão ativa única**

Adicionar a `tests/backend.test.js`:

```js
const sementeV3 = context.montarQuestionarioSementePrescricao_('v3');
assert.strictEqual(sementeV3.versao, 'v3');
assert.strictEqual(sementeV3.etapas.length, 6);
assert.strictEqual(sementeV3.etapas.reduce((total, etapa) => total + etapa.campos.length, 0), 28);
assert.strictEqual(context.validarRascunhoQuestionarioPrescricao_(sementeV3).ok, true);
assert.strictEqual(typeof context.prepararEAtivarQuestionarioV3Prescricao, 'function');
assert.throws(
  () => context.selecionarQuestionarioAtivoPrescricao_([
    Object.assign({}, sementeV3, { status: 'Ativa' }),
    Object.assign({}, sementeV3, { versao: 'v2', status: 'Ativa' }),
  ]),
  /exatamente uma versão ativa/
);
```

Atualizar os testes do catálogo:

```js
assert.strictEqual(linhasCatalogo.filter((linha) => linha[0] === 'v1').length, 27);
assert.strictEqual(linhasCatalogo.filter((linha) => linha[0] === 'v2').length, 28);
assert.strictEqual(linhasCatalogo.filter((linha) => linha[0] === 'v3').length, 28);
assert.strictEqual(
  linhasCatalogo.find((linha) => linha[0] === 'v3' && linha[2] === 'objetivo')[6],
  'Ganhar massa | Emagrecer | Força | Saúde | Estética | Performance | Voltar a treinar | Outro'
);
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `node tests/backend.test.js`  
Expected: FAIL pela ausência de `selecionarQuestionarioAtivoPrescricao_` e `prepararEAtivarQuestionarioV3Prescricao`.

- [ ] **Step 3: Separar leitura de preparação e exigir uma versão ativa**

Em `Questionario.gs`, remover a mutação implícita de `obterQuestionarioAtivoPrescricao_` e implementar:

```js
function selecionarQuestionarioAtivoPrescricao_(questionarios) {
  const ativas = (questionarios || []).filter(function (item) { return item.status === 'Ativa'; });
  if (ativas.length !== 1) {
    throw new Error('A configuração deve possuir exatamente uma versão ativa; encontradas: ' + ativas.length + '.');
  }
  const validacao = validarRascunhoQuestionarioPrescricao_(ativas[0]);
  if (!validacao.ok) {
    throw new Error('A versão ativa está incompleta: ' + validacao.erros.map(function (erro) { return erro.mensagem; }).join(' '));
  }
  return ativas[0];
}

function obterQuestionarioAtivoPrescricao_(planilha) {
  if (!planilha && (typeof SpreadsheetApp === 'undefined' || !SpreadsheetApp.openById)) {
    return montarQuestionarioSementePrescricao_(PRESCRICAO_VERSAO_PRINCIPAL);
  }
  return selecionarQuestionarioAtivoPrescricao_(lerVersoesQuestionarioPrescricao_(planilha || obterPlanilhaPrescricao_()));
}
```

- [ ] **Step 4: Criar a escrita idempotente e a ativação atômica**

Em `Questionario.gs`, implementar helpers que constroem linhas usando os 19 cabeçalhos existentes:

```js
function validarVersaoQuestionarioPrescricao_(questionario, versaoEsperada) {
  const validacao = validarRascunhoQuestionarioPrescricao_(questionario);
  const total = (questionario.etapas || []).reduce(function (soma, etapa) { return soma + etapa.campos.length; }, 0);
  if (questionario.versao !== versaoEsperada) throw new Error('Versão inesperada: ' + questionario.versao + '.');
  if (questionario.etapas.length !== 6 || total !== 28) throw new Error('A ' + versaoEsperada + ' deve possuir 6 etapas e 28 perguntas.');
  if (!validacao.ok) throw new Error(validacao.erros.map(function (erro) { return erro.mensagem; }).join(' '));
  return true;
}
```

`prepararEAtivarQuestionarioV3Prescricao()` deve, dentro de `executarComLockPrescricao_`:

1. obter a planilha e a aba `Questionário`;
2. garantir os 19 cabeçalhos;
3. montar e validar a semente `v3` antes da primeira escrita;
4. falhar se já existir uma `v3` divergente;
5. anexar seis linhas de etapa e 28 linhas de pergunta como `Rascunho` se a versão não existir;
6. reler a `v3` e validar novamente;
7. atualizar todas as linhas `Ativa` anteriores para `Arquivada`;
8. atualizar todas as linhas `v3` para `Ativa`;
9. executar `SpreadsheetApp.flush()`, reler e exigir exatamente uma ativa `v3`;
10. limpar o cache e retornar `{ok: true, versaoAtiva: 'v3', etapas: 6, perguntas: 28}`.

Não apagar linhas de `v1` ou `v2`. Não ativar `v3` se qualquer validação anterior falhar.

- [ ] **Step 5: Atualizar preparação e diagnóstico da base**

Em `Código.gs`:

```js
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Prescrições')
    .addItem('Sincronizar Monitoramento', 'sincronizarMonitoramento')
    .addItem('Preparar base versionada', 'prepararBaseAnamneseVersionadaPrescricao')
    .addItem('Preparar e ativar anamnese v3', 'prepararEAtivarQuestionarioV3Prescricao')
    .addItem('Validar base versionada', 'validarBaseAnamneseVersionadaPrescricao')
    .addItem('Validar backend', 'validarBackendPrescricoes')
    .addToUi();
}
```

Atualizar `versoesSuportadas` para `['v1', 'v2', 'v3']` e acrescentar ao diagnóstico a quantidade e o nome da versão ativa. O diagnóstico deve retornar `ok: false` se não houver exatamente uma ativa.

- [ ] **Step 6: Executar testes e confirmar aprovação**

Run: `node tests/backend.test.js`  
Expected: PASS com 27 linhas `v1`, 28 `v2`, 28 `v3`, seis etapas e ativa única validada.

- [ ] **Step 7: Registrar checkpoint sem Git**

Run: `node tests/backend.test.js`  
Expected: `Backend: testes de regras e payload aprovados.`

---

### Task 3: Validar opções, limites, `Outro` e exclusividade de `Nenhum`

**Files:**
- Modify: `tests/backend.test.js:100-180`
- Modify: `Código.gs:175-260`

**Interfaces:**
- Consumes: campos do questionário ativo e `respostasRecebidas`.
- Produces: `normalizarOpcaoOutroPrescricao_(campo, valor)`, validação v3 e registro canônico.

- [ ] **Step 1: Criar testes de falha e sucesso para a v3**

Construir em `tests/backend.test.js` uma resposta válida `respostasV3` a partir da resposta v2 existente, substituindo a versão por `v3`, e adicionar:

```js
const formularioV3 = {
  versao: 'v3', tentativaId: 'tentativa-v3-001',
  respostas: Object.assign({}, respostasV3, {
    objetivo: 'Outro: Reabilitação',
    tempoTreino: 'Outro: 50 min',
    intensidadeDor: '10',
    alturaCm: '171', pesoKg: '80',
    movimentosIncomodam: ['Agachar', 'Outro: Saltar'],
  }),
};
const validaV3 = context.validarDemandaPwaPrescricao_(formularioV3);
assert.deepStrictEqual(validaV3.respostas.movimentosIncomodam, ['Agachar', 'Outro: Saltar']);
assert.strictEqual(validaV3.respostas.objetivo, 'Outro: Reabilitação');
assert.throws(() => context.validarDemandaPwaPrescricao_({
  versao: 'v3', tentativaId: 'tentativa-v3-002',
  respostas: Object.assign({}, respostasV3, { objetivo: 'Outro:' }),
}), /Explique a opção Outro/);
assert.throws(() => context.validarDemandaPwaPrescricao_({
  versao: 'v3', tentativaId: 'tentativa-v3-003',
  respostas: Object.assign({}, respostasV3, { intensidadeDor: '11' }),
}), /entre 0 e 10/);
assert.throws(() => context.validarDemandaPwaPrescricao_({
  versao: 'v3', tentativaId: 'tentativa-v3-004',
  respostas: Object.assign({}, respostasV3, { alturaCm: '0' }),
}), /Altura/);
assert.throws(() => context.validarDemandaPwaPrescricao_({
  versao: 'v3', tentativaId: 'tentativa-v3-005',
  respostas: Object.assign({}, respostasV3, { movimentosIncomodam: ['Nenhum', 'Agachar'] }),
}), /Nenhum não pode ser combinado/);
```

- [ ] **Step 2: Executar o teste e observar as validações ausentes**

Run: `node tests/backend.test.js`  
Expected: FAIL porque `Outro: ...`, limites e exclusividade ainda não são tratados.

- [ ] **Step 3: Implementar validação normalizada de opções**

Em `Código.gs`, adicionar antes de `validarDemandaPwaPrescricao_`:

```js
function normalizarOpcaoOutroPrescricao_(campo, valor) {
  const texto = limparTextoPrescricao_(valor);
  if (texto === 'Outro' && campo.opcoes.indexOf('Outro') !== -1) {
    throw new Error('Explique a opção Outro em: ' + campo.rotulo);
  }
  if (campo.opcoes.indexOf('Outro') !== -1 && /^Outro:\s*\S/i.test(texto)) {
    return 'Outro: ' + texto.replace(/^Outro:\s*/i, '').trim();
  }
  if (/^Outro:/i.test(texto)) throw new Error('Explique a opção Outro em: ' + campo.rotulo);
  if (campo.opcoes.indexOf(texto) !== -1) return texto;
  throw new Error('Selecione uma opção válida em: ' + campo.rotulo);
}
```

No laço de validação:

- para `unica` e `select`, substituir a verificação direta por `normalizarOpcaoOutroPrescricao_`;
- para `multipla`, normalizar cada item, rejeitar duplicatas e rejeitar `Nenhum` combinado com outra opção;
- exigir inteiros 0–10 para `intensidadeDor` quando preenchida;
- exigir número positivo para `alturaCm` e `pesoKg`;
- manter frequência pretendida restrita a `1`–`7`.

- [ ] **Step 4: Confirmar a serialização na coluna existente**

Adicionar ao teste:

```js
const registroV3 = context.prepararRegistroDemandaPwaPrescricao_(
  validaV3, new Date(2026, 7, 17, 12, 0), 'DEM-20260817-v3teste'
);
assert.strictEqual(registroV3.resposta['Versão do questionário'], 'v3');
assert.strictEqual(registroV3.resposta['Movimentos que incomodam'], 'Agachar | Outro: Saltar');
assert.strictEqual(registroV3.resposta['Objetivo principal'], 'Outro: Reabilitação');
```

- [ ] **Step 5: Executar o teste completo**

Run: `node tests/backend.test.js`  
Expected: PASS para opções válidas e FAIL controlado nos cinco casos inválidos.

- [ ] **Step 6: Registrar checkpoint sem Git**

Run: `node tests/backend.test.js`  
Expected: zero falhas.

---

### Task 4: Renderizar seleções e complemento `Outro` no wizard

**Files:**
- Modify: `tests/frontend.test.js:40-120`
- Modify: `scripts.html:7-10,430-445,1170-1435`

**Interfaces:**
- Consumes: payload `getQuestionarioPwaPrescricao()` com `versao`, `etapas`, `campos` e `profissionais`.
- Produces: rascunho `v3` com strings `Outro: ...` e arrays de múltipla escolha; `renderizarCampoDemanda(chave)` por tipo.

- [ ] **Step 1: Fixar o contrato frontend da v3**

Adicionar a `tests/frontend.test.js`:

```js
[
  "versao: 'v3'",
  "['Nunca treinei', 'Menos de 3 meses', '3 a 12 meses', '1 a 3 anos', 'Mais de 3 anos']",
  "['Não', 'Sim']",
  "['Nenhum', 'Agachar', 'Correr', 'Subir escada'",
  'data-outro-campo',
  'normalizarOutroDemanda',
  'tratarExclusividadeNenhumDemanda',
].forEach((texto) => assert(scriptsHtml.includes(texto), `Wizard v3 deve conter: ${texto}`));
assert(scriptsHtml.includes("const DEMAND_DRAFT_KEY = 'prescricoes_anamnese_v3_rascunho'"));
```

- [ ] **Step 2: Executar o teste e confirmar falha**

Run: `node tests/frontend.test.js`  
Expected: FAIL porque o preview ainda usa `v2` e não há complemento de `Outro`.

- [ ] **Step 3: Atualizar a prévia e a chave do rascunho**

Em `scripts.html`:

```js
const DEMAND_DRAFT_KEY = 'prescricoes_anamnese_v3_rascunho';
```

Atualizar `criarQuestionarioPreview()` para `versao: 'v3'`, ordem e opções idênticas a `PRESCRICAO_QUESTIONARIOS.v3`. A prévia deve manter os sete títulos:

```js
[
  'Consentimento e responsável', 'Identificação e dados físicos',
  'Experiência de treino', 'Objetivo e rotina',
  'Dor, assimetrias e limitações', 'Saúde e preferências',
  'Revisar e enviar'
]
```

- [ ] **Step 4: Implementar helpers de leitura de `Outro`**

Adicionar antes de `renderizarCampoDemanda`:

```js
function opcaoBaseDemanda(valor) {
  return typeof valor === 'string' && /^Outro:\s*/i.test(valor) ? 'Outro' : valor;
}

function complementoOutroDemanda(valor) {
  return typeof valor === 'string' && /^Outro:\s*/i.test(valor)
    ? valor.replace(/^Outro:\s*/i, '') : '';
}

function normalizarOutroDemanda(chave, selecionado, complemento) {
  if (selecionado !== 'Outro') return selecionado;
  return 'Outro: ' + String(complemento || '').trim();
}
```

- [ ] **Step 5: Renderizar o complemento junto às escolhas que possuem `Outro`**

Em `renderizarCampoDemanda(chave)`:

- rádio deve considerar `opcaoBaseDemanda(valor)` para marcar `Outro`;
- múltipla escolha deve considerar itens `Outro: ...` como opção `Outro` marcada;
- quando `campo.opcoes` contiver `Outro`, renderizar após as opções:

```js
'<div class="wizard-other" data-outro-campo="' + escaparAttr(chave) + '"' + (outroMarcado ? '' : ' hidden') + '>'
  + '<label for="' + id + '_outro">Qual?</label>'
  + '<input id="' + id + '_outro" data-outro-input="' + escaparAttr(chave) + '" type="text" value="' + escaparAttr(complemento) + '">'
  + '</div>'
```

O complemento não recebe `name=chave`, evitando colisão com rádio/checkbox.

- [ ] **Step 6: Capturar respostas normalizadas no rascunho**

Em `capturarValoresDemanda()`:

- escolha única: obter o rádio marcado e, para `Outro`, combinar com `[data-outro-input="<chave>"]`;
- múltipla: mapear opções marcadas e substituir `Outro` por `Outro: <complemento>`;
- manter os demais tipos como estão.

Em `validarEtapaDemanda()`, quando `Outro` estiver marcado, exigir complemento não vazio, mostrar `Explique a opção Outro: <pergunta>` e focar o campo complementar.

- [ ] **Step 7: Implementar exclusividade de `Nenhum` e visibilidade do complemento**

Adicionar:

```js
function tratarExclusividadeNenhumDemanda(event) {
  const input = event.target;
  if (!input.matches('.wizard-choice input[type="checkbox"]')) return;
  const grupo = input.closest('fieldset');
  if (!grupo) return;
  const opcoes = Array.prototype.slice.call(grupo.querySelectorAll('input[type="checkbox"]'));
  if (input.value === 'Nenhum' && input.checked) {
    opcoes.forEach(function (opcao) { if (opcao !== input) opcao.checked = false; });
  } else if (input.checked) {
    const nenhum = opcoes.find(function (opcao) { return opcao.value === 'Nenhum'; });
    if (nenhum) nenhum.checked = false;
  }
}
```

No evento `change` do wizard, chamar esse helper, alternar `[data-outro-campo]` conforme a opção `Outro` e só depois salvar o rascunho.

- [ ] **Step 8: Atualizar a revisão**

`renderizarRevisaoDemanda()` deve continuar unindo arrays com `, ` e exibir `Outro: ...` exatamente como será enviado.

- [ ] **Step 9: Gerar a prévia e executar o teste**

Run: `node scripts/build-preview.js && node tests/frontend.test.js`  
Expected: `Preview criado...` e `Frontend: estrutura, contrato e compilação aprovados.`

- [ ] **Step 10: Registrar checkpoint sem Git**

Run: `node tests/frontend.test.js`  
Expected: zero falhas.

---

### Task 5: Estilizar e verificar os novos controles em celular

**Files:**
- Modify: `styles.html:299-350,1150-1190`
- Modify: `tests/responsive.test.js:20-150`
- Regenerate: `preview.html`

**Interfaces:**
- Consumes: `.wizard-choice`, `.wizard-other`, `[data-outro-input]`, `.custom-select`.
- Produces: controles com alvo mínimo de 48 px, foco visível e ausência de overflow.

- [ ] **Step 1: Estender o teste responsivo para abrir a anamnese v3**

No `probeHtml` de `tests/responsive.test.js`, após o app estar pronto, acionar a aba Adicionar e medir:

```js
const addTab = doc.querySelector('[data-app-view="demand"]');
addTab.click();
const choice = doc.querySelector('.wizard-choice');
const choiceRect = choice && choice.getBoundingClientRect();
const consent = doc.querySelector('.wizard-consent');
const consentRect = consent && consent.getBoundingClientRect();
```

Acrescentar ao resultado:

```js
wizardChoiceHeight: choiceRect ? choiceRect.height : 0,
wizardConsentHeight: consentRect ? consentRect.height : 0,
wizardOverflow: doc.querySelector('#demandWizard').scrollWidth > doc.querySelector('#demandWizard').clientWidth,
```

E às asserções de cada largura:

```js
assert(medida.wizardChoiceHeight >= 48, `Escolhas devem ter 48px em ${width}px.`);
assert(medida.wizardConsentHeight >= 48, `Consentimento deve ter 48px em ${width}px.`);
assert.strictEqual(medida.wizardOverflow, false, `Wizard não deve transbordar em ${width}px.`);
```

- [ ] **Step 2: Executar o teste e confirmar a falha útil**

Run: `node scripts/build-preview.js && node tests/responsive.test.js`  
Expected: FAIL se a prévia não abrir a etapa ou se os controles não alcançarem 48 px.

- [ ] **Step 3: Adicionar estilos do complemento e estados de escolha**

Em `styles.html`:

```css
.wizard-choice:has(input:checked),
.wizard-consent:has(input:checked) {
  border-color: var(--lime-strong);
  background: rgba(223,255,50,.08);
}
.wizard-other {
  display: grid;
  gap: 8px;
  margin: 4px 0 0 30px;
  padding: 12px;
  border-left: 3px solid var(--lime);
}
.wizard-other[hidden] { display: none; }
.wizard-other input { min-height: 48px; }
.wizard-choice:focus-within,
.wizard-consent:focus-within,
.wizard-other input:focus-visible {
  outline: 3px solid var(--lime);
  outline-offset: 2px;
}
```

No breakpoint mobile, definir `.wizard-other { margin-left: 0; }` para preservar largura útil.

- [ ] **Step 4: Gerar prévia e executar testes frontend/responsivo**

Run: `node scripts/build-preview.js && node tests/frontend.test.js && node tests/responsive.test.js`  
Expected: frontend aprovado e responsivo aprovado em 320, 360, 390, 412, 430 e 880 px.

- [ ] **Step 5: Inspecionar visualmente as etapas 1, 4 e 5**

Run: `python3 -m http.server 8000`  
Em outra chamada, abrir `http://127.0.0.1:8000/preview.html` no Chrome e conferir:

- etapa 1: consentimento e profissional;
- etapa 4: objetivo com `Outro`, frequência 1–7 e tempo com `Outro`;
- etapa 5: múltipla escolha, `Nenhum` exclusivo e complemento de `Outro`;
- etapa 7: revisão com respostas finais.

Expected: sem campos vazios por falta de opções, sem overflow horizontal e com foco verde-limão visível.

- [ ] **Step 6: Registrar checkpoint sem Git**

Run: `node tests/responsive.test.js`  
Expected: zero falhas nas seis larguras.

---

### Task 6: Documentar operação, sincronizar código e preparar a virada

**Files:**
- Modify: `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md`
- Modify: `Contexto/CONTEXTO_DO_PROJETO.md`
- Verify: `appsscript.json`

**Interfaces:**
- Consumes: arquivos locais aprovados e função `prepararEAtivarQuestionarioV3Prescricao()`.
- Produces: procedimento reproduzível de publicação, ativação, aceite e rollback.

- [ ] **Step 1: Atualizar o guia de implantação com a sequência sem gestor**

Registrar em `docs/IMPLANTACAO_PWA_ANAMNESE_VERSIONADA.md` esta ordem obrigatória:

1. executar os testes locais completos;
2. sincronizar `Código.gs`, `Questionario.gs`, `index.html`, `styles.html`, `scripts.html` e `appsscript.json` com o projeto Apps Script operacional;
3. salvar e testar `/dev` mantendo a `v2` ativa;
4. publicar uma nova versão na implantação existente;
5. executar `prepararEAtivarQuestionarioV3Prescricao` uma única vez;
6. reler a aba `Questionário` e confirmar uma única ativa `v3` com 34 linhas: seis etapas e 28 perguntas;
7. abrir novamente a URL oficial, preencher uma demanda fictícia e conferir `Respostas`/`Monitoramento`;
8. se o formulário publicado falhar antes de qualquer envio v3, arquivar as linhas v3 e reativar todas as linhas v2; não apagar v3;
9. se já houver envio v3, corrigir e republicar v3 sem reclassificar a linha como v2.

- [ ] **Step 2: Atualizar o contexto portátil**

Em `Contexto/CONTEXTO_DO_PROJETO.md`, registrar `v3` como mudança preparada, os tipos de seleção, o formato de `Outro`, a preservação de `v1`/`v2` e a necessidade do aceite publicado antes de declarar a virada concluída.

- [ ] **Step 3: Verificar manifesto e disponibilidade de sincronização**

Run: `node -e "const m=require('./appsscript.json'); if(m.runtimeVersion!=='V8'||m.timeZone!=='America/Fortaleza') process.exit(1); console.log('Manifesto v3 válido')"`  
Expected: `Manifesto v3 válido`.

Run: `test -f .clasp.json && echo 'clasp configurado' || echo 'clasp não configurado'`  
Expected no estado atual: `clasp não configurado`.

Se `.clasp.json` continuar ausente, a implementação deve solicitar o ID exato do projeto Apps Script operacional antes de qualquer sincronização externa. Não criar uma nova implantação nem presumir um projeto pelo título.

- [ ] **Step 4: Executar a suíte local completa**

Run:

```bash
node scripts/build-preview.js
node tests/backend.test.js
node tests/frontend.test.js
node tests/responsive.test.js
node dashboard-analytics/tests/backend.test.js
node dashboard-analytics/tests/sheets.test.js
node dashboard-analytics/tests/frontend.test.js
```

Expected: todos os sete comandos com exit code `0`; preview sincronizado; nenhuma regressão no dashboard.

- [ ] **Step 5: Registrar checkpoint final local**

Run: `find . -maxdepth 3 -type f -newermt '2026-08-17 00:00:00' | sort`  
Expected: somente arquivos previstos neste plano e artefatos já conhecidos; revisar qualquer arquivo adicional antes da publicação.

---

### Task 7: Ativar e verificar a v3 na planilha e na implantação oficial

**Files:**
- Live read/write: Google Sheet `1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs`, aba `Questionário`
- Live verify: abas `Respostas` e `Monitoramento`
- Deploy: projeto Apps Script operacional existente

**Interfaces:**
- Consumes: implantação com código v3 e `prepararEAtivarQuestionarioV3Prescricao()`.
- Produces: uma única versão ativa `v3` e um envio de aceite completo.

- [ ] **Step 1: Capturar o estado anterior somente para leitura**

Ler metadados e intervalos limitados:

- `Questionário!A1:S100`;
- cabeçalho `Respostas!A1:AG1`;
- cabeçalho `Monitoramento!A1:H1`.

Expected antes da virada: `v2` ativa; 28 perguntas v2; nenhuma linha v3; cabeçalhos canônicos intactos.

- [ ] **Step 2: Sincronizar e publicar o código compatível**

Usar o projeto Apps Script operacional identificado no Task 6. Atualizar a implantação existente, nunca criar outra URL. Abrir `/dev` e confirmar que `getQuestionarioPwaPrescricao` ainda carrega a versão ativa atual antes da ativação.

Expected: código v3 disponível no projeto, URL oficial ainda preservada e nenhuma resposta/linha histórica modificada.

- [ ] **Step 3: Executar a ativação explícita**

Executar `prepararEAtivarQuestionarioV3Prescricao()` no projeto operacional.

Expected:

```json
{"ok":true,"versaoAtiva":"v3","etapas":6,"perguntas":28}
```

- [ ] **Step 4: Reler o catálogo e validar a escrita**

Ler novamente `Questionário!A1:S150` e confirmar:

- exatamente seis linhas `v3` com `Tipo de registro = etapa`;
- exatamente 28 linhas `v3` com `Tipo de registro = pergunta`;
- todas as 34 linhas v3 com `Status = Ativa`;
- nenhuma linha v1/v2 ativa;
- opções não vazias em toda pergunta `unica`, `multipla` ou `select`;
- ordem de etapas 1–6 e ordem interna conforme a especificação;
- nenhum cabeçalho novo em `Respostas`.

- [ ] **Step 5: Executar aceite publicado sem dados reais**

Na URL oficial, criar uma demanda fictícia claramente identificada, usando:

- objetivo `Outro: Reabilitação`;
- frequência pretendida `3`;
- tempo `Outro: 50 min`;
- movimentos `Agachar | Outro: Saltar`;
- intensidade `10`;
- demais campos com valores fictícios válidos.

Expected: revisão correta, envio único e confirmação com `ID da demanda`.

- [ ] **Step 6: Verificar a linha criada e remover o teste pelo fluxo autorizado**

Localizar a linha pelo `ID da demanda` retornado e confirmar:

- `Origem = PWA`;
- `Versão do questionário = v3`;
- `Frequência pretendida (dias/semana) = 3`;
- `Objetivo principal = Outro: Reabilitação`;
- `Tempo disponível por treino = Outro: 50 min`;
- `Movimentos que incomodam = Agachar | Outro: Saltar`;
- linha correspondente em `Monitoramento` com os dois estados falsos.

Como a exclusão operacional pertence ao dashboard, remover a demanda fictícia somente pelo fluxo confirmado de exclusão do dashboard ou mantê-la marcada explicitamente como teste se o usuário preferir. Não executar exclusão direta silenciosa nas abas.

- [ ] **Step 7: Verificação final de regressão**

Confirmar que uma demanda `v1` e uma demanda `v2` ainda abrem no acompanhamento e no dashboard com suas respostas originais. Confirmar que o contador de linhas históricas não mudou, exceto pela demanda fictícia de aceite se ela não tiver sido removida.

Expected: v1/v2 legíveis, v3 ativa, nenhuma resposta histórica reescrita e URL oficial preservada.
