import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    const correctPin = settings?.adminPin || '1234';

    if (String(pin).trim() === correctPin.trim()) {
      return NextResponse.json({ success: true, message: 'Autenticado com sucesso' });
    }

    return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
  } catch (error) {
    console.error('Erro ao autenticar admin:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
