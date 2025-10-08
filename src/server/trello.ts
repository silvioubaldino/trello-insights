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

// Placeholder de fetcher (poderemos trocar por trello SDK ou fetch com proxy)
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5min por rota
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao buscar ${url}: ${res.status} ${text}`);
  }
  return res.json();
}

// Funções com memoização no lado do servidor
export const getCardsByBoard = cache(async (boardId: string): Promise<TrelloApiCard[]> => {
  // Placeholder: estrutura final de URL da API do Trello
  const url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/cards?${getAuthQuery()}`;
  // No momento, apenas retorna array vazio (placeholder)
  // return await fetchJson<TrelloApiCard[]>(url);
  return [];
});

export const getActionsByBoard = cache(async (boardId: string): Promise<TrelloApiAction[]> => {
  // Placeholder: estrutura final de URL da API do Trello
  const url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/actions?${getAuthQuery()}`;
  // return await fetchJson<TrelloApiAction[]>(url);
  return [];
});


