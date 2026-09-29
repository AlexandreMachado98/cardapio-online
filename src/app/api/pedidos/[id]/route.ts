import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawId = (await params).id;
    const cleanId = rawId ? decodeURIComponent(rawId).trim().replace(/^#/, '') : '';

    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      console.warn(`[TRACKING_LOOKUP_EMPTY] Identificador recebido inválido ou vazio: "${rawId}"`);
      return NextResponse.json({ error: 'Identificador do pedido inválido.' }, { status: 400 });
    }

    console.log(`[TRACKING_LOOKUP_STARTED] Buscando pedido com identificador: "${cleanId}"`);

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingToken: cleanId },
          { id: cleanId },
          { orderNumber: !isNaN(Number(cleanId)) ? Number(cleanId) : -1 },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.warn(`[TRACKING_LOOKUP_EMPTY] Pedido não encontrado para identificador: "${cleanId}"`);
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    console.log(`[TRACKING_LOOKUP_SUCCESS] Pedido #${order.orderNumber} localizado com sucesso (Status: ${order.status})`);
    return NextResponse.json(order);
  } catch (error) {
    console.error('[TRACKING_LOOKUP_ERROR] Erro ao buscar pedido:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawId = (await params).id;
    const cleanId = rawId ? decodeURIComponent(rawId).trim().replace(/^#/, '') : '';

    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      return NextResponse.json({ error: 'Identificador do pedido inválido.' }, { status: 400 });
    }

    const body = await request.json();
    const { courierName, courierPhone, courierVehicle, courierPlate, status, notes } = body;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingToken: cleanId },
          { id: cleanId },
          { orderNumber: !isNaN(Number(cleanId)) ? Number(cleanId) : -1 },
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
