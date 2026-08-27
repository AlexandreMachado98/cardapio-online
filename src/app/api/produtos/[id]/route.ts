import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      complements,
      hasFarofa,
      hasVinagrete,
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        price: price !== undefined ? Number(price) : undefined,
        originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        badge: badge !== undefined ? (badge ? badge : null) : undefined,
        available: available !== undefined ? Boolean(available) : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        meatPoints: meatPoints !== undefined ? (typeof meatPoints === 'string' ? meatPoints : JSON.stringify(meatPoints)) : undefined,
        complements: complements !== undefined ? (typeof complements === 'string' ? complements : JSON.stringify(complements)) : undefined,
        hasFarofa: hasFarofa !== undefined ? Boolean(hasFarofa) : undefined,
        hasVinagrete: hasVinagrete !== undefined ? Boolean(hasVinagrete) : undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
