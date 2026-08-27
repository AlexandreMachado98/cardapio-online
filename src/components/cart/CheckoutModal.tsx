'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  MapPin,
  Phone,
  User,
  CreditCard,
  QrCode,
  Banknote,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatBRL } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface CheckoutModalProps {
  onClose: () => void;
}

export default function CheckoutModal({ onClose }: void | any) {
  const router = useRouter();
  const { items, deliveryType, selectedZone, deliveryFee, subtotal, total, clearCart, setIsCartOpen } = useCart();
  const { customer, login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Customer & Address state
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [street, setStreet] = useState(customer?.street || '');
  const [number, setNumber] = useState(customer?.number || '');
  const [complement, setComplement] = useState(customer?.complement || '');
  const [cep, setCep] = useState(customer?.cep || '');
  const [notes, setNotes] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD' | 'CASH'>('PIX');
  const [changeFor, setChangeFor] = useState('');

  const neighborhood = selectedZone?.neighborhood || 'Centro';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Informe um telefone WhatsApp válido (com DDD).');
      return;
    }

    if (deliveryType === 'DELIVERY' && (!street.trim() || !number.trim())) {
      setError('Informe a rua e o número para a entrega.');
      return;
    }

    if (paymentMethod === 'CASH' && changeFor && Number(changeFor) < total) {
      setError(`O valor para troco deve ser maior que o total (${formatBRL(total)}).`);
      return;
    }

    setLoading(true);

    try {
      login({
        name,
        phone: cleanPhone,
        street,
        number,
        complement,
        neighborhood,
        cep,
      });

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: cleanPhone,
          deliveryType,
          street,
          number,
          complement,
          neighborhood,
          cep,
          deliveryFee,
          subtotal,
          total,
          paymentMethod,
          changeFor: changeFor ? Number(changeFor) : null,
          notes,
          items,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar o pedido. Tente novamente.');
      }

      const createdOrder = await res.json();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // ignore
      }

      clearCart();
      setIsCartOpen(false);
      onClose();

      router.push(`/pedido/${createdOrder.orderNumber}`);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao enviar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Finalizar Pedido</h3>
              <p className="text-[11px] text-zinc-400">Preencha seus dados para entrega</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dados do Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Seus Dados
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Endereço de Entrega (se delivery) */}
          {deliveryType === 'DELIVERY' ? (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Endereço de Entrega
                </h4>
                <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                  Bairro: {neighborhood}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua ou avenida"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Nº"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Complemento / Ponto de Ref.
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, bloco, casa dos fundos..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    CEP (opcional)
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs">
              📍 <strong>Retirada no Balcão:</strong> Seu pedido estará pronto em aproximadamente 20 minutos após a confirmação.
            </div>
          )}

          {/* Forma de Pagamento */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Forma de Pagamento
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('PIX')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all ${
                  paymentMethod === 'PIX'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300 shadow'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>Cartão na Entrega</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium gap-1 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow'
                    : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>Dinheiro</span>
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Precisa de troco para quanto? (Deixe em branco se não precisar)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Observações do Pedido (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções para o entregador ou cozinha..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Resumo Final */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal ({items.length} itens)</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Taxa de Entrega</span>
              <span>{deliveryFee > 0 ? formatBRL(deliveryFee) : 'Grátis'}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-zinc-800">
              <span>Total a Pagar</span>
              <span className="text-orange-400">{formatBRL(total)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando Pedido para a Cozinha...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirmar e Fazer Pedido ({formatBRL(total)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
