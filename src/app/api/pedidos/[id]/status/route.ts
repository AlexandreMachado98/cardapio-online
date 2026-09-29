import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWhatsAppMessage, createWhatsAppLink } from '@/lib/whatsapp';
import { sendWhatsAppNotification } from '@/lib/notificationService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawId = (await params).id;
    const cleanId = rawId ? decodeURIComponent(rawId).trim().replace(/^#/, '') : '';

    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { status, courierName, courierPhone, whatsappSent } = body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingToken: cleanId },
          { id: cleanId },
          { orderNumber: !isNaN(Number(cleanId)) ? Number(cleanId) : -1 },
        ],
      },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: status || existingOrder.status,
        courierName: courierName !== undefined ? courierName : existingOrder.courierName,
        courierPhone: courierPhone !== undefined ? courierPhone : existingOrder.courierPhone,
        whatsappSent: whatsappSent !== undefined ? whatsappSent : existingOrder.whatsappSent,
        closedAt: status === 'CLOSED' ? new Date() : existingOrder.closedAt,
      },
      include: { items: true },
    });

    // Se saiu para entrega, gerar o texto e link do WhatsApp
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const trackingUrl = `${origin}/acompanhar/${updatedOrder.trackingToken || updatedOrder.orderNumber}`;

    const whatsappMessage = generateWhatsAppMessage({
      orderNumber: updatedOrder.orderNumber,
      customerName: updatedOrder.customerName,
      customerPhone: updatedOrder.customerPhone,
      items: updatedOrder.items,
      deliveryType: updatedOrder.deliveryType,
      addressText: updatedOrder.addressText,
      deliveryFee: updatedOrder.deliveryFee,
      total: updatedOrder.total,
      paymentMethod: updatedOrder.paymentMethod,
      courierName: updatedOrder.courierName,
      trackingUrl,
    });

    const whatsappLink = createWhatsAppLink(updatedOrder.customerPhone, whatsappMessage);

    // Se mudou para OUT_FOR_DELIVERY, notificar WhatsApp em background
    if (status === 'OUT_FOR_DELIVERY') {
      sendWhatsAppNotification({
        orderId: updatedOrder.id,
        eventType: 'OUT_FOR_DELIVERY',
        customerPhone: updatedOrder.customerPhone,
        messageText: whatsappMessage,
      }).catch((e) => console.error('[WhatsApp Notification Background Error]:', e));
    }

    return NextResponse.json({
      order: updatedOrder,
      whatsappMessage,
      whatsappLink,
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
