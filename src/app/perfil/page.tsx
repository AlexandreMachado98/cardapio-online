'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { OrderData } from '@/types';
import { getStatusDetails, formatBRL, formatPhone } from '@/lib/utils';
import {
  User,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  RotateCcw,
  ChevronRight,
  LogOut,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function PerfilPage() {
  const { customer, login, logout, isAuthenticated } = useAuth();
  const { addItem, setIsCartOpen } = useCart();

  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch past orders whenever customer phone is set
  useEffect(() => {
    if (customer?.phone) {
      fetchCustomerOrders(customer.phone);
    }
  }, [customer?.phone]);

  const fetchCustomerOrders = async (phone: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pedidos?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;

    const clean = phoneInput.replace(/\D/g, '');
    login({
      name: nameInput.trim() || 'Cliente Sabor & Espeto',
      phone: clean,
    });
    fetchCustomerOrders(clean);
  };

  const handleRepeatOrder = (order: OrderData) => {
    order.items.forEach((item) => {
      addItem({
        cartItemId: `${item.productId || 'p'}-${Date.now()}-${Math.random()}`,
        productId: item.productId || 'custom',
        name: item.productName,
        price: item.unitPrice,
        imageUrl:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        quantity: item.quantity,
        meatPoint: item.meatPoint || undefined,
        farofa: item.farofa,
        vinagrete: item.vinagrete,
        notes: item.notes || undefined,
      });
    });
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header Profile Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-2xl">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {isAuthenticated ? customer?.name : 'Identifique-se'}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                {isAuthenticated
                  ? formatPhone(customer?.phone || '')
                  : 'Acesse seu histórico de pedidos pelo WhatsApp'}
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 bg-zinc-800/80 hover:bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-700 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Trocar Conta / Sair</span>
            </button>
          )}
        </div>

        {/* Not authenticated identification form */}
        {!isAuthenticated && (
          <form onSubmit={handleIdentify} className="mt-6 pt-6 border-t border-zinc-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-950/30 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Consultar Meus Pedidos</span>
            </button>
          </form>
        )}
      </div>

      {/* Order History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-white">Histórico de Pedidos</h2>
          </div>
          <span className="text-xs text-zinc-400">
            {orders.length} {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-28 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-300">
              Nenhum pedido encontrado ainda
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Assim que você fizer seus pedidos no Sabor & Espeto, eles aparecerão aqui com rastreamento e opção de pedir novamente com 1 clique.
            </p>
            <Link
              href="/"
              className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors mt-2"
            >
              Fazer Primeiro Pedido
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusDetails = getStatusDetails(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-white">
                        Pedido #{order.orderNumber}
                      </span>
                      <span className="text-xs text-zinc-500">
                        • {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${statusDetails.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDetails.badgeColor}`} />
                      {statusDetails.label}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 text-xs text-zinc-300">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.productName}{' '}
                          {item.meatPoint ? `(${item.meatPoint})` : ''}
                        </span>
                        <span className="text-zinc-400">{formatBRL(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions & Total */}
                  <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-zinc-400">Total: </span>
                      <span className="font-extrabold text-sm text-orange-400">
                        {formatBRL(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRepeatOrder(order)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>Pedir Novamente</span>
                      </button>

                      <Link
                        href={`/pedido/${order.orderNumber}`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow transition-colors"
                      >
                        <span>Ver Detalhes / Rastreio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
