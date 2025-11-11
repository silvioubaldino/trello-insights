/**
 * Tipos para o sistema de cache IndexedDB
 */

import { TrelloApiAction, TrelloApiCard } from "@/types/trello";

/**
 * Registro de action no IndexedDB
 */
export interface ActionRecord {
  id: string;              // action.id (Primary Key)
  boardId: string;         // Índice para queries por board
  date: number;            // timestamp (índice para queries por período)
  data: TrelloApiAction;   // Dados completos da action
}

/**
 * Registro de card no IndexedDB
 */
export interface CardRecord {
  id: string;              // card.id (Primary Key)
  boardId: string;         // Índice para queries por board
  data: TrelloApiCard;     // Dados completos do card
  lastSync: number;        // timestamp da última sincronização
}

/**
 * Período coberto pelo cache
 */
export interface CoveredPeriod {
  start: Date;
  end: Date;
  actionCount: number;
  fetchedAt: Date;         // Quando foi buscado
}

/**
 * Metadados do cache por board
 */
export interface CacheMetadata {
  boardId: string;         // Primary Key
  coveredPeriods: CoveredPeriod[];
  lastFullSync: Date | null;
  totalActions: number;
  totalCards: number;
  version: number;         // Versão do schema
}

/**
 * Range de datas para queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Resultado de análise de gaps no cache
 */
export interface CacheGapAnalysis {
  fullyCovered: boolean;
  gaps: DateRange[];
  cachedPeriods: DateRange[];
}

/**
 * Configuração do sistema de cache
 */
export interface CacheConfig {
  dbName: string;
  dbVersion: number;
  chunkSizeInDays: number;          // Tamanho do chunk para paginação (padrão: 7)
  maxParallelFetches: number;       // Máximo de fetches paralelos (padrão: 3)
  recentDataTtlInHours: number;     // TTL para dados recentes (padrão: 24h)
  oldDataThresholdInMonths: number; // Dados mais antigos que isso nunca expiram (padrão: 3 meses)
}

/**
 * Estatísticas do cache (para debugging/monitoring)
 */
export interface CacheStats {
  boardId: string;
  totalActions: number;
  totalCards: number;
  oldestAction: Date | null;
  newestAction: Date | null;
  coveredDays: number;
  lastUpdate: Date | null;
  sizeInMB: number;
}

/**
 * Opções para fetch incremental
 */
export interface IncrementalFetchOptions {
  boardId: string;
  dateRange: DateRange;
  forceRefresh?: boolean;  // Ignora cache e busca tudo novamente
  parallel?: boolean;      // Permite fetches paralelos
}

/**
 * Resultado de fetch incremental
 */
export interface IncrementalFetchResult {
  actions: TrelloApiAction[];
  cards: TrelloApiCard[];
  fromCache: boolean;
  fetchedChunks: number;
  cachedChunks: number;
  totalRequests: number;
}

