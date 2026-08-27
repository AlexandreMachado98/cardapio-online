'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { OrderData, StoreSettings } from '@/types';
import { formatBRL, formatPhone, getStatusDetails } from '@/lib/utils';
import { createWhatsAppLink, generateWhatsAppMessage } from '@/lib/whatsapp';
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
  RefreshCw,
  ShoppingBag,
  Printer,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  Search,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Trophy,
  BarChart3,
  CreditCard,
  AlertTriangle,
  Play,
  Bell,
  Sparkles,
  Signal,
  Eye,
  CheckCheck,
} from 'lucide-react';
import PrintReceiptModal from '@/components/admin/PrintReceiptModal';

// Helper to calculate elapsed time in minutes
function getElapsedMinutes(createdAt: string | Date): number {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  return Math.max(0, Math.floor((now - created) / (1000 * 60)));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Active Tab: QUEUE vs DASHBOARD
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DASHBOARD'>('QUEUE');

  // Thermal Print Modal state
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<OrderData | null>(null);

  // Copy state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');

  // Audio Ref for new order sound
  const prevPendingCountRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/pedidos${selectedFilter !== 'ALL' ? `?status=${selectedFilter}` : ''}`);
      if (res.ok) {
        const data: OrderData[] = await res.json();
        setOrders(data);

        // Check if there are new pending orders to alert
        const currentPending = data.filter((o) => o.status === 'PENDING').length;
        if (currentPending > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
        prevPendingCountRef.current = currentPending;
      }
    } catch (err) {
      console.error('Erro ao carregar pedidos admin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000);
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

  const handleCopyLink = () => {
    if (!siteUrl) return;
    navigator.clipboard.writeText(siteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const chatbotMessageText = `Olá! Seja muito bem-vindo ao nosso cardápio digital! 🍢🔥\n\nConfira nossos espetinhos artesanais, combos e bebidas e faça seu pedido online com rastreamento ao vivo pelo mapa:\n\n👉 ${siteUrl}\n\nAguardamos seu pedido! Bom apetite! 😋`;

  const handleCopyChatbotMessage = () => {
    navigator.clipboard.writeText(chatbotMessageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
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

  // Dynamic Status Counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      preparing: orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING').length,
      ready: orders.filter((o) => o.status === 'READY').length,
      out: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    };
  }, [orders]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalRev = validOrders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = validOrders.length > 0 ? totalRev / validOrders.length : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = validOrders.filter((o) => new Date(o.createdAt) >= today);
    const todayDeliveriesCount = todayOrders.filter((o) => o.status === 'DELIVERED' || o.status === 'OUT_FOR_DELIVERY').length;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    // Top Customers Ranking
    const customerMap: { [phone: string]: { name: string; phone: string; count: number; totalSpent: number } } = {};
    validOrders.forEach((o) => {
      const p = o.customerPhone;
      if (!customerMap[p]) {
        customerMap[p] = { name: o.customerName, phone: p, count: 0, totalSpent: 0 };
      }
      customerMap[p].count += 1;
      customerMap[p].totalSpent += o.total;
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Top Products Ranking
    const productMap: { [name: string]: { name: string; quantity: number; revenue: number } } = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productMap[item.productName].quantity += item.quantity;
        productMap[item.productName].revenue += item.totalPrice;
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
    const maxProductQty = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.quantity)) : 1;

    // Payment Methods Breakdown
    const payments = { pix: 0, card: 0, cash: 0, total: validOrders.length || 1 };
    validOrders.forEach((o) => {
      if (o.paymentMethod === 'PIX') payments.pix++;
      else if (o.paymentMethod === 'CARD') payments.card++;
      else if (o.paymentMethod === 'CASH') payments.cash++;
    });

    return {
      totalRev,
      avgTicket,
      todayDeliveriesCount,
      todayRevenue,
      topCustomers,
      topProducts,
      maxProductQty,
      payments,
    };
  }, [orders]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* 🚀 BANNER SUPERIOR: COMPARTILHAR LINK DO CARDÁPIO & CHATBOT WHATSAPP */}
      <div className="bg-gradient-to-r from-orange-950/80 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
              Divulgação & Automação do WhatsApp
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              Pronto p/ Chatbot
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Link do Cardápio para Clientes & Chatbots
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl">
            Envie este link direto para o cliente ou coloque como resposta automática no seu WhatsApp Business / Chatbot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Cardápio'}</span>
          </button>

          <button
            onClick={handleCopyChatbotMessage}
            className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-all active:scale-95"
            title="Copiar texto pronto com link e emojis para colar no WhatsApp"
          >
            {copiedMessage ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-orange-400" />}
            <span>{copiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto p/ Chatbot'}</span>
          </button>
        </div>
      </div>

      {/* 🧭 SELETOR DE ABAS: FILA DA COZINHA vs DASHBOARD */}
      <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'QUEUE'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Fila de Pedidos & Despacho</span>
          {counts.pending > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
              {counts.pending} novo(s)
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'DASHBOARD'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard & Estatísticas de Vendas</span>
        </button>
      </div>

      {/* 📊 TAB 1: DASHBOARD ANALÍTICO & RELATÓRIOS RELEVANTES */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Entregas de Hoje</span>
                <Bike className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{analytics.todayDeliveriesCount}</div>
              <p className="text-[11px] text-zinc-500">
                Faturamento hoje: <strong className="text-emerald-400">{formatBRL(analytics.todayRevenue)}</strong>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Ticket Médio por Pedido</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400">{formatBRL(analytics.avgTicket)}</div>
              <p className="text-[11px] text-zinc-500">Média de valor gasto por cliente</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Faturamento Total</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{formatBRL(analytics.totalRev)}</div>
              <p className="text-[11px] text-zinc-500">{orders.length} pedidos registrados</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                <span>Forma de Pagto Preferida</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-base font-black text-zinc-100 flex items-center gap-2 pt-1">
                <span className="text-emerald-400 text-xs">PIX: {Math.round((analytics.payments.pix / analytics.payments.total) * 100)}%</span>
                <span className="text-blue-400 text-xs">Cartão: {Math.round((analytics.payments.card / analytics.payments.total) * 100)}%</span>
              </div>
              <p className="text-[10px] text-zinc-500">Dinheiro: {Math.round((analytics.payments.cash / analytics.payments.total) * 100)}%</p>
            </div>
          </div>

          {/* 2 Main Columns: Top Products & Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 🔥 PRODUTOS COM MAIS SAÍDAS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-white text-sm">Produtos Mais Vendidos (Campeões de Saída)</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Ranking Geral</span>
              </div>

              {analytics.topProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">Nenhuma venda registrada ainda.</div>
              ) : (
                <div className="space-y-3">
                  {analytics.topProducts.map((prod, idx) => {
                    const percentage = Math.round((prod.quantity / analytics.maxProductQty) * 100);
                    return (
                      <div key={idx} className="space-y-1.5 bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 text-[10px] font-black flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-zinc-100">{prod.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-orange-400">{prod.quantity} un</span>
                            <span className="text-zinc-500 text-[11px]">({formatBRL(prod.revenue)})</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🏆 CLIENTES COM MAIS PEDIDOS (TOP CLIENTES VIP) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm">Top Clientes Fiéis (Mais Pedidos)</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Programa Fidelidade</span>
              </div>

              {analytics.topCustomers.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">Nenhum cliente registrado ainda.</div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.topCustomers.map((cust, idx) => {
                    const waLink = createWhatsAppLink(
                      cust.phone,
                      `Olá ${cust.name}! Somos do Cardápio Oficial. Como você é um de nossos clientes mais especiais, preparamos uma surpresa para o seu próximo pedido! 🍢🔥`
                    );

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : idx === 1
                                ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30'
                                : idx === 2
                                ? 'bg-amber-800/20 text-amber-600 border border-amber-800/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{cust.name}</div>
                            <div className="text-zinc-500 text-[11px]">{formatPhone(cust.phone)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-black text-orange-400">{cust.count} pedidos</div>
                            <div className="text-[10px] text-zinc-500">{formatBRL(cust.totalSpent)}</div>
                          </div>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 p-2 rounded-xl transition-colors"
                            title="Enviar WhatsApp VIP para este cliente"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📋 TAB 2: FILA DE PEDIDOS COM ALERTAS VISUAIS DE STATUS */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 🎛️ BARRA DE FILTROS COM CONTADORES COLORIDOS E ALERTA VISUAL */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
              {/* Todos */}
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'ALL'
                    ? 'bg-zinc-100 text-zinc-950 shadow-md font-black'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Todos</span>
                <span className="bg-zinc-700/80 text-zinc-200 px-1.5 py-0.2 rounded-full text-[10px]">
                  {counts.all}
                </span>
              </button>

              {/* 🚨 Novos Pedidos (com Alerta Neon e Pulsing) */}
              <button
                onClick={() => setSelectedFilter('PENDING')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedFilter === 'PENDING'
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : counts.pending > 0
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50 animate-pulse'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>🚨 Novos Pedidos</span>
                <span className="bg-emerald-600 text-white font-black px-2 py-0.2 rounded-full text-[10px]">
                  {counts.pending}
                </span>
              </button>

              {/* 🔥 Na Brasa / Em Preparo */}
              <button
                onClick={() => setSelectedFilter('PREPARING')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedFilter === 'PREPARING'
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-zinc-800/80 text-amber-400 border-amber-500/30'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Na Brasa / Preparo</span>
                <span className="bg-amber-600/30 text-amber-300 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {counts.preparing}
                </span>
              </button>

              {/* 📦 Prontos / Embalados */}
              <button
                onClick={() => setSelectedFilter('READY')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedFilter === 'READY'
                    ? 'bg-cyan-500 text-zinc-950 border-cyan-400 font-black shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    : 'bg-zinc-800/80 text-cyan-400 border-cyan-500/30'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Prontos</span>
                <span className="bg-cyan-600/30 text-cyan-300 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {counts.ready}
                </span>
              </button>

              {/* 🛵 Em Rota */}
              <button
                onClick={() => setSelectedFilter('OUT_FOR_DELIVERY')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  selectedFilter === 'OUT_FOR_DELIVERY'
                    ? 'bg-purple-500 text-white border-purple-400 font-black shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                    : 'bg-zinc-800/80 text-purple-400 border-purple-500/30'
                }`}
              >
                <Bike className="w-3.5 h-3.5 text-purple-400" />
                <span>Em Rota</span>
                <span className="bg-purple-600/30 text-purple-300 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {counts.out}
                </span>
              </button>

              {/* ✅ Entregues */}
              <button
                onClick={() => setSelectedFilter('DELIVERED')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedFilter === 'DELIVERED'
                    ? 'bg-zinc-700 text-white font-bold'
                    : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Entregues ({counts.delivered})</span>
              </button>
            </div>

            <div className="w-full md:w-64 relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar por nome ou Nº..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-10 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
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
              <p className="text-xs text-zinc-500">
                Assim que um cliente fizer um pedido, ele aparecerá aqui automaticamente com alerta sonoro e visual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {filteredOrders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
                const isReady = order.status === 'READY';
                const isOut = order.status === 'OUT_FOR_DELIVERY';
                const isDelivered = order.status === 'DELIVERED';
                const isCancelled = order.status === 'CANCELLED';

                const elapsedMin = getElapsedMinutes(order.createdAt);
                const isDelayed = isPending && elapsedMin > 8;

                // Dynamic Card Theme based on Status
                let cardBorderClass = 'border-zinc-800 bg-zinc-900';
                let topBadgeBg = 'bg-zinc-800 text-zinc-300';
                let statusLabel = 'Em Andamento';

                if (isPending) {
                  cardBorderClass = isDelayed
                    ? 'border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)] bg-gradient-to-b from-red-950/40 via-zinc-900 to-zinc-900'
                    : 'border-2 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-900';
                  topBadgeBg = 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md font-black';
                  statusLabel = '🚨 NOVO PEDIDO RECEBIDO';
                } else if (isPreparing) {
                  cardBorderClass = 'border-2 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-900';
                  topBadgeBg = 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold';
                  statusLabel = '🔥 NA BRASA / EM PREPARO';
                } else if (isReady) {
                  cardBorderClass = 'border-2 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-gradient-to-b from-cyan-950/30 via-zinc-900 to-zinc-900';
                  topBadgeBg = 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold';
                  statusLabel = '📦 PRONTO / EMBALADO';
                } else if (isOut) {
                  cardBorderClass = 'border-2 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.2)] bg-gradient-to-b from-purple-950/30 via-zinc-900 to-zinc-900';
                  topBadgeBg = 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold';
                  statusLabel = '🛵 EM ROTA DE ENTREGA';
                } else if (isDelivered) {
                  cardBorderClass = 'border border-zinc-800/60 opacity-60 bg-zinc-950/60';
                  topBadgeBg = 'bg-zinc-800 text-zinc-400';
                  statusLabel = '✅ ENTREGUE / FINALIZADO';
                } else if (isCancelled) {
                  cardBorderClass = 'border border-red-950 opacity-50 bg-zinc-950/80';
                  topBadgeBg = 'bg-red-950 text-red-400';
                  statusLabel = '❌ CANCELADO';
                }

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
                    className={`rounded-3xl p-5 shadow-2xl space-y-4 transition-all flex flex-col justify-between ${cardBorderClass}`}
                  >
                    {/* Order Card Header */}
                    <div className="space-y-3">
                      {/* Status Banner */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-lg text-white">
                            Pedido #{order.orderNumber}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Top Status Alert Badge */}
                        <div className="flex items-center gap-2">
                          {isDelayed && (
                            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{elapsedMin} min aguardando!</span>
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${topBadgeBg}`}>
                            {isPending && <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />}
                            {isPreparing && <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />}
                            {isOut && <Signal className="w-3.5 h-3.5 animate-pulse text-purple-400" />}
                            <span>{statusLabel}</span>
                          </span>
                        </div>
                      </div>

                      {/* Customer Details Box */}
                      <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-100 font-bold text-sm">
                          <span>{order.customerName}</span>
                          <span className="text-orange-400 text-xs font-mono">{formatPhone(order.customerPhone)}</span>
                        </div>

                        <div className="text-zinc-300 flex items-start gap-1.5 leading-snug">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                          <span>{order.addressText || 'Retirada no Balcão'}</span>
                        </div>

                        {order.notes && (
                          <div className="text-amber-300 text-xs italic pt-1.5 border-t border-zinc-800/80">
                            <strong>Obs:</strong> {order.notes}
                          </div>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 pt-1 text-xs text-zinc-300">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Itens do Pedido ({order.items.length})
                        </div>
                        {order.items.map((item) => {
                          let customComps: string[] = [];
                          if (item.complements) {
                            try {
                              const parsed = JSON.parse(item.complements);
                              if (Array.isArray(parsed)) customComps = parsed;
                            } catch (e) {}
                          }

                          return (
                            <div
                              key={item.id}
                              className="flex items-start justify-between py-1.5 border-b border-zinc-800/40 last:border-none"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-black bg-orange-600/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-xs">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-zinc-100">{item.productName}</span>
                                  {item.meatPoint && (
                                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.2 rounded font-semibold">
                                      {item.meatPoint}
                                    </span>
                                  )}
                                </div>

                                {/* Complementos */}
                                {customComps.length > 0 && (
                                  <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400 pl-7">
                                    {customComps.map((c, i) => (
                                      <span key={i} className="bg-zinc-800 px-1.5 py-0.2 rounded">
                                        + {c}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <span className="font-bold text-zinc-300">
                                {formatBRL(item.totalPrice)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Footer & Dynamic Action Buttons */}
                    <div className="pt-3 border-t border-zinc-800 space-y-3">
                      {/* Financials Summary */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-zinc-400">
                          Forma de Pagamento:{' '}
                          <strong className="text-white">{order.paymentMethod}</strong>
                          {order.changeFor && (
                            <span className="text-amber-400 ml-1.5">(Troco p/ {formatBRL(order.changeFor)})</span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-black text-base text-orange-400">
                            {formatBRL(order.total)}
                          </span>
                        </div>
                      </div>

                      {/* PRIMARY KITCHEN ACTION BUTTON (HIGH CONTRAST & INTUITIVE) */}
                      <div className="space-y-2">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            disabled={isUpdating}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-zinc-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all"
                          >
                            <Flame className="w-5 h-5 text-zinc-950" />
                            <span>⚡ ACEITAR PEDIDO & INICIAR PREPARO NA BRASA</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                            disabled={isUpdating}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all"
                          >
                            <PackageCheck className="w-5 h-5" />
                            <span>📦 MARCAR COMO PRONTO / EMBALADO</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                            disabled={isUpdating}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all"
                          >
                            <Bike className="w-5 h-5" />
                            <span>🛵 DESPACHAR C/ MOTOBOY (AVISAR NO WHATSAPP)</span>
                          </button>
                        )}

                        {isOut && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                              disabled={isUpdating}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Concluir Entrega</span>
                            </button>

                            <Link
                              href={`/entregador/${order.orderNumber}`}
                              target="_blank"
                              className="bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold py-3 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-purple-500/30 transition-all text-center"
                            >
                              <Bike className="w-4 h-4 text-purple-400" />
                              <span>Painel Motoboy</span>
                            </Link>
                          </div>
                        )}

                        {/* Secondary Tools: Print 80mm, WhatsApp & Cancel */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setSelectedPrintOrder(order)}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                            title="Imprimir Comanda Térmica 80mm/58mm"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" />
                            <span>Imprimir Comanda</span>
                          </button>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-zinc-800 hover:bg-emerald-950/60 text-zinc-300 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-500/40 p-2.5 rounded-xl text-xs transition-colors flex items-center justify-center"
                            title="Conversar com o Cliente no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {!isCancelled && !isDelivered && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente cancelar o Pedido #${order.orderNumber}?`)) {
                                  handleUpdateStatus(order.id, 'CANCELLED');
                                }
                              }}
                              className="bg-zinc-800 hover:bg-red-950/60 text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 p-2.5 rounded-xl text-xs transition-colors flex items-center justify-center"
                              title="Cancelar Pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE IMPRESSÃO TÉRMICA 80MM */}
      {selectedPrintOrder && (
        <PrintReceiptModal
          order={selectedPrintOrder}
          onClose={() => setSelectedPrintOrder(null)}
        />
      )}
    </div>
  );
}
