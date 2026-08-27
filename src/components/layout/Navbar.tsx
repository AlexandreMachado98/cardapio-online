'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Flame, ShoppingBag, User } from 'lucide-react';
import { StoreSettings } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItemCount, setIsCartOpen, total } = useCart();
  const { customer, isAuthenticated } = useAuth();
  const [storeConfig, setStoreConfig] = useState<StoreSettings | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setStoreConfig(data))
      .catch(() => {});
  }, []);

  // HIDE COMPLETELY IN ADMIN AND COURIER SCREENS (Exclusive admin bar is used)
  if (pathname.startsWith('/admin') || pathname.startsWith('/entregador')) {
    return null;
  }

  const isOpen = storeConfig?.isOpen ?? true;
  const logoUrl = storeConfig?.logoUrl;
  const storeName = storeConfig?.name || 'Cardápio Online';
  const subName = storeConfig?.subName || '';

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand Name with Circular Frame and Green/Red Status Glow Border */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                isOpen
                  ? 'border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'border-2 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
              }`}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo da Cozinha"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
              )}
            </div>

            {/* Micro Beacon Dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-sm sm:text-base tracking-tight text-white group-hover:text-orange-400 transition-colors uppercase">
                {storeName} {subName ? `- ${subName}` : ''}
              </span>
              <span
                className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded border ${
                  isOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              {isOpen ? 'Recebendo pedidos agora' : 'Fechado no momento'}
            </p>
          </div>
        </Link>

        {/* Customer Only Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Profile / Orders link */}
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-700/60 transition-all"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span>
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
