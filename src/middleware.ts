import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'cardapio-super-secret-key-change-in-prod';
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Excluir rotas de auth da verificação
  if (pathname.startsWith('/api/admin/login') || pathname.startsWith('/api/admin/logout') || pathname.startsWith('/api/admin/session')) {
    return NextResponse.next();
  }

  // Verificar Token
  const token = request.cookies.get('saborespeto_admin_token')?.value;
  let isAuthenticated = false;
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      if (payload.role === 'admin') {
        isAuthenticated = true;
      }
    } catch (e) {
      isAuthenticated = false;
    }
  }

  // 1. Proteger rotas de API Administrativas
  if (pathname.startsWith('/api/')) {
    const isProtectedMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    
    // Lista de APIs que exigem admin para operações de escrita
    const adminApiRoutes = [
      '/api/categorias',
      '/api/produtos',
      '/api/config',
      '/api/config/status',
      '/api/frete',
      '/api/entregadores',
    ];

    const isTargetingAdminApi = adminApiRoutes.some(route => pathname.startsWith(route));

    // APIs que são estritamente administrativas até mesmo para leitura (GET)
    const strictAdminApiRoutes = [
      '/api/entregadores',
    ];

    const isTargetingStrictAdminApi = strictAdminApiRoutes.some(route => pathname.startsWith(route));
    
    if (isTargetingStrictAdminApi && !isAuthenticated) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 });
    }

    // Proteção de operações de gravação nos endpoints (POST, PUT, DELETE)
    if (isProtectedMethod && isTargetingAdminApi && !isAuthenticated) {
      return NextResponse.json({ error: 'Acesso negado. Requer autenticação administrativa.' }, { status: 401 });
    }

    // Regras especiais para /api/pedidos
    if (pathname.startsWith('/api/pedidos')) {
      // POST é público (cliente cria pedido)
      if (request.method !== 'POST' && request.method !== 'GET') {
        if (!isAuthenticated) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 });
      }
      
      // GET sem telefone é operação administrativa (listar todos os pedidos)
      if (request.method === 'GET') {
        const phone = request.nextUrl.searchParams.get('phone');
        if (!phone && !isAuthenticated) {
          return NextResponse.json({ error: 'Acesso negado. Apenas admins podem listar todos os pedidos.' }, { status: 403 });
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
