import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          name: 'Cardápio Online',
          subName: 'Espetinho & Brasa',
          logoUrl: '',
          announcement: '🔥 Espetinhos 100% artesanais assados na brasa na hora! Faça seu pedido.',
          isOpen: true,
          adminPin: '1234',
          phone: '11987654321',
          address: 'Av. Principal dos Espetos, 500 - Centro',
          pixKey: '11987654321',
          minOrderValue: 0,
        },
      });
    }

    // Don't leak the raw adminPin in public get request if possible
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao buscar configurações da loja:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      subName,
      logoUrl,
      bannerUrl,
      announcement,
      isOpen,
      adminPin,
      phone,
      address,
      pixKey,
      minOrderValue,
    } = body;

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        name,
        subName,
        logoUrl,
        bannerUrl,
        announcement,
        isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        adminPin: adminPin ? String(adminPin) : undefined,
        phone,
        address,
        pixKey,
        minOrderValue: Number(minOrderValue) || 0,
      },
      create: {
        id: 'default',
        name: name || 'Cardápio Online',
        subName: subName || 'Espetinho & Brasa',
        logoUrl,
        bannerUrl,
        announcement,
        isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        adminPin: adminPin ? String(adminPin) : '1234',
        phone: phone || '11987654321',
        address: address || 'Av. Principal dos Espetos, 500 - Centro',
        pixKey: pixKey || phone,
        minOrderValue: Number(minOrderValue) || 0,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao salvar configurações da loja:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
