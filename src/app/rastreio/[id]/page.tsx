'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { OrderData } from '@/types';
import { ArrowLeft, RefreshCw, XCircle, Bike, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

// Dynamically import LiveTrackerMap without SSR
const LiveTrackerMap = dynamic(
  () => import('@/components/tracking/LiveTrackerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Carregando Mapa em Tempo Real...</span>
        </div>
      </div>
    ),
  }
);

export default function RastreioPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (err) {
      console.error('Erro ao carregar pedido de rastreio', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Conectando ao sinal GPS do entregador...</p>
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
          Não foi possível localizar as informações de entrega deste pedido.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/pedido/${order.orderNumber}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Detalhes do Pedido #{order.orderNumber}</span>
        </Link>

        <button
          onClick={fetchOrder}
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar GPS</span>
        </button>
      </div>

      {/* Main Tracker Component */}
      <LiveTrackerMap order={order} onRefresh={fetchOrder} />

      {/* Delivery Details Summary Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            Endereço de Entrega
          </h3>
          <span className="text-xs text-orange-400 font-bold">
            Total: {formatBRL(order.total)}
          </span>
        </div>

        <p className="text-xs text-zinc-300">
          {order.addressText || 'Retirada no Balcão'}
        </p>

        {order.notes && (
          <p className="text-xs text-zinc-400 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            Obs: {order.notes}
          </p>
        )}
      </div>
    </div>
  );
}
