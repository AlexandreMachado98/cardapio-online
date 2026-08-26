'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DeliveryZone } from '@/types';
import { formatBRL } from '@/lib/utils';
import { ArrowLeft, MapPin, Plus, Save, Clock, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TaxasPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [neighborhood, setNeighborhood] = useState('');
  const [fee, setFee] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('35');
  const [success, setSuccess] = useState('');

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/frete');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.error('Erro ao carregar taxas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighborhood.trim() || !fee) return;

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neighborhood: neighborhood.trim(),
          fee: Number(fee),
          estimatedMinutes: Number(estimatedMinutes) || 35,
        }),
      });

      if (res.ok) {
        setSuccess('Zona de entrega salva com sucesso!');
        setNeighborhood('');
        setFee('');
        setEstimatedMinutes('35');
        fetchZones();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar zona', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
          <MapPin className="w-6 h-6 text-orange-500" />
          Configuração de Taxas de Entrega & Bairros
        </h1>
        <p className="text-xs text-zinc-400">
          Cadastre os bairros atendidos pelo Sabor & Espeto, valor do frete e tempo médio de entrega.
        </p>
      </div>

      {/* Add new zone form */}
      <form onSubmit={handleAddOrUpdate} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-orange-400">
          Cadastrar ou Atualizar Bairro
        </h3>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nome do Bairro *
            </label>
            <input
              type="text"
              required
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex: Jardim Paulista"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Taxa de Entrega (R$) *
            </label>
            <input
              type="number"
              step="0.50"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Ex: 7.00"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Tempo Estimado (minutos)
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="35"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Taxa de Bairro</span>
        </button>
      </form>

      {/* Zones list table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">
          Bairros Cadastrados ({zones.length})
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {zones.map((z) => (
              <div key={z.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{z.neighborhood}</h4>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-400" />
                      Estimativa: ~{z.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-orange-400">
                    {formatBRL(z.fee)}
                  </div>
                  <span className="text-[10px] text-emerald-400">Ativo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
