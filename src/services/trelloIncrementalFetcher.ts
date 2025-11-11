/**
 * Trello Incremental Fetcher
 * 
 * Orquestra fetching incremental e inteligente de dados do Trello:
 * - Divide períodos em chunks
 * - Identifica gaps no cache
 * - Busca apenas dados faltantes
 * - Gerencia requisições paralelas
 * - Respeita rate limits
 */

import { TrelloApiAction, TrelloApiCard } from "@/types/trello";
import { indexedDBCache } from "./cache/indexedDBCache";
import {
  DateRange,
  IncrementalFetchOptions,
  IncrementalFetchResult,
  CacheConfig,
} from "./cache/types";

// Configuração padrão
const DEFAULT_CONFIG: CacheConfig = {
  dbName: "trello-insights-cache",
  dbVersion: 1,
  chunkSizeInDays: 7, // 1 semana por chunk
  maxParallelFetches: 3, // Máximo de 3 requests simultâneos
  recentDataTtlInHours: 24, // Revalida dados recentes a cada 24h
  oldDataThresholdInMonths: 3, // Dados mais antigos que 3 meses nunca expiram
};

/**
 * Serviço de fetch incremental de dados do Trello
 */
export class TrelloIncrementalFetcher {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Busca dados para um período, usando cache quando possível
   */
  async fetchPeriod(options: IncrementalFetchOptions): Promise<IncrementalFetchResult> {
    const { boardId, dateRange, forceRefresh = false, parallel = true } = options;

    // Se forceRefresh, ignora cache
    if (forceRefresh) {
      console.log(`🔄 [Fetch] Force refresh - ignorando cache`);
      return this.fetchFromApi(boardId, dateRange, parallel);
    }

    // Analisa gaps no cache
    const gapAnalysis = await indexedDBCache.analyzeGaps(boardId, dateRange);

    // Se está totalmente coberto, retorna do cache
    if (gapAnalysis.fullyCovered) {
      const actions = await indexedDBCache.getActions(boardId, dateRange);
      const cards = await indexedDBCache.getCards(boardId);

      console.log(`💾 [Cache Hit] ${actions.length} actions, ${cards.length} cards`);

      return {
        actions,
        cards,
        fromCache: true,
        fetchedChunks: 0,
        cachedChunks: gapAnalysis.cachedPeriods.length,
        totalRequests: 0,
      };
    }

    // Cache parcial ou vazio
    console.log(`⚡ [Cache Partial] Buscando ${gapAnalysis.gaps.length} gaps`);

    // Busca dados dos gaps
    const gapResults = await this.fetchGaps(boardId, gapAnalysis.gaps, parallel);

    // Busca dados do cache para períodos já cobertos
    let cachedActions: TrelloApiAction[] = [];
    for (const period of gapAnalysis.cachedPeriods) {
      const actions = await indexedDBCache.getActions(boardId, period);
      cachedActions = cachedActions.concat(actions);
    }

    // Busca cards (sempre busca tudo, pois são poucos)
    const cards = await this.fetchCards(boardId);

    // Merge e deduplicação
    const allActions = this.deduplicateActions([...cachedActions, ...gapResults.actions]);

    // Ordena por data (mais recente primeiro)
    allActions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(
      `✅ [Fetch Done] ${allActions.length} actions (${cachedActions.length} cache + ${gapResults.actions.length} API), ${cards.length} cards`
    );

    return {
      actions: allActions,
      cards,
      fromCache: gapAnalysis.cachedPeriods.length > 0,
      fetchedChunks: gapResults.chunksCount,
      cachedChunks: gapAnalysis.cachedPeriods.length,
      totalRequests: gapResults.requestsCount + 1, // +1 para cards
    };
  }

  /**
   * Busca dados de múltiplos gaps
   */
  private async fetchGaps(
    boardId: string,
    gaps: DateRange[],
    parallel: boolean
  ): Promise<{ actions: TrelloApiAction[]; chunksCount: number; requestsCount: number }> {
    if (gaps.length === 0) {
      return { actions: [], chunksCount: 0, requestsCount: 0 };
    }

    // Divide gaps em chunks
    const allChunks = gaps.flatMap((gap) => this.splitIntoChunks(gap));

    let allActions: TrelloApiAction[] = [];
    let requestsCount = 0;

    if (parallel && allChunks.length > 1) {
      // Busca paralela (respeitando limite)
      const chunkGroups = this.groupChunksForParallel(
        allChunks,
        this.config.maxParallelFetches
      );

      for (const group of chunkGroups) {
        const results = await Promise.all(
          group.map((chunk) => this.fetchActionsChunk(boardId, chunk))
        );

        for (const result of results) {
          allActions = allActions.concat(result.actions);
          requestsCount += result.requestsCount;

          // Salva no cache
          if (result.actions.length > 0) {
            await indexedDBCache.saveActions(boardId, result.actions);
            await indexedDBCache.registerCoveredPeriod(boardId, {
              start: result.chunk.start,
              end: result.chunk.end,
              actionCount: result.actions.length,
            });
          }
        }

        // Delay entre grupos para respeitar rate limit (100 req/10s = 10 req/s)
        if (chunkGroups.indexOf(group) < chunkGroups.length - 1) {
          await this.delay(1000);
        }
      }
    } else {
      // Busca sequencial
      for (const chunk of allChunks) {
        const result = await this.fetchActionsChunk(boardId, chunk);
        allActions = allActions.concat(result.actions);
        requestsCount += result.requestsCount;

        // Salva no cache
        if (result.actions.length > 0) {
          await indexedDBCache.saveActions(boardId, result.actions);
          await indexedDBCache.registerCoveredPeriod(boardId, {
            start: chunk.start,
            end: chunk.end,
            actionCount: result.actions.length,
          });
        }

        await this.delay(200);
      }
    }

    return {
      actions: allActions,
      chunksCount: allChunks.length,
      requestsCount,
    };
  }

  /**
   * Divide período em chunks menores
   */
  private splitIntoChunks(period: DateRange): DateRange[] {
    const chunks: DateRange[] = [];
    const chunkSizeMs = this.config.chunkSizeInDays * 24 * 60 * 60 * 1000;

    let currentStart = period.start.getTime();
    const endTime = period.end.getTime();

    while (currentStart < endTime) {
      const currentEnd = Math.min(currentStart + chunkSizeMs, endTime);

      chunks.push({
        start: new Date(currentStart),
        end: new Date(currentEnd),
      });

      currentStart = currentEnd;
    }

    return chunks;
  }

  /**
   * Agrupa chunks para busca paralela
   */
  private groupChunksForParallel(chunks: DateRange[], groupSize: number): DateRange[][] {
    const groups: DateRange[][] = [];

    for (let i = 0; i < chunks.length; i += groupSize) {
      groups.push(chunks.slice(i, i + groupSize));
    }

    return groups;
  }

  /**
   * Busca actions de um chunk específico via API
   */
  private async fetchActionsChunk(
    boardId: string,
    chunk: DateRange
  ): Promise<{ actions: TrelloApiAction[]; chunk: DateRange; requestsCount: number }> {
    try {
      const since = chunk.start.toISOString().split('T')[0];
      const before = chunk.end.toISOString().split('T')[0];

      const url = `/api/trello/actions/${encodeURIComponent(
        boardId
      )}?since=${since}&before=${before}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });

      const actions: TrelloApiAction[] = response.ok ? await response.json() : [];

      console.log(
        `📡 [API] GET actions?since=${since}&before=${before} → ${response.status} (${actions.length} items)`
      );

      return { actions, chunk, requestsCount: 1 };
    } catch (error) {
      console.error("❌ [API Error]", error);
      return { actions: [], chunk, requestsCount: 1 };
    }
  }

  /**
   * Busca cards via API
   */
  private async fetchCards(boardId: string): Promise<TrelloApiCard[]> {
    try {
      const url = `/api/trello/cards/${encodeURIComponent(boardId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });

      const cards: TrelloApiCard[] = response.ok ? await response.json() : [];

      console.log(`📡 [API] GET cards → ${response.status} (${cards.length} items)`);

      // Salva no cache
      if (cards.length > 0) {
        await indexedDBCache.saveCards(boardId, cards);
      }

      return cards;
    } catch (error) {
      console.error("❌ [API Error]", error);
      // Fallback: tenta buscar do cache
      return indexedDBCache.getCards(boardId);
    }
  }

  /**
   * Busca dados completos da API (sem usar cache)
   */
  private async fetchFromApi(
    boardId: string,
    dateRange: DateRange,
    parallel: boolean
  ): Promise<IncrementalFetchResult> {
    const chunks = this.splitIntoChunks(dateRange);
    const gapResults = await this.fetchGaps(boardId, chunks, parallel);
    const cards = await this.fetchCards(boardId);

    return {
      actions: gapResults.actions,
      cards,
      fromCache: false,
      fetchedChunks: gapResults.chunksCount,
      cachedChunks: 0,
      totalRequests: gapResults.requestsCount + 1,
    };
  }

  /**
   * Deduplica actions por ID
   */
  private deduplicateActions(actions: TrelloApiAction[]): TrelloApiAction[] {
    const seen = new Set<string>();
    const unique: TrelloApiAction[] = [];

    for (const action of actions) {
      if (!seen.has(action.id)) {
        seen.add(action.id);
        unique.push(action);
      }
    }

    return unique;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retorna estatísticas do cache
   */
  async getCacheStats(boardId: string) {
    return indexedDBCache.getStats(boardId);
  }

  /**
   * Limpa cache de um board
   */
  async clearCache(boardId: string) {
    return indexedDBCache.clearBoard(boardId);
  }
}

// Singleton instance
export const trelloIncrementalFetcher = new TrelloIncrementalFetcher();

