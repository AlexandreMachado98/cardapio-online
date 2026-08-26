import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { fee: 'asc' },
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
    const { neighborhood, fee, estimatedMinutes } = body;

    const zone = await prisma.deliveryZone.upsert({
      where: { neighborhood },
      update: { fee: Number(fee), estimatedMinutes: Number(estimatedMinutes) },
      create: {
        neighborhood,
        fee: Number(fee),
        estimatedMinutes: Number(estimatedMinutes) || 35,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Erro ao salvar zona de frete:', error);
    return NextResponse.json({ error: 'Erro ao salvar taxa de entrega' }, { status: 500 });
  }
}
