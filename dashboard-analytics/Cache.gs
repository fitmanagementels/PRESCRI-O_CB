function obterCacheAnalytics_() {
  try {
    const cache = CacheService.getScriptCache();
    const metaTexto = cache.get(ANALYTICS_CONFIG.cacheKey + '_meta');
    if (!metaTexto) return null;
    const meta = JSON.parse(metaTexto);
    const chaves = [];
    for (let i = 0; i < meta.partes; i++) chaves.push(ANALYTICS_CONFIG.cacheKey + '_' + i);
    const partes = cache.getAll(chaves);
    const texto = chaves.map(function (chave) { return partes[chave] || ''; }).join('');
    return texto ? JSON.parse(texto) : null;
  } catch (erro) { return null; }
}

function salvarCacheAnalytics_(payload) {
  try {
    const cache = CacheService.getScriptCache();
    const texto = JSON.stringify(payload);
    const tamanho = 20000;
    const valores = {};
    let partes = 0;
    for (let inicio = 0; inicio < texto.length; inicio += tamanho) {
      valores[ANALYTICS_CONFIG.cacheKey + '_' + partes] = texto.slice(inicio, inicio + tamanho);
      partes++;
    }
    cache.putAll(valores, ANALYTICS_CONFIG.cacheSeconds);
    cache.put(ANALYTICS_CONFIG.cacheKey + '_meta', JSON.stringify({ partes: partes }), ANALYTICS_CONFIG.cacheSeconds);
    return true;
  } catch (erro) { return false; }
}

function limparCacheAnalytics_() {
  try {
    const cache = CacheService.getScriptCache();
    const meta = JSON.parse(cache.get(ANALYTICS_CONFIG.cacheKey + '_meta') || '{"partes":0}');
    const chaves = [ANALYTICS_CONFIG.cacheKey + '_meta'];
    for (let i = 0; i < meta.partes; i++) chaves.push(ANALYTICS_CONFIG.cacheKey + '_' + i);
    cache.removeAll(chaves);
  } catch (erro) { /* Cache é uma otimização, não uma dependência. */ }
}
