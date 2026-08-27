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
  Signal,
  Copy,
  Check,
} from 'lucide-react';

export default function MotoboyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Handle Real Smartphone Geolocation Watch
  useEffect(() => {
    let watchId: number;

    if (isBroadcasting && typeof window !== 'undefined' && navigator.geolocation && order) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          setLastCoords({ lat, lng });
          setGpsAccuracy(accuracy);

          try {
            await fetch(`/api/pedidos/${order.id}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng }),
            });
            setStatusMsg(`📡 GPS ativo: Transmitindo posição ao vivo (Precisão: ~${accuracy}m)`);
          } catch (e) {
            console.error('Erro ao transmitir GPS', e);
          }
        },
        (err) => {
          setStatusMsg(`Erro ao acessar GPS do celular: ${err.message}. Verifique as permissões de localização.`);
          setIsBroadcasting(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000,
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isBroadcasting, order?.id]);

  const handleToggleBroadcast = () => {
    if (!isBroadcasting) {
      if (!navigator.geolocation) {
        alert('Seu navegador ou celular não possui suporte a GPS.');
        return;
      }
      setIsBroadcasting(true);
      setStatusMsg('Iniciando rastreamento GPS por satélite...');
    } else {
      setIsBroadcasting(false);
      setStatusMsg('Transmissão de GPS pausada.');
    }
  };

  const handleCopyAddress = () => {
    if (!order?.addressText) return;
    navigator.clipboard.writeText(order.addressText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    try {
      const res = await fetch(`/api/pedidos/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      if (res.ok) {
        setIsBroadcasting(false);
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
        <p className="text-xs text-zinc-400">Carregando painel do entregador...</p>
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
    `Olá ${order.customerName}! Sou o entregador e estou a caminho com seu Pedido #${order.orderNumber}.`
  );

  // Use the exact address provided by the customer
  const exactCustomerAddress = order.addressText || '';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    exactCustomerAddress
  )}`;

  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(exactCustomerAddress)}&navigate=yes`;

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
              Painel do Motoboy
            </span>
            <h1 className="text-xl font-black">Pedido #{order.orderNumber}</h1>
          </div>
        </div>

        <Link
          href={`/rastreio/${order.orderNumber}`}
          target="_blank"
          className="text-xs bg-black/30 hover:bg-black/40 px-3.5 py-2 rounded-xl border border-white/20 flex items-center gap-1.5 font-bold transition-all"
        >
          <Navigation className="w-4 h-4" />
          <span>Ver Mapa</span>
        </Link>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs rounded-2xl flex items-center gap-2 shadow-lg">
          <Signal className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 📡 CONTROLE DE TRANSMISSÃO DE GPS REAL DO SMARTPHONE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <Signal className="w-4 h-4" />
            Transmissão de GPS do Smartphone
          </h3>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isBroadcasting
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {isBroadcasting ? '● GPS AO VIVO' : '○ GPS Desconectado'}
          </span>
        </div>

        <p className="text-xs text-zinc-400">
          Ao clicar no botão abaixo, o seu celular começa a enviar suas coordenadas reais por satélite. O cliente verá a motinha se mover na rua ao vivo!
        </p>

        <button
          onClick={handleToggleBroadcast}
          className={`w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
            isBroadcasting
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white shadow-orange-950/50'
          }`}
        >
          <Share2 className="w-5 h-5" />
          <span>
            {isBroadcasting ? 'GPS Conectado (Transmitindo Posição)' : '🟢 Ativar GPS em Tempo Real'}
          </span>
        </button>

        {lastCoords && (
          <div className="text-[11px] text-zinc-400 text-center font-mono bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex items-center justify-around">
            <span>Lat: {lastCoords.lat.toFixed(5)}</span>
            <span>Lng: {lastCoords.lng.toFixed(5)}</span>
            {gpsAccuracy && <span>Precisão: ~{gpsAccuracy}m</span>}
          </div>
        )}
      </div>

      {/* 🏠 ENDEREÇO REAL FORNECIDO PELO CLIENTE NO PEDIDO */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Endereço Real do Cliente
          </h3>

          {order.addressText && (
            <button
              onClick={handleCopyAddress}
              className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700 flex items-center gap-1 transition-colors"
              title="Copiar endereço completo"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-orange-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Endereço'}</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-base font-extrabold text-white">{order.customerName}</div>
          
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1 text-xs">
            <div className="font-bold text-zinc-100 text-sm leading-snug">
              {order.addressText || 'Retirada no Balcão'}
            </div>
            {order.neighborhood && (
              <div className="text-orange-400 font-semibold">
                Bairro: {order.neighborhood}
              </div>
            )}
          </div>

          {order.notes && (
            <div className="text-xs text-amber-300 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30 italic">
              <strong>Observação do Cliente:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Action Buttons for Route (Waze & Google Maps) & WhatsApp */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow transition-all text-center"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow transition-all text-center"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Waze</span>
          </a>

          <a
            href={customerWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-2 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow transition-all text-center"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Items Summary & Mark Delivered */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
          <span>Itens do Pedido ({order.items.length})</span>
          <span className="text-orange-400 font-extrabold text-sm">Cobrar: {formatBRL(order.total)}</span>
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
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Entrega Concluída</span>
          </button>
        ) : (
          <div className="text-center py-3 text-emerald-400 text-xs font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            ✅ Pedido Entregue com Sucesso!
          </div>
        )}
      </div>
    </div>
  );
}
