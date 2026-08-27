'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderData } from '@/types';
import { getStatusDetails, formatBRL, formatPhone } from '@/lib/utils';
import { createWhatsAppLink, generateWhatsAppMessage } from '@/lib/whatsapp';
import {
  ShieldAlert,
  Flame,
  Clock,
  CheckCircle2,
  PackageCheck,
  Bike,
  PartyPopper,
  XCircle,
  MessageCircle,
  MapPin,
  RefreshCw,
  Search,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  Navigation,
  Settings,
  ShoppingBag,
  LayoutGrid,
  Truck,
} from 'lucide-react';

const statusOptions = [
  { value: 'ALL', label: 'Todos os Pedidos' },
  { value: 'PENDING', label: 'Recebidos / Novos' },
  { value: 'PREPARING', label: 'Na Brasa' },
  { value: 'READY', label: 'Embalados / Prontos' },
  { value: 'OUT_FOR_DELIVERY', label: 'Saiu p/ Entrega' },
  { value: 'DELIVERED', label: 'Entregues' },
];

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/pedidos${selectedFilter !== 'ALL' ? `?status=${selectedFilter}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 7000);
    return () => clearInterval(interval);
  }, [selectedFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/pedidos/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Se mudou para Saiu para Entrega, abrir automaticamente no WhatsApp
        if (newStatus === 'OUT_FOR_DELIVERY' && data.whatsappLink) {
          window.open(data.whatsappLink, '_blank');
        }

        fetchOrders();
      }
    } catch (err) {
      console.error('Erro ao atualizar status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.orderNumber.toString().includes(q) ||
      o.customerPhone.includes(q)
    );
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Admin Header with Management Nav */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Flame className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Painel da Cozinha & Gestão do Cardápio
              </h1>
              <p className="text-xs text-zinc-400">
                Fila de pedidos, controle do cardápio, produtos, categorias e perfil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar Fila</span>
            </button>
          </div>
        </div>

        {/* Action Management Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800">
          <Link
            href="/admin/produtos"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-800/90 hover:bg-orange-600 px-3.5 py-2 rounded-xl border border-zinc-700 transition-all shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <span>Produtos & Promoções</span>
          </Link>

          <Link
            href="/admin/categorias"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-800/90 hover:bg-orange-600 px-3.5 py-2 rounded-xl border border-zinc-700 transition-all shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>Categorias & Visibilidade</span>
          </Link>

          <Link
            href="/admin/taxas"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-800/90 hover:bg-orange-600 px-3.5 py-2 rounded-xl border border-zinc-700 transition-all shadow-sm"
          >
            <Truck className="w-4 h-4 text-blue-400" />
            <span>Taxas de Frete</span>
          </Link>

          <Link
            href="/admin/configuracoes"
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-800/90 hover:bg-orange-600 px-3.5 py-2 rounded-xl border border-zinc-700 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Perfil da Cozinha & Logo</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Pedidos em Andamento</div>
            <div className="text-2xl font-black text-orange-400 mt-0.5">
              {activeOrdersCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Faturamento Total</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {formatBRL(totalRevenue)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 font-medium">Total de Pedidos</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {orders.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedFilter(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedFilter === opt.value
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por cliente ou nº..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Carregando pedidos da cozinha...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-2">
          <PackageCheck className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-300">Nenhum pedido nesta fila no momento</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusDetails(order.status);
            const isUpdating = updatingId === order.id;

            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const trackingUrl = `${origin}/rastreio/${order.orderNumber}`;
            const msg = generateWhatsAppMessage({
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              items: order.items,
              deliveryType: order.deliveryType,
              addressText: order.addressText,
              deliveryFee: order.deliveryFee,
              total: order.total,
              paymentMethod: order.paymentMethod,
              courierName: order.courierName,
              trackingUrl,
            });
            const waLink = createWhatsAppLink(order.customerPhone, msg);

            return (
              <div
                key={order.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                {/* Order Card Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-white">
                        Pedido #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusInfo.badgeColor}`} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-200 font-semibold">
                      <span>{order.customerName}</span>
                      <span className="text-zinc-400">{formatPhone(order.customerPhone)}</span>
                    </div>
                    <div className="text-zinc-400 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{order.addressText || 'Retirada no Balcão'}</span>
                    </div>
                    {order.notes && (
                      <div className="text-amber-400 text-[11px] italic pt-1 border-t border-zinc-800">
                        Obs: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 pt-1 text-xs text-zinc-300">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1 border-b border-zinc-800/40 last:border-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold bg-zinc-800 text-orange-400 px-1.5 py-0.5 rounded text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="font-medium">{item.productName}</span>
                          {item.meatPoint && (
                            <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1 rounded">
                              {item.meatPoint}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-zinc-400">
                          {formatBRL(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span>
                      Pagamento: <strong className="text-white">{order.paymentMethod}</strong>
                    </span>
                    <span className="text-orange-400 text-sm">
                      Total: {formatBRL(order.total)}
                    </span>
                  </div>

                  {/* Status update buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      disabled={isUpdating || order.status === 'PREPARING'}
                      className="bg-orange-600/20 hover:bg-orange-600/40 disabled:opacity-40 text-orange-300 border border-orange-500/40 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Na Brasa</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      disabled={isUpdating || order.status === 'READY'}
                      className="bg-purple-600/20 hover:bg-purple-600/40 disabled:opacity-40 text-purple-300 border border-purple-500/40 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Pronto</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      disabled={isUpdating || order.status === 'OUT_FOR_DELIVERY'}
                      className="bg-emerald-600/20 hover:bg-emerald-600/40 disabled:opacity-40 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      title="Despachar pedido e enviar mensagem no WhatsApp"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Saiu Entrega</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      disabled={isUpdating || order.status === 'DELIVERED'}
                      className="bg-green-600/20 hover:bg-green-600/40 disabled:opacity-40 text-green-300 border border-green-500/40 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Entregue</span>
                    </button>
                  </div>

                  {/* Extra links: WhatsApp and Rastreio */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Notificar WhatsApp</span>
                    </a>

                    <Link
                      href={`/rastreio/${order.orderNumber}`}
                      target="_blank"
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl border border-zinc-700 transition-colors"
                      title="Abrir mapa de rastreio"
                    >
                      <Navigation className="w-4 h-4 text-orange-400" />
                    </Link>

                    <Link
                      href={`/entregador/${order.orderNumber}`}
                      target="_blank"
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl border border-zinc-700 transition-colors"
                      title="Abrir painel do motoboy"
                    >
                      <Bike className="w-4 h-4 text-emerald-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
