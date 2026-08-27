'use client';

import React, { useState, useEffect } from 'react';
import { Category, Product, StoreSettings } from '@/types';
import CategoryNav from '@/components/menu/CategoryNav';
import ProductCard from '@/components/menu/ProductCard';
import ProductModal from '@/components/menu/ProductModal';
import {
  Flame,
  Search,
  Clock,
  MapPin,
  Sparkles,
  ShoppingBag,
  Bike,
  Star,
  ChevronRight,
  Megaphone,
  AlertTriangle,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const { setIsCartOpen, selectedZone } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data);
      }
    } catch (err) {
      console.error('Erro ao buscar configs da loja', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/produtos?search=${encodeURIComponent(searchQuery)}`
        : '/api/produtos';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao carregar cardápio', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by selected category
  const filteredCategories = categories.filter((cat) => {
    if (activeCategoryId === 'all') return (cat.products?.length || 0) > 0;
    return cat.id === activeCategoryId && (cat.products?.length || 0) > 0;
  });

  const storeName = storeSettings?.name || 'Cardápio Online';
  const storeSubName = storeSettings?.subName || 'Espetinho & Brasa';
  const isOpen = storeSettings?.isOpen ?? true;

  return (
    <div className="min-h-screen pb-16">
      {/* Top Announcement Bar (if configured) */}
      {storeSettings?.announcement && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
          <Megaphone className="w-3.5 h-3.5 animate-bounce-short flex-shrink-0" />
          <span className="text-center">{storeSettings.announcement}</span>
        </div>
      )}

      {/* Closed Alert Banner */}
      {!isOpen && (
        <div className="bg-red-600/90 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>O restaurante está fechado no momento. Você ainda pode visualizar o cardápio.</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border-b border-zinc-800 pt-8 pb-10 px-4 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Circular Logo with Glowing Status Border */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      isOpen
                        ? 'border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                        : 'border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    }`}
                  >
                    {storeSettings?.logoUrl ? (
                      <img
                        src={storeSettings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white">
                        <Flame className="w-10 h-10 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Status Badge Tag */}
                  <div
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow text-white whitespace-nowrap ${
                      isOpen
                        ? 'bg-emerald-600 border-emerald-400'
                        : 'bg-red-600 border-red-400'
                    }`}
                  >
                    {isOpen ? 'Aberto' : 'Fechado'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-orange-400">
                      {isOpen ? '🔥 Assando na Brasa na Hora' : '⏰ Fechado no Momento'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight uppercase">
                    {storeName} {storeSubName ? `- ${storeSubName}` : ''}
                  </h1>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-lg">
                    Espetinhos suculentos na brasa, guarnições da casa e bebidas geladas. Faça seu pedido com rastreio ao vivo por GPS!
                  </p>
                </div>
              </div>

              {/* Badges / Info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700/60">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span>30-45 min</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700/60">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>4.9 (1.2k+ avaliações)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700/60">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Rastreio GPS ao Vivo</span>
                </div>
              </div>
            </div>

            {/* Quick Delivery Check Card */}
            <div className="w-full md:w-80 bg-zinc-800/60 backdrop-blur-md border border-zinc-700/70 p-4 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Status da Cozinha
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isOpen
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                      : 'text-red-400 bg-red-500/15 border-red-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOpen ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
                    }`}
                  />
                  {isOpen ? 'Aberto Agora' : 'Fechado'}
                </span>
              </div>

              <div className="text-xs text-zinc-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>
                  {selectedZone
                    ? `Entrega p/ ${selectedZone.neighborhood} (R$ ${selectedZone.fee.toFixed(2).replace('.', ',')})`
                    : 'Entregamos em toda a região'}
                </span>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-between transition-colors"
              >
                <span>Consultar Taxa de Entrega</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="mt-8 relative max-w-xl mx-auto md:mx-0">
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos, espetos, porções, bebidas..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Categories Navigation */}
      <CategoryNav
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

      {/* Products Display Section */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-32 bg-zinc-900/60 border border-zinc-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
              <Flame className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-200">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs text-zinc-400">
              Tente buscar por outro termo ou selecione outra categoria.
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id} id={category.slug} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
                  <h2 className="font-extrabold text-lg sm:text-xl text-zinc-100 tracking-tight">
                    {category.name}
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {category.products?.length} {category.products?.length === 1 ? 'opção' : 'opções'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.products?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenModal={setSelectedProduct}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Product Customizer Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
