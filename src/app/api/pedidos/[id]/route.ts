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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { courierName, courierPhone, courierVehicle, courierPlate, status, notes } = body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: !isNaN(Number(id)) ? Number(id) : -1 },
        ],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        courierName: courierName !== undefined ? courierName : undefined,
        courierPhone: courierPhone !== undefined ? courierPhone : undefined,
        courierVehicle: courierVehicle !== undefined ? courierVehicle : undefined,
        courierPlate: courierPlate !== undefined ? courierPlate : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados do pedido' }, { status: 500 });
  }
}
