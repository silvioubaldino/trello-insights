import { NextRequest, NextResponse } from 'next/server';
import { getActionsByBoard, getActionsByBoardPaged } from '@/server/trello';

export async function GET(req: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  try {
    // Verificar se há parâmetro ?since na query string
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');
    
    const data = since 
      ? await getActionsByBoardPaged(boardId, since)
      : await getActionsByBoard(boardId);
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


