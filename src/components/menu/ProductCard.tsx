'use client';

import React from 'react';
import { Product } from '@/types';
import { Plus, Sparkles, Percent } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal }: ProductCardProps) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="group bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-orange-500/50 rounded-2xl p-3.5 sm:p-4 flex gap-3 sm:gap-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-orange-950/20 relative overflow-hidden"
    >
      {/* Left Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.badge && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                {product.badge}
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                <Percent className="w-2.5 h-2.5" />
                Oferta
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-orange-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base sm:text-lg text-orange-400">
              {formatBRL(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-zinc-500 line-through">
                {formatBRL(product.originalPrice!)}
              </span>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-1 bg-zinc-800 group-hover:bg-orange-600 text-zinc-200 group-hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Right Image */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    </div>
  );
}
