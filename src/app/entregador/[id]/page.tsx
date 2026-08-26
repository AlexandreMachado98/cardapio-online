'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { OrderData } from '@/types';
import { getStatusDetails, formatBRL, formatPhone } from '@/lib/utils';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  Bike,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Play,
  Share2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

export default function MotoboyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        if (data.courierLat && data.courierLng) {
          setLastCoords({ lat: data.courierLat, lng: data.courierLng });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do entregador', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Handle Real Device Geolocation Watch
  useEffect(() => {
    let watchId: number;

    if (isBroadcasting && navigator.geolocation && order) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLastCoords({ lat, lng });

          try {
            await fetch(`/api/pedidos/${order.id}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng }),
            });
            setStatusMsg('GPS transmitindo em tempo real!');
          } catch (e) {
            console.error('Erro ao transmitir GPS', e);
          }
        },
        (err) => {
          setStatusMsg(`Erro no GPS: ${err.message}`);
          setIsBroadcasting(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isBroadcasting, order?.id]);

  const handleMarkDelivered = async () => {
    if (!order) return;
    try {
      const res = await fetch(`/api/pedidos/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      if (res.ok) {
        fetchOrder();
        setStatusMsg('✅ Pedido marcado como Entregue com sucesso!');
      }
    } catch (e) {
      console.error('Erro ao marcar entregue', e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400">Carregando dados da rota do motoboy...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-zinc-400">
        Pedido não encontrado para entrega.
      </div>
    );
  }

  const customerWhatsApp = createWhatsAppLink(
    order.customerPhone,
    `Olá ${order.customerName}! Sou o entregador do Sabor & Espeto e já estou chegando com o Pedido #${order.orderNumber}.`
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.addressText || 'São Paulo'
  )}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider opacity-90">
              Painel do Entregador
            </span>
            <h1 className="text-xl font-black">Pedido #{order.orderNumber}</h1>
          </div>
        </div>

        <Link
          href={`/rastreio/${order.orderNumber}`}
          className="text-xs bg-black/30 hover:bg-black/40 px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1 transition-all"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Ver Mapa</span>
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Customer & Address Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Destino da Entrega
        </h3>

        <div className="space-y-1">
          <div className="text-base font-extrabold text-white">{order.customerName}</div>
          <div className="text-xs text-zinc-300 font-medium leading-relaxed">
            {order.addressText || 'Retirada no Balcão'}
          </div>
          {order.notes && (
            <p className="text-xs text-amber-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 italic mt-2">
              Obs: {order.notes}
            </p>
          )}
        </div>

        {/* Action Buttons for Route & WhatsApp */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Abrir Rota GPS</span>
          </a>

          <a
            href={customerWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Zap Cliente</span>
          </a>
        </div>
      </div>

      {/* GPS Transmission Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">
          Transmissão do seu GPS ao Cliente
        </h3>

        <p className="text-xs text-zinc-400">
          Ao ativar a transmissão, o cliente vê sua motinha se deslocando pelo mapa em tempo real no app.
        </p>

        <button
          onClick={() => setIsBroadcasting(!isBroadcasting)}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
            isBroadcasting
              ? 'bg-emerald-600 text-white animate-pulse'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>
            {isBroadcasting ? 'GPS Ativo (Transmitindo Localização)' : 'Ativar GPS do Celular'}
          </span>
        </button>

        {lastCoords && (
          <div className="text-[11px] text-zinc-500 text-center font-mono">
            Últimas coordenadas: {lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Items Summary & Mark Delivered */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <span>Itens do Pedido ({order.items.length})</span>
          <span className="text-orange-400">Cobrar: {formatBRL(order.total)}</span>
        </div>

        <div className="space-y-1.5 text-xs text-zinc-300 divide-y divide-zinc-800">
          {order.items.map((item) => (
            <div key={item.id} className="pt-1.5 first:pt-0 flex justify-between">
              <span>{item.quantity}x {item.productName}</span>
              <span className="text-zinc-500">{item.meatPoint || ''}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400">
          Forma de Pagamento: <strong className="text-white">{order.paymentMethod}</strong>
          {order.changeFor && (
            <span className="text-amber-400 ml-2">(Troco p/ {formatBRL(order.changeFor)})</span>
          )}
        </div>

        {order.status !== 'DELIVERED' ? (
          <button
            onClick={handleMarkDelivered}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar Entrega Concluída</span>
          </button>
        ) : (
          <div className="text-center py-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            ✅ Pedido Entregue com Sucesso!
          </div>
        )}
      </div>
    </div>
  );
}
