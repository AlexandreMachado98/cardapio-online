import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true'; // Se true, traz inclusive as inativas para o admin

    const categories = await prisma.category.findMany({
      where: all ? {} : { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon, sortOrder, active } = body;

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const category = await prisma.category.create({
      data: {
        name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        icon: icon || 'Flame',
        sortOrder: Number(sortOrder) || 0,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, icon, sortOrder, active } = body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        icon: icon !== undefined ? icon : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
