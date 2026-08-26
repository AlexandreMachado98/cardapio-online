'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { MapPin, Truck, Store, Clock, ChevronDown, CheckCircle2 } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

export default function DeliveryFeeCalculator() {
  const {
    deliveryType,
    setDeliveryType,
    selectedZone,
    setSelectedZone,
    deliveryZones,
  } = useCart();

  return (
    <div className="bg-zinc-800/70 border border-zinc-700/60 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Forma de Entrega / Retirada
        </span>
        <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-700/80">
          <button
            type="button"
            onClick={() => setDeliveryType('DELIVERY')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
              deliveryType === 'DELIVERY'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Entrega
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('PICKUP')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
              deliveryType === 'PICKUP'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Retirar
          </button>
        </div>
      </div>

      {deliveryType === 'DELIVERY' ? (
        <div className="space-y-2 pt-1 border-t border-zinc-700/40">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              Consulte a Taxa por Bairro:
            </span>
            {selectedZone && (
              <span className="text-orange-400 font-bold">
                {formatBRL(selectedZone.fee)}
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedZone?.id || ''}
              onChange={(e) => {
                const zone = deliveryZones.find((z) => z.id === e.target.value);
                setSelectedZone(zone || null);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer pr-8"
            >
              <option value="" disabled>
                Selecione seu bairro para calcular o frete...
              </option>
              {deliveryZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.neighborhood} — {formatBRL(zone.fee)} (~{zone.estimatedMinutes} min)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {selectedZone && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/60 px-2.5 py-1.5 rounded border border-zinc-800">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Entrega disponível
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <Clock className="w-3 h-3 text-orange-400" />
                Tempo estimado: {selectedZone.estimatedMinutes} min
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2.5 rounded-lg flex items-center gap-2">
          <Store className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Retirada grátis no balcão! Pronto em aproximadamente 20 min.</span>
        </div>
      )}
    </div>
  );
}
