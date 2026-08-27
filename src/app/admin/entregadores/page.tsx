'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreSettings, OrderData } from '@/types';
import { formatBRL, formatPhone } from '@/lib/utils';
import { createWhatsAppLink } from '@/lib/whatsapp';
import {
  ArrowLeft,
  Bike,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Shield,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Clock,
  Navigation,
} from 'lucide-react';

export default function AdminEntregadoresPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [courierName, setCourierName] = useState('Carlos Motoboy');
  const [courierPhone, setCourierPhone] = useState('11999998888');
  const [courierVehicle, setCourierVehicle] = useState('Moto Honda Fan 160');
  const [courierPlate, setCourierPlate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, ordersRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/pedidos'),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setSettings(configData);
        setCourierName(configData.defaultCourierName || 'Carlos Motoboy');
        setCourierPhone(configData.defaultCourierPhone || '11999998888');
        setCourierVehicle(configData.defaultCourierVehicle || 'Moto Honda Fan 160');
        setCourierPlate(configData.defaultCourierPlate || '');
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do entregador', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCourierName: courierName.trim(),
          defaultCourierPhone: courierPhone.trim(),
          defaultCourierVehicle: courierVehicle.trim(),
          defaultCourierPlate: courierPlate.trim(),
        }),
      });

      if (res.ok) {
        setSuccess('Dados do entregador salvos com sucesso! Todos os novos pedidos e rastreios usarão estas informações.');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError('Erro ao salvar dados do entregador.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const activeDeliveries = orders.filter(
    (o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel da Cozinha</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Bike className="w-6 h-6 text-emerald-500" />
          Gestão de Entregadores & Motoboys
        </h1>
        <p className="text-xs text-zinc-400">
          Configure o nome, WhatsApp, veículo e placa do entregador. Essas informações são exibidas para o cliente no mapa de rastreio ao vivo por GPS.
        </p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário: Dados do Entregador */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <User className="w-4 h-4" />
            Entregador Padrão da Cozinha
          </h3>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            Ativo para Rastreamento GPS
          </span>
        </div>

        <form onSubmit={handleSaveCourier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome Completo do Entregador *
              </label>
              <input
                type="text"
                required
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="Ex: Carlos Motoboy"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Telefone / WhatsApp do Entregador *
              </label>
              <input
                type="tel"
                required
                value={courierPhone}
                onChange={(e) => setCourierPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Modelo da Moto / Veículo
              </label>
              <input
                type="text"
                value={courierVehicle}
                onChange={(e) => setCourierVehicle(e.target.value)}
                placeholder="Ex: Honda Fan 160 Vermelha"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Placa do Veículo (opcional)
              </label>
              <input
                type="text"
                value={courierPlate}
                onChange={(e) => setCourierPlate(e.target.value)}
                placeholder="Ex: ABC-1234"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Salvando...' : 'Salvar Dados do Entregador'}</span>
          </button>
        </form>
      </div>

      {/* Pedidos em Rota de Entrega com o Entregador */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Entregas em Andamento ({activeDeliveries.length})
          </h3>
          <span className="text-[11px] text-zinc-500">Ao vivo</span>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            Nenhum pedido em rota de entrega no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDeliveries.map((order) => (
              <div
                key={order.id}
                className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Pedido #{order.orderNumber}</span>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {order.status === 'OUT_FOR_DELIVERY' ? 'Em Rota' : 'Pronto p/ Saída'}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <div><strong>Cliente:</strong> {order.customerName}</div>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>{order.addressText || 'Retirada'}</span>
                  </div>
                  <div><strong>Total:</strong> {formatBRL(order.total)} ({order.paymentMethod})</div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  <Link
                    href={`/entregador/${order.orderNumber}`}
                    target="_blank"
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 transition-colors"
                  >
                    <Bike className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Painel do Motoboy</span>
                  </Link>

                  <Link
                    href={`/rastreio/${order.orderNumber}`}
                    target="_blank"
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2 rounded-xl border border-zinc-700 transition-colors"
                    title="Ver mapa ao vivo"
                  >
                    <Navigation className="w-3.5 h-3.5 text-orange-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
