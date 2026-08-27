'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { UtensilsCrossed, User, ShoppingBag } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItemCount, setIsCartOpen } = useCart();

  // Hide in admin or motoboy standalone screens
  if (pathname.startsWith('/admin') || pathname.startsWith('/entregador')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800 px-6 py-2.5 flex items-center justify-around shadow-2xl">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
          pathname === '/' ? 'text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span>Cardápio</span>
      </Link>

      <button
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          {totalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {totalItemCount}
            </span>
          )}
        </div>
        <span>Carrinho</span>
      </button>

      <Link
        href="/perfil"
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
          pathname === '/perfil' ? 'text-orange-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <User className="w-5 h-5" />
        <span>Meus Pedidos</span>
      </Link>
    </div>
  );
}
