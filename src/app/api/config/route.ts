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
          subName: '',
          logoUrl: '',
          announcement: '',
          isOpen: true,
          adminPin: '157864',
          adminPassword: '157864',
          defaultCourierName: 'Carlos Motoboy',
          defaultCourierPhone: '11999998888',
          defaultCourierVehicle: 'Moto Honda Fan 160',
          defaultCourierPlate: '',
          phone: '',
          address: '',
          pixKey: '',
          minOrderValue: 0,
        },
      });
    }

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
      adminUser,
      adminEmail,
      adminPassword,
      defaultCourierName,
      defaultCourierPhone,
      defaultCourierVehicle,
      defaultCourierPlate,
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
        adminUser: adminUser ? String(adminUser) : undefined,
        adminEmail: adminEmail ? String(adminEmail) : undefined,
        adminPassword: adminPassword ? String(adminPassword) : undefined,
        defaultCourierName: defaultCourierName !== undefined ? defaultCourierName : undefined,
        defaultCourierPhone: defaultCourierPhone !== undefined ? defaultCourierPhone : undefined,
        defaultCourierVehicle: defaultCourierVehicle !== undefined ? defaultCourierVehicle : undefined,
        defaultCourierPlate: defaultCourierPlate !== undefined ? defaultCourierPlate : undefined,
        phone,
        address,
        pixKey,
        minOrderValue: Number(minOrderValue) || 0,
      },
      create: {
        id: 'default',
        name: name || 'Cardápio Online',
        subName: subName || '',
        logoUrl,
        bannerUrl,
        announcement,
        isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
        adminPin: adminPin ? String(adminPin) : '157864',
        adminPassword: adminPassword ? String(adminPassword) : '157864',
        defaultCourierName: defaultCourierName || 'Carlos Motoboy',
        defaultCourierPhone: defaultCourierPhone || '11999998888',
        defaultCourierVehicle: defaultCourierVehicle || 'Moto Honda Fan 160',
        defaultCourierPlate: defaultCourierPlate || '',
        phone: phone || '',
        address: address || '',
        pixKey: pixKey || phone || '',
        minOrderValue: Number(minOrderValue) || 0,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erro ao salvar configurações da loja:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
