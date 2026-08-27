import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    const where: any = {};
    if (phone) {
      where.customerPhone = phone.replace(/\D/g, '');
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryType,
      street,
      number,
      complement,
      neighborhood,
      cep,
      deliveryFee,
      subtotal,
      total,
      paymentMethod,
      changeFor,
      notes,
      items,
    } = body;

    const cleanPhone = customerPhone.replace(/\D/g, '');

    // 1. Criar ou atualizar cliente
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: cleanPhone,
          email: customerEmail || null,
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          email: customerEmail || customer.email,
        },
      });
    }

    // 2. Se for entrega, salvar endereço
    let addressFormatted = 'Retirada no Balcão';
    let targetLat = -23.561684;
    let targetLng = -46.655981;

    if (deliveryType === 'DELIVERY') {
      addressFormatted = `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}${cep ? ` - CEP: ${cep}` : ''}`;
      
      // Salvar endereço do cliente se não existir
      await prisma.address.create({
        data: {
          customerId: customer.id,
          street,
          number,
          complement: complement || null,
          neighborhood,
          cep: cep || null,
          lat: targetLat + (Math.random() - 0.5) * 0.01,
          lng: targetLng + (Math.random() - 0.5) * 0.01,
        },
      });
    }

    // 3. Gerar número de pedido único sequencial amigável
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;

    // 4. Criar o pedido com itens
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName,
        customerPhone: cleanPhone,
        deliveryType,
        addressText: addressFormatted,
        neighborhood: deliveryType === 'DELIVERY' ? neighborhood : 'Retirada',
        deliveryFee: Number(deliveryFee) || 0,
        subtotal: Number(subtotal),
        total: Number(total),
        paymentMethod,
        changeFor: changeFor ? Number(changeFor) : null,
        notes: notes || null,
        status: 'PENDING',
        courierName: 'Carlos Motoboy',
        courierPhone: '11999998888',
        courierLat: -23.5505, // Ponto inicial (Restaurante)
        courierLng: -46.6333,
        targetLat: targetLat,
        targetLng: targetLng,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            meatPoint: item.meatPoint || null,
            complements: item.selectedComplements ? JSON.stringify(item.selectedComplements) : null,
            farofa: Boolean(item.farofa || (item.selectedComplements && item.selectedComplements.some((c: string) => c.toLowerCase().includes('farofa')))),
            vinagrete: Boolean(item.vinagrete || (item.selectedComplements && item.selectedComplements.some((c: string) => c.toLowerCase().includes('vinagrete')))),
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
  }
}
