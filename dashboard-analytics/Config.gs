const ANALYTICS_CONFIG = Object.freeze({
  spreadsheetId: '1qyk_MfgfAP6-n_FlzVaHGcM9o2sIH6WVTv91TExkJNs',
  abaRespostas: 'Respostas',
  abaMonitoramento: 'Monitoramento',
  abaHistorico: 'Analytics_Historico',
  abaQuestionario: 'Questionário',
  abaExclusoes: 'Analytics_Exclusoes',
  timeZone: 'America/Fortaleza',
  slaDias: 2,
  cacheSeconds: 600,
  cacheKey: 'dashboard_analytics_payload_pwa_v3',
  versao: 1,
  equipeId: '__EQUIPE__',
});

const ANALYTICS_HEADERS = Object.freeze({
  respostas: Object.freeze({
    submissionId: ['id da demanda', 'submission id'],
    dataEntrada: ['criado em', 'submitted at', 'data da anamnese', 'data de envio'],
    profissional: ['nome do profissional', 'profissional', 'trainee'],
    aluno: ['nome completo', 'aluno', 'nome do aluno'],
    whatsapp: ['whatsapp', 'whats app', 'telefone', 'celular'],
  }),
  monitoramento: Object.freeze({
    submissionId: ['id da demanda', 'submission id'],
    dataEntrada: ['data da anamnese'],
    aluno: ['aluno'],
    profissional: ['profissional'],
    transferida: ['anamnese transferida?'],
    prescrita: ['treino prescrito?'],
    dataConclusao: ['data da prescrição', 'data da prescricao'],
    atualizadoEm: ['atualizado em'],
  }),
});
