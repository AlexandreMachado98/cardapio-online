'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { OrderData } from '@/types';
import { getStatusDetails, formatBRL, formatPhone } from '@/lib/utils';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  Clock,
  CheckCircle2,
  Flame,
  PackageCheck,
  Bike,
  PartyPopper,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Receipt,
  Navigation,
  Sparkles,
  WifiOff,
} from 'lucide-react';

const steps = [
  { key: 'PENDING', label: 'Recebido', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmado', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Na Brasa', icon: Flame },
  { key: 'READY', label: 'Embalado', icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'A Caminho', icon: Bike },
  { key: 'DELIVERED', label: 'Entregue', icon: PartyPopper },
];

const LiveTrackerMap = dynamic(
  () => import('@/components/tracking/LiveTrackerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-2xl">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-400">Carregando Mapa de Rastreamento em Tempo Real...</span>
        </div>
      </div>
    ),
  }
);

interface TrackingViewProps {
  id: string;
}

export default function TrackingView({ id }: TrackingViewProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'NONE' | 'NOT_FOUND' | 'INVALID_ID' | 'NETWORK_ERROR'>('NONE');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storePhone, setStorePhone] = useState<string>('');
  const lastFetchedOrderRef = useRef<OrderData | null>(null);

  const cleanId = id ? decodeURIComponent(id).trim().replace(/^#/, '') : '';

  const fetchOrderData = useCallback(async (isPolling = false) => {
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      setErrorType('INVALID_ID');
      setErrorMessage('Identificador do pedido inválido ou não informado.');
      setLoading(false);
      return;
    }

    if (!isPolling) {
      setIsRefreshing(true);
    }

    try {
      const [orderRes, configRes] = await Promise.all([
        fetch(`/api/pedidos/${encodeURIComponent(cleanId)}`),
        fetch('/api/config').catch(() => null),
      ]);

      if (configRes && configRes.ok) {
        try {
          const cfg = await configRes.json();
          if (cfg?.phone) setStorePhone(cfg.phone);
        } catch (e) {}
      }

      if (orderRes.ok) {
        const data: OrderData = await orderRes.json();
        setOrder(data);
        lastFetchedOrderRef.current = data;
        setErrorType('NONE');
        setErrorMessage('');
      } else {
        const errorData = await orderRes.json().catch(() => ({}));
        if (orderRes.status === 404) {
          // Only show not found if we don't already have an order loaded
          if (!lastFetchedOrderRef.current) {
            setErrorType('NOT_FOUND');
            setErrorMessage(errorData.error || 'Não encontramos nenhum pedido com este identificador.');
          }
        } else if (orderRes.status === 400) {
          setErrorType('INVALID_ID');
          setErrorMessage(errorData.error || 'Identificador de pedido inválido.');
        } else {
          // 500 or other server error: do not destroy existing order, flag network error
          if (!lastFetchedOrderRef.current) {
            setErrorType('NETWORK_ERROR');
            setErrorMessage('Serviço temporariamente indisponível. Tente novamente em instantes.');
          }
        }
      }
    } catch (err: any) {
      console.error('[TRACKING_CLIENT_ERROR] Falha na requisição:', err);
      if (!lastFetchedOrderRef.current) {
        setErrorType('NETWORK_ERROR');
        setErrorMessage('Falha na conexão com o servidor. Verifique sua internet.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [cleanId]);

  useEffect(() => {
    fetchOrderData(false);

    // Auto-poll every 4 seconds to catch real-time status updates (e.g. OUT_FOR_DELIVERY)
    const interval = setInterval(() => {
      fetchOrderData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchOrderData]);

  // 1. ESTADO DE CARREGAMENTO INICIAL
  if (loading && !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-orange-500/20" />
        <h2 className="text-base font-bold text-white">Buscando seu pedido...</h2>
        <p className="text-xs text-zinc-400">Consultando status e conexão com a cozinha...</p>
      </div>
    );
  }

  // 2. ESTADO DE ERRO DE CONEXÃO
  if (errorType === 'NETWORK_ERROR' && !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
          <WifiOff className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Problema de Conexão</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {errorMessage || 'Não foi possível atualizar o pedido. Verifique sua conexão e tente novamente.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchOrderData(false)}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/40"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tentar Novamente</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </div>
    );
  }

  // 3. ESTADO IDENTIFICADOR INVÁLIDO OU NÃO ENCONTRADO REAL
  if (!order || errorType === 'NOT_FOUND' || errorType === 'INVALID_ID') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 shadow-2xl">
          <XCircle className="w-8 h-8 text-red-500/80" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">
            {errorType === 'INVALID_ID' ? 'Identificador Inválido' : 'Pedido Não Encontrado'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {errorMessage || 'Não encontramos nenhum pedido ativo com o código fornecido. Verifique o link ou acesse seu histórico de pedidos pelo WhatsApp.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Link
            href="/perfil"
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-lg shadow-orange-950/40"
          >
            Consultar Meus Pedidos
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </div>
    );
  }

  // 4. PEDIDO ENCONTRADO - RENDERIZAÇÃO DOS ESTADOS REAIS
  const statusInfo = getStatusDetails(order.status);
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const isDelivered = order.status === 'DELIVERED' || order.status === 'CLOSED';
  const isCancelled = order.status === 'CANCELLED';

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);

  const contactPhone = storePhone || order.courierPhone || '11999999999';
  const storeWhatsAppUrl = createWhatsAppLink(
    contactPhone,
    `Olá! Gostaria de acompanhar meu Pedido #${order.orderNumber} em nome de ${order.customerName}.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Refresh Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/pedido/${order.orderNumber}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Recibo</span>
          </Link>

          <button
            onClick={() => fetchOrderData(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all"
            title="Atualizar status agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Hero Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-orange-400 tracking-wider">
                Pedido #{order.orderNumber}
              </span>
              <span className="text-[11px] text-zinc-500">
                • {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {order.deliveryType === 'TABLE' ? (
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  🍽️ Mesa {order.tableNumber || ''}
                </span>
              ) : order.deliveryType === 'DELIVERY' ? (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  🛵 Delivery
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  📍 Retirada
                </span>
              )}
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

        {/* Visual Progress Stepper */}
        {order.deliveryType !== 'TABLE' && (
          <div className="py-2">
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
        )}

        {/* Notice for orders in preparation / not yet dispatched */}
        {!isOutForDelivery && !isDelivered && !isCancelled && order.deliveryType === 'DELIVERY' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600/30 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bike className="w-4 h-4" />
            </div>
            <div className="text-xs text-orange-200/90 space-y-1">
              <p className="font-bold text-white">
                📡 O mapa de rastreamento GPS ao vivo será ativado quando o pedido sair para entrega!
              </p>
              <p className="text-[11px] text-zinc-400">
                Seu pedido está sendo preparado na cozinha. Esta tela atualiza automaticamente assim que o entregador for despachado.
              </p>
            </div>
          </div>
        )}

        {/* Delivered banner */}
        {isDelivered && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">Pedido Entregue com Sucesso!</h4>
                <p className="text-[11px] text-emerald-200/80">Esperamos que goste da sua refeição. Bom apetite!</p>
              </div>
            </div>
            <Link
              href={`/pedido/${order.orderNumber}`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex-shrink-0"
            >
              Ver Recibo
            </Link>
          </div>
        )}
      </div>

      {/* 5. LIVE GPS TRACKER COMPONENT (ACTIVATED WHEN OUT FOR DELIVERY) */}
      {isOutForDelivery && (
        <div className="space-y-4">
          <LiveTrackerMap order={order} onRefresh={() => fetchOrderData(false)} />
        </div>
      )}

      {/* 6. ORDER DETAILS, ADDRESS & ITEMS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Itens do Pedido ({order.items.length})
            </h3>
            <span className="text-xs text-orange-400 font-extrabold">
              Total: {formatBRL(order.total)}
            </span>
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

        {/* Sidebar Info: Address & Contact */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-xl text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Destino da Entrega
            </h4>
            <div className="text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              {order.addressText || 'Retirada no Balcão'}
            </div>

            {order.notes && (
              <p className="text-[11px] text-zinc-400 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                Obs: {order.notes}
              </p>
            )}

            <div className="pt-3 border-t border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Pagamento:</span>
                <span className="text-white font-medium">{order.paymentMethod}</span>
              </div>
              {order.changeFor && (
                <div className="flex justify-between text-zinc-400">
                  <span>Troco para:</span>
                  <span className="text-amber-400 font-medium">{formatBRL(order.changeFor)}</span>
                </div>
              )}
            </div>

            <a
              href={storeWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow active:scale-95 text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
