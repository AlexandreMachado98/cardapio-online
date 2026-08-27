'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import {
  ArrowLeft,
  LayoutGrid,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Flame,
  Crown,
  Sparkles,
  UtensilsCrossed,
  Beer,
  Gift,
  CheckCircle2,
} from 'lucide-react';

const iconList = [
  { name: 'Flame', label: 'Chama / Brasa', icon: Flame },
  { name: 'Crown', label: 'Coroa / Nobre', icon: Crown },
  { name: 'Sparkles', label: 'Especial / Top', icon: Sparkles },
  { name: 'UtensilsCrossed', label: 'Porções / Guarnições', icon: UtensilsCrossed },
  { name: 'Beer', label: 'Bebidas Geladas', icon: Beer },
  { name: 'Gift', label: 'Combos & Ofertas', icon: Gift },
];

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categorias?all=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Flame');
    setSortOrder(String(categories.length));
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || 'Flame');
    setSortOrder(String(cat.sortOrder));
    setActive(cat.active);
    setIsModalOpen(true);
  };

  const handleToggleVisibility = async (cat: Category) => {
    try {
      const res = await fetch('/api/categorias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, active: !cat.active }),
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Erro ao alternar visibilidade', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os produtos vinculados a ela também serão removidos.')) return;

    try {
      const res = await fetch(`/api/categorias?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccess('Categoria excluída com sucesso!');
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao excluir categoria', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await fetch('/api/categorias', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name,
            icon,
            sortOrder: Number(sortOrder),
            active,
          }),
        });
        setSuccess('Categoria atualizada com sucesso!');
      } else {
        await fetch('/api/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            icon,
            sortOrder: Number(sortOrder),
            active,
          }),
        });
        setSuccess('Categoria criada com sucesso!');
      }

      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar categoria', err);
    } finally {
      setSaving(false);
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

        <button
          onClick={handleOpenCreate}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <LayoutGrid className="w-6 h-6 text-orange-500" />
          Organização de Categorias do Cardápio
        </h1>
        <p className="text-xs text-zinc-400">
          Crie, edite, reordene e ative ou oculte categorias inteiras para os clientes.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-orange-400">
          Categorias ({categories.length})
        </h3>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            Nenhuma categoria cadastrada ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-400 font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-100">{cat.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          cat.active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {cat.active ? 'Visível no Cardápio' : 'Oculta'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {cat.products?.length || 0} produtos vinculados • Ordem: {cat.sortOrder}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleVisibility(cat)}
                    className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                      cat.active
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                        : 'bg-orange-500/20 border-orange-500/40 text-orange-400 hover:bg-orange-500/30'
                    }`}
                    title={cat.active ? 'Ocultar categoria' : 'Tornar visível'}
                  >
                    {cat.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="Editar Categoria"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Espetos Especiais"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {iconList.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIcon(item.name)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                          icon === item.name
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400 shadow'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] truncate max-w-full">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span className="text-xs font-semibold text-zinc-200">Visível</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Categoria'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
