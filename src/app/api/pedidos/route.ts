import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOrderConfirmationWhatsAppMessage, createWhatsAppLink } from '@/lib/whatsapp';

// Helper to resolve customer address to real lat/lng near the store
async function geocodeCustomerAddress(
  addressText: string,
  baseLat: number,
  baseLng: number
): Promise<{ lat: number; lng: number }> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      addressText + ', Brasil'
    )}&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CardapioOnlineDelivery/1.0 (delivery-order-geocoding)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (e) {
    console.error('Erro ao geocodificar endereço do cliente:', e);
  }

  // Fallback: place close to the actual restaurant (offset 0.5km - 1.5km), NOT in São Paulo!
  const angle = Math.random() * 2 * Math.PI;
  const distanceOffset = 0.008 + Math.random() * 0.008; // ~1km away
  return {
    lat: baseLat + Math.cos(angle) * distanceOffset,
    lng: baseLng + Math.sin(angle) * distanceOffset,
  };
}

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

    // 1. Buscar configurações da loja para coordenadas e dados do restaurante
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    const storeLat = settings?.lat ?? -23.5505;
    const storeLng = settings?.lng ?? -46.6333;

    // 2. Criar ou atualizar cliente
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

    // 3. Se for entrega, formatar endereço e resolver coordenadas reais
    let addressFormatted = 'Retirada no Balcão';
    let targetLat = storeLat;
    let targetLng = storeLng;

    if (deliveryType === 'DELIVERY') {
      const parts = [
        street ? `${street}, ${number || 'S/N'}` : '',
        complement ? `(${complement})` : '',
        neighborhood ? `Bairro: ${neighborhood}` : '',
        cep ? `CEP: ${cep}` : '',
      ].filter(Boolean);

      addressFormatted = parts.join(' - ');

      const searchAddress = `${street || ''} ${number || ''}, ${neighborhood || ''}`;
      const resolvedTarget = await geocodeCustomerAddress(searchAddress, storeLat, storeLng);
      targetLat = resolvedTarget.lat;
      targetLng = resolvedTarget.lng;

      // Salvar endereço do cliente
      await prisma.address.create({
        data: {
          customerId: customer.id,
          street: street || '',
          number: number || '',
          complement: complement || null,
          neighborhood: neighborhood || '',
          cep: cep || null,
          lat: targetLat,
          lng: targetLng,
        },
      });
    }

    // 4. Gerar número de pedido único sequencial amigável
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
    });
    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;

    // 5. Criar o pedido com itens e coordenadas vinculadas à loja real
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
        courierName: settings?.defaultCourierName || 'Carlos Motoboy',
        courierPhone: settings?.defaultCourierPhone || '11999998888',
        courierVehicle: settings?.defaultCourierVehicle || 'Moto Honda Fan 160',
        courierPlate: settings?.defaultCourierPlate || '',
        courierLat: storeLat, // Ponto inicial é a localização real da cozinha
        courierLng: storeLng,
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

    // 6. Gerar mensagem e link do WhatsApp para envio imediato
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const trackingUrl = `${origin}/pedido/${order.orderNumber}`;

    const waMsg = generateOrderConfirmationWhatsAppMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      deliveryType: order.deliveryType,
      addressText: order.addressText,
      deliveryFee: order.deliveryFee,
      subtotal: order.subtotal,
      total: order.total,
      paymentMethod: order.paymentMethod,
      changeFor: order.changeFor,
      trackingUrl,
      storeName: settings?.name || 'Cardápio Online',
      notes: order.notes,
    });

    const whatsappLink = createWhatsAppLink(cleanPhone, waMsg);

    return NextResponse.json(
      {
        ...order,
        whatsappLink,
        trackingUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
  }
}
