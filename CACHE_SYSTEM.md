# 📦 Sistema de Cache Incremental - Guia Rápido

## 🎯 Problema Resolvido

**Antes:**
- ❌ API do Trello limita 1000 actions por request
- ❌ Board movimentado = apenas ~13 dias de cobertura
- ❌ Cold start do servidor = cache perdido, precisa buscar tudo novamente
- ❌ Períodos longos (meses) = impossível buscar todos os dados

**Agora:**
- ✅ Cache persistente no browser (IndexedDB) - sobrevive a cold starts
- ✅ Paginação automática em chunks de 1 semana
- ✅ Busca apenas dados faltantes (gaps)
- ✅ Fetching paralelo inteligente
- ✅ Suporta períodos de meses ou anos

---

## 🚀 Como Usar

### Uso Básico (Automático)

```typescript
import { trelloDataService } from "@/services/trelloDataService";

// Carrega semana atual (domingo a sábado) - padrão
await trelloDataService.refreshFromBackend(boardId);

// Dados são automaticamente:
// 1. Buscados do cache (se disponível)
// 2. Preenchidos com requests à API (apenas gaps)
// 3. Salvos no cache para próximas visitas
```

### Uso Avançado

```typescript
import { trelloDataService } from "@/services/trelloDataService";

// 1. Carregar período customizado
await trelloDataService.refreshFromBackend(boardId, {
  start: new Date('2024-01-01'),
  end: new Date('2024-12-31')  // Ano inteiro!
});

// 2. Forçar refresh (ignora cache)
await trelloDataService.forceFullRefresh(boardId);

// 3. Ver estatísticas do cache
const stats = await trelloDataService.getCacheStats(boardId);
console.log(`Cache tem ${stats.totalActions} actions cobrindo ${stats.coveredDays} dias`);

// 4. Limpar cache
await trelloDataService.clearCache(boardId);
```

---

## 📊 Exemplos de Performance

### Cenário 1: Primeiro Acesso
```
Período: Semana atual (domingo a sábado)
Board movimentado: ~1200 actions/semana

Execução:
└─ Chunk 1 (semana atual): 1200 actions  ← request 1

Resultado:
✅ Total: 1200 actions
✅ Requests: 1 (rápido, ~800ms)
✅ Salvo no cache: 1200 actions
```

### Cenário 2: Acesso Subsequente (2 dias depois)
```
Cache existente: 1200 actions (semana anterior)
Novo período: Semana atual (nova semana)

Execução:
└─ Fetch: 1200 actions (semana nova)  ← 1 request (~800ms)

Resultado:
✅ Total: 1200 actions
✅ Requests: 1 (semana nova)
✅ Tempo: ~800ms

OU (mesmo dia, horas depois):
├─ Cache: 1100 actions (92%)  ← IndexedDB (instantâneo!)
└─ Fetch: 100 actions (8%)    ← 1 request (~300ms)

Resultado:
✅ Total: 1200 actions
✅ Requests: 1 (apenas novos dados do dia)
✅ Tempo: ~300ms
```

### Cenário 3: Período Longo (6 meses)
```
Período: Janeiro → Junho 2024
Cache: Já tem Maio e Junho (cache anterior)

Execução:
├─ Cache: Maio-Junho (já salvo)     ← IndexedDB
└─ Fetch: Janeiro-Abril (faltando)  ← 16 requests (4 meses × 4 semanas)
    └─ Paralelo: 3 chunks por vez
    └─ Delay 1s entre grupos

Resultado:
✅ Total: ~20.000 actions (6 meses)
✅ Requests: 16 (2 meses já em cache)
✅ Tempo: ~8-10 segundos
✅ Próximo acesso: instantâneo!
```

---

## 🔧 Configuração

### Parâmetros Configuráveis

Arquivo: `src/services/trelloIncrementalFetcher.ts`

```typescript
const DEFAULT_CONFIG: CacheConfig = {
  chunkSizeInDays: 7,           // Tamanho do chunk (1 semana)
  maxParallelFetches: 3,        // Máximo de requests simultâneos
  recentDataTtlInHours: 24,     // TTL para dados recentes
  oldDataThresholdInMonths: 3,  // Dados antigos nunca expiram
};

// Customize ao instanciar:
const fetcher = new TrelloIncrementalFetcher({
  chunkSizeInDays: 14,          // Chunks de 2 semanas
  maxParallelFetches: 5,        // Mais agressivo (cuidado com rate limit!)
});
```

### Trade-offs

| Configuração | Menor Valor | Maior Valor |
|--------------|-------------|-------------|
| **chunkSizeInDays** | Mais requests, mais granular | Menos requests, chunks maiores |
| **maxParallelFetches** | Mais lento, mais seguro | Mais rápido, risco de rate limit |

**Recomendado (padrão):**
- `chunkSizeInDays: 7` - Balanceio ideal
- `maxParallelFetches: 3` - Seguro para rate limit do Trello (100 req/10s)

---

## 🔍 Debugging

### Ver Cache no Browser

**Chrome DevTools:**
1. Abra DevTools (F12)
2. Vá em `Application`
3. Navegue para `IndexedDB` > `trello-insights-cache`
4. Explore os stores:
   - `actions`: Ações do Trello
   - `cards`: Cards do board
   - `metadata`: Períodos cobertos

### Logs no Console

Todos os logs têm prefixo para fácil filtragem:

```javascript
// Filtrar por serviço:
[IndexedDBCache] ...        // Operações de persistência
[TrelloIncrementalFetcher] ...  // Fetching e paginação
[TrelloDataService] ...     // Orquestração geral

// Exemplo de log:
[TrelloIncrementalFetcher] Análise de cache: fullyCovered=false, gaps=2, cachedPeriods=1
[TrelloIncrementalFetcher] Buscando 2 chunks de dados
[TrelloIncrementalFetcher] Chunk retornou 873 actions
[IndexedDBCache] 873 actions salvas
[TrelloDataService] Fetch concluído: 1746 actions, fromCache=true, chunks: 1 cached + 2 fetched
```

### Comandos Úteis (Console do Browser)

```javascript
// Importar service
const { trelloDataService } = await import('./services/trelloDataService');
const BOARD_ID = "659436fd99b94b5c7432e98e";

// Ver estatísticas
const stats = await trelloDataService.getCacheStats(BOARD_ID);
console.table(stats);

// Limpar cache
await trelloDataService.clearCache(BOARD_ID);

// Forçar refresh
await trelloDataService.forceFullRefresh(BOARD_ID);

// Ver metadata
const cache = await import('./services/cache/indexedDBCache');
const metadata = await cache.indexedDBCache.getMetadata(BOARD_ID);
console.log('Períodos cobertos:', metadata.coveredPeriods);
```

---

## ⚠️ Limitações e Considerações

### 1. Storage do Browser

**Limites:**
- LocalStorage: ~5MB (não usado)
- IndexedDB: ~50MB (Chrome/Firefox) a vários GB (depende do browser)

**Estimativa de uso:**
- 1 action ≈ 500 bytes
- 10.000 actions ≈ 5MB
- 100.000 actions ≈ 50MB

**Para boards muito grandes (100k+ actions):**
- Considere limitar período máximo (ex: últimos 6 meses)
- Implemente limpeza automática de dados antigos

### 2. Rate Limits da API do Trello

**Limites oficiais:**
- 100 requests por 10 segundos
- 300 requests por minuto

**Nossa implementação:**
- Máximo 3 requests paralelos
- Delay de 1s entre grupos de 3
- Throughput: ~12 requests/minuto (seguro!)

**Se precisar de mais throughput:**
```typescript
// ⚠️ Use com cuidado!
const fetcher = new TrelloIncrementalFetcher({
  maxParallelFetches: 5,  // Mais agressivo
});
```

### 3. IndexedDB não disponível

**Quando pode não estar disponível:**
- Navegadores muito antigos (IE < 10)
- Modo privado/incógnito (alguns browsers)
- Storage do browser desabilitado

**Fallback automático:**
```typescript
// O sistema detecta automaticamente e:
// 1. Loga warning no console
// 2. Faz requests diretos à API (sem cache)
// 3. Funciona normalmente, apenas mais lento

console.warn("[IndexedDBCache] IndexedDB não disponível neste ambiente");
// Sistema continua funcionando ✅
```

---

## 🧪 Testes Manuais

### Teste 1: Cache Funciona

```bash
# 1. Abra a aplicação
# 2. Aguarde carregar dados (primeiros requests)
# 3. Abra DevTools > Network > Limpar
# 4. Recarregue a página (F5)
# 5. Verifique Network:
#    ✅ Nenhum ou poucos requests
#    ✅ Gráficos aparecem rapidamente
```

### Teste 2: Gap Detection

```bash
# 1. Carregue últimas 2 semanas
# 2. Aguarde completar
# 3. No console:
await trelloDataService.refreshFromBackend(BOARD_ID, {
  start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), # 60 dias
  end: new Date()
});
# 4. Observe logs:
#    ✅ "gaps=X" (deve identificar semanas 3-8 como gaps)
#    ✅ Busca apenas gaps
```

### Teste 3: Cold Start

```bash
# 1. Carregue a aplicação
# 2. Aguarde completar
# 3. Feche o navegador completamente
# 4. (Opcional) Reinicie o servidor Next.js
# 5. Abra navegador novamente
# 6. Verifique:
#    ✅ Cache ainda funciona (IndexedDB é persistente)
#    ✅ Gráficos aparecem rápido
#    ✅ Poucos ou nenhum request
```

---

## 📈 Monitoramento de Performance

### Métricas Importantes

```typescript
// Após carregar dados:
const stats = await trelloDataService.getCacheStats(BOARD_ID);

// KPIs:
console.log(`
Cache Hit Rate: ${stats.totalActions > 0 ? 'Bom' : 'Vazio'}
Cobertura: ${stats.coveredDays} dias
Actions/dia: ${stats.totalActions / stats.coveredDays}
Período: ${stats.oldestAction} → ${stats.newestAction}
`);
```

### Logs de Performance

```javascript
// Ative logs detalhados (já habilitados por padrão):
[TrelloDataService] Fetch concluído: 3847 actions, 156 cards, fromCache=true, chunks: 3 cached + 1 fetched, requests: 2

// Decodificando:
// - 3847 actions retornadas
// - fromCache=true: pelo menos parte veio do cache
// - 3 chunks cached: 3 semanas já estavam no cache
// - 1 fetched: 1 semana foi buscada da API
// - 2 requests: 1 para actions + 1 para cards
```

---

## 🔐 Segurança

### Dados Armazenados Localmente

**O que está no cache:**
- ✅ Actions (movimentos de cards entre listas)
- ✅ Cards (informações básicas)
- ✅ Metadata (períodos cobertos)

**O que NÃO está no cache:**
- ❌ Credenciais (API Key/Token)
- ❌ Dados sensíveis de usuários
- ❌ Informações de autenticação

### Privacidade

- IndexedDB é isolado por domínio (CORS)
- Dados não são compartilhados entre sites
- Usuário pode limpar cache a qualquer momento (DevTools)

### Limpeza de Cache

```typescript
// Manual (via código):
await trelloDataService.clearCache(BOARD_ID);

// Manual (via browser):
// Chrome: Settings > Privacy > Clear browsing data > Cached images and files

// Automática (futura implementação):
// - Dados mais antigos que 1 ano são removidos automaticamente
// - Storage atingindo limite: remove dados mais antigos
```

---

## 🎓 Para Desenvolvedores

### Adicionar Novo Campo ao Cache

```typescript
// 1. Atualizar tipos em src/services/cache/types.ts
interface ActionRecord {
  id: string;
  boardId: string;
  date: number;
  data: TrelloApiAction;
  customField: string;  // ← Novo campo
}

// 2. Incrementar versão do DB em indexedDBCache.ts
const DB_VERSION = 2;  // ← Foi 1, agora 2

// 3. Adicionar migração em onupgradeneeded:
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  
  if (oldVersion < 2) {
    // Migração v1 → v2
    const store = transaction.objectStore(STORE_ACTIONS);
    store.createIndex("customField", "customField", { unique: false });
  }
};
```

### Adicionar Novo Store

```typescript
// Em indexedDBCache.ts:
const STORE_MY_NEW_DATA = "myNewData";

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  if (!db.objectStoreNames.contains(STORE_MY_NEW_DATA)) {
    const store = db.createObjectStore(STORE_MY_NEW_DATA, { keyPath: "id" });
    store.createIndex("boardId", "boardId", { unique: false });
  }
};
```

### Testar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Desabilitar mock (usar API real)
echo "NEXT_PUBLIC_USE_MOCK=false" > .env.local
echo "TRELLO_API_KEY=sua_key" >> .env.local
echo "TRELLO_API_TOKEN=seu_token" >> .env.local

# 3. Rodar em dev
npm run dev

# 4. Abrir DevTools e monitorar:
# - Console: logs detalhados
# - Application > IndexedDB: ver dados
# - Network: verificar requests
```

---

## 🐛 Troubleshooting

### Problema: Cache não está salvando

**Sintomas:**
- Sempre faz requests completos
- IndexedDB aparece vazio no DevTools

**Soluções:**
1. Verificar se IndexedDB está habilitado:
```javascript
if (typeof indexedDB === 'undefined') {
  console.error('IndexedDB não disponível');
}
```

2. Verificar modo privado (desabilita IndexedDB em alguns browsers)

3. Verificar storage quota:
```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log(`Usage: ${estimate.usage} / ${estimate.quota}`);
}
```

### Problema: Requests duplicados

**Sintomas:**
- Busca mesma semana múltiplas vezes
- Logs mostram `removidas X actions duplicadas`

**Soluções:**
1. Verificar merge de períodos:
```javascript
const metadata = await indexedDBCache.getMetadata(BOARD_ID);
console.log('Períodos:', metadata.coveredPeriods);
// Deve ter períodos mesclados, não fragmentados
```

2. Forçar limpeza e refresh:
```javascript
await trelloDataService.clearCache(BOARD_ID);
await trelloDataService.forceFullRefresh(BOARD_ID);
```

### Problema: Performance ruim

**Sintomas:**
- Carregamento lento mesmo com cache
- Browser travando

**Soluções:**
1. Verificar quantidade de dados:
```javascript
const stats = await trelloDataService.getCacheStats(BOARD_ID);
if (stats.totalActions > 50000) {
  console.warn('Cache muito grande! Considere limitar período.');
}
```

2. Reduzir período padrão:
```typescript
// Em trelloDataService.ts:
const defaultDateRange = {
  start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),  // 2 semanas (foi 4)
  end: new Date(),
};
```

---

## 📚 Referências Técnicas

- **IndexedDB API**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **IndexedDB Best Practices**: https://web.dev/indexeddb-best-practices/
- **Trello API - Actions**: https://developer.atlassian.com/cloud/trello/rest/api-group-actions/
- **Next.js Data Fetching**: https://nextjs.org/docs/app/building-your-application/data-fetching

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025  
**Autor:** AI Assistant + Silvio Ubaldino

