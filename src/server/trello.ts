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

// Fetcher com cache de 1 hora (3600s) - otimizado com filtro de campos
async function fetchJson<T>(url: string): Promise<T> {
  const startTime = Date.now();
  
  const res = await fetch(url, { 
    next: { revalidate: 3600 }, // Cache de 1 hora
  });
  
  const duration = Date.now() - startTime;
  
  // Log detalhado para monitorar cache
  const urlObj = new URL(url);
  const isCached = res.headers.get('x-vercel-cache') || 
                   res.headers.get('x-nextjs-cache') || 
                   (duration < 50 ? 'HIT (fast)' : 'MISS (slow)');
  
  console.log(`[Trello API] ${urlObj.pathname}`);
  console.log(`  ├─ Cache: ${isCached}`);
  console.log(`  ├─ Duration: ${duration}ms`);
  console.log(`  └─ Status: ${res.status}`);
  
  if (!res.ok) {
    console.error('Trello fetch failed', { status: res.status, path: urlObj.pathname });
    throw new Error('Falha ao buscar dados do Trello');
  }
  
  const data = await res.json();
  const dataSize = JSON.stringify(data).length;
  console.log(`  └─ Response size: ${(dataSize / 1024).toFixed(2)} KB`);
  
  return data;
}

// Funções com memoização no lado do servidor
export const getCardsByBoard = cache(async (boardId: string): Promise<TrelloApiCard[]> => {
  console.log(`\n[getCardsByBoard] Fetching cards for board: ${boardId}`);
  // Filtra apenas os campos necessários para reduzir tamanho da resposta
  const fields = 'id,name,labels,idMembers,closed,due,dateLastActivity';
  const url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/cards?${getAuthQuery()}&members=true&fields=${fields}`;
  const result = await fetchJson<TrelloApiCard[]>(url);
  console.log(`[getCardsByBoard] Returned ${result.length} cards\n`);
  return result;
});

export const getActionsByBoard = cache(async (boardId: string): Promise<TrelloApiAction[]> => {
  console.log(`\n[getActionsByBoard] Fetching actions for board: ${boardId}`);
  // Define data de início como 01/01/2025
  const since = '2025-01-01';
  // Filtra apenas ações de criação e movimentação de cards
  const filter = 'createCard,updateCard';
  const url = `${TRELLO_API_BASE}/boards/${encodeURIComponent(boardId)}/actions?since=${since}&filter=${filter}&${getAuthQuery()}`;
  const result = await fetchJson<TrelloApiAction[]>(url);
  console.log(`[getActionsByBoard] Returned ${result.length} actions\n`);
  return result;
});


