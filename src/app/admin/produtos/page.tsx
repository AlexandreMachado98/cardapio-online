'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Category } from '@/types';
import { formatBRL } from '@/lib/utils';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  X,
  Search,
  CheckCircle2,
  Flame,
  Percent,
} from 'lucide-react';

export default function AdminProdutosPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [badge, setBadge] = useState('');
  const [available, setAvailable] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [meatPointsText, setMeatPointsText] = useState('Ao Ponto, Bem Passado, Mal Passado');
  const [hasMeatPoints, setHasMeatPoints] = useState(true);
  const [hasFarofa, setHasFarofa] = useState(true);
  const [hasVinagrete, setHasVinagrete] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const fetchProductsAndCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/produtos?all=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar produtos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80');
    setBadge('');
    setAvailable(true);
    setCategoryId(categories[0]?.id || '');
    setHasMeatPoints(true);
    setMeatPointsText('Ao Ponto, Bem Passado, Mal Passado');
    setHasFarofa(true);
    setHasVinagrete(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(String(prod.price));
    setOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : '');
    setImageUrl(prod.imageUrl);
    setBadge(prod.badge || '');
    setAvailable(prod.available);
    setCategoryId(prod.categoryId);

    if (prod.meatPoints) {
      try {
        const points = JSON.parse(prod.meatPoints);
        setHasMeatPoints(true);
        setMeatPointsText(Array.isArray(points) ? points.join(', ') : '');
      } catch (e) {
        setHasMeatPoints(false);
        setMeatPointsText('');
      }
    } else {
      setHasMeatPoints(false);
      setMeatPointsText('');
    }

    setHasFarofa(prod.hasFarofa);
    setHasVinagrete(prod.hasVinagrete);
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      const res = await fetch(`/api/produtos/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !prod.available }),
      });
      if (res.ok) {
        fetchProductsAndCategories();
      }
    } catch (err) {
      console.error('Erro ao alternar disponibilidade', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto do cardápio?')) return;
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSuccess('Produto excluído com sucesso!');
        fetchProductsAndCategories();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao excluir produto', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    setSaving(true);
    try {
      let meatPointsJson: string | null = null;
      if (hasMeatPoints && meatPointsText.trim()) {
        const parsed = meatPointsText.split(',').map((p) => p.trim()).filter(Boolean);
        meatPointsJson = JSON.stringify(parsed);
      }

      const payload = {
        name,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        imageUrl,
        badge: badge.trim() || null,
        available,
        categoryId,
        meatPoints: meatPointsJson,
        hasFarofa,
        hasVinagrete,
      };

      if (editingProduct) {
        await fetch(`/api/produtos/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Produto atualizado com sucesso!');
      } else {
        await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setSuccess('Novo produto adicionado ao cardápio!');
      }

      setIsModalOpen(false);
      fetchProductsAndCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar produto', err);
    } finally {
      setSaving(false);
    }
  };

  // Flatten products for filtering
  const allProducts: (Product & { categoryName?: string })[] = [];
  categories.forEach((cat) => {
    cat.products?.forEach((p) => {
      allProducts.push({ ...p, categoryName: cat.name });
    });
  });

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto / Espeto</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <ShoppingBag className="w-6 h-6 text-orange-500" />
          Gerenciamento de Produtos, Preços & Promoções
        </h1>
        <p className="text-xs text-zinc-400">
          Cadastre novos espetinhos, altere preços, crie descontos promocionais com preços riscados e oculte itens esgotados com 1 clique.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({allProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.id
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.name} ({cat.products?.length || 0})
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-xs">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className={`bg-zinc-900 border rounded-3xl p-4.5 flex flex-col justify-between space-y-3 transition-all ${
                prod.available
                  ? 'border-zinc-800 hover:border-zinc-700'
                  : 'border-zinc-800/40 opacity-60 bg-zinc-950/50'
              }`}
            >
              <div className="flex gap-3">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-zinc-950 flex-shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prod.badge && (
                      <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded-full">
                        {prod.badge}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 truncate">
                      {prod.categoryName}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white truncate">{prod.name}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2">{prod.description}</p>
                </div>
              </div>

              {/* Price & Discounts */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-orange-400">
                      {formatBRL(prod.price)}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs text-zinc-500 line-through">
                        {formatBRL(prod.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      prod.available ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {prod.available ? '● Disponível para compra' : '○ Esgotado / Oculto'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleAvailability(prod)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                      prod.available
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                        : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    }`}
                    title={prod.available ? 'Ocultar / Marcar Esgotado' : 'Tornar Disponível'}
                  >
                    {prod.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-all"
                    title="Editar Produto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-all"
                    title="Excluir Produto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do produto ou espeto"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição dos ingredientes, corte da carne, peso..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Preços & Promoções */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Preço Original (Riscado para Promoção)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Selo / Badge Promocional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Selo / Destaque Promocional
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: 30% OFF, Oferta, Destaque"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    URL da Foto do Produto
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Opções de Carne & Acompanhamentos */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="flex items-center gap-2 mb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMeatPoints}
                      onChange={(e) => setHasMeatPoints(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span className="text-xs font-bold text-zinc-200">
                      Permitir que o cliente escolha o Ponto da Carne
                    </span>
                  </label>

                  {hasMeatPoints && (
                    <input
                      type="text"
                      value={meatPointsText}
                      onChange={(e) => setMeatPointsText(e.target.value)}
                      placeholder="Ao Ponto, Bem Passado, Mal Passado"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-orange-500 mt-1"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFarofa}
                      onChange={(e) => setHasFarofa(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span className="text-xs font-medium text-zinc-300">Oferecer Farofa</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVinagrete}
                      onChange={(e) => setHasVinagrete(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <span className="text-xs font-medium text-zinc-300">Oferecer Vinagrete</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando Produto...' : 'Salvar Produto no Cardápio'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
