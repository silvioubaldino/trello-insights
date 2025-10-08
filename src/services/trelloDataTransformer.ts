import { TrelloApiCard, TrelloApiAction, TrelloCard } from "@/types/trello";

/**
 * Serviço responsável por transformar os dados brutos da API do Trello
 * em uma estrutura unificada com métricas pré-calculadas
 */
export class TrelloDataTransformer {
  /**
   * Lista de nomes de listas usadas para cálculo de métricas
   * Estes podem ser alterados para IDs no futuro
   */
  private readonly LIST_NAMES = {
    REVISAO: "REVISÃO",
    ENVIADO_CLIENTE: "ENVIADO PARA O CLIENTE",
    AJUSTE: "AJUSTE",
    DESENVOLVIMENTO: "DESENVOLVIMENTO",
  };

  /**
   * Mapeamento de ID de membro para nome completo
   */
  private memberIdToNameMap: Map<string, string> = new Map();

  /**
   * Constrói o mapeamento de IDs de membros para nomes
   */
  private buildMemberMap(actions: TrelloApiAction[]): void {
    this.memberIdToNameMap.clear();
    
    actions.forEach((action) => {
      if (action.memberCreator) {
        const { id, fullName } = action.memberCreator;
        if (id && fullName && !this.memberIdToNameMap.has(id)) {
          this.memberIdToNameMap.set(id, fullName);
        }
      }
    });
  }

  /**
   * Obtém os nomes dos membros do card
   * Usa o campo members do card se disponível (quando &members=true na API),
   * senão faz fallback para mapeamento por ID usando as actions
   */
  private getMemberNames(card: TrelloApiCard): string[] {
    // Se o card tem o campo members (quando &members=true na API), usar diretamente
    if (card.members && card.members.length > 0) {
      return card.members.map(m => m.fullName);
    }

    // Fallback: usar mapeamento de IDs construído das actions
    if (card.idMembers && card.idMembers.length > 0) {
      return card.idMembers
        .map(id => this.memberIdToNameMap.get(id) || id)
        .filter(name => name !== undefined);
    }

    return [];
  }

  /**
   * Transforma os dados brutos da API em cards com métricas calculadas
   */
  transform(cards: TrelloApiCard[], actions: TrelloApiAction[]): TrelloCard[] {
    // Primeiro, construir o mapeamento de membros
    this.buildMemberMap(actions);
    
    return cards.map((card) => this.transformCard(card, actions));
  }

  /**
   * Transforma um card individual
   */
  private transformCard(card: TrelloApiCard, actions: TrelloApiAction[]): TrelloCard {
    const cardActions = this.getCardActions(card.id, actions);
    const created_at = this.getCreatedDate(card.id, cardActions);
    const due_date = this.getDueDate(card, cardActions);
    const metrics = this.calculateMetrics(card.id, cardActions);
    const days_open = this.calculateDaysOpen(created_at, due_date);

    return {
      id: card.id,
      name: card.name,
      labels: card.labels.map((label) => label.name),
      members: this.getMemberNames(card),
      created_at,
      due_date,
      closed: card.closed,
      metrics: {
        ...metrics,
        days_open,
      },
    };
  }

  /**
   * Filtra todas as ações relacionadas a um card específico
   */
  private getCardActions(cardId: string, actions: TrelloApiAction[]): TrelloApiAction[] {
    return actions.filter(
      (action) => action.data.card?.id === cardId
    );
  }

  /**
   * Encontra a data de criação do card
   */
  private getCreatedDate(cardId: string, cardActions: TrelloApiAction[]): Date {
    const createAction = cardActions.find((action) => action.type === "createCard");
    
    if (createAction) {
      return new Date(createAction.date);
    }

    // Fallback: usar a ação mais antiga do card
    const sortedActions = [...cardActions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sortedActions.length > 0 
      ? new Date(sortedActions[0].date)
      : new Date();
  }

  /**
   * Determina a data de conclusão/entrega do card
   */
  private getDueDate(card: TrelloApiCard, cardActions: TrelloApiAction[]): Date | null {
    // Se o card tem uma due date definida, usar ela
    if (card.due) {
      return new Date(card.due);
    }

    // Se o card está fechado, usar a data da última atividade
    if (card.closed) {
      return new Date(card.dateLastActivity);
    }

    // Se não está fechado e não tem due date, retornar null
    return null;
  }

  /**
   * Calcula as métricas de rejeição interna e do cliente
   */
  private calculateMetrics(
    cardId: string,
    cardActions: TrelloApiAction[]
  ): { internal_rejected_number: number; client_rejected_number: number } {
    let internal_rejected_number = 0;
    let client_rejected_number = 0;

    // Filtrar apenas ações de movimento de card (updateCard com mudança de lista)
    const moveActions = cardActions.filter(
      (action) => 
        action.type === "updateCard" && 
        action.data.listBefore && 
        action.data.listAfter
    );

    for (const action of moveActions) {
      const fromList = action.data.listBefore?.name || "";
      const toList = action.data.listAfter?.name || "";

      // Rejeição interna: saiu de "REVISÃO" para qualquer outra lista (exceto aprovação)
      if (
        fromList === this.LIST_NAMES.REVISAO &&
        toList !== this.LIST_NAMES.ENVIADO_CLIENTE &&
        toList !== "ENVIAR PARA O CLIENTE"
      ) {
        internal_rejected_number++;
      }

      // Rejeição do cliente: saiu de "ENVIADO PARA O CLIENTE" de volta para desenvolvimento/ajuste
      if (
        fromList === this.LIST_NAMES.ENVIADO_CLIENTE &&
        (toList === this.LIST_NAMES.AJUSTE || 
         toList === this.LIST_NAMES.DESENVOLVIMENTO ||
         toList === this.LIST_NAMES.REVISAO)
      ) {
        client_rejected_number++;
      }
    }

    return {
      internal_rejected_number,
      client_rejected_number,
    };
  }

  /**
   * Calcula os dias que o card ficou aberto
   */
  private calculateDaysOpen(created_at: Date, due_date: Date | null): number {
    if (!due_date) {
      // Se não tem data de conclusão, calcular até hoje
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - created_at.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const diffTime = Math.abs(due_date.getTime() - created_at.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Exportar instância singleton
export const trelloDataTransformer = new TrelloDataTransformer();
