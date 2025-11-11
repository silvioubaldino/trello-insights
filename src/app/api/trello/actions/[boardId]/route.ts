import { NextRequest, NextResponse } from 'next/server';
import { getActionsByBoard } from '@/server/trello';

export async function GET(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  
  // Extrai query parameters para paginação por período
  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since') || undefined;
  const before = searchParams.get('before') || undefined;
  
  try {
    const data = await getActionsByBoard(boardId, since, before);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


