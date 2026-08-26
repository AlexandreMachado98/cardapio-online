import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: {
            available: true,
            ...(search
              ? {
                  OR: [
                    { name: { contains: search } },
                    { description: { contains: search } },
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
