// Tipos da API do Trello
export interface TrelloApiCard {
  id: string;
  name: string;
  idList: string;
  idMembers: string[];
  members?: Array<{
    id: string;
    fullName: string;
    username: string;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  closed: boolean;
  due: string | null;
  dateLastActivity: string;
}

export interface TrelloApiAction {
  id: string;
  type: string;
  date: string;
  data: {
    card?: {
      id: string;
      name: string;
    };
    listBefore?: {
      id: string;
      name: string;
    };
    listAfter?: {
      id: string;
      name: string;
    };
  };
  memberCreator: {
    id: string;
    fullName: string;
    username: string;
  };
}

// Tipo transformado para uso interno
export interface TrelloCard {
  id: string;
  name: string;
  labels: string[];
  members: string[];
  created_at: Date;
  due_date: Date | null;
  closed: boolean;
  metrics: {
    internal_rejected_number: number;
    client_rejected_number: number;
    days_open: number;
  };
  rejectionsByClient: number;
  rejectionsByTeam: number;
}

// Tipos para filtros e gráficos (compatíveis com a UI existente)
export interface TrelloCardLegacy {
  id: string;
  name: string;
  dateCreated: Date;
  dateDelivered?: Date;
  member: string;
  labels: string[];
  daysOpen?: number;
}

export interface TrelloFilters {
  members: string[];
  labels: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}
