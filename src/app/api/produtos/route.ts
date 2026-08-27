import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') === 'true'; // Se true, traz para o painel admin

    const categories = await prisma.category.findMany({
      where: all ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: {
            ...(all ? {} : { available: true }),
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      originalPrice,
      imageUrl,
      badge,
      available,
      categoryId,
      meatPoints,
      hasFarofa,
      hasVinagrete,
    } = body;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        badge: badge || null,
        available: available !== undefined ? Boolean(available) : true,
        categoryId,
        meatPoints: meatPoints ? (typeof meatPoints === 'string' ? meatPoints : JSON.stringify(meatPoints)) : null,
        hasFarofa: hasFarofa !== undefined ? Boolean(hasFarofa) : true,
        hasVinagrete: hasVinagrete !== undefined ? Boolean(hasVinagrete) : true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar produto' }, { status: 500 });
  }
}
