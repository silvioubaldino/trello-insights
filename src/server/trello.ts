import 'server-only';

import { cache } from 'react';
import { TrelloApiCard, TrelloApiAction } from '@/types/trello';

// Variáveis de ambiente (somente no servidor)
const TRELLO_API_BASE = 'https://api.trello.com/1';

function getAuthQuery() {
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_API_TOKEN;
  if (!key || !token) {
    throw new Error('TRELLO_API_KEY/TRELLO_API_TOKEN não configurados');
  }
  return `key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}`;
}

// Fetcher com cache de 1 hora (3600s)
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { 
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    console.error(`❌ [Trello API] ${res.status}`);
    throw new Error('Falha ao buscar dados do Trello');
  }
  
  return res.json();
}

// Funções com memoização no lado do servidor
export const getCardsByBoard = cache(async (boardId: string): Promise<TrelloApiCard[]> => {
  const fields = 'id,name,labels,idMembers,closed,due,dateLastActivity';
  const url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/cards?${getAuthQuery()}&members=true&fields=${fields}`;
  return fetchJson<TrelloApiCard[]>(url);
});

export const getActionsByBoard = cache(async (
  boardId: string,
  since?: string,
  before?: string
): Promise<TrelloApiAction[]> => {
  const sinceParam = since || '2025-01-01';
  const filter = 'updateCard:idList,createCard';
  const fields = 'id,date,data';

  let url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/actions?since=${sinceParam}&filter=${filter}&fields=${fields}&memberCreator=true&memberCreator_fields=id,fullName&limit=1000&${getAuthQuery()}`;
  
  if (before) {
    url += `&before=${before}`;
  }
  
  return fetchJson<TrelloApiAction[]>(url);
});
