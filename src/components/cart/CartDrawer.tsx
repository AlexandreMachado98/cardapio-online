'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import DeliveryFeeCalculator from './DeliveryFeeCalculator';
import CheckoutModal from './CheckoutModal';

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    deliveryType,
  } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-base tracking-tight">Seu Carrinho</h2>
                <span className="text-xs bg-orange-500/20 text-orange-400 font-semibold px-2 py-0.5 rounded-full border border-orange-500/30">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-red-400 p-1.5 transition-colors"
                    title="Esvaziar Carrinho"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-zinc-300">Seu carrinho está vazio</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Escolha seus espetinhos favoritos no cardápio e adicione aqui para fazer seu pedido.
                  </p>
                </div>
              ) : (
                <>
                  {/* Item List */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-3 flex gap-3 items-start hover:border-zinc-700 transition-colors"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-zinc-900"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-zinc-100 truncate">
                            {item.name}
                          </h4>
                          
                          {/* Selected Options & Complements */}
                          <div className="flex flex-wrap gap-1 mt-1 text-[11px] text-zinc-400">
                            {item.meatPoint && (
                              <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.2 rounded border border-orange-500/20">
                                {item.meatPoint}
                              </span>
                            )}
                            {item.selectedComplements && item.selectedComplements.length > 0 ? (
                              item.selectedComplements.map((c, i) => (
                                <span key={i} className="bg-zinc-700/60 text-zinc-300 px-1.5 py-0.2 rounded">
                                  + {c}
                                </span>
                              ))
                            ) : (
                              <>
                                {item.farofa && (
                                  <span className="bg-zinc-700/60 text-zinc-300 px-1.5 py-0.2 rounded">
                                    + Farofa
                                  </span>
                                )}
                                {item.vinagrete && (
                                  <span className="bg-zinc-700/60 text-zinc-300 px-1.5 py-0.2 rounded">
                                    + Vinagrete
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-amber-400/80 italic mt-0.5 truncate">
                              Obs: {item.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-700/40">
                            <span className="font-bold text-sm text-orange-400">
                              {formatBRL(item.price * item.quantity)}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-700 p-0.5">
                              <button
                                onClick={() => updateQuantity(item.cartItemId, -1)}
                                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold px-2 text-zinc-200">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.cartItemId, 1)}
                                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Consulta de Taxa de Entrega */}
                  <DeliveryFeeCalculator />
                </>
              )}
            </div>

            {/* Footer Summary & Checkout button */}
            {items.length > 0 && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 space-y-3">
                <div className="space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-200">{formatBRL(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega ({deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'})</span>
                    <span className="font-semibold text-zinc-200">
                      {deliveryType === 'DELIVERY'
                        ? deliveryFee > 0
                          ? formatBRL(deliveryFee)
                          : 'Selecione o bairro'
                        : 'Grátis'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-zinc-800">
                    <span>Total do Pedido</span>
                    <span className="text-orange-400 text-base">{formatBRL(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Avançar para Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal onClose={() => setIsCheckoutOpen(false)} />
      )}
    </>
  );
}
