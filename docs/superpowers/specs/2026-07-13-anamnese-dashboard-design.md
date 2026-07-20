# Consulta de anamnese no dashboard — desenho aprovado

## Objetivo

Permitir que o gestor abra a ficha completa de anamnese diretamente na aba Acompanhamento, sem sair do dashboard e sem tornar o carregamento inicial mais lento.

## Interação

- Cada cartão de demanda será clicável e terá um botão explícito `Ver anamnese`.
- Clique no cartão, toque no botão ou uso de `Enter`/barra de espaço abrirão a mesma ficha.
- Um modal somente leitura mostrará nome do aluno, data da resposta e profissional responsável.
- O modal fechará pelo botão `×`, pela tecla `Esc` ou por clique no fundo.
- A abertura exibirá um estado curto de carregamento; falhas terão mensagem e botão para tentar novamente.

## Carregamento e privacidade

- O payload principal do dashboard continuará contendo apenas os dados operacionais atuais.
- A anamnese será buscada em `Respostas` pelo `Submission ID` somente após a ação do gestor.
- A resposta completa não será gravada em `Analytics_Historico`, CacheService ou documentação.
- O navegador manterá um cache apenas em memória durante a sessão para reabrir fichas já consultadas sem nova leitura.
- O backend continuará sem escrever, formatar ou reorganizar `Respostas` e `Monitoramento`.

## Organização da ficha

O modal seguirá a organização já consolidada no app operacional:

1. Identificação — retraída por padrão;
2. Perfil físico, objetivo e rotina — expandida por padrão;
3. Dores, lesões e condições de saúde;
4. Restrições e movimentos;
5. Preferências e observações.

As categorias serão retráteis e haverá um controle para expandir ou recolher todas. Campos técnicos, cabeçalhos vazios e perguntas de consentimento não serão exibidos. Datas serão apresentadas no padrão brasileiro.

## Arquitetura

- `Dados.gs`: função pública de leitura pontual por `Submission ID` e transformação segura de cabeçalhos/valores.
- `index.html`: um único modal reutilizável de anamnese.
- `scripts.html`: acionamento dos cartões, estado de carregamento, cache em memória, categorias e renderização.
- `styles.html`: modal responsivo e cartões com affordance de clique.
- O código não dependerá do projeto operacional em tempo de execução; a lógica necessária será implementada no segundo projeto.

## Tratamento de erros

- ID vazio: rejeitar sem consultar a planilha.
- ID inexistente: informar que a anamnese não foi localizada.
- Aba ou cabeçalho incompatível: orientar a verificar a migração da planilha oficial.
- Falha temporária: preservar o modal e oferecer nova tentativa.

## Verificação

- Testar leitura de apenas uma linha e ausência de qualquer escrita nas fontes.
- Testar filtragem de consentimento e campos técnicos.
- Testar abertura pelo cartão e botão, carregamento, sucesso, erro, cache em memória e fechamento.
- Revisar modal em 430×932 e 1280×900.
- Executar todas as suítes existentes e regenerar o preview com dados exclusivamente sintéticos.
