'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DeliveryZone } from '@/types';
import { formatBRL } from '@/lib/utils';
import {
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Save,
  Search,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  X,
  PlusCircle,
} from 'lucide-react';

export default function AdminTaxasPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState('');
  const [fee, setFee] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('35');

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/frete?all=true');
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

  const handleOpenEdit = (zone: DeliveryZone) => {
    setIsEditing(true);
    setEditingId(zone.id);
    setNeighborhood(zone.neighborhood);
    setFee(String(zone.fee));
    setEstimatedMinutes(String(zone.estimatedMinutes || 35));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNeighborhood('');
    setFee('');
    setEstimatedMinutes('35');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighborhood.trim() || fee === '') return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing && editingId) {
        const res = await fetch(`/api/frete/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neighborhood: neighborhood.trim(),
            fee: Number(fee),
            estimatedMinutes: Number(estimatedMinutes) || 35,
          }),
        });

        if (res.ok) {
          setSuccess('Bairro atualizado com sucesso!');
          handleCancelEdit();
          fetchZones();
        } else {
          setError('Erro ao atualizar bairro.');
        }
      } else {
        const res = await fetch('/api/frete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neighborhood: neighborhood.trim(),
            fee: Number(fee),
            estimatedMinutes: Number(estimatedMinutes) || 35,
            active: true,
          }),
        });

        if (res.ok) {
          setSuccess('Novo bairro cadastrado com sucesso!');
          setNeighborhood('');
          setFee('');
          setEstimatedMinutes('35');
          fetchZones();
        } else {
          setError('Erro ao cadastrar bairro.');
        }
      }

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3500);
    } catch (err) {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: DeliveryZone) => {
    if (!confirm(`Deseja realmente excluir o bairro "${zone.neighborhood}"?`)) return;

    try {
      const res = await fetch(`/api/frete/${zone.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(`Bairro "${zone.neighborhood}" excluído com sucesso!`);
        fetchZones();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao excluir bairro.');
      }
    } catch (err) {
      setError('Erro de conexão ao excluir.');
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const res = await fetch(`/api/frete/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !zone.active }),
      });

      if (res.ok) {
        fetchZones();
      }
    } catch (err) {
      console.error('Erro ao alternar status do bairro', err);
    }
  };

  const filteredZones = zones.filter((z) =>
    z.neighborhood.toLowerCase().includes(search.toLowerCase())
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-orange-500" />
            Bairros Atendidos & Taxas de Entrega
          </h1>
          <span className="text-xs font-bold bg-zinc-800 text-orange-400 border border-zinc-700 px-3 py-1 rounded-full">
            {zones.length} bairro(s) cadastrado(s)
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Adicione, edite ou exclua os bairros da sua cidade e configure o valor do frete e tempo estimado de entrega de cada um.
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

      {/* Form: Cadastrar / Editar Bairro */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 flex items-center gap-2">
            {isEditing ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {isEditing ? 'Editar Bairro Cadastrado' : 'Cadastrar Novo Bairro de Entrega'}
          </h3>

          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar Edição</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nome do Bairro *
            </label>
            <input
              type="text"
              required
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Nome do bairro atendido"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Taxa de Frete (R$) *
            </label>
            <input
              type="number"
              step="0.50"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0.00 (ou valor do frete)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Tempo Estimado (minutos)
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="Ex: 35"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : isEditing ? 'Atualizar Bairro' : 'Adicionar Bairro'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Search & List of Neighborhoods */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
            Lista de Bairros Atendidos ({filteredZones.length})
          </h3>

          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bairro..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs space-y-1">
            <p>Nenhum bairro cadastrado ainda.</p>
            <p className="text-[11px] text-zinc-600">Use o formulário acima para adicionar os bairros da sua cidade.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredZones.map((zone) => (
              <div
                key={zone.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  zone.active
                    ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800/50 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{zone.neighborhood}</span>
                    </h4>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        zone.active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                      }`}
                    >
                      {zone.active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-400">Taxa:</span>
                    <span className="font-extrabold text-orange-400 text-sm">
                      {zone.fee === 0 ? 'Grátis' : formatBRL(zone.fee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>Tempo médio:</span>
                    </span>
                    <span>~{zone.estimatedMinutes || 35} min</span>
                  </div>
                </div>

                {/* Actions: Toggle Active, Edit, Delete */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleToggleActive(zone)}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      zone.active
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    }`}
                    title={zone.active ? 'Pausar entregas para este bairro' : 'Ativar entregas'}
                  >
                    {zone.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(zone)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="Editar taxa ou tempo deste bairro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(zone)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Excluir bairro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
