'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Flame, ShoppingBag, User, UtensilsCrossed, ShieldAlert, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { totalItemCount, setIsCartOpen, total } = useCart();
  const { customer, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">
                SABOR & ESPETO
              </span>
              <span className="text-[10px] uppercase font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30">
                Na Brasa
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Cardápio Artesanal & Delivery Rápido</p>
          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin shortcut */}
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-orange-400 bg-zinc-800/80 hover:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700/60 transition-all"
            title="Painel de Controle da Cozinha"
          >
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <span>Cozinha / Admin</span>
          </Link>

          {/* Profile link */}
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700/60 transition-all"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {isAuthenticated ? customer?.name.split(' ')[0] : 'Meus Pedidos'}
            </span>
          </Link>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-3.5 py-2 rounded-xl font-semibold shadow-md shadow-orange-950/50 hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {totalItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-orange-600 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {total > 0 ? `R$ ${total.toFixed(2).replace('.', ',')}` : 'Carrinho'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
