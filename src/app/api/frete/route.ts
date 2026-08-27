import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    const zones = await prisma.deliveryZone.findMany({
      where: all ? {} : { active: true },
      orderBy: { neighborhood: 'asc' },
    });
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Erro ao buscar zonas de frete:', error);
    return NextResponse.json({ error: 'Erro ao buscar taxas de entrega' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { neighborhood, fee, estimatedMinutes, active } = body;

    if (!neighborhood || fee === undefined) {
      return NextResponse.json({ error: 'Bairro e taxa são obrigatórios' }, { status: 400 });
    }

    const zone = await prisma.deliveryZone.upsert({
      where: { neighborhood: neighborhood.trim() },
      update: {
        fee: Number(fee),
        estimatedMinutes: Number(estimatedMinutes) || 35,
        active: active !== undefined ? Boolean(active) : true,
      },
      create: {
        neighborhood: neighborhood.trim(),
        fee: Number(fee),
        estimatedMinutes: Number(estimatedMinutes) || 35,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Erro ao salvar zona de frete:', error);
    return NextResponse.json({ error: 'Erro ao salvar taxa de entrega' }, { status: 500 });
  }
}
