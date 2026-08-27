'use client';

import React, { useState, useEffect } from 'react';
import { Product, CartItem, ProductComplement } from '@/types';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, Check, Flame, Sparkles, CheckSquare, Square } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState<string>('');
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  const [availableComplements, setAvailableComplements] = useState<ProductComplement[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNotes('');

      // Meat Points
      if (product.meatPoints) {
        try {
          const parsed = JSON.parse(product.meatPoints);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedMeatPoint(parsed[0]);
          }
        } catch (e) {
          setSelectedMeatPoint('');
        }
      } else {
        setSelectedMeatPoint('');
      }

      // Parse Complements
      let comps: ProductComplement[] = [];
      if (product.complements) {
        try {
          const parsed = JSON.parse(product.complements);
          if (Array.isArray(parsed)) {
            comps = parsed;
          }
        } catch (e) {
          comps = [];
        }
      } else {
        // Fallback
        if (product.hasFarofa) comps.push({ name: 'Farofa Crocante da Casa', price: 0 });
        if (product.hasVinagrete) comps.push({ name: 'Vinagrete Especial com Azeite', price: 0 });
      }

      setAvailableComplements(comps);
      // Pre-select free complements by default
      setSelectedComplements(comps.map((c) => c.name));
    }
  }, [product]);

  if (!product) return null;

  let availableMeatPoints: string[] = [];
  if (product.meatPoints) {
    try {
      availableMeatPoints = JSON.parse(product.meatPoints);
    } catch (e) {
      availableMeatPoints = [];
    }
  }

  const handleToggleComplement = (compName: string) => {
    setSelectedComplements((prev) => {
      if (prev.includes(compName)) {
        return prev.filter((name) => name !== compName);
      } else {
        return [...prev, compName];
      }
    });
  };

  // Calculate extra price from selected complements
  const extraPrice = availableComplements
    .filter((c) => selectedComplements.includes(c.name) && (c.price || 0) > 0)
    .reduce((sum, c) => sum + (c.price || 0), 0);

  const unitPriceWithExtras = product.price + extraPrice;
  const totalPrice = unitPriceWithExtras * quantity;

  const handleAddToCart = () => {
    const cartItemId = `${product.id}-${selectedMeatPoint}-${selectedComplements.sort().join('-')}-${notes}-${Date.now()}`;

    const hasFarofa = selectedComplements.some((c) => c.toLowerCase().includes('farofa'));
    const hasVinagrete = selectedComplements.some((c) => c.toLowerCase().includes('vinagrete'));

    const item: CartItem = {
      cartItemId,
      productId: product.id,
      name: product.name,
      price: unitPriceWithExtras,
      imageUrl: product.imageUrl,
      quantity,
      meatPoint: selectedMeatPoint || undefined,
      selectedComplements: selectedComplements,
      farofa: hasFarofa,
      vinagrete: hasVinagrete,
      notes: notes.trim() || undefined,
    };

    addItem(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Top Image Banner with Close Button */}
        <div className="relative h-48 sm:h-56 w-full bg-zinc-950 flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {product.badge && (
            <span className="absolute bottom-3 left-4 inline-flex items-center gap-1 text-xs uppercase font-bold tracking-wider bg-orange-500 text-white px-2.5 py-1 rounded-full shadow-md">
              <Sparkles className="w-3 h-3" />
              {product.badge}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {product.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {product.description}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-orange-400 font-extrabold text-xl">
                {formatBRL(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-zinc-500 line-through">
                  {formatBRL(product.originalPrice)}
                </span>
              )}
              <span className="text-xs text-zinc-500 font-normal">/ unid.</span>
            </div>
          </div>

          {/* Ponto da Carne */}
          {availableMeatPoints.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Ponto da Carne
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableMeatPoints.map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setSelectedMeatPoint(point)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedMeatPoint === point
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COMPLEMENTOS & ACOMPANHAMENTOS DINÂMICOS */}
          {availableComplements.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Complementos & Acompanhamentos
                </label>
                <span className="text-[11px] text-zinc-500">Escolha os desejados</span>
              </div>

              <div className="space-y-2">
                {availableComplements.map((comp) => {
                  const isChecked = selectedComplements.includes(comp.name);
                  return (
                    <label
                      key={comp.name}
                      onClick={() => handleToggleComplement(comp.name)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-zinc-950 border-orange-500/50 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium">{comp.name}</span>
                      </div>

                      <span className="text-[11px] font-bold text-orange-400">
                        {comp.price && comp.price > 0 ? `+ ${formatBRL(comp.price)}` : 'Grátis'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1">
              Alguma Observação?
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções para o preparo..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center bg-zinc-900 rounded-xl border border-zinc-700 p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold px-3 text-zinc-100 min-w-[2rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] transition-all text-xs sm:text-sm"
          >
            <span>Adicionar ao Pedido</span>
            <span className="font-extrabold">{formatBRL(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
