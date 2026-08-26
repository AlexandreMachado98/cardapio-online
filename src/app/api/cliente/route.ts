import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ message: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
