import { TrelloCard, TrelloCardLegacy, TrelloFilters, ChartData, TrelloApiCard, TrelloApiAction } from "@/types/trello";
import { trelloDataTransformer } from "./trelloDataTransformer";

// Importar mocks da API do Trello
import cardsJsonData from "@/data/mocks/getCards.json";
import actionsJsonData from "@/data/mocks/getActions.json";

/**
 * Serviço para gerenciar dados do Trello
 * Processa dados da API e fornece métodos para filtragem e análise
 */
class TrelloDataService {
  private transformedCards: TrelloCard[];

  constructor() {
    // Inicialmente carrega dos mocks (fallback local para dev/offline)
    this.transformedCards = this.loadAndTransformData();
  }

  /**
   * Carrega e transforma os dados dos mocks da API
   */
  private loadAndTransformData(): TrelloCard[] {
    try {
      const cards = cardsJsonData as unknown as TrelloApiCard[];
      const actions = actionsJsonData as unknown as TrelloApiAction[];
      
      return trelloDataTransformer.transform(cards, actions);
    } catch (error) {
      console.error("Erro ao carregar dados do Trello:", error);
      return [];
    }
  }

  /**
   * Novo fluxo: carregar dados do backend (Next API) por board.
   * Mantém compatibilidade: retorna também no formato legado via getCards().
   */
  async refreshFromBackend(boardId: string): Promise<void> {
    try {
      const [cards, actions] = await Promise.all([
        this.fetchCardsFromBackend(boardId),
        this.fetchActionsFromBackend(boardId),
      ]);
      this.transformedCards = trelloDataTransformer.transform(cards, actions);
    } catch (error) {
      console.error('Erro ao buscar backend, mantendo dados locais:', error);
    }
  }

  private async fetchCardsFromBackend(boardId: string): Promise<TrelloApiCard[]> {
    const res = await fetch(`/api/trello/cards/${encodeURIComponent(boardId)}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
      // Cache de navegação padrão; pode ser ajustado com React Query
    });
    if (!res.ok) {
      throw new Error(`Falha ao obter cards: ${res.status}`);
    }
    return res.json();
  }

  private async fetchActionsFromBackend(boardId: string): Promise<TrelloApiAction[]> {
    const res = await fetch(`/api/trello/actions/${encodeURIComponent(boardId)}`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Falha ao obter actions: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Enriquece os cards transformados com contadores de rejeições
   * baseado nas actions do board desde uma data específica
   */
  async enrichRejectionsByActions(boardId: string, since: Date): Promise<void> {
    try {
      console.log(`[enrichRejectionsByActions] Buscando actions desde ${since.toISOString()}`);
      
      const res = await fetch(
        `/api/trello/actions/${encodeURIComponent(boardId)}?since=${encodeURIComponent(since.toISOString())}`,
        {
          method: 'GET',
          headers: { 'content-type': 'application/json' },
        }
      );
      
      if (!res.ok) {
        throw new Error(`Falha ao obter actions paginadas: ${res.status}`);
      }
      
      const actions = await res.json() as TrelloApiAction[];
      console.log(`[enrichRejectionsByActions] Recebidas ${actions.length} actions`);
      
      // Resetar contadores antes de processar
      this.transformedCards.forEach(card => {
        card.rejectionsByClient = 0;
        card.rejectionsByTeam = 0;
      });
      
      // Agrupar actions por card
      const actionsByCard = new Map<string, TrelloApiAction[]>();
      actions.forEach(action => {
        if (action.data.card?.id) {
          const cardId = action.data.card.id;
          if (!actionsByCard.has(cardId)) {
            actionsByCard.set(cardId, []);
          }
          actionsByCard.get(cardId)!.push(action);
        }
      });
      
      // Processar cada card
      this.transformedCards.forEach(card => {
        const cardActions = actionsByCard.get(card.id) || [];
        
        // Filtrar apenas movimentos de lista
        const moveActions = cardActions.filter(
          action => 
            action.type === 'updateCard' && 
            action.data.listBefore && 
            action.data.listAfter
        );
        
        // Aplicar regras de rejeição
        moveActions.forEach(action => {
          const fromList = action.data.listBefore?.name || '';
          const toList = action.data.listAfter?.name || '';
          
          // Rejeição do cliente: de "ENVIADO PARA O CLIENTE" para "AJUSTES"
          if (fromList === 'ENVIADO PARA O CLIENTE' && toList === 'AJUSTES') {
            card.rejectionsByClient++;
          }
          
          // Rejeição do time: de "REVISÃO" para "AJUSTES"
          if (fromList === 'REVISÃO' && toList === 'AJUSTES') {
            card.rejectionsByTeam++;
          }
        });
      });
      
      console.log(`[enrichRejectionsByActions] Contadores atualizados para ${this.transformedCards.length} cards`);
    } catch (error) {
      console.error('[enrichRejectionsByActions] Erro:', error);
      throw error;
    }
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
   * Considera todos os membros participantes do card
   */
  getDeliveriesByMember(cards: TrelloCardLegacy[]): ChartData[] {
    const memberCounts: Record<string, number> = {};

    // Mapa para lookup rápido dos dados completos (incluindo array de members)
    const transformedMap = new Map<string, TrelloCard>();
    this.transformedCards.forEach(card => {
      transformedMap.set(card.id, card);
    });

    cards.forEach((card) => {
      const transformedCard = transformedMap.get(card.id);
      
      // Se tiver o card original com lista completa de membros
      if (transformedCard && transformedCard.members.length > 0) {
        transformedCard.members.forEach(member => {
          memberCounts[member] = (memberCounts[member] || 0) + 1;
        });
      } else {
        // Fallback para o membro legado (único) ou "Sem responsável"
        const memberName = card.member;
        memberCounts[memberName] = (memberCounts[memberName] || 0) + 1;
      }
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
   * Calcula rejeições agrupadas por membro
   * Retorna dados para gráfico empilhado com rejeições internas e do cliente
   */
  getRejectionsByMember(cards: TrelloCardLegacy[]): ChartData[] {
    const memberData: Record<string, { team: number; client: number }> = {};

    // Criar mapa de id -> card transformado para acessar contadores
    const transformedMap = new Map<string, TrelloCard>();
    this.transformedCards.forEach(card => {
      transformedMap.set(card.id, card);
    });

    cards.forEach((card) => {
      const transformedCard = transformedMap.get(card.id);
      if (!transformedCard) return;

      if (!memberData[card.member]) {
        memberData[card.member] = { team: 0, client: 0 };
      }
      
      memberData[card.member].team += transformedCard.rejectionsByTeam;
      memberData[card.member].client += transformedCard.rejectionsByClient;
    });

    return Object.entries(memberData)
      .map(([name, data]) => ({
        name,
        value: data.team + data.client,
        "Rejeições Internas": data.team,
        "Rejeições do Cliente": data.client,
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
