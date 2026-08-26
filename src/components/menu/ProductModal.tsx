'use client';

import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, Check, Flame, Sparkles } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedMeatPoint, setSelectedMeatPoint] = useState<string>('');
  const [hasFarofa, setHasFarofa] = useState(false);
  const [hasVinagrete, setHasVinagrete] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNotes('');
      // Default meat point if available
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
      setHasFarofa(product.hasFarofa);
      setHasVinagrete(product.hasVinagrete);
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

  const handleAddToCart = () => {
    const cartItemId = `${product.id}-${selectedMeatPoint}-${hasFarofa}-${hasVinagrete}-${notes}-${Date.now()}`;

    const item: CartItem = {
      cartItemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity,
      meatPoint: selectedMeatPoint || undefined,
      farofa: hasFarofa,
      vinagrete: hasVinagrete,
      notes: notes.trim() || undefined,
    };

    addItem(item);
    onClose();
  };

  const totalPrice = product.price * quantity;

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
            <div className="text-orange-400 font-extrabold text-lg mt-2">
              {formatBRL(product.price)} <span className="text-xs text-zinc-500 font-normal">/ unid.</span>
            </div>
          </div>

          {/* Ponto da Carne (se aplicável) */}
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

          {/* Acompanhamentos Gratuitos da Casa */}
          {(product.hasFarofa || product.hasVinagrete) && (
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Acompanhamentos Cortesia da Casa
              </label>
              <div className="space-y-2">
                {product.hasFarofa && (
                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">Farofa Crocante Artesanal</span>
                    <input
                      type="checkbox"
                      checked={hasFarofa}
                      onChange={(e) => setHasFarofa(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-500"
                    />
                  </label>
                )}
                {product.hasVinagrete && (
                  <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                    <span className="text-xs text-zinc-200 font-medium">Vinagrete Especial com Azeite</span>
                    <input
                      type="checkbox"
                      checked={hasVinagrete}
                      onChange={(e) => setHasVinagrete(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-500"
                    />
                  </label>
                )}
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
              placeholder="Ex: pouco sal, corte em rodelas, etc."
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
