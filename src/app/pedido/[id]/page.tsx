'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderData } from '@/types';
import { getStatusDetails, formatBRL, formatPhone } from '@/lib/utils';
import { createWhatsAppLink, generateOrderConfirmationWhatsAppMessage } from '@/lib/whatsapp';
import {
  Clock,
  CheckCircle2,
  Flame,
  PackageCheck,
  Bike,
  PartyPopper,
  XCircle,
  MapPin,
  MessageCircle,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

const steps = [
  { key: 'PENDING', label: 'Recebido', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Na Brasa', icon: Flame },
  { key: 'READY', label: 'Embalado', icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'A Caminho', icon: Bike },
  { key: 'DELIVERED', label: 'Entregue', icon: PartyPopper },
];

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Erro ao buscar status do pedido', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Auto-poll status every 6 seconds
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Carregando status do pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Pedido não encontrado</h2>
        <p className="text-xs text-zinc-400">
          Não localizamos nenhum pedido com o identificador informado.
        </p>
        <Link
          href="/"
          className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors"
        >
          Voltar ao Cardápio
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusDetails(order.status);
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const isDelivered = order.status === 'DELIVERED';

  // Find step index
  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  // Restaurant WhatsApp contact
  const restaurantWhatsApp = createWhatsAppLink(
    '11999999999',
    `Olá! Gostaria de informações sobre meu Pedido #${order.orderNumber} no Sabor & Espeto.`
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </Link>

        <button
          onClick={fetchOrder}
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizado agora</span>
        </button>
      </div>

      {/* Hero Status Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-orange-400 tracking-wider">
                Pedido #{order.orderNumber}
              </span>
              <span className="text-[11px] text-zinc-500">
                • {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {statusInfo.label}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg">
              {statusInfo.description}
            </p>
          </div>

          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.badgeColor} animate-pulse`} />
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Visual Step Progress Bar */}
        <div className="py-3">
          <div className="grid grid-cols-6 gap-1 relative">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-orange-500 text-white ring-4 ring-orange-500/30 scale-110 shadow-lg'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold hidden sm:block ${
                      isCurrent
                        ? 'text-orange-400 font-bold'
                        : isPast
                        ? 'text-zinc-200'
                        : 'text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Notification & Confirmation Card */}
        {order && (() => {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const trackingUrl = `${origin}/pedido/${order.orderNumber}`;
          const waConfirmationMsg = generateOrderConfirmationWhatsAppMessage({
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            items: order.items,
            deliveryType: order.deliveryType,
            addressText: order.addressText,
            deliveryFee: order.deliveryFee,
            subtotal: order.subtotal,
            total: order.total,
            paymentMethod: order.paymentMethod,
            changeFor: order.changeFor,
            trackingUrl,
            notes: order.notes,
          });
          const waConfirmationLink = createWhatsAppLink(order.customerPhone, waConfirmationMsg);

          return (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 flex-shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    💬 Comprovante & Notificação do WhatsApp
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    O link de rastreio e resumo do pedido foram formatados para envio no seu WhatsApp.
                  </p>
                </div>
              </div>

              <a
                href={waConfirmationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:scale-105 transition-all flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir no WhatsApp</span>
              </a>
            </div>
          );
        })()}

        {/* Live GPS Tracker Highlight Button (If Out for Delivery) */}
        {isOutForDelivery && (
          <div className="bg-gradient-to-r from-orange-600/30 via-amber-600/20 to-zinc-900 border border-orange-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse-subtle">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 flex-shrink-0">
                <Bike className="w-6 h-6 animate-bounce-short" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  🛵 Seu pedido saiu para entrega com {order.courierName || 'o motoboy'}!
                </h4>
                <p className="text-xs text-orange-200/80">
                  Acompanhe o deslocamento ao vivo pelo mapa da rota.
                </p>
              </div>
            </div>

            <Link
              href={`/rastreio/${order.orderNumber}`}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 hover:scale-105 transition-all flex-shrink-0"
            >
              <Navigation className="w-4 h-4" />
              <span>Ver Rastreio no Mapa</span>
            </Link>
          </div>
        )}
      </div>

      {/* Order Items & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              Itens Escolhidos ({order.items.length})
            </h3>
          </div>

          <div className="space-y-3 divide-y divide-zinc-800/60">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-zinc-800 text-orange-400 px-2 py-0.5 rounded">
                      {item.quantity}x
                    </span>
                    <span className="text-sm font-semibold text-zinc-100">
                      {item.productName}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px] text-zinc-400 pl-7">
                    {item.meatPoint && (
                      <span className="text-orange-300">Ponto: {item.meatPoint}</span>
                    )}
                    {item.farofa && <span>• Farofa</span>}
                    {item.vinagrete && <span>• Vinagrete</span>}
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-zinc-500 italic pl-7">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>

                <span className="font-bold text-sm text-zinc-200">
                  {formatBRL(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Details & Payment sidebar */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-orange-400">
              Resumo dos Valores
            </h4>

            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-zinc-200">{formatBRL(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega</span>
                <span className="text-zinc-200">
                  {order.deliveryFee > 0 ? formatBRL(order.deliveryFee) : 'Grátis'}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-white pt-2 border-t border-zinc-800">
                <span>Total</span>
                <span className="text-orange-400">{formatBRL(order.total)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div>
                <span className="font-medium text-zinc-300">Pagamento: </span>
                <span>{order.paymentMethod}</span>
              </div>
              {order.changeFor && (
                <div>
                  <span className="font-medium text-zinc-300">Troco para: </span>
                  <span>{formatBRL(order.changeFor)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-orange-400">
              Entrega / Destino
            </h4>
            <div className="flex items-start gap-2 text-zinc-300">
              <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>{order.addressText || 'Retirada no Balcão'}</span>
            </div>

            <a
              href={restaurantWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar com o Restaurante</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
