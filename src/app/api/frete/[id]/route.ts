import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { neighborhood, fee, estimatedMinutes, active } = body;

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: {
        neighborhood: neighborhood ? neighborhood.trim() : undefined,
        fee: fee !== undefined ? Number(fee) : undefined,
        estimatedMinutes: estimatedMinutes !== undefined ? Number(estimatedMinutes) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Erro ao atualizar taxa de entrega:', error);
    return NextResponse.json({ error: 'Erro ao atualizar taxa' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.deliveryZone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir bairro/taxa de entrega:', error);
    return NextResponse.json({ error: 'Erro ao excluir bairro' }, { status: 500 });
  }
}
