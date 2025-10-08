import { NextRequest, NextResponse } from 'next/server';
import { getActionsByBoard } from '@/server/trello';

export async function GET(_req: NextRequest, { params }: { params: { boardId: string } }) {
  const { boardId } = params;
  try {
    const data = await getActionsByBoard(boardId);
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


