import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    const validUser = settings?.adminUser || 'admin';
    const validEmail = settings?.adminEmail || 'admin@cardapio.com';
    const validPass = settings?.adminPassword || settings?.adminPin || '157864';

    const inputUser = String(username || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    const userMatches =
      inputUser === validUser.toLowerCase() ||
      inputUser === validEmail.toLowerCase() ||
      inputUser === 'admin';

    const passMatches = inputPass === validPass;

    if (userMatches && passMatches) {
      return NextResponse.json({
        success: true,
        message: 'Login realizado com sucesso',
        user: { name: validUser, email: validEmail },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Usuário ou senha incorretos' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Erro ao autenticar admin:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
