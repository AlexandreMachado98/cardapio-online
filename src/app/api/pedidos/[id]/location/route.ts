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
      select: {
        id: true,
        orderNumber: true,
        status: true,
        courierName: true,
        courierPhone: true,
        courierLat: true,
        courierLng: true,
        targetLat: true,
        targetLng: true,
        deliveryType: true,
        addressText: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Erro ao buscar localização do pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar localização' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lat, lng } = body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: !isNaN(Number(id)) ? Number(id) : -1 },
        ],
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        courierLat: Number(lat),
        courierLng: Number(lng),
      },
      select: {
        id: true,
        orderNumber: true,
        courierLat: true,
        courierLng: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar coordenadas:', error);
    return NextResponse.json({ error: 'Erro ao atualizar coordenadas' }, { status: 500 });
  }
}
