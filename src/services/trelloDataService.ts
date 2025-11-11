import { TrelloCard, TrelloCardLegacy, TrelloFilters, ChartData } from "@/types/trello";
import { trelloDataTransformer } from "./trelloDataTransformer";
import { trelloIncrementalFetcher } from "./trelloIncrementalFetcher";
import { DateRange } from "./cache/types";

/**
 * Calcula o início da semana atual (domingo)
 */
function getCurrentWeekStart(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
  
  // Retrocede para o domingo da semana atual
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  
  // Zera horas para início do dia
  sunday.setHours(0, 0, 0, 0);
  
  return sunday;
}

/**
 * Calcula o fim da semana atual (sábado 23:59:59)
 */
function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const saturday = new Date(weekStart);
  
  // Avança 6 dias para o sábado
  saturday.setDate(weekStart.getDate() + 6);
  
  // Define para fim do dia
  saturday.setHours(23, 59, 59, 999);
  
  return saturday;
}

/**
 * Serviço para gerenciar dados do Trello
 * Processa dados da API e fornece métodos para filtragem e análise
 * 
 * Utiliza cache incremental inteligente (IndexedDB) para otimizar performance
 */
class TrelloDataService {
  private transformedCards: TrelloCard[];

  constructor() {
    // Inicializa vazio - dados são carregados via refreshFromBackend()
    this.transformedCards = [];
  }

  /**
   * Carrega dados do Trello via API com cache incremental inteligente
   * 
   * Funcionalidades:
   * - Cache persistente no IndexedDB (sobrevive a cold starts)
   * - Busca apenas gaps faltantes
   * - Suporta períodos customizados
   * - Fetching paralelo otimizado
   * 
   * @param boardId - ID do board do Trello
   * @param dateRange - Período opcional (padrão: semana atual domingo-sábado)
   * @param forceRefresh - Se true, ignora cache e busca tudo novamente
   */
  async refreshFromBackend(
    boardId: string, 
    dateRange?: DateRange,
    forceRefresh: boolean = false
  ): Promise<void> {
    const defaultDateRange: DateRange = dateRange || {
      start: getCurrentWeekStart(),
      end: getCurrentWeekEnd(),
    };

    try {
      const result = await trelloIncrementalFetcher.fetchPeriod({
        boardId,
        dateRange: defaultDateRange,
        forceRefresh,
        parallel: true,
      });

      // Transforma dados
      this.transformedCards = trelloDataTransformer.transform(result.cards, result.actions);
      
      console.log(`✅ [Data Service] ${this.transformedCards.length} cards prontos`);
    } catch (error) {
      console.error('❌ [Data Service]', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas do cache para monitoramento
   */
  async getCacheStats(boardId: string) {
    return trelloIncrementalFetcher.getCacheStats(boardId);
  }

  /**
   * Limpa o cache de um board específico
   */
  async clearCache(boardId: string) {
    console.log(`[TrelloDataService] Limpando cache do board ${boardId}`);
    await trelloIncrementalFetcher.clearCache(boardId);
  }

  /**
   * Força refresh completo (ignora cache)
   */
  async forceFullRefresh(boardId: string, dateRange?: DateRange) {
    console.log('[TrelloDataService] Forçando refresh completo (ignorando cache)');
    return this.refreshFromBackend(boardId, dateRange, true);
  }

  /**
   * Converte TrelloCard para o formato legado (para compatibilidade com UI existente)
   */
  private convertToLegacyFormat(cards: TrelloCard[]): TrelloCardLegacy[] {
    return cards.map(card => ({
      id: card.id,
      name: card.name,
      dateCreated: card.created_at,
      dateDelivered: card.due_date || undefined,
      member: card.members[0] || "Sem responsável", // Pega o primeiro membro
      labels: card.labels,
      daysOpen: card.metrics.days_open,
    }));
  }

  /**
   * Retorna todos os cards transformados (formato legado para compatibilidade)
   */
  getCards(): TrelloCardLegacy[] {
    return this.convertToLegacyFormat(this.transformedCards);
  }

  /**
   * Retorna os cards no formato completo com métricas
   */
  getTransformedCards(): TrelloCard[] {
    return this.transformedCards;
  }

  /**
   * Filtra cards baseado nos filtros fornecidos
   */
  filterCards(cards: TrelloCardLegacy[], filters: TrelloFilters): TrelloCardLegacy[] {
    let filtered = [...cards];

    if (filters.members.length > 0) {
      filtered = filtered.filter((card) =>
        filters.members.includes(card.member)
      );
    }

    if (filters.labels.length > 0) {
      filtered = filtered.filter((card) =>
        card.labels.some((label) => filters.labels.includes(label))
      );
    }

    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter((card) => {
        if (!card.dateDelivered) return false;
        return (
          card.dateDelivered >= filters.dateRange.start! &&
          card.dateDelivered <= filters.dateRange.end!
        );
      });
    }

    return filtered;
  }

  /**
   * Calcula entregas agrupadas por label (cliente)
   * Retorna os 10 maiores clientes ordenados, agrupando os demais como "Outros"
   */
  getDeliveriesByLabel(cards: TrelloCardLegacy[]): ChartData[] {
    const labelCounts: Record<string, number> = {};

    cards.forEach((card) => {
      card.labels.forEach((label) => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
    });

    // Ordenar do maior para o menor
    const sortedLabels = Object.entries(labelCounts)
      .sort(([, a], [, b]) => b - a);

    // Se houver 10 ou menos labels, retornar todos ordenados
    if (sortedLabels.length <= 10) {
      return sortedLabels.map(([name, value]) => ({
        name,
        value,
      }));
    }

    // Pegar os 10 maiores
    const top10 = sortedLabels.slice(0, 10).map(([name, value]) => ({
      name,
      value,
    }));

    // Agrupar o resto como "Outros"
    const othersSum = sortedLabels
      .slice(10)
      .reduce((sum, [, value]) => sum + value, 0);

    if (othersSum > 0) {
      top10.push({
        name: "Outros",
        value: othersSum,
      });
    }

    return top10;
  }

  /**
   * Calcula entregas agrupadas por membro
   * Ordenado do maior para o menor
   */
  getDeliveriesByMember(cards: TrelloCardLegacy[]): ChartData[] {
    const memberCounts: Record<string, number> = {};

    cards.forEach((card) => {
      memberCounts[card.member] = (memberCounts[card.member] || 0) + 1;
    });

    return Object.entries(memberCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }

  /**
   * Calcula entregas agrupadas por semana
   */
  getDeliveriesByWeek(cards: TrelloCardLegacy[]): ChartData[] {
    const weekCounts: Record<string, number> = {};

    cards.forEach((card) => {
      if (!card.dateDelivered) return;
      const weekKey = this.getWeekKey(card.dateDelivered);
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });

    return Object.entries(weekCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({
        name,
        value,
      }));
  }

  /**
   * Calcula média de dias que cards ficaram abertos por membro
   * Ordenado do maior para o menor
   */
  getAverageDaysOpenByMember(cards: TrelloCardLegacy[]): ChartData[] {
    const memberData: Record<string, { total: number; count: number }> = {};

    cards.forEach((card) => {
      if (card.daysOpen !== undefined) {
        if (!memberData[card.member]) {
          memberData[card.member] = { total: 0, count: 0 };
        }
        memberData[card.member].total += card.daysOpen;
        memberData[card.member].count += 1;
      }
    });

    return Object.entries(memberData)
      .map(([name, data]) => ({
        name,
        value: Math.round((data.total / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Calcula rejeições internas e externas agrupadas por membro
   * Retorna dados para gráfico de barras empilhadas
   */
  getRejectionsByMember(cards: TrelloCardLegacy[]): ChartData[] {
    const memberData: Record<string, { internal: number; external: number }> = {};
    
    // Criar mapa de IDs dos cards filtrados para consulta rápida
    const filteredCardIds = new Set(cards.map(c => c.id));

    // Usar os cards transformados para ter acesso às métricas
    // mas considerar apenas os que passaram pelos filtros
    this.transformedCards
      .filter(card => filteredCardIds.has(card.id))
      .forEach((card) => {
        card.members.forEach((member) => {
          if (!memberData[member]) {
            memberData[member] = { internal: 0, external: 0 };
          }
          memberData[member].internal += card.metrics.internal_rejected_number;
          memberData[member].external += card.metrics.client_rejected_number;
        });
      });

    // Converter para formato do gráfico e ordenar pelo total de rejeições
    return Object.entries(memberData)
      .map(([name, data]) => ({
        name,
        value: data.internal + data.external, // Total de rejeições
        "Rejeições Internas": data.internal,
        "Rejeições do Cliente": data.external,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Retorna lista única de todos os membros
   */
  getAllMembers(cards: TrelloCardLegacy[]): string[] {
    return Array.from(new Set(cards.map((card) => card.member)));
  }

  /**
   * Retorna lista única de todas as labels (clientes)
   */
  getAllLabels(cards: TrelloCardLegacy[]): string[] {
    const labels = new Set<string>();
    cards.forEach((card) => {
      card.labels.forEach((label) => labels.add(label));
    });
    return Array.from(labels);
  }

  /**
   * Helper para obter chave da semana
   */
  private getWeekKey(date: Date): string {
    const weekNumber = this.getWeekNumber(date);
    return `Sem ${weekNumber}`;
  }

  /**
   * Calcula o número da semana do ano
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}

export const trelloDataService = new TrelloDataService();
