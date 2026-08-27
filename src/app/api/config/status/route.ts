import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isOpen } = body;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        isOpen: Boolean(isOpen),
      },
      create: {
        id: 'default',
        isOpen: Boolean(isOpen),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao alternar status aberto/fechado:', error);
    return NextResponse.json({ error: 'Erro ao alterar status' }, { status: 500 });
  }
}
