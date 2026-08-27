import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to geocode address server side if coordinates not provided
async function geocodeAddressServer(addressText: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      addressText + ', Brasil'
    )}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CardapioDeliveryApp/2.0 (settings-geocoding)',
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
  } catch (e) {}
  return null;
}

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
      lat,
      lng,
      googleMapsApiKey,
      pixKey,
      minOrderValue,
    } = body;

    let finalLat = lat !== undefined && lat !== null && lat !== '' ? Number(lat) : null;
    let finalLng = lng !== undefined && lng !== null && lng !== '' ? Number(lng) : null;

    // If coordinates not passed but address is provided, geocode automatically
    if ((!finalLat || !finalLng) && address && address.trim()) {
      const geo = await geocodeAddressServer(address.trim());
      if (geo) {
        finalLat = geo.lat;
        finalLng = geo.lng;
      }
    }

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
        lat: finalLat !== null ? finalLat : undefined,
        lng: finalLng !== null ? finalLng : undefined,
        googleMapsApiKey: googleMapsApiKey !== undefined ? googleMapsApiKey : undefined,
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
        lat: finalLat,
        lng: finalLng,
        googleMapsApiKey: googleMapsApiKey || '',
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
