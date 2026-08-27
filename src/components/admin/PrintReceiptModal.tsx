'use client';

import React from 'react';
import { OrderData } from '@/types';
import { formatBRL, formatPhone } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

interface PrintReceiptModalProps {
  order: OrderData | null;
  onClose: () => void;
}

export default function PrintReceiptModal({ order, onClose }: PrintReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDelivery = order.deliveryType === 'DELIVERY';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4 print:border-none print:shadow-none print:bg-white print:p-0 print:text-black">
        {/* Header Controls (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 print:hidden">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-orange-400" />
            Comanda da Cozinha
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper (80mm formatted) */}
        <div
          id="printable-receipt"
          className="bg-white text-black font-mono p-4 rounded-xl text-xs space-y-2.5 shadow-inner border border-zinc-300 print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-zinc-400 pb-2 space-y-0.5">
            <div className="font-black text-sm uppercase">COMANDA DE PEDIDO</div>
            <div className="text-[10px] text-zinc-600">DELIVERY & BALCÃO</div>
            <div className="text-base font-black pt-1">
              *** PEDIDO #{order.orderNumber} ***
            </div>
            <div className="text-[10px] text-zinc-600">
              {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Customer & Address */}
          <div className="border-b border-dashed border-zinc-400 pb-2 text-[11px] space-y-0.5">
            <div>
              <strong>CLIENTE:</strong> {order.customerName}
            </div>
            <div>
              <strong>FONE/ZAP:</strong> {formatPhone(order.customerPhone)}
            </div>
            <div>
              <strong>TIPO:</strong>{' '}
              <span className="font-bold uppercase">
                {isDelivery ? '>>> ENTREGA EM DOMICÍLIO <<<' : '>>> RETIRADA NO BALCÃO <<<'}
              </span>
            </div>
            {isDelivery && (
              <div>
                <strong>ENDEREÇO:</strong> {order.addressText}
              </div>
            )}
            {order.notes && (
              <div className="bg-zinc-100 p-1 rounded font-bold text-red-700 mt-1">
                OBS: {order.notes}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-b border-dashed border-zinc-400 pb-2 space-y-1 text-[11px]">
            <div className="font-bold uppercase text-[10px] text-zinc-500 border-b border-zinc-200 pb-0.5 flex justify-between">
              <span>QTD ITEM</span>
              <span>TOTAL</span>
            </div>

            {order.items.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span>{formatBRL(item.totalPrice)}</span>
                </div>
                {(item.meatPoint || item.farofa || item.vinagrete || item.notes) && (
                  <div className="text-[10px] text-zinc-600 pl-3">
                    {item.meatPoint && <div>• Ponto: {item.meatPoint}</div>}
                    {item.farofa && <div>• Com Farofa</div>}
                    {item.vinagrete && <div>• Com Vinagrete</div>}
                    {item.notes && <div>• Obs: {item.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa Entrega:</span>
              <span>{order.deliveryFee > 0 ? formatBRL(order.deliveryFee) : 'GRÁTIS'}</span>
            </div>
            <div className="flex justify-between font-black text-sm border-t border-zinc-300 pt-1">
              <span>TOTAL:</span>
              <span>{formatBRL(order.total)}</span>
            </div>
            <div className="pt-1 text-[10px] text-zinc-700">
              <strong>PAGAMENTO:</strong> {order.paymentMethod}{' '}
              {order.changeFor ? `(Troco p/ ${formatBRL(order.changeFor)})` : ''}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-dashed border-zinc-400 pt-2 text-[9px] text-zinc-500">
            Acompanhe o pedido pelo site oficial
          </div>
        </div>

        {/* Print Button (Hidden on print) */}
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir na Impressora Térmica</span>
          </button>
        </div>
      </div>
    </div>
  );
}
