'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  Copy,
  Check,
  Bot,
  ExternalLink,
  QrCode,
  Share2,
  BarChart3,
  Users,
  Trophy,
  Award,
  Calendar,
  CreditCard,
  QrCode as QrIcon,
  Banknote,
} from 'lucide-react';
import PrintReceiptModal from '@/components/admin/PrintReceiptModal';

const statusOptions = [
  { value: 'ALL', label: 'Todos os Pedidos' },
  { value: 'PENDING', label: 'Novos' },
  { value: 'PREPARING', label: 'Na Brasa' },
  { value: 'READY', label: 'Prontos' },
  { value: 'OUT_FOR_DELIVERY', label: 'Em Entrega' },
  { value: 'DELIVERED', label: 'Entregues' },
];

export default function AdminPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'DASHBOARD'>('QUEUE');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [orderToPrint, setOrderToPrint] = useState<OrderData | null>(null);

  // Link & Chatbot State
  const [siteUrl, setSiteUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
    }
  }, []);

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

  // --- ANALYTICS CALCULATIONS ---
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalRev = validOrders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = validOrders.length > 0 ? totalRev / validOrders.length : 0;

    // Today's stats
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

    // Top Products
    const productMap: { [name: string]: { name: string; quantity: number; revenue: number } } = {};
    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        const pName = item.productName;
        if (!productMap[pName]) {
          productMap[pName] = { name: pName, quantity: 0, revenue: 0 };
        }
        productMap[pName].quantity += item.quantity;
        productMap[pName].revenue += item.totalPrice;
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    const maxProductQty = topProducts[0]?.quantity || 1;

    // Top Delivery Neighborhoods
    const zoneMap: { [neighborhood: string]: { name: string; count: number; totalFees: number } } = {};
    validOrders.forEach((o) => {
      const n = o.neighborhood || (o.deliveryType === 'PICKUP' ? 'Retirada no Balcão' : 'Outros');
      if (!zoneMap[n]) {
        zoneMap[n] = { name: n, count: 0, totalFees: 0 };
      }
      zoneMap[n].count += 1;
      zoneMap[n].totalFees += o.deliveryFee || 0;
    });
    const topZones = Object.values(zoneMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Payment methods distribution
    let pixCount = 0;
    let cardCount = 0;
    let cashCount = 0;
    validOrders.forEach((o) => {
      if (o.paymentMethod === 'PIX') pixCount++;
      else if (o.paymentMethod === 'CARD') cardCount++;
      else cashCount++;
    });

    return {
      totalRev,
      avgTicket,
      todayOrdersCount: todayOrders.length,
      todayDeliveriesCount,
      todayRevenue,
      topCustomers,
      topProducts,
      maxProductQty,
      topZones,
      payments: { pix: pixCount, card: cardCount, cash: cashCount, total: validOrders.length || 1 },
    };
  }, [orders]);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* 🚀 BANNER: LINK DO CARDÁPIO & MENSAGEM PARA CHATBOT / INSTAGRAM */}
      <div className="bg-gradient-to-r from-orange-950/70 via-zinc-900 to-zinc-900 border border-orange-500/40 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/40 flex-shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-orange-400">
                  Divulgação & Automação
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-semibold">
                  Pronto para Chatbot
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Link do seu Cardápio para Clientes & WhatsApp
              </h2>
              <p className="text-xs text-zinc-400">
                Copie o link público ou a mensagem pré-formatada para configurar no seu robô/chatbot do WhatsApp ou Bio do Instagram.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Cardápio'}</span>
            </button>

            <button
              onClick={handleCopyChatbotMessage}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
            >
              {copiedMessage ? <Check className="w-4 h-4 text-white" /> : <MessageCircle className="w-4 h-4" />}
              <span>{copiedMessage ? 'Mensagem Copiada!' : 'Copiar Texto p/ Chatbot'}</span>
            </button>
          </div>
        </div>

        {/* Display Current URL Box */}
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 overflow-hidden text-zinc-300">
            <span className="text-zinc-500 font-bold">Link Oficial:</span>
            <code className="text-orange-400 font-mono font-bold truncate select-all">
              {siteUrl || 'https://seu-link.vercel.app'}
            </code>
          </div>

          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white flex items-center gap-1 self-end sm:self-auto text-[11px] font-semibold transition-colors"
          >
            <span>Abrir Cardápio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Tabs Switcher: Fila de Pedidos vs Dashboard Analítico */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'QUEUE'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Fila de Pedidos & Despacho ({activeOrdersCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
            activeTab === 'DASHBOARD'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
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
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100">{cust.name}</div>
                            <div className="text-[11px] text-zinc-500">{formatPhone(cust.phone)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-black text-orange-400">{cust.count} pedidos</div>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              Total: {formatBRL(cust.totalSpent)}
                            </div>
                          </div>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl transition-colors"
                            title="Enviar mensagem VIP no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 📍 BAIRROS COM MAIS ENTREGAS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Bairros com Maior Volume de Entregas</h3>
              </div>
              <span className="text-[11px] text-zinc-500">Distribuição de Rotas</span>
            </div>

            {analytics.topZones.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500">Nenhuma entrega registrada ainda.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {analytics.topZones.map((z, idx) => (
                  <div key={idx} className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold text-white truncate">{z.name}</span>
                      <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded font-bold">#{idx + 1}</span>
                    </div>
                    <div className="text-lg font-black text-orange-400">{z.count} entregas</div>
                    <div className="text-[10px] text-zinc-500">Frete acumulado: {formatBRL(z.totalFees)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📋 TAB 2: FILA DE PEDIDOS EM TEMPO REAL & DESPACHO */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
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
                placeholder="Buscar pedido ou cliente..."
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
              <p className="text-xs text-zinc-500">
                Assim que um cliente fizer um pedido, ele aparecerá aqui automaticamente com alerta sonoro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
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
                              className="flex items-start justify-between py-1 border-b border-zinc-800/40 last:border-none"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold bg-zinc-800 text-orange-400 px-1.5 py-0.5 rounded text-[11px]">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-zinc-100">{item.productName}</span>
                                  {item.meatPoint && (
                                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1 rounded">
                                      {item.meatPoint}
                                    </span>
                                  )}
                                </div>

                                {/* Complementos */}
                                {customComps.length > 0 && (
                                  <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400 pl-6">
                                    {customComps.map((c, i) => (
                                      <span key={i} className="bg-zinc-800 px-1.5 py-0.2 rounded">
                                        + {c}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <span className="font-semibold text-zinc-400">
                                {formatBRL(item.totalPrice)}
                              </span>
                            </div>
                          );
                        })}
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

                      {/* Extra links: WhatsApp and Rastreio and Print */}
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

                        <button
                          onClick={() => setOrderToPrint(order)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white p-2 rounded-xl border border-zinc-700 transition-all"
                          title="Imprimir Comanda Térmica da Cozinha"
                        >
                          <Printer className="w-4 h-4 text-amber-400" />
                        </button>

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
      )}

      {/* Modal de Impressão de Comanda Térmica */}
      <PrintReceiptModal
        order={orderToPrint}
        onClose={() => setOrderToPrint(null)}
      />
    </div>
  );
}
