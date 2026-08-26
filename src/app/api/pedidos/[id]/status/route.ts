import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWhatsAppMessage, createWhatsAppLink } from '@/lib/whatsapp';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, courierName, courierPhone, whatsappSent } = body;

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: !isNaN(Number(id)) ? Number(id) : -1 },
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
      },
      include: { items: true },
    });

    // Se saiu para entrega, gerar o texto e link do WhatsApp
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const trackingUrl = `${origin}/rastreio/${updatedOrder.orderNumber}`;

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
