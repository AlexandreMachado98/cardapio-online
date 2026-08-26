import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: !isNaN(Number(id)) ? Number(id) : -1 },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
