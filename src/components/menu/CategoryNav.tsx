'use client';

import React from 'react';
import { Category } from '@/types';
import { Flame, Crown, Sparkles, UtensilsCrossed, Beer, Gift, LayoutGrid } from 'lucide-react';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

const iconMap: Record<string, any> = {
  Flame,
  Crown,
  Sparkles,
  UtensilsCrossed,
  Beer,
  Gift,
};

export default function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <div className="sticky top-16 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 py-3 shadow-md">
      <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategoryId === 'all'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105'
              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Todos</span>
        </button>

        {categories.map((cat) => {
          const IconComponent = (cat.icon && iconMap[cat.icon]) || Flame;
          const isActive = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
