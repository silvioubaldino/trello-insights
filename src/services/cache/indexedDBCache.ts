/**
 * IndexedDB Cache Service
 * 
 * Gerencia cache persistente de dados do Trello no browser.
 * Utiliza IndexedDB para armazenamento local que sobrevive a reloads e cold starts.
 */

import { TrelloApiAction, TrelloApiCard } from "@/types/trello";
import {
  ActionRecord,
  CardRecord,
  CacheMetadata,
  DateRange,
  CacheGapAnalysis,
  CacheStats,
  CoveredPeriod,
} from "./types";

const DB_NAME = "trello-insights-cache";
const DB_VERSION = 1;

// Store names
const STORE_ACTIONS = "actions";
const STORE_CARDS = "cards";
const STORE_METADATA = "metadata";

/**
 * Wrapper do IndexedDB com operações otimizadas para cache de dados do Trello
 */
export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Inicialização lazy - só abre o banco quando necessário
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;

    // Se já está inicializando, aguarda
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Verifica se IndexedDB está disponível
      if (typeof indexedDB === "undefined") {
        console.warn("[IndexedDBCache] IndexedDB não disponível neste ambiente");
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("[IndexedDBCache] Erro ao abrir banco:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store de actions
        if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
          const actionStore = db.createObjectStore(STORE_ACTIONS, { keyPath: "id" });
          actionStore.createIndex("boardId", "boardId", { unique: false });
          actionStore.createIndex("date", "date", { unique: false });
          actionStore.createIndex("boardId_date", ["boardId", "date"], { unique: false });
        }

        // Store de cards
        if (!db.objectStoreNames.contains(STORE_CARDS)) {
          const cardStore = db.createObjectStore(STORE_CARDS, { keyPath: "id" });
          cardStore.createIndex("boardId", "boardId", { unique: false });
          cardStore.createIndex("lastSync", "lastSync", { unique: false });
        }

        // Store de metadata
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          db.createObjectStore(STORE_METADATA, { keyPath: "boardId" });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Salva actions no cache
   */
  async saveActions(boardId: string, actions: TrelloApiAction[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([STORE_ACTIONS], "readwrite");
    const store = transaction.objectStore(STORE_ACTIONS);

    const records: ActionRecord[] = actions.map((action) => ({
      id: action.id,
      boardId,
      date: new Date(action.date).getTime(),
      data: action,
    }));

    // Salva em batch
    for (const record of records) {
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Salva cards no cache
   */
  async saveCards(boardId: string, cards: TrelloApiCard[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([STORE_CARDS], "readwrite");
    const store = transaction.objectStore(STORE_CARDS);

    const now = Date.now();
    const records: CardRecord[] = cards.map((card) => ({
      id: card.id,
      boardId,
      data: card,
      lastSync: now,
    }));

    for (const record of records) {
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Busca actions por período
   */
  async getActions(boardId: string, dateRange: DateRange): Promise<TrelloApiAction[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction([STORE_ACTIONS], "readonly");
    const store = transaction.objectStore(STORE_ACTIONS);
    const index = store.index("boardId_date");

    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    // Query usando índice composto
    const range = IDBKeyRange.bound([boardId, startTime], [boardId, endTime]);

    return new Promise((resolve, reject) => {
      const request = index.getAll(range);

      request.onsuccess = () => {
        const records = request.result as ActionRecord[];
        const actions = records.map((r) => r.data);
        resolve(actions);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca todos os cards de um board
   */
  async getCards(boardId: string): Promise<TrelloApiCard[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction([STORE_CARDS], "readonly");
    const store = transaction.objectStore(STORE_CARDS);
    const index = store.index("boardId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(boardId);

      request.onsuccess = () => {
        const records = request.result as CardRecord[];
        const cards = records.map((r) => r.data);
        resolve(cards);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Atualiza metadata do cache
   */
  async updateMetadata(metadata: CacheMetadata): Promise<void> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const transaction = this.db.transaction([STORE_METADATA], "readwrite");
    const store = transaction.objectStore(STORE_METADATA);

    store.put(metadata);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Busca metadata de um board
   */
  async getMetadata(boardId: string): Promise<CacheMetadata | null> {
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_METADATA], "readonly");
    const store = transaction.objectStore(STORE_METADATA);

    return new Promise((resolve, reject) => {
      const request = store.get(boardId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Registra um novo período coberto pelo cache
   */
  async registerCoveredPeriod(
    boardId: string,
    period: Omit<CoveredPeriod, "fetchedAt">
  ): Promise<void> {
    const metadata = await this.getMetadata(boardId);

    const newPeriod: CoveredPeriod = {
      ...period,
      fetchedAt: new Date(),
    };

    if (!metadata) {
      // Cria novo metadata
      const newMetadata: CacheMetadata = {
        boardId,
        coveredPeriods: [newPeriod],
        lastFullSync: null,
        totalActions: period.actionCount,
        totalCards: 0,
        version: DB_VERSION,
      };
      await this.updateMetadata(newMetadata);
    } else {
      // Merge com períodos existentes (evita sobreposições)
      const mergedPeriods = this.mergePeriods([...metadata.coveredPeriods, newPeriod]);

      const updatedMetadata: CacheMetadata = {
        ...metadata,
        coveredPeriods: mergedPeriods,
        totalActions: metadata.totalActions + period.actionCount,
      };
      await this.updateMetadata(updatedMetadata);
    }
  }

  /**
   * Merge de períodos sobrepostos ou adjacentes
   */
  private mergePeriods(periods: CoveredPeriod[]): CoveredPeriod[] {
    if (periods.length === 0) return [];

    // Ordena por data de início
    const sorted = periods.sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: CoveredPeriod[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // Se há sobreposição ou adjacência, merge
      if (current.start.getTime() <= last.end.getTime()) {
        last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
        last.actionCount += current.actionCount;
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Analisa gaps no cache para um período solicitado
   */
  async analyzeGaps(boardId: string, requestedRange: DateRange): Promise<CacheGapAnalysis> {
    const metadata = await this.getMetadata(boardId);

    if (!metadata || metadata.coveredPeriods.length === 0) {
      // Cache vazio - todo o período é um gap
      return {
        fullyCovered: false,
        gaps: [requestedRange],
        cachedPeriods: [],
      };
    }

    const { coveredPeriods } = metadata;
    const gaps: DateRange[] = [];
    const cachedPeriods: DateRange[] = [];

    let currentStart = requestedRange.start.getTime();
    const requestedEnd = requestedRange.end.getTime();

    // Ordena períodos cobertos
    const sorted = coveredPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

    for (const period of sorted) {
      const periodStart = period.start.getTime();
      const periodEnd = period.end.getTime();

      // Pula períodos que estão totalmente fora do range solicitado
      if (periodEnd < currentStart || periodStart > requestedEnd) {
        continue;
      }

      // Se há gap antes deste período
      if (currentStart < periodStart) {
        gaps.push({
          start: new Date(currentStart),
          end: new Date(Math.min(periodStart, requestedEnd)),
        });
      }

      // Adiciona período coberto
      const cachedStart = Math.max(currentStart, periodStart);
      const cachedEnd = Math.min(periodEnd, requestedEnd);

      if (cachedStart < cachedEnd) {
        cachedPeriods.push({
          start: new Date(cachedStart),
          end: new Date(cachedEnd),
        });
      }

      currentStart = Math.max(currentStart, periodEnd);

      // Se já cobrimos todo o período solicitado
      if (currentStart >= requestedEnd) {
        break;
      }
    }

    // Gap final (se houver)
    if (currentStart < requestedEnd) {
      gaps.push({
        start: new Date(currentStart),
        end: new Date(requestedEnd),
      });
    }

    return {
      fullyCovered: gaps.length === 0,
      gaps,
      cachedPeriods,
    };
  }

  /**
   * Retorna estatísticas do cache
   */
  async getStats(boardId: string): Promise<CacheStats | null> {
    const metadata = await this.getMetadata(boardId);
    if (!metadata) return null;

    // Busca data mais antiga e mais recente
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_ACTIONS], "readonly");
    const store = transaction.objectStore(STORE_ACTIONS);
    const index = store.index("boardId_date");

    const range = IDBKeyRange.bound([boardId, 0], [boardId, Date.now()]);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      let oldestAction: Date | null = null;
      let newestAction: Date | null = null;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;

        if (cursor) {
          const record = cursor.value as ActionRecord;
          const actionDate = new Date(record.date);

          if (!oldestAction) oldestAction = actionDate;
          newestAction = actionDate;

          cursor.continue();
        } else {
          // Fim do cursor
          const coveredDays =
            oldestAction && newestAction
              ? Math.ceil(
                  (newestAction.getTime() - oldestAction.getTime()) / (1000 * 60 * 60 * 24)
                )
              : 0;

          resolve({
            boardId,
            totalActions: metadata.totalActions,
            totalCards: metadata.totalCards,
            oldestAction,
            newestAction,
            coveredDays,
            lastUpdate: metadata.lastFullSync,
            sizeInMB: 0, // TODO: calcular tamanho real se necessário
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa todo o cache de um board
   */
  async clearBoard(boardId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(
      [STORE_ACTIONS, STORE_CARDS, STORE_METADATA],
      "readwrite"
    );

    // Limpa actions
    const actionsStore = transaction.objectStore(STORE_ACTIONS);
    const actionsIndex = actionsStore.index("boardId");
    let actionsRequest = actionsIndex.openCursor(IDBKeyRange.only(boardId));

    actionsRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Limpa cards
    const cardsStore = transaction.objectStore(STORE_CARDS);
    const cardsIndex = cardsStore.index("boardId");
    let cardsRequest = cardsIndex.openCursor(IDBKeyRange.only(boardId));

    cardsRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Limpa metadata
    const metadataStore = transaction.objectStore(STORE_METADATA);
    metadataStore.delete(boardId);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Limpa todo o banco de dados
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction(
      [STORE_ACTIONS, STORE_CARDS, STORE_METADATA],
      "readwrite"
    );

    transaction.objectStore(STORE_ACTIONS).clear();
    transaction.objectStore(STORE_CARDS).clear();
    transaction.objectStore(STORE_METADATA).clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Fecha a conexão com o banco
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
export const indexedDBCache = new IndexedDBCache();

